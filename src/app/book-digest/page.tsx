import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { createMetadata, SITE_CONFIG } from "@/lib/metadata";
import { getBookDigestItems } from "@/lib/notion/queries";
import { formatPublishedDate, type NotionBookDigestItem } from "@/lib/notion/types";

export const metadata: Metadata = {
  ...createMetadata({
    title: "Book Digest",
    description:
      "Breaking down the books I read — key ideas, takeaways, and notes from each book, one chapter at a time.",
    path: "/book-digest",
  }),
  alternates: {
    types: {
      "application/rss+xml": `${SITE_CONFIG.url}/book-digest/rss.xml`,
    },
  },
};

export const dynamic = "force-dynamic";

export default async function BookDigestIndex() {
  const items = await getBookDigestItems();

  return (
    <div className="@container flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto grid w-full grid-cols-3 gap-3 p-4 sm:grid-cols-4 sm:gap-4 md:grid-cols-5 lg:grid-cols-6 lg:gap-5 lg:p-8 xl:grid-cols-7">
          {items.map((item) => (
            <BookDigestItem key={item.slug} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}

function BookDigestItem({ item }: { item: NotionBookDigestItem }) {
  const date = formatPublishedDate(item.published);

  return (
    <Link
      href={`/book-digest/${item.slug}`}
      className="group/book hover:bg-tertiary dark:hover:bg-secondary relative mx-auto flex w-full max-w-40 flex-none flex-col items-center gap-2 overflow-hidden rounded-xl p-2 sm:gap-3 sm:p-3"
    >
      {item.cover ? (
        <Image
          width={128}
          height={192}
          sizes="(max-width: 640px) 28vw, (max-width: 1024px) 18vw, 128px"
          alt={`${item.title} cover`}
          className="border-secondary aspect-2/3 w-full max-w-32 rounded-lg border object-cover shadow-xs"
          src={item.cover}
        />
      ) : (
        <div className="border-secondary bg-tertiary flex aspect-2/3 w-full max-w-32 items-center justify-center rounded-lg border shadow-xs">
          <span className="text-tertiary text-xl font-medium">{item.title.charAt(0)}</span>
        </div>
      )}

      <div className="flex flex-col">
        <div className="text-primary line-clamp-2 text-sm font-medium">{item.title}</div>
        {item.author && <div className="text-tertiary line-clamp-1 text-sm">{item.author}</div>}
        <div className="text-quaternary text-sm">{date}</div>
      </div>
    </Link>
  );
}
