import { NextResponse } from "next/server";

import { errorResponse } from "@/lib/api-utils";
import { getGoodWebsites } from "@/lib/goodWebsites";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get("tag") || "";

    // Use the same function as the page to get randomized results
    const items = await getGoodWebsites();

    // Filter items based on query parameters
    const filteredItems = items.filter((item) => {
      const tagMatch = tag ? item.tags?.includes(tag) : true;
      return tagMatch;
    });

    // No CDN/HTTP caching here: freshness is governed by `cachedNotionQuery`
    // (Upstash + Next data cache) and the purge-cache endpoint. A separate
    // `s-maxage` layer would serve a stale JSON snapshot that SWR then swaps in
    // over the fresh server-rendered data, making new entries flash and vanish.
    return NextResponse.json(filteredItems, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Error fetching good website items:", error);
    return errorResponse("Failed to fetch good website items");
  }
}
