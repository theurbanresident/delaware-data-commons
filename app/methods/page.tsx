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
        <p className="community-only">
          See what gets checked, what a successful check can tell you, and why a person still needs to review important changes.
        </p>
        <p className="technical-only">
          The catalog separates whether a source can be reached from whether
          its data are current, structurally consistent, or appropriate for a
          particular question.
        </p>
      </PageIntro>

      <article className="shell prose prose-centered community-only">
        <section>
          <p className="eyebrow">The short version</p>
          <h2>Both views use the same records.</h2>
          <p>Community view uses shorter explanations. Technical view adds IDs, source cells, raw metadata, and monitoring details. Switching views never changes the data.</p>
        </section>
        <section>
          <h2>What gets checked?</h2>
          <p>Each week, the checker tries to open the expected public page or file. It records whether the link worked and whether the kind of file looks as expected.</p>
        </section>
        <section>
          <h2>What does a successful check mean?</h2>
          <p>It means the source answered at that time. It does not prove that the information is new, complete, correct, or right for your question.</p>
        </section>
        <section>
          <h2>Why keep old or missing sources?</h2>
          <p>A broken, moved, or retired source is part of the public record. Keeping its page makes it easier to see what changed and whether a replacement exists.</p>
        </section>
        <section>
          <h2>What does “inferred” mean?</h2>
          <p>It means the resource guide names a data item, but we did not find an exact public definition from the publisher. Inferred items can help you search. They should not be quoted as official definitions until someone verifies them.</p>
        </section>
        <section>
          <h2>Can the comparison tool tell me two numbers are equal?</h2>
          <p>No. It finds items that may describe the same idea and shows missing or different details. A person still needs to check the population, unit, place, year, question wording, and source methods.</p>
        </section>
        <section>
          <h2>Why can combining data create risk?</h2>
          <p>Even public facts can reveal too much when they are joined for very small places or groups. Future combined products will need privacy review and will keep the publisher&apos;s hidden-value rules.</p>
        </section>
        <Notice title="For an important decision" tone="caution">
          <p>Read the original publisher&apos;s definitions and methods. Missing or hidden values are not zero, and a connection between two measures does not prove that one caused the other.</p>
        </Notice>
      </article>

      <div className="shell content-layout technical-only">
        <aside className="section-nav" aria-label="On this page">
          <strong>On this page</strong>
          <a href="#inclusion">Inclusion</a>
          <a href="#checks">Weekly checks</a>
          <a href="#codebooks">Codebooks</a>
          <a href="#matching">Variable matching</a>
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

          <section id="views">
            <p className="eyebrow">Presentation layer</p>
            <h2>Community and Technical views share one canonical record</h2>
            <p>
              The audience switch sets a browser presentation preference and reveals different explanatory layers on the same static route. It does not create a second catalog, modify source metadata, or alter monitoring output. A shareable <code>?view=technical</code> parameter can request the detailed presentation.
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

          <section id="codebooks">
            <p className="eyebrow">03 · Codebook evidence</p>
            <h2>Publisher documentation and catalog inference remain separate</h2>
            <p>
              Each catalog source has a codebook research record. Public
              artifacts may include a publisher codebook, questionnaire, API
              schema, table definition, or methodology page. Every
              publisher-documented variable retains its exact evidence URL.
              When no exact public definition is located, the imported SHIP
              measure phrase remains <strong>inferred—needs verification</strong>
              with its workbook cells, confidence, and inference basis.
            </p>
            <p>
              Source families and portals can contain many child datasets. A
              family-level artifact is not represented as complete field-level
              coverage unless the evidence actually enumerates those fields.
              “No codebook located” describes this research pass; it is not a
              claim that no documentation exists.
            </p>
          </section>

          <section id="matching">
            <p className="eyebrow">04 · Candidate variable matching</p>
            <h2>Automated matches start review; they do not finish it</h2>
            <p>
              A deterministic function normalizes labels, applies a curated
              concept taxonomy, and compares unit, universe, geography, time
              grain, and data type. It emits a strong or review candidate only
              across different catalog sources. Missing fields and differences
              remain visible; the function never labels a pair “comparable.”
            </p>
            <p>
              The taxonomy explicitly separates easily confused constructs,
              including sex and gender identity, incidence and mortality,
              counts and rates, estimates and projections, adult smoking and
              smoking during pregnancy, and high-school graduation and
              completion. Concept-specific traps are shown with every match.
            </p>
          </section>

          <section id="dates">
            <p className="eyebrow">05 · Dates</p>
            <h2>Three dates that answer different questions</h2>
            <dl className="date-definitions">
              <div><dt>Data through</dt><dd>The latest period described by the data.</dd></div>
              <div><dt>Published</dt><dd>When the publisher released or revised the resource.</dd></div>
              <div><dt>Last checked</dt><dd>When this catalog most recently observed the access route.</dd></div>
            </dl>
            <p>These dates are never substituted for one another. An accessible file can still contain old data.</p>
          </section>

          <section id="preservation">
            <p className="eyebrow">06 · Preservation and licensing</p>
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
            <p className="eyebrow">07 · Privacy and responsible integration</p>
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
            <p className="eyebrow">08 · Limitations</p>
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
