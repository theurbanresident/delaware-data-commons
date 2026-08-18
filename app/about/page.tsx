import type { Metadata } from "next";
import { Notice, PageIntro } from "../components/Content";
import { sitePath } from "../lib/site-path";

export const metadata: Metadata = {
  title: "About",
  description: "Purpose, governance, independence, and correction process for Delaware Data Commons.",
};

export default function AboutPage() {
  return (
    <main id="main-content">
      <PageIntro eyebrow="About" title="A community data service with transparent stewardship.">
        <p>
          Delaware Data Commons helps people find and understand data relevant
          to Delaware. It does not replace the original publisher or serve as
          an official state record.
        </p>
      </PageIntro>

      <article className="shell prose prose-centered">
        <section>
          <h2>Why this exists</h2>
          <p>
            Public data often lives across changing agency pages, reports,
            dashboards, and request processes. The Commons creates a stable
            discovery layer: it links back to source organizations, preserves
            metadata and observed history, and—where licensing permits—can
            publish clearly labeled reproducible derivatives.
          </p>
          <Notice title="Independent, not authoritative">
            <p>
              Publishers remain the authoritative source. Catalog observations
              are evidence about access and change, not endorsements of data
              quality or fitness for use.
            </p>
          </Notice>
        </section>

        <section>
          <h2>Who the site is designed for</h2>
          <div className="audience-grid">
            <div><h3>Community organizations</h3><p>Find defensible local evidence and understand its caveats.</p></div>
            <div><h3>Researchers</h3><p>Trace versions, fields, methods, and provenance.</p></div>
            <div><h3>Policy analysts</h3><p>See release, revision, geographic, and comparability context.</p></div>
            <div><h3>Residents</h3><p>Explore public evidence without needing a GitHub account.</p></div>
          </div>
        </section>

        <section>
          <h2>Governance commitments</h2>
          <ul className="check-list">
            <li>At least two maintainers and named dataset stewards.</li>
            <li>Public methods, decisions, corrections, and retirement history.</li>
            <li>Two-person review for semantic harmonization and derived indicators.</li>
            <li>Community review of terminology, priority questions, and potentially harmful uses.</li>
            <li>Separate licensing for code, metadata, upstream copies, and derived products.</li>
          </ul>
        </section>

        <section id="corrections">
          <h2>Corrections and source updates</h2>
          <p className="community-only">If you know that a link moved, a description is wrong, or a measure needs a better explanation, you can use a short guided form. You do not need to write code.</p>
          <p className="technical-only">Publisher and community corrections become structured GitHub issues. Accepted edits are reviewed in a pull request and released as a new version; stable identifiers and prior history are retained.</p>
          <p><a className="button-link" href={sitePath("/contribute")}>Choose a feedback form</a></p>
        </section>
      </article>
    </main>
  );
}
