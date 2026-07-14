# Architecture

## Data Layer

**Notion as CMS**: All content (stack, sites, TIL, book digest) lives in separate Notion databases.

**Schema generation**: TypeScript schemas are auto-generated from Notion database properties via `generateNotionSchemas.ts`. The dev server runs this automatically on startup.

**API routes**: Next.js route handlers with 24-hour caching. Data flows from Notion → API route → SWR hook → component.

**Client-side fetching**: SWR hooks in `/hooks/` handle data fetching and caching.

## UI Layer

**Layout system**:

- `PrimarySidebar` — Collapsible navigation sidebar
- `CommandMenu` — Global command palette
- `ListDetailLayout` — Consistent list-detail navigation pattern

**State management**: Jotai for global state (sidebar toggle, etc.)

**Styling**: TailwindCSS with custom design tokens, Radix UI primitives

**Hotkeys**: Global keyboard shortcuts via `react-hotkeys-hook`

## Key Patterns

**Route structure**: App router with nested layouts per content section

**Infinite scroll**: `InfiniteScrollList` component + `useInfiniteScroll` hook

**Theming**: `next-themes` for dark/light mode

**Content rendering**: Notion blocks → React components via `renderBlocks.tsx`

## Notion Webhooks

Webhook endpoints called by Notion database automations (button properties). All webhooks verify the `x-webhook-secret` header against `NOTION_WEBHOOK_VERIFICATION_SECRET` if configured.

**Endpoints**:

- `/api/webhooks/generate-short-id` — Generates a unique 7-char Short ID for writing posts
- `/api/webhooks/optimize-writing-images` — Optimizes and uploads blog images to R2
- `/api/webhooks/process-stack-icon` — Optimizes existing stack page icons to R2
- `/api/webhooks/update-site-icon` — Fetches and optimizes favicons for good websites

  Capture button — add two Send webhook actions (order matters):

  1. Send webhook → https://www.teflonofjoy.dev/api/webhooks/update-site-icon
  2. Send webhook → https://www.teflonofjoy.dev/api/webhooks/capture-site-preview

  Both use header: x-webhook-secret: <NOTION_WEBHOOK_VERIFICATION_SECRET>

## Migration Scripts

These scripts were used for one-time data migrations and are rarely needed:

- `backfillStacksToNotion.ts` — Migrated JSON stack data to Notion
- `backfillAmaToNotion.ts` — Migrated AMA questions to Notion
- `migrateSimplecast.ts` — Mirrored podcast episodes to S3
