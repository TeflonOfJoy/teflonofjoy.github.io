import { Feed } from "feed";

import { SITE_CONFIG } from "@/lib/metadata";
import { getBookDigestItemBySlug, getBookDigestItems } from "@/lib/notion/queries";
import { extractPreviewText } from "@/lib/notion/types";

export async function GET() {
  try {
    const items = await getBookDigestItems();

    const feed = new Feed({
      title: `${SITE_CONFIG.name} - Book Digest`,
      description: "Breakdowns and notes from the books I read",
      id: `${SITE_CONFIG.url}/book-digest`,
      link: `${SITE_CONFIG.url}/book-digest`,
      language: "en",
      image: `${SITE_CONFIG.url}/api/og`,
      favicon: `${SITE_CONFIG.url}/favicon.ico`,
      copyright: `All rights reserved ${new Date().getFullYear()}, ${SITE_CONFIG.author.name}`,
      updated: new Date(),
      feedLinks: {
        rss: `${SITE_CONFIG.url}/book-digest/rss.xml`,
      },
      author: {
        name: SITE_CONFIG.author.name,
        link: SITE_CONFIG.url,
      },
    });

    // Fetch content for all items in parallel (gracefully handle failures)
    const itemsWithContent = await Promise.all(
      items.map(async (item) => {
        try {
          const content = await getBookDigestItemBySlug(item.slug);
          return { item, content };
        } catch {
          return { item, content: null };
        }
      }),
    );

    itemsWithContent.forEach(({ item, content }) => {
      const itemUrl = `${SITE_CONFIG.url}/book-digest/${item.slug}`;
      const publishDate = new Date(item.published);

      // Build description with intro text and view link
      const descriptionParts: string[] = [];
      if (content?.introBlocks) {
        const introText = extractPreviewText(content.introBlocks, { maxBlocks: 1 });
        if (introText) {
          descriptionParts.push(introText);
        }
      }
      descriptionParts.push(`View full digest: ${itemUrl}`);
      const description = descriptionParts.join("\n\n");

      feed.addItem({
        title: item.title,
        id: item.slug,
        link: itemUrl,
        description,
        date: publishDate,
        published: publishDate,
        author: [
          {
            name: SITE_CONFIG.author.name,
            link: SITE_CONFIG.url,
          },
        ],
      });
    });

    return new Response(feed.rss2(), {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error generating Book Digest RSS feed:", error);
    return new Response("Error generating RSS feed", { status: 500 });
  }
}
