/**
 * Create all Notion databases required by the site, with the exact property
 * names/types the app reads in `src/lib/notion/queries.ts`.
 *
 * Usage:
 *   1. Create ONE empty page in Notion (this will be the parent container).
 *   2. Share that page with your Notion integration (••• > Connections).
 *   3. Copy the page ID from its URL (the 32-char hex after the last "-").
 *   4. Run:
 *        NOTION_TOKEN=secret_xxx bun scripts/setup-notion-databases.ts <parentPageId>
 *      or set NOTION_PARENT_PAGE_ID instead of passing an argument.
 *
 * The script prints the resulting NOTION_*_DATABASE_ID values so you can paste
 * them into Vercel (or your local .env). Re-running creates NEW databases, so
 * only run it once per environment.
 *
 * To create only a subset (e.g. when adding a new section later), set the ONLY
 * env var to a comma-separated list of database titles:
 *   ONLY="Book Digest" NOTION_TOKEN=secret_xxx bun scripts/setup-notion-databases.ts <parentPageId>
 */

const NOTION_VERSION = "2022-06-28";

type PropertyConfig = Record<string, unknown>;

interface DatabaseDefinition {
  /** Human-readable database title shown in Notion. */
  title: string;
  /** Environment variable the app reads this database ID from. */
  envKey: string;
  /** Property schema — must match the names/types read in queries.ts. */
  properties: Record<string, PropertyConfig>;
}

const PREVIEW_STATUS_OPTIONS = {
  select: {
    options: [
      { name: "Queued", color: "yellow" },
      { name: "Processing", color: "blue" },
      { name: "Done", color: "green" },
      { name: "Error", color: "red" },
    ],
  },
};

const DATABASES: DatabaseDefinition[] = [
  {
    title: "Stack",
    envKey: "NOTION_STACK_DATABASE_ID",
    properties: {
      Name: { title: {} },
      Slug: { rich_text: {} },
      Description: { rich_text: {} },
      Image: { url: {} },
      URL: { url: {} },
      Platforms: { multi_select: {} },
      Status: { select: { options: [] } },
      "Created time": { created_time: {} },
      "Preview Image": { url: {} },
      "Preview Image Dark": { url: {} },
      "Preview Status": PREVIEW_STATUS_OPTIONS,
      Likes: { number: {} },
    },
  },
  {
    title: "Sites",
    envKey: "NOTION_GOOD_WEBSITES_DATABASE_ID",
    properties: {
      Name: { title: {} },
      URL: { url: {} },
      X: { url: {} },
      Tags: { multi_select: {} },
      "Created time": { created_time: {} },
      "Preview Image": { url: {} },
      "Preview Image Dark": { url: {} },
      "Preview Status": PREVIEW_STATUS_OPTIONS,
      Likes: { number: {} },
    },
  },
  {
    title: "Design Details Episodes",
    envKey: "NOTION_DESIGN_DETAILS_EPISODES_DATABASE_ID",
    properties: {
      Name: { title: {} },
      Slug: { rich_text: {} },
      Description: { rich_text: {} },
      "Episode Number": { number: {} },
      "Published Date": { date: {} },
      "Image URL": { url: {} },
      "Audio URL (S3)": { url: {} },
    },
  },
  {
    title: "TIL",
    envKey: "NOTION_TIL_DATABASE_ID",
    properties: {
      // TIL uses "Title" as its title column, unlike the others which use "Name".
      Title: { title: {} },
      Published: { date: {} },
      "Short ID": { rich_text: {} },
      Likes: { number: {} },
    },
  },
  {
    title: "Book Digest",
    envKey: "NOTION_BOOK_DIGEST_DATABASE_ID",
    properties: {
      Name: { title: {} },
      Slug: { rich_text: {} },
      Author: { rich_text: {} },
      Cover: { url: {} },
      Tags: { multi_select: {} },
      Published: { date: {} },
      // The list query filters on Status = "Published", so that option must exist.
      Status: {
        select: {
          options: [
            { name: "Draft", color: "gray" },
            { name: "Published", color: "green" },
          ],
        },
      },
    },
  },
];

async function createDatabase(parentPageId: string, def: DatabaseDefinition): Promise<string> {
  const response = await fetch("https://api.notion.com/v1/databases", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_VERSION,
    },
    body: JSON.stringify({
      parent: { type: "page_id", page_id: parentPageId },
      title: [{ type: "text", text: { content: def.title } }],
      properties: def.properties,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Failed to create "${def.title}": ${response.status} ${JSON.stringify(error)}`);
  }

  const result = (await response.json()) as { id: string };
  return result.id;
}

async function main() {
  const parentPageId = process.argv[2] || process.env.NOTION_PARENT_PAGE_ID;

  if (!process.env.NOTION_TOKEN) {
    console.error("Error: NOTION_TOKEN environment variable is not set.");
    process.exit(1);
  }

  if (!parentPageId) {
    console.error(
      "Error: provide a parent page ID as the first argument or via NOTION_PARENT_PAGE_ID.",
    );
    console.error("The page must be shared with your integration (••• > Connections).");
    process.exit(1);
  }

  // Optional filter: ONLY="Book Digest,Stack" creates only the matching databases
  // (case-insensitive, matched against the database title). Useful for incremental setup.
  const onlyFilter = (process.env.ONLY || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const toCreate = onlyFilter.length
    ? DATABASES.filter((db) => onlyFilter.includes(db.title.toLowerCase()))
    : DATABASES;

  if (toCreate.length === 0) {
    console.error(`Error: ONLY filter "${process.env.ONLY}" matched no databases.`);
    console.error(`Available: ${DATABASES.map((d) => d.title).join(", ")}`);
    process.exit(1);
  }

  console.log(`Creating ${toCreate.length} database(s) under page ${parentPageId}\n`);

  const results: { envKey: string; id: string }[] = [];

  for (const def of toCreate) {
    process.stdout.write(`- ${def.title} ... `);
    const id = await createDatabase(parentPageId, def);
    results.push({ envKey: def.envKey, id });
    console.log("done");

    // Notion allows ~3 requests/second.
    await new Promise((resolve) => setTimeout(resolve, 350));
  }

  console.log("\nAll databases created. Add these env vars to Vercel / .env:\n");
  for (const { envKey, id } of results) {
    console.log(`${envKey}=${id}`);
  }
}

main().catch((error) => {
  console.error("\nSetup failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
