import type { Metadata } from "next";
import { Notice, PageIntro } from "../components/Content";
import { githubIssueUrl, githubRepositoryUrl } from "../lib/github";
import { sitePath } from "../lib/site-path";

export const metadata: Metadata = {
  title: "Contribute data knowledge",
  description: "Use a short, guided form to report a Delaware data correction, source change, metadata concern, or new source.",
};

const reportTypes = [
  {
    label: "Wrong or unclear information",
    title: "Correct a catalog record",
    body: "Tell us what looks wrong, what it should say, and where you found better information.",
    template: "correction.yml",
    issueTitle: "[Correction] ",
  },
  {
    label: "Broken, moved, or retired link",
    title: "Report a source change",
    body: "Tell us if a source is missing, moved, blocked, replaced, or back online.",
    template: "broken-source.yml",
    issueTitle: "[Source status] ",
  },
  {
    label: "Measure, variable, or definition",
    title: "Share metadata knowledge",
    body: "Comment on units, populations, dates, geography, missing values, suppression, or how a field should be understood.",
    template: "variable-metadata.yml",
    issueTitle: "[Metadata] ",
  },
  {
    label: "Source not yet listed",
    title: "Suggest a public data source",
    body: "Point us to a Delaware-relevant source and explain the community question it can help answer.",
    template: "dataset-suggestion.yml",
    issueTitle: "[Source suggestion] ",
  },
  {
    label: "Prompt guide feedback",
    title: "Improve a prompt guide",
    body: "Tell us when a guide is unclear, misses an important check, or produces an unsafe or unhelpful result.",
    template: "prompt-guide.yml",
    issueTitle: "[Prompt guide] ",
  },
];

export default function ContributePage() {
  return (
    <main id="main-content">
      <PageIntro eyebrow="Contribute" title="Your data knowledge can improve this catalog.">
        <p className="community-only">
          You do not need to write code or know Git. Choose a short form, describe what you know, and share a public source when you can.
        </p>
        <p className="technical-only">
          Structured GitHub issues capture evidence and stable record identifiers. Maintainers review accepted changes in pull requests and include them in versioned releases.
        </p>
      </PageIntro>

      <section className="shell contribution-intro" aria-labelledby="choose-report">
        <div>
          <p className="eyebrow">Start here</p>
          <h2 id="choose-report">What would you like us to review?</h2>
          <p>Each button opens a guided form on GitHub. A free GitHub account is required to send the form.</p>
        </div>
        <a className="secondary-button" href={githubRepositoryUrl} target="_blank" rel="noreferrer">View the public archive <span aria-hidden="true">↗</span></a>
      </section>

      <section className="shell report-grid" aria-label="Ways to contribute">
        {reportTypes.map((report, index) => (
          <article className="report-card" key={report.template}>
            <span className="report-number" aria-hidden="true">0{index + 1}</span>
            <p className="eyebrow">{report.label}</p>
            <h2>{report.title}</h2>
            <p>{report.body}</p>
            <a
              className="button-link"
              href={githubIssueUrl({ template: report.template, title: report.issueTitle })}
              target="_blank"
              rel="noreferrer"
            >
              Open the short form <span aria-hidden="true">↗</span>
            </a>
          </article>
        ))}
      </section>

      <section className="contribution-process">
        <div className="shell process-layout">
          <div>
            <p className="eyebrow">What happens next</p>
            <h2>Every accepted change leaves a clear history.</h2>
            <p className="community-only">Your report starts a public conversation. A maintainer checks the source before changing the catalog.</p>
            <p className="technical-only">The issue, reviewed pull request, commit, release note, and catalog release form one provenance chain.</p>
          </div>
          <ol className="process-steps">
            <li><span>1</span><div><strong>You send a report</strong><p>Describe the concern in your own words. Technical language is optional.</p></div></li>
            <li><span>2</span><div><strong>A person reviews the evidence</strong><p>We separate publisher facts, community knowledge, and automated observations.</p></div></li>
            <li><span>3</span><div><strong>The proposed edit is shown publicly</strong><p>A maintainer prepares a GitHub change request. Important meaning changes receive an additional review.</p></div></li>
            <li><span>4</span><div><strong>The record gets a new version</strong><p>The earlier version stays in Git history. The issue links to the accepted change or explains why no change was made.</p></div></li>
          </ol>
        </div>
      </section>

      <article className="shell prose prose-centered contribution-guidance">
        <section>
          <h2>What makes a useful report?</h2>
          <ul className="check-list">
            <li>Name the source or paste its catalog page link.</li>
            <li>Say what you saw and why it may be wrong or confusing.</li>
            <li>Link to the publisher, documentation, or another public source when possible.</li>
            <li>Explain who may be affected by the problem.</li>
            <li>It is okay to say what you do not know.</li>
          </ul>
          <Notice title="Keep private information out of public reports" tone="caution">
            <p>Do not include names, personal records, passwords, private files, protected health information, or confidential correspondence. Use the private security process for a vulnerability.</p>
          </Notice>
        </section>

        <section className="technical-only">
          <h2>Versioning and review rules</h2>
          <p>
            Stable dataset and distribution IDs remain attached to a conceptual resource. Routine evidence-backed corrections require one independent reviewer. Changes to a definition, denominator, geography, unit, comparability rule, schema, license, or derived product require the material-change review described in governance.
          </p>
          <p>
            Catalog releases use Git tags and GitHub Releases. Each release includes the catalog export, schemas, change notes, checksum manifest, and citation metadata. Automated status observations are annotated rather than silently rewritten.
          </p>
          <p><a href={sitePath("/methods")}>Read the technical methods</a></p>
        </section>
      </article>
    </main>
  );
}
