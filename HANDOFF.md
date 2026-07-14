# Handoff — teflonofjoy.dev migration

**Repo**: Next.js 16 fork of briOS, migrated to **teflonofjoy.dev**. Package manager
**Bun** (installed at `/usr/bin/bun`). Blog is external at `blog.teflonofjoy.dev`. Vercel
deploy is working (GitHub Git webhook already connected).

## Current state (all committed & pushed to `main`)

- **Notion-backed sections kept**: Home, About, **Stack**, **Sites**, **TIL**, **Book Digest**.
  Plus `/numbers` (static, standalone).
- **Removed**: Hacker News / AMA / internal Writing, **Listening** (+ Spotify/Music),
  **Speaking** (from About), **Design Details**.
- **Transformed**: the former "App Dissection" section is now **Book Digest**
  (`/book-digest`, `/book-digest/[slug]`, `/book-digest/rss.xml`).
- Unused deps removed (`fathom-client`, `postmark`, `jsonwebtoken`, `botid`). Package renamed
  `teflonofjoy`.
- `bun run lint` and `bun run build` both pass clean.

## Book Digest — Notion model

DB "Book Digest" properties: `Name` (title = book title), `Slug` (rich_text), `Author`
(rich_text), `Cover` (url), `Tags` (multi_select), `Published` (date), `Status` (select:
Draft/Published). Only `Status = Published` entries show.

Page content structure: **intro** blocks before the first `divider`; then each `heading_2`
starts a **section** (idea/chapter); optional per-section media via a `code` JSON block:
`{"type":"book-digest-video","urls":["..."],"orientation":"portrait|landscape"}`.

## Notion — integration & databases

Integration bot "Website" (workspace "My Workspace"). Parent page:
`39dc3041-4385-80b7-819c-f172a692e729`.
Create DBs with `bun run setup-notion-databases <parentPageId>` (supports `ONLY="Book Digest"`
filter for incremental creation).

**In-use DB IDs (set these in Vercel):**

```
NOTION_STACK_DATABASE_ID=39dc3041-4385-811d-a600-d9b4dcd7648e
NOTION_GOOD_WEBSITES_DATABASE_ID=39dc3041-4385-81be-bc5e-de269fba36fe
NOTION_TIL_DATABASE_ID=39dc3041-4385-8194-9814-fe73e76b16ed
NOTION_BOOK_DIGEST_DATABASE_ID=39dc3041-4385-8162-9ca6-d441dddf98bb
```

**Orphaned DBs** (archive in Notion + remove env from Vercel): App Dissection
`39dc3041-4385-8177-b32c-eab67bddac77`, Music `39dc3041-4385-81ba-bc27-c9f71bbdf0e6`,
Speaking `39dc3041-4385-81ac-83ab-da00e088d17f`, Design Details
`39dc3041-4385-816b-8f28-eab27ade1291`.

## Remaining work (user actions)

1. **Vercel env**: ensure `NOTION_TOKEN` + the 4 in-use DB IDs; **remove**
   `NOTION_APP_DISSECTION_DATABASE_ID`, `NOTION_SPEAKING_DATABASE_ID`,
   `NOTION_MUSIC_DATABASE_ID`, `NOTION_DESIGN_DETAILS_EPISODES_DATABASE_ID`.
2. **Likes** (Upstash Redis): `UPSTASH_LIKES_REST_URL` / `UPSTASH_LIKES_REST_TOKEN` +
   `LIKES_HASH_SALT` (required in prod, else like endpoints 500). Optional cache:
   `UPSTASH_NOTION_CACHE_REST_URL` / `UPSTASH_NOTION_CACHE_REST_TOKEN`.
3. **Book covers**: if using **external URLs** (Open Library/Goodreads), add the host to
   `next.config.ts` → `images.remotePatterns`, otherwise `next/image` throws. Covers
   **uploaded to Notion** (page icon/file) already work.
4. **Image assets** in `public/` still Brian's branding: `img/avatar.jpg`, `img/og.png`,
   favicons, `apple-touch-icon.png`, `web-app-manifest-*.png`.
5. **R2** (only if enabling Stack/Sites preview images): `next.config.ts` still allow-lists
   Brian's R2 hostname (`pub-...r2.dev`) and `scripts/optimizeR2Images.ts` has
   `BUCKET_NAME = "brios"` — replace with your own bucket + `R2_*` env vars.
6. **Security**: `NOTION_TOKEN` was pasted into chat/terminal — **rotate it** in the Notion
   integration settings and update Vercel.

## Technical notes

- About no longer depends on Notion (no more 500). Bio in `src/app/about/page.tsx` is a
  placeholder to personalize.
- In-use Notion DBs are **empty**: pages render fine but empty until rows are added.
- Commands: `bun run lint`, `bun run build`, `bun run generate-schemas`,
  `bun run setup-notion-databases`.
