import type { Metadata } from "next";
import { Notice, PageIntro } from "../../components/Content";
import { sitePath } from "../../lib/site-path";

export const metadata: Metadata = {
  title: "Grant evidence guide",
  description: "How to identify, evaluate, and cite Delaware public data in a grant need statement.",
};

export default function GrantGuidePage() {
  return (
    <main id="main-content">
      <PageIntro eyebrow="Guide · Grants" title="Build a grant need statement that can be checked later.">
        <p>
          Phase 1 helps you select and document a source. It does not generate a
          numerical claim until the indicator value and definition have been independently verified.
        </p>
      </PageIntro>

      <article className="shell prose prose-centered numbered-guide">
        <section>
          <span className="step-number">1</span>
          <h2>State the question before choosing a number</h2>
          <p>
            Identify the population, place, time period, measure, and comparison
            your proposal actually needs. “How many residents lack health
            insurance in Kent County?” is more actionable than “Find health data.”
          </p>
        </section>
        <section>
          <span className="step-number">2</span>
          <h2>Check whether the source fits</h2>
          <p>
            Confirm the geographic level, population or survey universe, data
            period, denominator, and method. A statewide estimate cannot support
            a neighborhood claim, and a modeled estimate is not the same as an observed count.
          </p>
        </section>
        <section>
          <span className="step-number">3</span>
          <h2>Keep the three dates separate</h2>
          <p>
            Record data through, publisher release date, and the date you
            accessed the source. The catalog&apos;s last check is useful for
            traceability but does not replace the publisher&apos;s dates.
          </p>
        </section>
        <section>
          <span className="step-number">4</span>
          <h2>Write the caveat with the claim</h2>
          <p>
            Note confidence intervals, margins of error, suppression, modeled
            values, or non-comparable definitions. Missing and suppressed values
            are not zero, and an association does not establish causation.
          </p>
        </section>
        <section>
          <span className="step-number">5</span>
          <h2>Create a reproducible citation</h2>
          <div className="citation-template">
            <p><strong>Suggested sentence pattern</strong></p>
            <p>[Measure] was [value/unit] among [population] in [geography] during [period], compared with [same-definition benchmark], according to [publisher].</p>
          </div>
          <p>
            Include the publisher, resource title, release or version, direct
            source URL, data period, and date accessed.
          </p>
        </section>

        <Notice title="What Phase 1 can safely provide" tone="caution">
          <p>
            Catalog records can support source discovery and citation planning.
            A grant-ready metric card requires a verified value, definition,
            geography, denominator, uncertainty, and same-definition benchmark.
          </p>
        </Notice>

        <p className="guide-cta"><a className="button-link" href={sitePath("/datasets")}>Search the data catalog</a></p>
      </article>
    </main>
  );
}
