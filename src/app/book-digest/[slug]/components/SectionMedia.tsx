"use client";

import { renderBlocks } from "@/components/renderBlocks";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import type { BookDigestSection } from "@/lib/notion/types";

interface Props {
  section: BookDigestSection;
}

export function BookDigestSectionMedia({ section }: Props) {
  const { ref, isVisible } = useIntersectionObserver({
    threshold: 0.1,
    freezeOnceVisible: true,
  });

  const orientation = section.media?.orientation || "portrait";
  const mediaUrls = section.media?.urls || [];

  return (
    <div ref={ref} className="flex flex-col">
      <h2 className="text-primary mb-4 text-2xl font-semibold">{section.title}</h2>
      <div className="notion-blocks prose-lg">{renderBlocks(section.descriptionBlocks)}</div>

      {isVisible && mediaUrls.length > 0 && (
        <div className="bg-tertiary dark:bg-secondary mt-8 mb-4 flex items-center justify-center rounded-xl p-2 md:p-4 xl:rounded-2xl">
          {mediaUrls.map((src) => (
            <video
              playsInline
              muted
              loop
              autoPlay
              preload="metadata"
              key={src}
              style={{
                minHeight: orientation === "landscape" ? "320px" : "680px",
                maxWidth: orientation === "landscape" ? "100%" : "400px",
              }}
              className="h-full w-full overflow-hidden rounded-md"
            >
              <source src={`${src}#t=0.1`} />
            </video>
          ))}
        </div>
      )}
    </div>
  );
}
