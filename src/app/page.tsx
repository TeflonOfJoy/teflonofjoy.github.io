import type { Metadata } from "next";
import Image from "next/image";

import { ProjectsList } from "@/components/home/ProjectsList";
import { GitHubIcon } from "@/components/icons/SocialIcons";
import {
  List,
  ListItem,
  ListItemLabel,
  Section,
  SectionHeading,
} from "@/components/shared/ListComponents";
import { createMetadata, createPersonJsonLd, SITE_CONFIG } from "@/lib/metadata";

const BLOG_URL = "https://blog.teflonofjoy.dev";

export const metadata: Metadata = createMetadata({
  title: SITE_CONFIG.title,
  description: SITE_CONFIG.description,
  path: "/",
});

export default function Home() {
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

              <h1 id="home-title" className="text-2xl font-semibold">
                TeflonOfJoy
              </h1>

              <p className="text-secondary text-2xl font-semibold text-pretty">
                I&apos;m a developer building things for the web.
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
              <SectionHeading>Writing</SectionHeading>
              <List>
                <ListItem
                  href={BLOG_URL}
                  className="flex-col items-start gap-0 sm:flex-row sm:items-center sm:gap-2"
                >
                  <ListItemLabel className="sm:line-clamp-1">
                    Re:Furbed Starting a Blog in Another World
                  </ListItemLabel>
                </ListItem>
              </List>
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
