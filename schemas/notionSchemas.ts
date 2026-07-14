// ⚠️ AUTO-GENERATED FILE — DO NOT EDIT MANUALLY
// Run `bun run generate-schemas` to regenerate.

import { z } from "zod";

export const StackSchema = z.object({
  Slug: z.string().optional(),
  Description: z.string().optional(),
  Likes: z.number().optional(),
  Image: z.string().optional(),
  "Created time": z.string().optional(),
  "Preview Image": z.string().optional(),
  "Preview Image Dark": z.string().optional(),
  URL: z.string().optional(),
  Platforms: z.array(z.enum(["Windows", "Web", "Physical", "macOS", "iOS"])).optional(),
  "Preview Updated": z.string().optional(),
  "Capture Screenshot": z.any().optional(),
  "Preview Error": z.string().optional(),
  "Process icon": z.any().optional(),
  Status: z.enum(["Inactive", "Active"]).optional(),
  "Preview Status": z.enum(["Queued", "Processing", "Done", "Error", "Pending"]).optional(),
  Name: z.string().optional(),
});

export type Stack = z.infer<typeof StackSchema>;

export const GoodWebsitesSchema = z.object({
  "Preview Status": z.enum(["Queued", "Processing", "Done", "Error", "Pending"]).optional(),
  "Created time": z.string().optional(),
  "Preview Error": z.string().optional(),
  "Capture Screenshot": z.any().optional(),
  X: z.string().optional(),
  Tags: z.array(z.enum(["Personal site", "Company"])).optional(),
  "Preview Image Dark": z.string().optional(),
  URL: z.string().optional(),
  "Preview Image": z.string().optional(),
  "Preview Updated": z.string().optional(),
  Likes: z.number().optional(),
  "Process favicon": z.any().optional(),
  Name: z.string().optional(),
});

export type GoodWebsites = z.infer<typeof GoodWebsitesSchema>;

export const TILSchema = z.object({
  "Generate Short ID": z.any().optional(),
  Published: z.string().optional(),
  "Short ID": z.string().optional(),
  Likes: z.number().optional(),
  "Created time": z.string().optional(),
  Title: z.string().optional(),
});

export type TIL = z.infer<typeof TILSchema>;
