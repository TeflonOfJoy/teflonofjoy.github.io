import Image from "next/image";

import { BookDigestDock } from "@/components/BookDigestDock";
import { renderBlocks } from "@/components/renderBlocks";
import { PageTitle } from "@/components/Typography";
import { FancySeparator } from "@/components/ui/FancySeparator";
import {
  formatPublishedDate,
  type NotionBookDigestItem,
  type NotionBookDigestItemWithContent,
} from "@/lib/notion/types";

import { BookDigestSectionMedia } from "./SectionMedia";

interface Props {
  post: NotionBookDigestItemWithContent;
  allItems: NotionBookDigestItem[];
}

export function BookDigestDetail({ post, allItems }: Props) {
  const date = formatPublishedDate(post.published);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-3xl flex-col gap-12 px-4 py-12 md:px-6 lg:px-8 lg:py-16 xl:py-20">
        {/* Header with cover and title */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
          {post.cover && (
            <Image
              src={post.cover}
              width={140}
              height={210}
              quality={100}
              alt={`${post.title} cover`}
              className="border-secondary aspect-2/3 w-32 rounded-xl border object-cover shadow-sm"
            />
          )}
          <div className="flex flex-col gap-1">
            <PageTitle>{post.title}</PageTitle>
            {post.author && <span className="text-secondary text-lg">{post.author}</span>}
            <span className="text-tertiary">{date}</span>
            {post.tags && post.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-tertiary text-secondary rounded-full px-2.5 py-0.5 text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Intro description from Notion blocks */}
        <div className="notion-blocks prose-lg">{renderBlocks(post.introBlocks)}</div>

        {/* Sections */}
        <div className="flex flex-col gap-12">
          {post.sections.map((section, i) => (
            <BookDigestSectionMedia section={section} key={`${section.title}-${i}`} />
          ))}
        </div>

        <FancySeparator />

        {/* macOS-style Dock Navigation */}
        <BookDigestDock items={allItems} currentSlug={post.slug} />
      </div>
    </div>
  );
}
