import type {
  PageObjectResponse,
  UpdatePageParameters,
} from "@notionhq/client/build/src/api-endpoints";
import { after } from "next/server";
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
 * Returns 202 immediately after setting Preview Status — Notion times out
 * webhook calls after ~5 seconds; screenshot runs in the background via after().
 */
export async function POST(request: Request) {
  try {
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

    const pageProperties = currentPage.properties;

    await notion.pages.update({
      page_id: pageId,
      properties: pickExistingProperties(pageProperties, {
        "Preview Status": { select: { name: "Processing" } },
        "Preview Error": { rich_text: [] },
      }),
    });

    after(async () => {
      try {
        console.log(`[Site Preview] Capturing screenshot for ${pageId}: ${url}`);
        const screenshot = await captureScreenshot(url);
        console.log(
          `[Site Preview] Screenshot captured for ${pageId}: ${(screenshot.length / 1024).toFixed(0)}KB`,
        );

        const optimized = await optimizeSitePreview(screenshot);
        const r2Url = await uploadBufferToR2(optimized.buffer, optimized.contentType);
        console.log(`[Site Preview] Uploaded ${pageId} → ${r2Url}`);

        await notion.pages.update({
          page_id: pageId,
          properties: pickExistingProperties(pageProperties, {
            "Preview Status": { select: { name: "Done" } },
            "Preview Image": { url: r2Url },
            "Preview Updated": { date: { start: new Date().toISOString() } },
          }),
        });
      } catch (captureError) {
        const errorMessage = captureError instanceof Error ? captureError.message : "Unknown error";
        console.error(`[Site Preview] Background job failed for ${pageId}:`, captureError);

        try {
          await notion.pages.update({
            page_id: pageId,
            properties: pickExistingProperties(pageProperties, {
              "Preview Status": { select: { name: "Error" } },
              "Preview Error": {
                rich_text: [{ text: { content: errorMessage.slice(0, 2000) } }],
              },
            }),
          });
        } catch (updateError) {
          console.error(`[Site Preview] Failed to write error status for ${pageId}:`, updateError);
        }
      }
    });

    return NextResponse.json(
      {
        success: true,
        message: "Site preview processing started",
        pageId,
      },
      { status: 202 },
    );
  } catch (error) {
    console.error("Error capturing site preview:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(`Failed to capture site preview: ${errorMessage}`, 500, error);
  }
}
