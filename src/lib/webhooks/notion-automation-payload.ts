type JsonRecord = Record<string, unknown>;

const NOTION_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function asRecord(value: unknown): JsonRecord | undefined {
  return typeof value === "object" && value !== null ? (value as JsonRecord) : undefined;
}

function isNotionId(value: unknown): value is string {
  return typeof value === "string" && NOTION_ID_RE.test(value);
}

function isPageLike(record: JsonRecord): boolean {
  const type = record.type ?? record.object;
  return type === "page" || type === "database_item";
}

/**
 * Notion automation / database-button webhooks use different payload shapes.
 * Database automations often send `data.id`; button clicks may send `entity.id`
 * or a minimal/empty body (use page ID in the webhook URL query string instead).
 */
export function extractPageIdFromWebhookBody(body: unknown): string | undefined {
  const root = asRecord(body);
  if (!root) return undefined;

  const data = asRecord(root.data);
  if (typeof data?.id === "string") return data.id;
  if (typeof data?.page_id === "string") return data.page_id;

  const dataObject = asRecord(data?.object);
  if (typeof dataObject?.id === "string") return dataObject.id;

  const dataPage = asRecord(data?.page);
  if (typeof dataPage?.id === "string") return dataPage.id;

  const payload = asRecord(root.payload);
  const payloadPage = asRecord(payload?.page);
  if (typeof payloadPage?.id === "string") return payloadPage.id;

  const entity = asRecord(root.entity);
  if (typeof entity?.id === "string") return entity.id;

  if (typeof root.id === "string" && isPageLike(root)) return root.id;

  return findPageIdDeep(root);
}

/** Fallback when Notion can't customize the POST body (common for database buttons). */
export function extractPageIdFromRequestUrl(requestUrl: string): string | undefined {
  const { searchParams } = new URL(requestUrl);
  for (const key of ["id", "pageId", "page_id"]) {
    const value = searchParams.get(key);
    if (isNotionId(value)) return value;
  }
  return undefined;
}

export function extractPageIdFromWebhookRequest(
  requestUrl: string,
  body: unknown,
): string | undefined {
  return extractPageIdFromWebhookBody(body) ?? extractPageIdFromRequestUrl(requestUrl);
}

export function extractUrlFromWebhookBody(body: unknown): string | undefined {
  const root = asRecord(body);
  if (!root) return undefined;

  const fromProperties = (properties: unknown): string | undefined => {
    const props = asRecord(properties);
    if (!props) return undefined;
    return extractUrlProperty(props.URL);
  };

  const data = asRecord(root.data);
  const dataProps = fromProperties(data?.properties);
  if (dataProps) return dataProps;

  const rootProps = fromProperties(root.properties);
  if (rootProps) return rootProps;

  const dataPage = asRecord(data?.page);
  const pageProps = fromProperties(dataPage?.properties);
  if (pageProps) return pageProps;

  const payload = asRecord(root.payload);
  const payloadPage = asRecord(payload?.page);
  const payloadProps = fromProperties(payloadPage?.properties);
  if (payloadProps) return payloadProps;

  return undefined;
}

function extractUrlProperty(urlProperty: unknown): string | undefined {
  if (!urlProperty) return undefined;
  if (typeof urlProperty === "string") return urlProperty;

  const record = asRecord(urlProperty);
  if (!record) return undefined;

  if (typeof record.url === "string") return record.url;

  const richText = record.rich_text;
  if (Array.isArray(richText)) {
    const text = richText
      .map((item) => asRecord(item)?.plain_text)
      .filter((value): value is string => typeof value === "string")
      .join("");
    return text || undefined;
  }

  return undefined;
}

function findPageIdDeep(value: unknown, depth = 0): string | undefined {
  if (depth > 6) return undefined;

  const record = asRecord(value);
  if (!record) return undefined;

  if (isPageLike(record) && isNotionId(record.id)) {
    return record.id;
  }

  for (const nested of Object.values(record)) {
    if (Array.isArray(nested)) {
      for (const item of nested) {
        const found = findPageIdDeep(item, depth + 1);
        if (found) return found;
      }
      continue;
    }

    const found = findPageIdDeep(nested, depth + 1);
    if (found) return found;
  }

  return undefined;
}
