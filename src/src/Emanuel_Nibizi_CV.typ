// Import the rendercv function and all the refactored components
#import "@preview/rendercv:0.3.0": *

// Apply the rendercv template with custom configuration
#show: rendercv.with(
  name: "Emanuel Nibizi",
  title: "Emanuel Nibizi - CV",
  footer: context { [#emph[Emanuel Nibizi -- #str(here().page())\/#str(counter(page).final().first())]] },
  top-note: [ #emph[Last updated in May 2026] ],
  locale-catalog-language: "en",
  text-direction: ltr,
  page-size: "us-letter",
  page-top-margin: 0.7in,
  page-bottom-margin: 0.7in,
  page-left-margin: 0.7in,
  page-right-margin: 0.7in,
  page-show-footer: true,
  page-show-top-note: true,
  colors-body: rgb(0, 0, 0),
  colors-name: rgb(0, 0, 0),
  colors-headline: rgb(0, 0, 0),
  colors-connections: rgb(0, 0, 0),
  colors-section-titles: rgb(0, 0, 0),
  colors-links: rgb(0, 0, 0),
  colors-footer: rgb(128, 128, 128),
  colors-top-note: rgb(128, 128, 128),
  typography-line-spacing: 0.6em,
  typography-alignment: "justified",
  typography-date-and-location-column-alignment: right,
  typography-font-family-body: "New Computer Modern",
  typography-font-family-name: "New Computer Modern",
  typography-font-family-headline: "New Computer Modern",
  typography-font-family-connections: "New Computer Modern",
  typography-font-family-section-titles: "New Computer Modern",
  typography-font-size-body: 10pt,
  typography-font-size-name: 30pt,
  typography-font-size-headline: 10pt,
  typography-font-size-connections: 10pt,
  typography-font-size-section-titles: 1.4em,
  typography-small-caps-name: false,
  typography-small-caps-headline: false,
  typography-small-caps-connections: false,
  typography-small-caps-section-titles: false,
  typography-bold-name: true,
  typography-bold-headline: false,
  typography-bold-connections: false,
  typography-bold-section-titles: true,
  links-underline: true,
  links-show-external-link-icon: false,
  header-alignment: center,
  header-photo-width: 3.5cm,
  header-space-below-name: 0.7cm,
  header-space-below-headline: 0.7cm,
  header-space-below-connections: 0.7cm,
  header-connections-hyperlink: true,
  header-connections-show-icons: false,
  header-connections-display-urls-instead-of-usernames: true,
  header-connections-separator: "•",
  header-connections-space-between-connections: 0.5cm,
  section-titles-type: "with_full_line",
  section-titles-line-thickness: 0.5pt,
  section-titles-space-above: 0.5cm,
  section-titles-space-below: 0.3cm,
  sections-allow-page-break: true,
  sections-space-between-text-based-entries: 0.3em,
  sections-space-between-regular-entries: 1.2em,
  entries-date-and-location-width: 4.15cm,
  entries-side-space: 0.2cm,
  entries-space-between-columns: 0.1cm,
  entries-allow-page-break: false,
  entries-short-second-row: false,
  entries-degree-width: 1cm,
  entries-summary-space-left: 0cm,
  entries-summary-space-above: 0cm,
  entries-highlights-bullet:  "◦" ,
  entries-highlights-nested-bullet:  "◦" ,
  entries-highlights-space-left: 0.15cm,
  entries-highlights-space-above: 0cm,
  entries-highlights-space-between-items: 0cm,
  entries-highlights-space-between-bullet-and-text: 0.5em,
  date: datetime(
    year: 2026,
    month: 5,
    day: 5,
  ),
)


= Emanuel Nibizi

#connections(
  [#link("mailto:h2sbf7@protonmail.com", icon: false, if-underline: false, if-color: false)[h2sbf7\@protonmail.com]],
  [#link("tel:+39-351-586-3236", icon: false, if-underline: false, if-color: false)[351 586 3236]],
  [#link("https://www.teflonofjoy.dev/", icon: false, if-underline: false, if-color: false)[www.teflonofjoy.dev]],
  [#link("https://github.com/teflonofjoy", icon: false, if-underline: false, if-color: false)[github.com\/teflonofjoy]],
)


== Education

#education-entry(
  [
    #strong[University of Turin]

    #emph[BS] #emph[in] #emph[Computer Science]

  ],
  [
    #emph[Turin, Italy]

    #emph[Sept 2022 – Mar 2025]

  ],
  main-column-second-row: [
    - Thesis work on deep reinforcement learning for an autonomous driving simulation in Godot

    - Granted access to resources from the high performance computing center HPC4AI for the scope of the Thesis

  ],
)

== Experience

#regular-entry(
  [
    #strong[Software Engineer]

    #emph[Sistemi]

  ],
  [
    #emph[Turin, Italy]

    #emph[June 2021 – Dec 2023]

  ],
  main-column-second-row: [
    - Developed and shipped multiple SPA and web applications focusing on making the most of the proprietary project management software

  ],
)

#regular-entry(
  [
    #strong[IT Consultant]

    #emph[Sistemi]

  ],
  [
    #emph[Turin, Italy]

    #emph[Feb 2024 – Jan 2025]

  ],
  main-column-second-row: [
    - Created and maintained a system for data collection and analysis of data using Apache Kafka

  ],
)

== Projects

#regular-entry(
  [
    #strong[#link("https://blog.teflonofjoy.com/")[Blog]]

  ],
  [
    #emph[Nov 2022 – present]

  ],
  main-column-second-row: [
    #summary[Collaborative blog with my good friend 0universe0, hosted on Netlify and seamlessly deployed through my custom domain]

    - Built with HUGO and shipped with Netlify

  ],
)

== Skills

#strong[Programming:] Proficient with Python, C, Java, Dafny, Kotlin and Git, ; good understanding of Web, app development, and DevOps

#strong[Mathematics:] Good understanding of differential equations, calculus, linear algebra, mathematical logic, formal systems and software verification through formal methods

#strong[Languages:] English (fluent, Cambridge English: C2 Proficiency), French (native), Italyn (native)
