import type { Metadata } from "next";
import { PageIntro } from "../components/Content";
import { sitePath } from "../lib/site-path";

export const metadata: Metadata = {
  title: "Guides",
  description: "Practical paths for using Delaware public data responsibly.",
};

const guides = [
  {
    href: "/guides/prompts",
    label: "For AI-assisted data work",
    title: "Copy a careful prompt guide",
    body: "Use a provider-neutral prompt to interpret, compare, cite, or explain public data—with the human-review step kept visible.",
  },
  {
    href: "/guides/grants",
    label: "For community organizations",
    title: "Build a grant need statement",
    body: "Choose a defensible source, match the right population and place, and cite it with the necessary caveats.",
  },
  {
    href: "/datasets?sort=coverage",
    label: "For policy questions",
    title: "Find data for a place",
    body: "Compare what is available at state, county, municipal, ZIP, tract, and neighborhood levels.",
  },
  {
    href: "/methods",
    label: "For reproducible analysis",
    title: "Understand versions and provenance",
    body: "Learn how source releases, catalog checks, revisions, and future preserved snapshots relate.",
  },
  {
    href: "/status",
    label: "For continuity",
    title: "See updates and interruptions",
    body: "Distinguish a temporary access problem from late data, a changed schema, or a retired source.",
  },
  {
    href: "/contribute",
    label: "For community knowledge",
    title: "Report a correction or source change",
    body: "Use a short guided form to share what you know without editing code or data files.",
  },
];

export default function GuidesPage() {
  return (
    <main id="main-content">
      <PageIntro eyebrow="Guides" title="Start with the decision you need to make.">
        <p>
          These guides translate catalog metadata into practical workflows for
          grants, research, policy analysis, community inquiry, and careful AI-assisted work.
        </p>
      </PageIntro>
      <section className="shell guide-grid" aria-label="Available guides">
        {guides.map((guide, index) => (
          <article className="guide-card" key={guide.title}>
            <span className="guide-index">0{index + 1}</span>
            <p className="eyebrow">{guide.label}</p>
            <h2>{guide.title}</h2>
            <p>{guide.body}</p>
            <a href={sitePath(guide.href)}>Open guide <span aria-hidden="true">→</span></a>
          </article>
        ))}
      </section>
    </main>
  );
}
