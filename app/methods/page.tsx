import type { Metadata } from "next";
import { Notice, PageIntro } from "../components/Content";

export const metadata: Metadata = {
  title: "Methods and limitations",
  description: "How Delaware Data Commons imports, checks, describes, and responsibly preserves public data sources.",
};

export default function MethodsPage() {
  return (
    <main id="main-content">
      <PageIntro eyebrow="Methods" title="What our checks mean—and what they do not.">
        <p>
          The catalog separates whether a source can be reached from whether
          its data are current, structurally consistent, or appropriate for a
          particular question.
        </p>
      </PageIntro>

      <div className="shell content-layout">
        <aside className="section-nav" aria-label="On this page">
          <strong>On this page</strong>
          <a href="#inclusion">Inclusion</a>
          <a href="#checks">Weekly checks</a>
          <a href="#dates">Dates</a>
          <a href="#preservation">Preservation</a>
          <a href="#privacy">Privacy</a>
          <a href="#limitations">Limitations</a>
        </aside>

        <article className="prose">
          <section id="inclusion">
            <p className="eyebrow">01 · Inclusion</p>
            <h2>How a source enters the catalog</h2>
            <p>
              Phase 1 begins with the Delaware SHIP Community Data Resource
              Guide. Imported records retain their workbook row provenance and
              start as <strong>imported—review pending</strong>. A record is not
              considered verified until a curator has confirmed the publisher,
              access route, coverage, dates, and reuse terms.
            </p>
            <p>
              A source may be a dataset, recurring report series, survey,
              projection, portal, collection, or request-only resource. Those
              types are kept distinct because they require different checks and
              should not imply the same level of machine-readiness.
            </p>
          </section>

          <section id="checks">
            <p className="eyebrow">02 · Weekly checks</p>
            <h2>How automated checks work</h2>
            <p>
              Each week, automated checks attempt to reach the expected file,
              page, or API and test basic retrieval and structure. A successful
              check means the source responded at that time. It does not mean
              the underlying data were updated, complete, error-free, or
              endorsed. Meaningful definition and methodology changes require
              human review.
            </p>
            <div className="definition-grid">
              <div><h3>Access</h3><p>Can the expected public resource be retrieved?</p></div>
              <div><h3>Freshness</h3><p>Is the source within its expected publication cadence?</p></div>
              <div><h3>Integrity</h3><p>Does the resource still have the expected type and structure?</p></div>
              <div><h3>Lifecycle</h3><p>Is it active, retired, replaced, or of unknown status?</p></div>
            </div>
            <Notice title="A weekly check is an observation, not an uptime guarantee.">
              <p>
                A source can fail between observations. We do not publish
                percentage-uptime claims from weekly checks, and we confirm
                persistent failures before labeling a source unavailable.
              </p>
            </Notice>
          </section>

          <section id="dates">
            <p className="eyebrow">03 · Dates</p>
            <h2>Three dates that answer different questions</h2>
            <dl className="date-definitions">
              <div><dt>Data through</dt><dd>The latest period described by the data.</dd></div>
              <div><dt>Published</dt><dd>When the publisher released or revised the resource.</dd></div>
              <div><dt>Last checked</dt><dd>When this catalog most recently observed the access route.</dd></div>
            </dl>
            <p>These dates are never substituted for one another. An accessible file can still contain old data.</p>
          </section>

          <section id="preservation">
            <p className="eyebrow">04 · Preservation and licensing</p>
            <h2>Public access is not automatically permission to republish</h2>
            <p>
              When reuse rights are unknown or restricted, the project stores
              metadata, observed history, and technical fingerprints—not a copy
              of the source. Licensed snapshots may be preserved with checksums,
              provenance, and clear labels. Retired records receive permanent
              tombstone pages rather than being deleted.
            </p>
          </section>

          <section id="privacy">
            <p className="eyebrow">05 · Privacy and responsible integration</p>
            <h2>Combining public sources can create new risks</h2>
            <p>
              Phase 1 catalogs already-public aggregate resources. It does not
              reconstruct suppressed values. Any future cross-source product
              involving small areas or sensitive populations requires a privacy
              and mosaic-risk review, retention of publisher suppression flags,
              and documented approval.
            </p>
          </section>

          <section id="limitations">
            <p className="eyebrow">06 · Limitations</p>
            <h2>Use the original methodology for consequential decisions</h2>
            <p>
              Sources vary in purpose, methods, geography, timeliness, and
              reliability. Missing or suppressed values are not zero.
              Associations do not establish causation. The catalog is incomplete
              and links can change; consult the original publisher and methodology
              before making consequential decisions.
            </p>
          </section>
        </article>
      </div>
    </main>
  );
}
