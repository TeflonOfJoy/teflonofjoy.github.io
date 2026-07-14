/**
 * Favicon extraction utilities
 * Fetches and parses favicons from URLs with multiple fallback strategies
 */

/**
 * Check if a URL is a valid HTTP/HTTPS URL (not a data URL or other scheme)
 */
function isValidHttpUrl(iconUrl: string): boolean {
  return iconUrl.startsWith("http://") || iconUrl.startsWith("https://");
}

/**
 * Build a favicon URL from Google's public favicon service for a site URL.
 * Synchronous, no network call — used as a render-time fallback when a Notion
 * page has no icon set, avoiding the R2 upload pipeline entirely.
 * Returns undefined when the input URL is missing or malformed.
 */
export function getGoogleFaviconUrl(url?: string, size = 128): string | undefined {
  if (!url) return undefined;
  try {
    const candidates = getFaviconHostCandidates(url);
    const hostname = candidates.find((host, index) => index > 0) ?? candidates[0];
    if (!hostname) return undefined;
    return `https://www.google.com/s2/favicons?sz=${size}&domain=${hostname}`;
  } catch {
    return undefined;
  }
}

/**
 * Check if a URL is a base64 data URL
 */
export function isDataUrl(iconUrl: string): boolean {
  return iconUrl.startsWith("data:");
}

/**
 * Parse a data URL and extract the buffer and content type
 * Returns null if the data URL is invalid or not base64 encoded
 */
export function parseDataUrl(dataUrl: string): { buffer: Buffer; contentType: string } | null {
  if (!isDataUrl(dataUrl)) {
    return null;
  }

  // Data URL format: data:[<mediatype>][;base64],<data>
  const match = dataUrl.match(/^data:([^;,]+)?(?:;base64)?,(.*)$/);
  if (!match) {
    return null;
  }

  const contentType = match[1] || "application/octet-stream";
  const data = match[2];

  if (!data) {
    return null;
  }

  // Check if it's base64 encoded (most common case)
  if (dataUrl.includes(";base64,")) {
    try {
      const buffer = Buffer.from(data, "base64");
      return { buffer, contentType };
    } catch {
      return null;
    }
  }

  // URL-encoded data (less common)
  try {
    const decoded = decodeURIComponent(data);
    const buffer = Buffer.from(decoded);
    return { buffer, contentType };
  } catch {
    return null;
  }
}

/**
 * Fetch and parse HTML to extract metadata including favicon
 */
async function fetchBasicMetadata(url: string): Promise<{
  title?: string;
  description?: string;
  author?: string;
  imageUrl?: string;
  siteName?: string;
  iconUrl?: string;
}> {
  try {
    // Use a simple fetch with headers that mimic a browser
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        DNT: "1",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    // Extract just the head section to minimize parsing
    const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    const headContent = headMatch ? headMatch[1] : html.substring(0, 10000); // Fallback to first 10KB

    // Helper function to extract meta content with flexible attribute order
    const extractMetaByProperty = (property: string): string | undefined => {
      // Try multiple patterns to handle different attribute orders
      const patterns = [
        new RegExp(
          `<meta[^>]*\\s+property=["']${property}["'][^>]*\\s+content=["']([^"']+)["']`,
          "i",
        ),
        new RegExp(
          `<meta[^>]*\\s+content=["']([^"']+)["'][^>]*\\s+property=["']${property}["']`,
          "i",
        ),
      ];

      for (const pattern of patterns) {
        const match = headContent.match(pattern);
        if (match) return match[1]?.trim();
      }
      return undefined;
    };

    const extractMetaByName = (name: string): string | undefined => {
      // Try multiple patterns to handle different attribute orders
      const patterns = [
        new RegExp(`<meta[^>]*\\s+name=["']${name}["'][^>]*\\s+content=["']([^"']+)["']`, "i"),
        new RegExp(`<meta[^>]*\\s+content=["']([^"']+)["'][^>]*\\s+name=["']${name}["']`, "i"),
      ];

      for (const pattern of patterns) {
        const match = headContent.match(pattern);
        if (match) return match[1]?.trim();
      }
      return undefined;
    };

    // Extract Open Graph tags
    const ogTitle = extractMetaByProperty("og:title");
    const ogDescription = extractMetaByProperty("og:description");
    const ogImage = extractMetaByProperty("og:image");
    const ogSiteName = extractMetaByProperty("og:site_name");

    // Extract Twitter Card tags as fallback
    const twitterTitle =
      extractMetaByProperty("twitter:title") || extractMetaByName("twitter:title");
    const twitterDescription =
      extractMetaByProperty("twitter:description") || extractMetaByName("twitter:description");
    const twitterImage =
      extractMetaByProperty("twitter:image") || extractMetaByName("twitter:image");

    // Extract standard meta tags
    const metaDescription = extractMetaByName("description");
    const metaAuthor = extractMetaByName("author");

    // Extract title tag
    const titleMatch = headContent.match(/<title[^>]*>([^<]+)<\/title>/i);
    const titleTag = titleMatch ? titleMatch[1]?.trim() : undefined;

    // Extract favicon/icon information
    let iconUrl: string | undefined;

    // Helper function to extract link href with flexible attribute order
    const extractLinkHref = (relPattern: string): string | undefined => {
      const patterns = [
        new RegExp(`<link[^>]*\\s+rel=["']${relPattern}["'][^>]*\\s+href=["']([^"']+)["']`, "i"),
        new RegExp(`<link[^>]*\\s+href=["']([^"']+)["'][^>]*\\s+rel=["']${relPattern}["']`, "i"),
      ];

      for (const pattern of patterns) {
        const match = headContent.match(pattern);
        if (match) return match[1];
      }
      return undefined;
    };

    // Try to extract high-quality icons in order of preference
    // Data URLs (base64 encoded) are now supported
    // Note: ICO files are deprioritized because they often contain only BMP data
    // which is harder to process than PNG/SVG formats
    const candidateIcons: string[] = [];

    // Helper to check if URL points to an ICO file
    const isIcoFile = (url: string): boolean => {
      try {
        const pathname = new URL(url, "http://example.com").pathname.toLowerCase();
        return pathname.endsWith(".ico");
      } catch {
        return url.toLowerCase().endsWith(".ico");
      }
    };

    // 1. Apple touch icon (usually highest quality, 180x180 or similar)
    // Skip if it's an ICO file - these often don't contain extractable PNG data
    const appleIcon =
      extractLinkHref("apple-touch-icon") || extractLinkHref("apple-touch-icon-precomposed");
    if (appleIcon && !isIcoFile(appleIcon)) candidateIcons.push(appleIcon);

    // 2. High-res icon with sizes attribute
    const highResIcon = headContent.match(
      /<link[^>]*\s+rel=["']icon["'][^>]*\s+sizes=["'](?:192x192|256x256|512x512)[^>]*\s+href=["']([^"']+)["']/i,
    );
    if (highResIcon && highResIcon[1]) {
      candidateIcons.push(highResIcon[1]);
    }

    // 3. Icon with type="image/png" or type="image/svg+xml"
    const patterns = [
      /<link[^>]*\s+type=["']image\/(?:png|svg\+xml)["'][^>]*\s+href=["']([^"']+)["']/i,
      /<link[^>]*\s+href=["']([^"']+\.(?:png|svg))["'][^>]*>/i,
    ];

    for (const pattern of patterns) {
      const match = headContent.match(pattern);
      if (match && match[1]) {
        candidateIcons.push(match[1]);
        break;
      }
    }

    // 4. Any icon or shortcut icon (prefer non-ICO)
    const standardIcon =
      extractLinkHref("icon") || extractLinkHref("shortcut icon") || extractLinkHref("shortcut");
    if (standardIcon && !isIcoFile(standardIcon)) candidateIcons.push(standardIcon);

    // 5. ICO files as lower priority fallback (may not have extractable PNG data)
    if (appleIcon && isIcoFile(appleIcon)) candidateIcons.push(appleIcon);
    if (standardIcon && isIcoFile(standardIcon)) candidateIcons.push(standardIcon);

    // 6. OG image as last resort (sometimes sites use their logo as og:image)
    if (ogImage && ogImage.includes("logo")) {
      candidateIcons.push(ogImage);
    }

    // Use the first valid candidate
    iconUrl = candidateIcons[0];

    // Make icon URL absolute if it's relative
    if (iconUrl) {
      try {
        const baseUrl = new URL(url);
        iconUrl = new URL(iconUrl, baseUrl).toString();
      } catch {
        // If URL construction fails, keep the original
      }
    }

    // Combine results with fallbacks
    return {
      title: ogTitle || twitterTitle || titleTag || undefined,
      description: ogDescription || twitterDescription || metaDescription || undefined,
      author: metaAuthor || undefined,
      imageUrl: ogImage || twitterImage || undefined,
      siteName: ogSiteName || undefined,
      iconUrl: iconUrl || undefined,
    };
  } catch {
    return {};
  }
}

/**
 * Verify that a URL is accessible and returns a valid response
 */
async function verifyIconUrl(iconUrl: string): Promise<boolean> {
  try {
    const response = await fetch(iconUrl, {
      method: "HEAD", // Just check headers, don't download the full file
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get the best quality favicon URL for a given URL
 * This function prioritizes higher quality favicons over Google's generic service
 *
 * Priority order:
 * 1. Apple touch icon from HTML meta tags (verified to be accessible)
 * 2. High-res icon from HTML meta tags (verified to be accessible)
 * 3. Standard icon from HTML meta tags (verified to be accessible)
 * 4. Google's favicon service (128px for better quality)
 */
export async function getBestFaviconUrl(url: string): Promise<string> {
  try {
    const metadata = await fetchBasicMetadata(url);
    if (metadata.iconUrl) {
      // Data URLs (base64 encoded) can be returned directly - no verification needed
      if (isDataUrl(metadata.iconUrl)) {
        return metadata.iconUrl;
      }

      // Only use HTTP/HTTPS URLs, and verify they're accessible
      if (isValidHttpUrl(metadata.iconUrl)) {
        const isAccessible = await verifyIconUrl(metadata.iconUrl);
        if (isAccessible) {
          return metadata.iconUrl;
        }
        // If the icon URL is not accessible, fall through to Google's service
      }
    }
  } catch {
    // Silent failure, will use fallback
  }

  // Fallback to Google's favicon service (try parent domain for subdomains)
  for (const hostname of getFaviconHostCandidates(url)) {
    const googleFaviconUrl = `https://www.google.com/s2/favicons?sz=128&domain=${hostname}`;
    const buffer = await downloadIconBuffer(googleFaviconUrl);
    if (buffer) return googleFaviconUrl;
  }

  try {
    const hostname = getFaviconHostCandidates(url)[0];
    return `https://www.google.com/s2/favicons?sz=128&domain=${hostname ?? "example.com"}`;
  } catch {
    return "https://www.google.com/s2/favicons?sz=128&domain=example.com";
  }
}

/**
 * Hostnames to try when resolving a favicon (subdomains often block bots or lack
 * Google favicon entries — e.g. wiki.librarything.com returns 403 and Google 404).
 */
function getFaviconHostCandidates(siteUrl: string): string[] {
  try {
    const hostname = new URL(siteUrl).hostname.toLowerCase();
    const candidates: string[] = [];
    const add = (host: string) => {
      const normalized = host.replace(/^www\./, "");
      if (normalized && !candidates.includes(normalized)) {
        candidates.push(normalized);
      }
    };

    add(hostname);

    const bare = hostname.replace(/^www\./, "");
    for (const prefix of ["wiki.", "blog.", "m.", "docs.", "app.", "forum."]) {
      if (bare.startsWith(prefix)) {
        add(bare.slice(prefix.length));
      }
    }

    const parts = bare.split(".");
    if (parts.length > 2) {
      add(parts.slice(-2).join("."));
    }

    return candidates;
  } catch {
    return [];
  }
}

async function downloadGoogleFaviconBuffer(siteUrl: string, size = 128): Promise<Buffer | null> {
  for (const hostname of getFaviconHostCandidates(siteUrl)) {
    const googleFaviconUrl = `https://www.google.com/s2/favicons?sz=${size}&domain=${hostname}`;
    const buffer = await downloadIconBuffer(googleFaviconUrl);
    if (buffer) return buffer;
  }
  return null;
}

/**
 * Download an icon image from an HTTP(S) or data URL into a buffer.
 */
export async function downloadIconBuffer(iconUrl: string): Promise<Buffer | null> {
  if (isDataUrl(iconUrl)) {
    const parsed = parseDataUrl(iconUrl);
    return parsed?.buffer ?? null;
  }

  if (!isValidHttpUrl(iconUrl)) {
    return null;
  }

  const response = await fetch(iconUrl);
  if (!response.ok) {
    return null;
  }

  return Buffer.from(await response.arrayBuffer());
}

/**
 * Fast favicon fetch for Notion button webhooks.
 * Skips slow HTML scraping — Notion times out webhook calls after ~5 seconds.
 */
export async function fetchWebhookFaviconBuffer(siteUrl: string): Promise<Buffer | null> {
  return downloadGoogleFaviconBuffer(siteUrl, 128);
}

/**
 * Resolve and download the best favicon for a site URL.
 */
export async function fetchFaviconBuffer(siteUrl: string): Promise<Buffer | null> {
  try {
    const iconUrl = await getBestFaviconUrl(siteUrl);
    const buffer = await downloadIconBuffer(iconUrl);
    if (buffer) return buffer;
  } catch {
    // Fall through to Google candidates
  }

  return downloadGoogleFaviconBuffer(siteUrl, 128);
}
