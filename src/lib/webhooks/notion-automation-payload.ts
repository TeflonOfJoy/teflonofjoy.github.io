type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | undefined {
  return typeof value === "object" && value !== null ? (value as JsonRecord) : undefined;
}

/**
 * Notion automation / database-button webhooks use different payload shapes.
 * Database automations often send `data.id`; button clicks may send `entity.id`.
 */
export function extractPageIdFromWebhookBody(body: unknown): string | undefined {
  const root = asRecord(body);
  if (!root) return undefined;

  const data = asRecord(root.data);
  if (typeof data?.id === "string") return data.id;
  if (typeof data?.page_id === "string") return data.page_id;

  const dataPage = asRecord(data?.page);
  if (typeof dataPage?.id === "string") return dataPage.id;

  const entity = asRecord(root.entity);
  if (typeof entity?.id === "string") return entity.id;

  if (typeof root.id === "string" && root.type === "page") return root.id;

  return undefined;
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
