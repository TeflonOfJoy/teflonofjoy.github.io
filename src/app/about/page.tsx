import type { Metadata } from "next";
import Image from "next/image";

import { ProjectsList } from "@/components/home/ProjectsList";
import { GitHubIcon } from "@/components/icons/SocialIcons";
import { InlineLink, ListItem, Section, SectionHeading } from "@/components/shared/ListComponents";
import { createMetadata, createPersonJsonLd, SITE_CONFIG } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createMetadata({
  title: "About",
  description: SITE_CONFIG.description,
  path: "/about",
});

export default function About() {
  const personJsonLd = createPersonJsonLd();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <div className="flex flex-1 flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="text-primary mx-auto flex max-w-2xl flex-1 flex-col gap-16 py-16 leading-[1.6] sm:py-32">
            <Section>
              <Image
                src="/img/avatar.jpg"
                alt="TeflonOfJoy"
                width={60}
                height={60}
                draggable={false}
                className="mb-8 rounded-full select-none"
              />

              <p className="text-secondary text-2xl font-medium text-pretty">
                I&apos;m TeflonOfJoy, a developer who likes building things for the web.
              </p>

              <p className="text-secondary text-2xl font-medium">
                This is my personal site. I write on my{" "}
                <InlineLink href="https://blog.teflonofjoy.dev">blog</InlineLink> and collect the
                tools, sites, and things I&apos;m into here.
              </p>
            </Section>

            <Section className="flex flex-row gap-2">
              <ListItem href="https://github.com/TeflonOfJoy" className="group -ml-1 p-2">
                <GitHubIcon
                  size={28}
                  className="text-quaternary group-hover:text-primary select-none"
                />
              </ListItem>
            </Section>

            <Section>
              <SectionHeading>Projects</SectionHeading>
              <ProjectsList />
            </Section>
          </div>
        </div>
      </div>
    </>
  );
}
