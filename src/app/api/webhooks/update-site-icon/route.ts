import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { NextResponse } from "next/server";

import { errorResponse } from "@/lib/api-utils";
import { optimizeSiteIcon } from "@/lib/image-processing/optimize";
import { notion } from "@/lib/notion";
import { uploadBufferToR2 } from "@/lib/r2/storage";
import { downloadIconBuffer, fetchFaviconBuffer, getGoogleFaviconUrl } from "@/lib/utils/favicon";
import {
  extractPageIdFromWebhookRequest,
  extractUrlFromWebhookBody,
} from "@/lib/webhooks/notion-automation-payload";

/**
 * Webhook endpoint to fetch and upload good website favicon to R2
 *
 * POST /api/webhooks/update-site-icon
 * Notion automation payload: same as capture-site-preview (`data.id` from button clicks)
 *
 * Flow:
 * 1. Extract page ID and URL from Notion webhook
 * 2. Fetch favicon from URL
 * 3. Download favicon as buffer
 * 4. Optimize favicon (resize to max 80x80px, compress)
 * 5. Upload to R2 storage
 * 6. Update Notion page icon with R2 URL
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

    const page = (await notion.pages.retrieve({ page_id: pageId })) as PageObjectResponse;
    const url =
      extractUrlFromWebhookBody(body) ??
      (page.properties.URL?.type === "url" ? (page.properties.URL.url ?? undefined) : undefined);

    if (!url) {
      console.error("URL property is empty or invalid", body);
      return errorResponse("URL property is empty or invalid", 400);
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      console.error("Invalid URL format", url, body);
      return errorResponse("Invalid URL format", 400);
    }

    // Fetch favicon from URL (falls back to Google's favicon service)
    let faviconBuffer = await fetchFaviconBuffer(url);
    if (!faviconBuffer) {
      const googleFaviconUrl = getGoogleFaviconUrl(url, 128);
      if (googleFaviconUrl) {
        faviconBuffer = await downloadIconBuffer(googleFaviconUrl);
      }
    }
    if (!faviconBuffer) {
      console.error("Failed to fetch favicon", url, body);
      return errorResponse("Failed to fetch favicon", 500);
    }

    const optimized = await optimizeSiteIcon(faviconBuffer);

    console.log(
      `Optimized favicon: ${optimized.width}x${optimized.height}, ${(optimized.optimizedSize / 1024).toFixed(2)}KB (saved ${optimized.savings.toFixed(1)}%)`,
    );

    // Step 4: Upload optimized favicon to R2
    const r2Url = await uploadBufferToR2(optimized.buffer, optimized.contentType);

    // Step 5: Update Notion page icon with R2 URL
    await notion.pages.update({
      page_id: pageId,
      icon: {
        type: "external",
        external: { url: r2Url },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Good website icon uploaded to R2 and updated successfully",
        iconUrl: r2Url,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating good website icon", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(`Failed to update good website icon: ${errorMessage}`, 500, error);
  }
}
