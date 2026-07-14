import type {
  PageObjectResponse,
  UpdatePageParameters,
} from "@notionhq/client/build/src/api-endpoints";
import { NextResponse } from "next/server";

import { errorResponse } from "@/lib/api-utils";
import { optimizeSitePreview } from "@/lib/image-processing/optimize";
import { notion } from "@/lib/notion";
import { uploadBufferToR2 } from "@/lib/r2/storage";
import { captureScreenshot } from "@/lib/screenshot";
import {
  extractPageIdFromWebhookRequest,
  extractUrlFromWebhookBody,
} from "@/lib/webhooks/notion-automation-payload";

// Screenshot + upload can exceed Vercel's default 10s limit.
export const maxDuration = 60;

type NotionPageProperties = PageObjectResponse["properties"];
type NotionUpdateProperties = NonNullable<UpdatePageParameters["properties"]>;

function pickExistingProperties(
  available: NotionPageProperties,
  properties: NotionUpdateProperties,
): NotionUpdateProperties {
  return Object.fromEntries(
    Object.entries(properties).filter(([name]) => name in available),
  ) as NotionUpdateProperties;
}

function extractUrlFromPage(page: PageObjectResponse): string | undefined {
  const urlProperty = page.properties.URL;
  return urlProperty?.type === "url" ? (urlProperty.url ?? undefined) : undefined;
}

/**
 * Webhook endpoint to capture a website screenshot and store it in R2
 *
 * POST /api/webhooks/capture-site-preview
 * POST /api/webhooks/capture-site-preview?id=<page-id>
 * Notion automation payload: { data: { id, properties?: { URL } } } or { entity: { id } }
 *
 * Flow:
 * 1. Extract page ID and URL from webhook payload or Notion page
 * 2. Set status to "Processing"
 * 3. Capture screenshot using Puppeteer
 * 4. Optimize image (resize, compress to WebP)
 * 5. Upload to R2 storage
 * 6. Update Notion page with preview URL and status
 */
export async function POST(request: Request) {
  try {
    // Verify webhook secret
    const webhookSecret = process.env.NOTION_WEBHOOK_VERIFICATION_SECRET;
    const providedSecret = request.headers.get("x-webhook-secret");
    if (!webhookSecret || providedSecret !== webhookSecret) {
      return errorResponse("Unauthorized", 401);
    }

    const rawBody = await request.text();
    const body: unknown = rawBody ? JSON.parse(rawBody) : {};

    const pageId = extractPageIdFromWebhookRequest(request.url, body);
    if (!pageId) {
      console.error("Missing page ID in webhook payload", body);
      return errorResponse("Missing page ID in webhook payload", 400);
    }

    const currentPage = (await notion.pages.retrieve({
      page_id: pageId,
    })) as PageObjectResponse;

    const url = extractUrlFromWebhookBody(body) ?? extractUrlFromPage(currentPage);
    if (!url) {
      console.error("URL property is empty or invalid", body);
      return errorResponse("URL property is empty or invalid", 400);
    }

    try {
      new URL(url);
    } catch {
      console.error("Invalid URL format", url, body);
      return errorResponse("Invalid URL format", 400);
    }

    const currentStatus = currentPage.properties["Preview Status"];
    if (currentStatus?.type === "select" && currentStatus.select?.name === "Processing") {
      console.log(`Page ${pageId} is already being processed, skipping`);
      return NextResponse.json(
        { success: true, message: "Already processing", skipped: true },
        { status: 200 },
      );
    }

    // Step 1: Set status to Processing
    await notion.pages.update({
      page_id: pageId,
      properties: pickExistingProperties(currentPage.properties, {
        "Preview Status": { select: { name: "Processing" } },
        "Preview Error": { rich_text: [] },
      }),
    });

    try {
      // Step 2: Capture screenshot
      console.log(`Capturing screenshot for: ${url}`);
      const screenshot = await captureScreenshot(url);
      console.log(`Screenshot captured: ${(screenshot.length / 1024).toFixed(0)}KB`);

      // Step 3: Optimize the screenshot
      const optimized = await optimizeSitePreview(screenshot);
      console.log(
        `Optimized preview: ${optimized.width}x${optimized.height}, ${(optimized.optimizedSize / 1024).toFixed(2)}KB (saved ${optimized.savings.toFixed(1)}%)`,
      );

      // Step 4: Upload to R2
      const r2Url = await uploadBufferToR2(optimized.buffer, optimized.contentType);
      console.log(`Uploaded to R2: ${r2Url}`);

      // Step 5: Update Notion page with success
      await notion.pages.update({
        page_id: pageId,
        properties: pickExistingProperties(currentPage.properties, {
          "Preview Status": { select: { name: "Done" } },
          "Preview Image": { url: r2Url },
          "Preview Updated": { date: { start: new Date().toISOString() } },
        }),
      });

      return NextResponse.json(
        {
          success: true,
          message: "Site preview captured and uploaded successfully",
          previewUrl: r2Url,
        },
        { status: 200 },
      );
    } catch (captureError) {
      const errorMessage = captureError instanceof Error ? captureError.message : "Unknown error";
      console.error("Error capturing screenshot:", captureError);

      await notion.pages.update({
        page_id: pageId,
        properties: pickExistingProperties(currentPage.properties, {
          "Preview Status": { select: { name: "Error" } },
          "Preview Error": {
            rich_text: [{ text: { content: errorMessage.slice(0, 2000) } }],
          },
        }),
      });

      throw captureError;
    }
  } catch (error) {
    console.error("Error capturing site preview:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(`Failed to capture site preview: ${errorMessage}`, 500, error);
  }
}
