import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { createArticleJsonLd, createMetadata, truncateDescription } from "@/lib/metadata";
import { getBookDigestItemBySlug, getBookDigestItems } from "@/lib/notion/queries";
import { extractPreviewText } from "@/lib/notion/types";

import { BookDigestDetail } from "./components/BookDigestDetail";

export const revalidate = 3600;

export function generateStaticParams(): { slug: string }[] {
  return [];
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const post = await getBookDigestItemBySlug(params.slug);

  if (!post) {
    return {
      title: "Book Digest Not Found",
    };
  }

  const descriptionText = extractPreviewText(post.introBlocks, { separator: " " });

  return createMetadata({
    title: `${post.title} - Book Digest`,
    description: truncateDescription(descriptionText),
    path: `/book-digest/${post.slug}`,
    type: "article",
    publishedTime: post.published,
  });
}

export default async function BookDigestPostPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const [post, allItems] = await Promise.all([
    getBookDigestItemBySlug(params.slug),
    getBookDigestItems(),
  ]);

  if (!post) {
    notFound();
  }

  const descriptionText = extractPreviewText(post.introBlocks, { separator: " " });

  // Generate JSON-LD structured data
  const articleJsonLd = createArticleJsonLd({
    title: `${post.title} - Book Digest`,
    description: descriptionText,
    path: `/book-digest/${post.slug}`,
    publishedTime: post.published,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <BookDigestDetail post={post} allItems={allItems} />
    </>
  );
}
