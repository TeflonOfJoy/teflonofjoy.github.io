import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { NextResponse } from "next/server";

import { errorResponse } from "@/lib/api-utils";
import { optimizeSiteIcon } from "@/lib/image-processing/optimize";
import { invalidateNotionCache, notion } from "@/lib/notion";
import { uploadBufferToR2 } from "@/lib/r2/storage";
import { downloadIconBuffer, fetchFaviconBuffer } from "@/lib/utils/favicon";
import {
  extractPageIdFromWebhookRequest,
  extractUrlFromWebhookBody,
} from "@/lib/webhooks/notion-automation-payload";

function getPageIconUrl(page: PageObjectResponse): string | undefined {
  if (!page.icon) return undefined;
  if (page.icon.type === "external") return page.icon.external.url;
  if (page.icon.type === "file") return page.icon.file.url;
  return undefined;
}

function getPageSiteUrl(page: PageObjectResponse): string | undefined {
  const urlProperty = page.properties.URL;
  return urlProperty?.type === "url" ? (urlProperty.url ?? undefined) : undefined;
}

function getPageImageUrl(page: PageObjectResponse): string | undefined {
  const imageProperty = page.properties.Image;
  return imageProperty?.type === "url" ? (imageProperty.url ?? undefined) : undefined;
}

/**
 * Webhook endpoint to resolve, optimize, and upload a Stack page icon to R2.
 *
 * POST /api/webhooks/process-stack-icon
 * Notion automation payload: { data: { id, properties?: { URL } } }
 *
 * Flow:
 * 1. Use the existing page icon, Image property, or fetch favicon from URL
 * 2. Optimize icon (resize to max 80x80px, compress)
 * 3. Upload to R2 storage
 * 4. Update Notion page icon with R2 URL
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
    const siteUrl = extractUrlFromWebhookBody(body) ?? getPageSiteUrl(page);

    let iconBuffer: Buffer | null = null;
    let source = "unknown";

    const pageIconUrl = getPageIconUrl(page);
    if (pageIconUrl) {
      iconBuffer = await downloadIconBuffer(pageIconUrl);
      source = "page-icon";
    }

    if (!iconBuffer) {
      const imageUrl = getPageImageUrl(page);
      if (imageUrl) {
        iconBuffer = await downloadIconBuffer(imageUrl);
        source = "image-property";
      }
    }

    if (!iconBuffer && siteUrl) {
      iconBuffer = await fetchFaviconBuffer(siteUrl);
      source = "favicon";
    }

    if (!iconBuffer) {
      console.error("No icon source available for page", pageId, body);
      return errorResponse(
        "No icon source available. Set a page icon, Image property, or URL.",
        400,
      );
    }

    console.log(`Processing stack icon for page ${pageId} from ${source}`);

    const optimized = await optimizeSiteIcon(iconBuffer);
    console.log(
      `Optimized icon: ${optimized.width}x${optimized.height}, ${(optimized.optimizedSize / 1024).toFixed(2)}KB (saved ${optimized.savings.toFixed(1)}%)`,
    );

    const r2Url = await uploadBufferToR2(optimized.buffer, optimized.contentType);

    await notion.pages.update({
      page_id: pageId,
      icon: {
        type: "external",
        external: { url: r2Url },
      },
    });

    await invalidateNotionCache("notion:stack:*");

    return NextResponse.json(
      {
        success: true,
        message: "Stack icon processed and uploaded to R2 successfully",
        iconUrl: r2Url,
        source,
        originalSize: iconBuffer.length,
        optimizedSize: optimized.optimizedSize,
        savings: `${optimized.savings.toFixed(1)}%`,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error processing stack icon", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(`Failed to process stack icon: ${errorMessage}`, 500, error);
  }
}
