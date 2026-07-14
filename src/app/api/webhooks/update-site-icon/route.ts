import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { after } from "next/server";
import { NextResponse } from "next/server";

import { errorResponse } from "@/lib/api-utils";
import { optimizeSiteIcon } from "@/lib/image-processing/optimize";
import { notion } from "@/lib/notion";
import { uploadBufferToR2 } from "@/lib/r2/storage";
import { fetchWebhookFaviconBuffer } from "@/lib/utils/favicon";
import {
  extractPageIdFromWebhookRequest,
  extractUrlFromWebhookBody,
} from "@/lib/webhooks/notion-automation-payload";

// Icon upload can run in the background after the 202 response.
export const maxDuration = 60;

/**
 * Webhook endpoint to fetch and upload good website favicon to R2
 *
 * POST /api/webhooks/update-site-icon
 * Notion automation payload: same as capture-site-preview (`data.id` from button clicks)
 *
 * Returns 202 immediately — Notion times out webhook calls after ~5 seconds.
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

    const page = (await notion.pages.retrieve({ page_id: pageId })) as PageObjectResponse;
    const url =
      extractUrlFromWebhookBody(body) ??
      (page.properties.URL?.type === "url" ? (page.properties.URL.url ?? undefined) : undefined);

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

    after(async () => {
      try {
        const faviconBuffer = await fetchWebhookFaviconBuffer(url);
        if (!faviconBuffer) {
          console.error("Failed to fetch favicon for webhook", url, pageId);
          return;
        }

        const optimized = await optimizeSiteIcon(faviconBuffer);
        console.log(
          `[Site Icon] Optimized ${pageId}: ${optimized.width}x${optimized.height}, ${(optimized.optimizedSize / 1024).toFixed(2)}KB`,
        );

        const r2Url = await uploadBufferToR2(optimized.buffer, optimized.contentType);

        await notion.pages.update({
          page_id: pageId,
          icon: {
            type: "external",
            external: { url: r2Url },
          },
        });

        console.log(`[Site Icon] Updated ${pageId} → ${r2Url}`);
      } catch (error) {
        console.error(`[Site Icon] Background job failed for ${pageId}:`, error);
      }
    });

    return NextResponse.json(
      {
        success: true,
        message: "Icon processing started",
        pageId,
      },
      { status: 202 },
    );
  } catch (error) {
    console.error("Error updating good website icon:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(`Failed to update good website icon: ${errorMessage}`, 500, error);
  }
}
