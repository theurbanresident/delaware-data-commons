import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { codebookSources, codebookStatusLabel, evidenceLabel, formatMetadataValue } from "../../lib/codebooks";
import { sources, splitSourceName, truncate } from "../../lib/catalog";
import { githubIssueUrl } from "../../lib/github";
import { sitePath } from "../../lib/site-path";

type Params = Promise<{ id: string }>;

export function generateStaticParams() {
  return codebookSources.map((source) => ({ id: source.source_id }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const entry = codebookSources.find((source) => source.source_id === id);
  if (!entry) return { title: "Codebook not found" };
  const catalogSource = sources.find((source) => source.id === id);
  const title = catalogSource ? splitSourceName(catalogSource).title : entry.source_name;
  const description = truncate(`Variable definitions and codebook evidence for ${title}. ${entry.summary}`, 155);
  return { title: `${title} codebook`, description, openGraph: { title, description, images: [] }, twitter: { title, description, images: [] } };
}

function MetadataRow({ label, value }: { label: string; value: unknown }) {
  return <div><dt>{label}</dt><dd>{formatMetadataValue(value)}</dd></div>;
}

export default async function CodebookDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const entry = codebookSources.find((source) => source.source_id === id);
  if (!entry) notFound();
  const catalogSource = sources.find((source) => source.id === id);
  const { title, publisher } = catalogSource ? splitSourceName(catalogSource) : { title: entry.source_name, publisher: "Publisher not separated" };

  return (
    <main id="main-content">
      <header className="dataset-hero codebook-detail-hero">
        <div className="shell">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <a href={sitePath("/codebooks")}>Data dictionaries</a><span aria-hidden="true">/</span><span aria-current="page">Source codebook</span>
          </nav>
          <div className="badge-row"><span className={`badge ${entry.codebook_status === "published" || entry.codebook_status === "partial_published" ? "badge-public" : "badge-review"}`}>{codebookStatusLabel(entry.codebook_status)}</span></div>
          <h1>{title}</h1>
          <p className="dataset-publisher">{publisher}</p>
          <p className="dataset-lede community-only">This page separates definitions we could trace to the publisher from labels that still need confirmation.</p>
          <p className="dataset-lede technical-only">{entry.summary} Research date: {entry.research_date}. Source ID: <code>{entry.source_id}</code>.</p>
          <div className="hero-actions">
            <a className="secondary-button" href={sitePath(`/datasets/${entry.source_id}`)}>Return to source record</a>
            <a className="secondary-button" href={sitePath("/compare")}>Find similar variables</a>
            <a className="secondary-button" href={sitePath("/guides/prompts#explain-measure")}>Use a definition prompt</a>
          </div>
        </div>
      </header>

      <div className="shell codebook-detail-layout">
        <aside className="codebook-summary-panel">
          <h2>At a glance</h2>
          <dl>
            <MetadataRow label="Publicly documented" value={entry.published_variable_count} />
            <MetadataRow label="Inferred" value={entry.inferred_variable_count} />
            <MetadataRow label="Documentation links" value={entry.codebook_artifacts.length} />
            <MetadataRow label="Access" value={entry.access_type === "request_only" ? "Request required" : "Public source"} />
            <div className="technical-only"><dt>Research batch</dt><dd><code>{entry.research_batch}</code></dd></div>
          </dl>
        </aside>

        <article className="codebook-detail-content">
          <section>
            <p className="eyebrow">Documentation found</p>
            <h2 className="community-only">Open the source&apos;s own explanations</h2>
            <h2 className="technical-only">Authoritative documentation artifacts</h2>
            {entry.codebook_artifacts.length ? (
              <div className="artifact-list">
                {entry.codebook_artifacts.map((artifact) => (
                  <article key={artifact.url}>
                    <h3><a href={artifact.url} target="_blank" rel="noreferrer">{artifact.title} <span aria-hidden="true">↗</span></a></h3>
                    <p>{artifact.applies_to ?? "Applies-to scope was not stated in the research record."}</p>
                    <p className="technical-only"><strong>Authority:</strong> {artifact.authority ?? "Not stated"} · <strong>Format:</strong> {artifact.format ?? "Not stated"}</p>
                    {artifact.notes ? <p className="technical-only">{artifact.notes}</p> : null}
                  </article>
                ))}
              </div>
            ) : (
              <div className="plain-caution">
                <strong>No public codebook was located in this research pass.</strong>
                <p>This does not prove that none exists. The inferred labels below are discovery aids, not official definitions.</p>
              </div>
            )}
          </section>

          <section>
            <p className="eyebrow">Variables and measures</p>
            <h2>{entry.variables.length} documented or inferred items</h2>
            <p className="community-only">“Publisher-documented” means the item has a direct source link. “Inferred” means the wording needs confirmation before you quote or compare it.</p>
            <p className="technical-only">Null values are displayed as “Not documented.” Concept assignments are candidate semantic mappings and do not establish statistical comparability.</p>
            <div className="variable-record-list">
              {entry.variables.map((variable) => (
                <details className={`variable-record variable-${variable.evidence_kind}`} key={variable.id}>
                  <summary>
                    <span>{variable.label}</span>
                    <span className={`evidence-chip evidence-chip-${variable.evidence_kind}`}>{evidenceLabel(variable.evidence_kind)}</span>
                  </summary>
                  <div className="variable-record-body">
                    <div className="community-only">
                      <p><strong>Meaning:</strong> {variable.definition ?? "No publisher definition was located."}</p>
                      {variable.evidence_kind === "published" ? (
                        <p><a href={variable.evidence_url ?? "#"} target="_blank" rel="noreferrer">Check the publisher evidence <span aria-hidden="true">↗</span></a></p>
                      ) : (
                        <p><strong>Why it appears here:</strong> {variable.inference_basis}</p>
                      )}
                      {variable.concept_match ? <p><strong>Possible shared idea:</strong> {variable.concept_match.concept_label}. This still needs a definition check.</p> : null}
                    </div>
                    <dl className="variable-metadata technical-only">
                      <MetadataRow label="Variable ID" value={variable.id} />
                      <MetadataRow label="Source field" value={variable.source_variable_name} />
                      <MetadataRow label="Definition" value={variable.definition} />
                      <MetadataRow label="Data type" value={variable.data_type} />
                      <MetadataRow label="Unit" value={variable.unit} />
                      <MetadataRow label="Universe" value={variable.universe} />
                      <MetadataRow label="Geography" value={variable.geography} />
                      <MetadataRow label="Time grain" value={variable.time_granularity} />
                      <MetadataRow label="Categories" value={variable.categories} />
                      <MetadataRow label="Missing codes" value={variable.missing_codes} />
                      <MetadataRow label="Suppression" value={variable.suppression_rules} />
                      <MetadataRow label="Comparison notes" value={variable.comparability_notes} />
                      <MetadataRow label="Evidence kind" value={variable.evidence_kind} />
                      <MetadataRow label="Confidence" value={variable.confidence} />
                      <MetadataRow label="Inference basis" value={variable.inference_basis} />
                      <MetadataRow label="Candidate concept" value={variable.concept_match?.concept_id} />
                    </dl>
                    <p className="technical-only">{variable.evidence_url ? <a href={variable.evidence_url} target="_blank" rel="noreferrer">Open exact evidence <span aria-hidden="true">↗</span></a> : "No direct public evidence URL for this inferred record."}</p>
                    <p><a href={githubIssueUrl({ template: "variable-metadata.yml", title: `[Variable or metadata] ${title}: ${variable.label} (${entry.source_id})` })} target="_blank" rel="noreferrer">Suggest a definition or comparison correction <span aria-hidden="true">↗</span></a></p>
                    <details className="raw-record technical-only"><summary>Show variable provenance JSON</summary><pre>{JSON.stringify(variable.provenance, null, 2)}</pre></details>
                  </div>
                </details>
              ))}
            </div>
          </section>

          <section className="technical-only">
            <p className="eyebrow">Machine-readable record</p>
            <h2>Download and inspect</h2>
            <div className="technical-downloads">
              <a className="secondary-button" href={sitePath("/data/codebooks.json")} download>Download all codebooks JSON</a>
              <a className="secondary-button" href={sitePath("/data/variable-crosswalk.json")} download>Download variable crosswalk JSON</a>
            </div>
          </section>
        </article>
      </div>
    </main>
  );
}
