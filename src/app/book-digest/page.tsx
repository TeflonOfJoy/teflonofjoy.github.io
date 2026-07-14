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
        <div className="mx-auto grid w-full grid-cols-2 gap-4 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-6 lg:p-8">
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
      className="group/book hover:bg-tertiary dark:hover:bg-secondary relative flex flex-none flex-col gap-3 overflow-hidden rounded-xl p-3"
    >
      {item.cover ? (
        <Image
          width={200}
          height={300}
          alt={`${item.title} cover`}
          className="border-secondary aspect-2/3 w-full rounded-lg border object-cover shadow-xs"
          src={item.cover}
        />
      ) : (
        <div className="border-secondary bg-tertiary flex aspect-2/3 w-full items-center justify-center rounded-lg border shadow-xs">
          <span className="text-tertiary text-2xl font-medium">{item.title.charAt(0)}</span>
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
