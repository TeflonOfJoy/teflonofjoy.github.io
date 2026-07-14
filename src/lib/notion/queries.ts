import type {
  DatabaseObjectResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";

import { getGoogleFaviconUrl } from "@/lib/utils/favicon";

import { getAllBlocks } from "./blocks";
import { CACHE_TTLS, cachedNotionQuery } from "./cache";
import { notion } from "./client";
import {
  type BookDigestSection,
  type GoodWebsiteItem,
  type GoodWebsiteItemWithDate,
  hasProperties,
  isValidBookDigestMedia,
  type NotionBookDigestItem,
  type NotionBookDigestItemWithContent,
  type NotionItem,
  type NotionStackItem,
  type NotionTilItem,
  type NotionTilItemWithContent,
  type ProcessedBlock,
} from "./types";

async function getDataSourceId(databaseId: string): Promise<string> {
  return cachedNotionQuery(
    `notion:datasource:${databaseId}`,
    async () => {
      const database = (await notion.databases.retrieve({
        database_id: databaseId,
      })) as DatabaseObjectResponse;

      const dataSourceId = database.data_sources[0]?.id;
      if (!dataSourceId) {
        throw new Error(`No data source found for database ${databaseId}`);
      }

      return dataSourceId;
    },
    { ttl: CACHE_TTLS.DATA_SOURCE },
  );
}

// ===== Generic Content Retrieval =====

export async function getFullContent(
  pageId: string,
): Promise<{ blocks: ProcessedBlock[]; metadata: NotionItem } | null> {
  return cachedNotionQuery(
    `notion:content:${pageId}`,
    async () => {
      const page = await notion.pages.retrieve({ page_id: pageId });

      if (!hasProperties(page)) return null;

      const pageWithProps = page as PageObjectResponse;
      const properties = pageWithProps.properties as {
        Name?: { title: { plain_text: string }[] };
        Category?: { select: { name: string } | null };
        Status?: { select: { name: string } | null };
        Published?: { date: { start: string } | null };
        Source?: { url: string };
        Slug?: { rich_text: { plain_text: string }[] };
      };

      const metadata: NotionItem = {
        id: pageWithProps.id,
        title: properties.Name?.title[0]?.plain_text || "Untitled",
        category: properties.Category?.select?.name || "Uncategorized",
        status: properties.Status?.select?.name || "Draft",
        createdTime: pageWithProps.created_time,
        published: properties.Published?.date?.start || pageWithProps.created_time,
        source: properties.Source?.url?.replace("https://", ""),
        slug: properties.Slug?.rich_text[0]?.plain_text || "",
      };

      const blocks = await getAllBlocks(pageId);

      return { blocks, metadata };
    },
    { ttl: CACHE_TTLS.CONTENT },
  );
}

// ===== Stack Database =====

export async function getStackDatabaseItems(): Promise<NotionStackItem[]> {
  return cachedNotionQuery(
    "notion:stack:list",
    async () => {
      const databaseId = process.env.NOTION_STACK_DATABASE_ID || "";
      const dataSourceId = await getDataSourceId(databaseId);
      const response = await notion.dataSources.query({
        data_source_id: dataSourceId,
        sorts: [
          {
            property: "Name",
            direction: "ascending",
          },
        ],
      });

      const items = response.results
        .map((page) => {
          if (!hasProperties(page)) return null;

          const pageWithProps = page as PageObjectResponse;

          // Extract icon from page object
          const icon =
            pageWithProps.icon?.type === "file"
              ? pageWithProps.icon.file.url
              : pageWithProps.icon?.type === "external"
                ? pageWithProps.icon.external.url
                : pageWithProps.icon?.type === "emoji"
                  ? pageWithProps.icon.emoji
                  : undefined;

          const properties = pageWithProps.properties as {
            Name?: { title: { plain_text: string }[] };
            Slug?: { rich_text: { plain_text: string }[] };
            Description?: { rich_text: { plain_text: string }[] };
            Image?: { url: string };
            URL?: { url: string };
            Platforms?: { multi_select: { name: string }[] };
            Status?: { select: { name: string } | null };
            "Created time"?: { created_time: string };
            "Preview Image"?: { url: string };
            "Preview Image Dark"?: { url: string };
            "Preview Status"?: { select: { name: string } | null };
          };

          return {
            id: pageWithProps.id,
            name: properties.Name?.title[0]?.plain_text || "Untitled",
            slug: properties.Slug?.rich_text[0]?.plain_text || "",
            description: properties.Description?.rich_text[0]?.plain_text || undefined,
            image: properties.Image?.url || undefined,
            icon,
            url: properties.URL?.url || undefined,
            platforms: properties.Platforms?.multi_select.map((p) => p.name) || [],
            status: properties.Status?.select?.name || undefined,
            createdTime: properties["Created time"]?.created_time || pageWithProps.created_time,
            previewImage: properties["Preview Image"]?.url || undefined,
            previewImageDark: properties["Preview Image Dark"]?.url || undefined,
            previewStatus: properties["Preview Status"]?.select?.name as
              | "Queued"
              | "Processing"
              | "Done"
              | "Error"
              | undefined,
          } as NotionStackItem;
        })
        .filter((item): item is NotionStackItem => item !== null);

      return items;
    },
    { ttl: CACHE_TTLS.LIST },
  );
}

// ===== Good Websites Database =====

export async function getGoodWebsitesDatabaseItems(): Promise<GoodWebsiteItem[]> {
  return cachedNotionQuery(
    "notion:good-websites:list",
    async () => {
      const databaseId = process.env.NOTION_GOOD_WEBSITES_DATABASE_ID || "";
      const dataSourceId = await getDataSourceId(databaseId);
      const response = await notion.dataSources.query({
        data_source_id: dataSourceId,
        sorts: [
          {
            property: "Name",
            direction: "ascending",
          },
        ],
      });

      const items = response.results
        .map((page) => {
          if (!hasProperties(page)) return null;

          const pageWithProps = page as PageObjectResponse;

          // Extract icon from page object
          const icon =
            pageWithProps.icon?.type === "file"
              ? pageWithProps.icon.file.url
              : pageWithProps.icon?.type === "external"
                ? pageWithProps.icon.external.url
                : undefined;

          const properties = pageWithProps.properties as {
            Name?: { title: { plain_text: string }[] };
            URL?: { url: string };
            X?: { url: string };
            Tags?: { multi_select: { name: string }[] };
            "Preview Image"?: { url: string };
            "Preview Image Dark"?: { url: string };
            "Preview Status"?: { select: { name: string } | null };
          };

          return {
            id: pageWithProps.id,
            name: properties.Name?.title[0]?.plain_text || "Untitled",
            url: properties.URL?.url || undefined,
            x: properties.X?.url || undefined,
            icon: icon || getGoogleFaviconUrl(properties.URL?.url),
            tags: properties.Tags?.multi_select.map((t) => t.name) || [],
            previewImage: properties["Preview Image"]?.url || undefined,
            previewImageDark: properties["Preview Image Dark"]?.url || undefined,
            previewStatus: properties["Preview Status"]?.select?.name as
              | "Queued"
              | "Processing"
              | "Done"
              | "Error"
              | undefined,
          } as GoodWebsiteItem;
        })
        .filter((item): item is GoodWebsiteItem => item !== null);

      return items;
    },
    { ttl: CACHE_TTLS.LIST },
  );
}

export async function getGoodWebsitesDatabaseItemsForRss(): Promise<GoodWebsiteItemWithDate[]> {
  return cachedNotionQuery(
    "notion:good-websites:rss",
    async () => {
      const databaseId = process.env.NOTION_GOOD_WEBSITES_DATABASE_ID || "";
      const dataSourceId = await getDataSourceId(databaseId);
      const response = await notion.dataSources.query({
        data_source_id: dataSourceId,
        sorts: [
          {
            property: "Created time",
            direction: "descending",
          },
        ],
      });

      const items = response.results
        .map((page) => {
          if (!hasProperties(page)) return null;

          const pageWithProps = page as PageObjectResponse;

          const icon =
            pageWithProps.icon?.type === "file"
              ? pageWithProps.icon.file.url
              : pageWithProps.icon?.type === "external"
                ? pageWithProps.icon.external.url
                : undefined;

          const properties = pageWithProps.properties as {
            Name?: { title: { plain_text: string }[] };
            URL?: { url: string };
            X?: { url: string };
            Tags?: { multi_select: { name: string }[] };
            "Preview Image"?: { url: string };
            "Preview Image Dark"?: { url: string };
            "Preview Status"?: { select: { name: string } | null };
            "Created time"?: { created_time: string };
          };

          return {
            id: pageWithProps.id,
            name: properties.Name?.title[0]?.plain_text || "Untitled",
            url: properties.URL?.url || undefined,
            x: properties.X?.url || undefined,
            icon: icon || getGoogleFaviconUrl(properties.URL?.url),
            tags: properties.Tags?.multi_select.map((t) => t.name) || [],
            previewImage: properties["Preview Image"]?.url || undefined,
            previewImageDark: properties["Preview Image Dark"]?.url || undefined,
            previewStatus: properties["Preview Status"]?.select?.name as
              | "Queued"
              | "Processing"
              | "Done"
              | "Error"
              | undefined,
            createdTime: properties["Created time"]?.created_time || pageWithProps.created_time,
          } as GoodWebsiteItemWithDate;
        })
        .filter((item): item is GoodWebsiteItemWithDate => item !== null);

      return items;
    },
    { ttl: CACHE_TTLS.LIST },
  );
}

// ===== TIL Database =====

export async function getTilDatabaseItems(
  cursor?: string,
  pageSize: number = 20,
): Promise<{ items: NotionTilItem[]; nextCursor: string | null }> {
  return cachedNotionQuery(
    `notion:til:list:${cursor || "start"}:${pageSize}`,
    async () => {
      const databaseId = process.env.NOTION_TIL_DATABASE_ID || "";
      const dataSourceId = await getDataSourceId(databaseId);
      const response = await notion.dataSources.query({
        data_source_id: dataSourceId,
        page_size: pageSize,
        ...(cursor ? { start_cursor: cursor } : {}),
        filter: {
          property: "Published",
          date: {
            is_not_empty: true,
          },
        },
        sorts: [
          {
            property: "Published",
            direction: "descending",
          },
        ],
      });

      const items = response.results
        .map((page) => {
          if (!hasProperties(page)) return null;

          const pageWithProps = page as PageObjectResponse;
          const properties = pageWithProps.properties as {
            Title?: { title: { plain_text: string }[] };
            Published?: { date: { start: string } | null };
            "Short ID"?: { rich_text: { plain_text: string }[] };
          };

          return {
            id: pageWithProps.id,
            title: properties.Title?.title.map((t) => t.plain_text).join("") || "Untitled",
            published: properties.Published?.date?.start || pageWithProps.created_time,
            shortId: properties["Short ID"]?.rich_text[0]?.plain_text || undefined,
          } as NotionTilItem;
        })
        .filter((item): item is NotionTilItem => item !== null);

      return {
        items,
        nextCursor: response.has_more ? (response.next_cursor as string) : null,
      };
    },
    { ttl: CACHE_TTLS.LIST },
  );
}

export async function getTilItemContent(pageId: string): Promise<NotionTilItemWithContent | null> {
  return cachedNotionQuery(
    `notion:til:content:${pageId}`,
    async () => {
      const page = await notion.pages.retrieve({ page_id: pageId });

      if (!hasProperties(page)) return null;

      const pageWithProps = page as PageObjectResponse;
      const properties = pageWithProps.properties as {
        Title?: { title: { plain_text: string }[] };
        Published?: { date: { start: string } | null };
        "Short ID"?: { rich_text: { plain_text: string }[] };
      };

      const item: NotionTilItem = {
        id: pageWithProps.id,
        title: properties.Title?.title.map((t) => t.plain_text).join("") || "Untitled",
        published: properties.Published?.date?.start || pageWithProps.created_time,
        shortId: properties["Short ID"]?.rich_text[0]?.plain_text || undefined,
      };

      const blocks = await getAllBlocks(pageId);

      return {
        ...item,
        blocks,
      };
    },
    { ttl: CACHE_TTLS.CONTENT },
  );
}

export async function getTilByShortId(shortId: string): Promise<NotionTilItemWithContent | null> {
  return cachedNotionQuery(
    `notion:til:content:shortid:${shortId}`,
    async () => {
      const databaseId = process.env.NOTION_TIL_DATABASE_ID || "";
      const dataSourceId = await getDataSourceId(databaseId);
      const response = await notion.dataSources.query({
        data_source_id: dataSourceId,
        filter: {
          property: "Short ID",
          rich_text: {
            equals: shortId,
          },
        },
      });

      if (response.results.length === 0) {
        return null;
      }

      const page = response.results[0];
      if (!hasProperties(page)) return null;

      return getTilItemContent(page.id);
    },
    { ttl: CACHE_TTLS.CONTENT },
  );
}

// ===== Book Digest Database =====

type BookDigestProperties = {
  Name?: { title: { plain_text: string }[] };
  Slug?: { rich_text: { plain_text: string }[] };
  Author?: { rich_text: { plain_text: string }[] };
  Cover?: { url: string };
  Tags?: { multi_select: { name: string }[] };
  Published?: { date: { start: string } | null };
  Status?: { select: { name: string } | null };
};

function getPageIcon(page: PageObjectResponse): string {
  return page.icon?.type === "file"
    ? page.icon.file.url
    : page.icon?.type === "external"
      ? page.icon.external.url
      : "";
}

export async function getBookDigestItems(): Promise<NotionBookDigestItem[]> {
  return cachedNotionQuery(
    "notion:book-digest:list",
    async () => {
      const databaseId = process.env.NOTION_BOOK_DIGEST_DATABASE_ID || "";
      const dataSourceId = await getDataSourceId(databaseId);
      const response = await notion.dataSources.query({
        data_source_id: dataSourceId,
        filter: {
          property: "Status",
          select: {
            equals: "Published",
          },
        },
        sorts: [
          {
            property: "Published",
            direction: "descending",
          },
        ],
      });

      const items = response.results
        .map((page) => {
          if (!hasProperties(page)) return null;

          const pageWithProps = page as PageObjectResponse;
          const properties = pageWithProps.properties as BookDigestProperties;

          return {
            id: pageWithProps.id,
            title: properties.Name?.title[0]?.plain_text || "Untitled",
            slug: properties.Slug?.rich_text[0]?.plain_text || "",
            author: properties.Author?.rich_text[0]?.plain_text || undefined,
            cover: properties.Cover?.url || getPageIcon(pageWithProps),
            tags: properties.Tags?.multi_select.map((t) => t.name) || [],
            published: properties.Published?.date?.start || pageWithProps.created_time,
            status: properties.Status?.select?.name || "Draft",
          } as NotionBookDigestItem;
        })
        .filter((item): item is NotionBookDigestItem => item !== null);

      return items;
    },
    { ttl: CACHE_TTLS.LIST },
  );
}

export async function getBookDigestItemBySlug(
  slug: string,
): Promise<NotionBookDigestItemWithContent | null> {
  return cachedNotionQuery(
    `notion:book-digest:content:${slug}`,
    async () => {
      const databaseId = process.env.NOTION_BOOK_DIGEST_DATABASE_ID || "";
      const dataSourceId = await getDataSourceId(databaseId);
      const response = await notion.dataSources.query({
        data_source_id: dataSourceId,
        filter: {
          and: [
            {
              property: "Slug",
              rich_text: {
                equals: slug,
              },
            },
            {
              property: "Status",
              select: {
                equals: "Published",
              },
            },
          ],
        },
      });

      if (response.results.length === 0) {
        return null;
      }

      const page = response.results[0];
      if (!hasProperties(page)) return null;

      const pageWithProps = page as PageObjectResponse;
      const properties = pageWithProps.properties as BookDigestProperties;

      // Get all blocks from the page
      const blocks = await getAllBlocks(page.id);

      // Parse blocks into intro and content sections
      const introBlocks: ProcessedBlock[] = [];
      const sections: BookDigestSection[] = [];

      let currentSection: BookDigestSection | null = null;
      let inIntro = true;

      for (const block of blocks) {
        if (block.type === "divider") {
          inIntro = false;
          continue;
        }

        if (inIntro) {
          introBlocks.push(block);
          continue;
        }

        if (block.type === "heading_2") {
          if (currentSection) {
            sections.push(currentSection);
          }
          currentSection = {
            title: block.content.map((c) => c.text.content).join(""),
            descriptionBlocks: [],
          };
          continue;
        }

        if (block.type === "code" && block.language === "json" && currentSection) {
          const jsonContent = block.content.map((c) => c.text.content).join("");
          try {
            const parsed = JSON.parse(jsonContent);
            if (isValidBookDigestMedia(parsed)) {
              currentSection.media = parsed;
            } else {
              currentSection.descriptionBlocks.push(block);
            }
          } catch {
            currentSection.descriptionBlocks.push(block);
          }
          continue;
        }

        if (currentSection) {
          currentSection.descriptionBlocks.push(block);
        }
      }

      if (currentSection) {
        sections.push(currentSection);
      }

      return {
        id: pageWithProps.id,
        title: properties.Name?.title[0]?.plain_text || "Untitled",
        slug: properties.Slug?.rich_text[0]?.plain_text || "",
        author: properties.Author?.rich_text[0]?.plain_text || undefined,
        cover: properties.Cover?.url || getPageIcon(pageWithProps),
        tags: properties.Tags?.multi_select.map((t) => t.name) || [],
        published: properties.Published?.date?.start || pageWithProps.created_time,
        status: properties.Status?.select?.name || "Draft",
        introBlocks,
        sections,
      };
    },
    { ttl: CACHE_TTLS.CONTENT },
  );
}
