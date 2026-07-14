// Client singleton
export { notion } from "./client";

// Types
export type {
  // SDK types
  BlockObjectResponse,
  // Zod schemas and types
  DatabaseObjectResponse,
  DesignDetailsEpisodes,
  GoodWebsiteItem,
  GoodWebsiteItemWithDate,
  Music,
  NotionDesignDetailsEpisodeItem,
  NotionItem,
  NotionListeningHistoryItem,
  NotionStackItem,
  NotionTilItem,
  NotionTilItemWithContent,
  PageObjectResponse,
  PageResponse,
  PartialDatabaseObjectResponse,
  PartialPageObjectResponse,
  ProcessedBlock,
  // Custom types
  RichTextContent,
  RichTextItemResponse,
  Stack,
  TIL,
} from "./types";

// Zod schemas
export { DesignDetailsEpisodesSchema, MusicSchema, StackSchema, TILSchema } from "./types";

// Type guards and utilities
export { extractPlainText, hasProperties, isBlockObjectResponse } from "./types";

// Block processing
export { getAllBlocks, processBlockFromResponse } from "./blocks";

// Queries
export {
  // Design Details
  getDesignDetailsEpisodeDatabaseItems,
  // Generic
  getFullContent,
  // Good Websites
  getGoodWebsitesDatabaseItems,
  getGoodWebsitesDatabaseItemsForRss,
  // Listening History
  getListeningHistoryDatabaseItems,
  // Speaking
  getSpeakingItems,
  // Stack
  getStackDatabaseItems,
  // TIL
  getTilByShortId,
  getTilDatabaseItems,
  getTilItemContent,
} from "./queries";

// Cache
export { invalidateNotionCache } from "./cache";

// Mutations
export { createStackItem, updateStackItem } from "./mutations";
