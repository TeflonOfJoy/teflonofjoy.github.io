/**
 * Inspect Sites Notion database pages and preview webhook readiness.
 * Usage: NOTION_TOKEN=... bun run scripts/inspect-sites-notion.ts
 */
import { Client } from "@notionhq/client";

const databaseId =
  process.env.NOTION_GOOD_WEBSITES_DATABASE_ID ?? "39dc3041-4385-81be-bc5e-de269fba36fe";

if (!process.env.NOTION_TOKEN) {
  console.error("Set NOTION_TOKEN in the environment.");
  process.exit(1);
}

const client = new Client({ auth: process.env.NOTION_TOKEN });

const db = await client.databases.retrieve({ database_id: databaseId });
const dataSourceId = db.data_sources[0]?.id;
if (!dataSourceId) {
  console.error("No data source on Sites database.");
  process.exit(1);
}

const dataSource = await client.dataSources.retrieve({ data_source_id: dataSourceId });
const buttonProps = Object.entries(dataSource.properties)
  .filter(([, prop]) => (prop as { type?: string }).type === "button")
  .map(([name]) => name);

console.log("Sites button properties:", buttonProps.length ? buttonProps.join(", ") : "(none)");
console.log(
  "\nNotion button webhook setup (Send webhook action on paid plan):\n" +
    "  URL: https://www.teflonofjoy.dev/api/webhooks/capture-site-preview?id=@Page\n" +
    "  Header: x-webhook-secret = NOTION_WEBHOOK_VERIFICATION_SECRET\n" +
    "  (Use @ mention → Page in the URL field if the POST body is empty.)\n",
);

const response = await client.dataSources.query({
  data_source_id: dataSourceId,
  sorts: [{ property: "Name", direction: "ascending" }],
});

for (const result of response.results) {
  if (result.object !== "page") continue;
  const page = result as {
    id: string;
    archived?: boolean;
    in_trash?: boolean;
    properties: Record<string, unknown>;
  };

  const nameProp = page.properties.Name as { title?: { plain_text: string }[] } | undefined;
  const name = nameProp?.title?.map((t) => t.plain_text).join("") ?? "Untitled";
  const urlProp = page.properties.URL as { url?: string | null } | undefined;
  const statusProp = page.properties["Preview Status"] as
    | { select?: { name: string } | null }
    | undefined;
  const previewProp = page.properties["Preview Image"] as { url?: string | null } | undefined;
  const errorProp = page.properties["Preview Error"] as
    | { rich_text?: { plain_text: string }[] }
    | undefined;

  console.log(`\n${name}`);
  console.log(`  id: ${page.id}`);
  console.log(`  active: ${!page.archived && !page.in_trash}`);
  console.log(`  URL: ${urlProp?.url ?? "(empty)"}`);
  console.log(`  Preview Status: ${statusProp?.select?.name ?? "(empty)"}`);
  console.log(`  Preview Image: ${previewProp?.url ? "set" : "(empty)"}`);
  const err = errorProp?.rich_text?.map((t) => t.plain_text).join("");
  if (err) console.log(`  Preview Error: ${err.slice(0, 120)}`);
}
