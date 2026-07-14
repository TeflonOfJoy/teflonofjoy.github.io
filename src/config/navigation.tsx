import React from "react";

import { AppDissection } from "@/components/icons/AppDissection";
import { Ballot } from "@/components/icons/Ballot";
import { BrowserTabs } from "@/components/icons/BrowserTabs";
import { FileText2 } from "@/components/icons/FileText2";
import { Headphones3 } from "@/components/icons/Headphones3";
import { Home } from "@/components/icons/Home";
import { LightBulb } from "@/components/icons/LightBulb";
import { Person } from "@/components/icons/Person";
import { IconProps } from "@/components/icons/types";

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<IconProps>;
  keywords?: string[];
  isActive?: (pathname: string) => boolean;
  section?: "main" | "projects";
}

export const navigationItems: NavigationItem[] = [
  {
    id: "home",
    label: "Home",
    href: "/",
    icon: Home,
    keywords: ["home", "dashboard"],
    isActive: (pathname) => pathname === "/",
    section: "main",
  },
  {
    id: "about",
    label: "About",
    href: "/about",
    icon: Person,
    keywords: ["about", "bio", "me"],
    isActive: (pathname) => pathname === "/about",
    section: "main",
  },
  {
    id: "writing",
    label: "Writing",
    href: "https://blog.teflonofjoy.dev",
    icon: FileText2,
    keywords: ["writing", "blog", "posts"],
    isActive: () => false,
    section: "main",
  },
  {
    id: "app-dissection",
    label: "App Dissection",
    href: "/app-dissection",
    icon: AppDissection,
    keywords: ["app", "dissection", "analysis"],
    isActive: (pathname) => pathname.startsWith("/app-dissection"),
    section: "projects",
  },
  {
    id: "stack",
    label: "Stack",
    href: "/stack",
    icon: Ballot,
    keywords: ["stack", "tools", "tech"],
    isActive: (pathname) => pathname.startsWith("/stack"),
    section: "projects",
  },
  {
    id: "til",
    label: "TIL",
    href: "/til",
    icon: LightBulb,
    keywords: ["til", "today i learned", "notes", "learnings"],
    isActive: (pathname) => pathname.startsWith("/til"),
    section: "projects",
  },
  {
    id: "music",
    label: "Listening",
    href: "/listening",
    icon: Headphones3,
    keywords: ["listening", "music", "audio"],
    isActive: (pathname) => pathname === "/listening",
    section: "projects",
  },
  {
    id: "good-websites",
    label: "Sites",
    href: "/sites",
    icon: BrowserTabs,
    keywords: ["sites", "good websites", "websites", "inspiration"],
    isActive: (pathname) => pathname.startsWith("/sites"),
    section: "projects",
  },
];

// Helper functions to filter navigation items
export const getMainNavigationItems = () =>
  navigationItems.filter((item) => item.section === "main");

export const getProjectNavigationItems = () =>
  navigationItems.filter((item) => item.section === "projects");

export const getAllNavigationItems = () => navigationItems;
