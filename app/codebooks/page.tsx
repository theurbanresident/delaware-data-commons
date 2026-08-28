import type { Metadata } from "next";
import { codebooks, codebookSources, codebookStatusLabel } from "../lib/codebooks";
import { sources, splitSourceName } from "../lib/catalog";
import { sitePath } from "../lib/site-path";

export const metadata: Metadata = {
  title: "Data dictionaries",
  description: "Publisher-documented and clearly labeled inferred variable definitions for Delaware-relevant data sources.",
};

export const dynamic = "force-static";

const orderedSources = [...codebookSources].sort((a, b) => {
  const statusOrder = { published: 0, partial_published: 1, none_found: 2, request_only: 3, not_applicable: 4 };
  return statusOrder[a.codebook_status] - statusOrder[b.codebook_status] || a.source_name.localeCompare(b.source_name);
});

export default function CodebooksPage() {
  return (
    <main id="main-content">
      <header className="catalog-hero">
        <div className="shell">
          <p className="eyebrow">Definitions and codebooks</p>
          <h1 className="community-only">See what each data item means—and what still needs checking.</h1>
          <h1 className="technical-only">Inspect publisher codebooks, inferred metadata, and variable provenance.</h1>
          <p className="community-only">We looked for an official data dictionary for every source. When we could not find one, we kept the wording from the resource guide and marked it as inferred.</p>
          <p className="technical-only">This layer separates publisher-documented variables from unverified intake labels at field level. Research cutoff: {codebooks.research_cutoff}.</p>
        </div>
      </header>

      <section className="shell codebook-overview" aria-labelledby="documentation-key">
        <div>
          <p className="eyebrow">Documentation key</p>
          <h2 id="documentation-key">Two labels that should never be confused</h2>
        </div>
        <div className="evidence-key">
          <article className="evidence-published">
            <span className="evidence-chip evidence-chip-published">Publisher-documented</span>
            <h3 className="community-only">The source explains it</h3>
            <h3 className="technical-only">Direct public evidence</h3>
            <p>A public codebook, questionnaire, API schema, table definition, or methodology page supports the record. Follow the evidence link before use.</p>
          </article>
          <article className="evidence-inferred">
            <span className="evidence-chip evidence-chip-inferred">Inferred—needs verification</span>
            <h3 className="community-only">The guide names it, but the source definition is missing</h3>
            <h3 className="technical-only">Catalog inference without an exact public definition</h3>
            <p>The phrase came from the SHIP intake or a documented research inference. It is useful for discovery, but it is not an official field definition.</p>
          </article>
        </div>
      </section>

      <section className="codebook-metrics-section">
        <dl className="shell status-metrics codebook-metrics">
          <div><dt>Catalog sources</dt><dd>{codebooks.summary.source_count}</dd><small>Every source has a research record</small></div>
          <div><dt>With public documentation</dt><dd>{codebooks.summary.source_with_public_documentation_count}</dd><small>Full or partial documentation located</small></div>
          <div><dt>Publisher-documented variables</dt><dd>{codebooks.summary.published_variable_count}</dd><small>Each has a direct evidence link</small></div>
          <div><dt>Inferred labels</dt><dd>{codebooks.summary.inferred_variable_count}</dd><small>Each retains its inference basis</small></div>
        </dl>
      </section>

      <section className="shell codebook-list-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">All source families</p>
            <h2>Codebook coverage</h2>
          </div>
          <a className="button-link" href={sitePath("/compare")}>Compare similar variables</a>
        </div>
        <div className="codebook-source-list">
          {orderedSources.map((entry) => {
            const catalogSource = sources.find((source) => source.id === entry.source_id);
            const { title, publisher } = catalogSource ? splitSourceName(catalogSource) : { title: entry.source_name, publisher: "Publisher not separated" };
            return (
              <article className="codebook-source-card" key={entry.source_id}>
                <div className="badge-row">
                  <span className={`badge ${entry.codebook_status === "published" || entry.codebook_status === "partial_published" ? "badge-public" : "badge-review"}`}>{codebookStatusLabel(entry.codebook_status)}</span>
                </div>
                <h3><a href={sitePath(`/codebooks/${entry.source_id}`)}>{title}</a></h3>
                <p className="publisher">{publisher}</p>
                <p>{entry.summary}</p>
                <dl className="codebook-card-counts">
                  <div><dt>Documented</dt><dd>{entry.published_variable_count}</dd></div>
                  <div><dt>Inferred</dt><dd>{entry.inferred_variable_count}</dd></div>
                  <div><dt>Codebook links</dt><dd>{entry.codebook_artifacts.length}</dd></div>
                </dl>
                <a className="secondary-link" href={sitePath(`/codebooks/${entry.source_id}`)}>Open definitions <span aria-hidden="true">→</span></a>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
