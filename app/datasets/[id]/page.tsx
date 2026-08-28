import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  catalog,
  getAccessLabel,
  getCaution,
  getFormatLabels,
  getGeographyHint,
  getLatestDate,
  getMeasureCount,
  getPlainSummary,
  getPrimaryDistribution,
  getResourceType,
  getSuitability,
  getTopicLabels,
  sources,
  splitSourceName,
  truncate,
} from "../../lib/catalog";
import { datasetIssueTitle, githubIssueUrl } from "../../lib/github";
import { sitePath } from "../../lib/site-path";

type Params = Promise<{ id: string }>;

export function generateStaticParams() {
  return sources.map((source) => ({ id: source.id }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const source = sources.find((item) => item.id === id);
  if (!source) return { title: "Source not found" };
  const { title } = splitSourceName(source);
  const description = source.background ? truncate(source.background, 155) : `Catalog record and source status for ${title}.`;
  return {
    title,
    description,
    openGraph: { title, description, images: [] },
    twitter: { title, description, images: [] },
  };
}

export default async function DatasetDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const source = sources.find((item) => item.id === id);
  if (!source) notFound();

  const { title, publisher } = splitSourceName(source);
  const primary = getPrimaryDistribution(source);
  const latestData = getLatestDate(source.data_source_dates);
  const latestPublished = getLatestDate(source.publication_dates);
  const topics = getTopicLabels(source);
  const correctionUrl = githubIssueUrl({
    template: "correction.yml",
    title: datasetIssueTitle("Correction", title, source.id),
  });
  const sourceStatusUrl = githubIssueUrl({
    template: "broken-source.yml",
    title: datasetIssueTitle("Source status", title, source.id),
  });
  const metadataUrl = githubIssueUrl({
    template: "variable-metadata.yml",
    title: datasetIssueTitle("Metadata", title, source.id),
  });

  return (
    <main id="main-content">
      <header className="dataset-hero">
        <div className="shell">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <a href={sitePath("/datasets")}>Data catalog</a><span aria-hidden="true">/</span><span aria-current="page">Source detail</span>
          </nav>
          <div className="badge-row">
            <span className={`badge ${source.access_type === "request_only" ? "badge-request" : "badge-public"}`}>{getAccessLabel(source)}</span>
            <span className="badge badge-review"><span className="community-only">Not reviewed yet</span><span className="technical-only">Imported · review pending</span></span>
          </div>
          <h1>{title}</h1>
          <p className="dataset-publisher">{publisher}</p>
          <p className="dataset-lede community-only">{getPlainSummary(source)}</p>
          <p className="dataset-lede technical-only">{source.background ?? "The intake workbook did not include a background description for this source."}</p>
          <div className="hero-actions">
            {primary ? <a className="button-link" href={primary.url} target="_blank" rel="noreferrer">Open publisher source <span aria-hidden="true">↗</span></a> : null}
            <a className="secondary-button" href={sitePath(`/codebooks/${source.id}`)}>View definitions</a>
            <a className="secondary-button community-only" href="#quick-facts">See the quick facts</a>
            <a className="secondary-button technical-only" href="#technical-record">Jump to technical record</a>
          </div>
        </div>
      </header>

      <div className="shell detail-layout">
        <aside className="detail-sidebar" aria-label="Source summary">
          <dl>
            <div className="community-only"><dt>Published by</dt><dd>{publisher || "Not stated"}</dd></div>
            <div className="community-only"><dt>Area covered</dt><dd>{getGeographyHint(source)}</dd></div>
            <div className="community-only"><dt>Latest data listed</dt><dd>{latestData?.display_value ?? "Not stated"}</dd></div>
            <div className="community-only"><dt>How to get it</dt><dd>{getAccessLabel(source)}</dd></div>
            <div className="community-only"><dt>Link check</dt><dd>{source.monitoring.last_checked_at ? `Checked ${source.monitoring.last_checked_at}` : "Not checked yet"}</dd></div>

            <div className="technical-only"><dt>Catalog ID</dt><dd><code>{source.id}</code></dd></div>
            <div className="technical-only"><dt>Resource type</dt><dd>{getResourceType(source)}</dd></div>
            <div className="technical-only"><dt>Access type</dt><dd><code>{source.access_type}</code></dd></div>
            <div className="technical-only"><dt>Review state</dt><dd><code>{source.review_status}</code></dd></div>
            <div className="technical-only"><dt>Data through</dt><dd>{latestData?.display_value ?? "Not stated"}</dd></div>
            <div className="technical-only"><dt>Published</dt><dd>{latestPublished?.display_value ?? "Not stated"}</dd></div>
            <div className="technical-only"><dt>Last checked</dt><dd>{source.monitoring.last_checked_at ?? "Not yet checked"}</dd></div>
          </dl>
          <a className="technical-only" href="#technical-record">How this record was imported</a>
        </aside>

        <article className="prose detail-prose">
          <section id="quick-facts">
            <p className="eyebrow">Overview</p>
            <div className="community-only">
              <h2>What this source may help you do</h2>
              <p>{getSuitability(source)}</p>
              <div className="plain-caution">
                <strong>Before you use a number</strong>
                <p>{getCaution(source)}</p>
              </div>
              <p>This page helps you find and understand the source. It does not say that every number is correct for every question.</p>
            </div>
            <div className="technical-only">
              <h2>Record classification</h2>
              <p><strong>Analytical suitability:</strong> {getSuitability(source)}</p>
              <p><strong>Primary caution:</strong> {getCaution(source)}</p>
            </div>
            <div className="definition-grid technical-only">
              <div><h3>{source.topics.length}</h3><p>topic {source.topics.length === 1 ? "record" : "records"} from the guide</p></div>
              <div><h3>{getMeasureCount(source)}</h3><p>measure labels preserved from the guide</p></div>
              <div><h3>{source.distributions.length}</h3><p>access {source.distributions.length === 1 ? "link" : "links"}</p></div>
              <div><h3>Unverified</h3><p>curator review status</p></div>
            </div>
          </section>

          <section id="questions">
            <p className="eyebrow">Questions</p>
            <h2>What can this help you investigate?</h2>
            <ul>
              {topics.slice(0, 3).map((topic) => <li key={topic}>Which published measures are available for {topic.toLowerCase()}?</li>)}
              {!topics.length ? <li>What information may be available from this source organization?</li> : null}
              <li>What time period and geography does the publisher make available?</li>
            </ul>
            <p className="community-only">The words used for a measure can change. Check the publisher&apos;s notes before comparing places or years.</p>
            <p className="technical-only">This catalog entry helps locate and assess a source. It does not establish that every listed measure is comparable across years or places.</p>
          </section>

          <section id="coverage">
            <p className="eyebrow">Coverage</p>
            <h2 className="community-only">Topics listed in the source guide</h2>
            <h2 className="technical-only">Imported topics, measures, and date fields</h2>
            {source.topics.length ? <>
              <div className="topic-summary-list community-only">
                {source.topics.map((topic) => (
                  <article key={topic.id}>
                    <h3>{topic.category || "Topic name not supplied"}</h3>
                    <p>{topic.measures.slice(0, 4).join(", ")}{topic.measures.length > 4 ? `, and ${topic.measures.length - 4} more` : ""}</p>
                  </article>
                ))}
              </div>
              <div className="topic-sections technical-only">
                {source.topics.map((topic) => (
                  <section key={topic.id}>
                    <h3>{topic.category || "Category not supplied"}</h3>
                    <p className="technical-id"><code>{topic.id}</code></p>
                    <ul className="measure-list">
                      {topic.measures.map((measure) => <li key={measure}>{measure}</li>)}
                    </ul>
                    <dl className="topic-dates">
                      <div><dt>Data period</dt><dd>{topic.data_source_date?.display_value ?? "Not stated"}</dd></div>
                      <div><dt>Published</dt><dd>{topic.publication_date?.display_value ?? "Not stated"}</dd></div>
                      <div><dt>Workbook row</dt><dd>{topic.provenance.sheet}, row {topic.provenance.row}</dd></div>
                      <div><dt>Measure cell</dt><dd><code>{topic.provenance.cells.measures}</code></dd></div>
                    </dl>
                  </section>
                ))}
              </div>
            </> : <p>No structured topic records were included in the intake workbook.</p>}
          </section>

          <section id="access">
            <p className="eyebrow">Access</p>
            <h2 className="community-only">How to open or request the source</h2>
            <h2 className="technical-only">Publisher distributions and request routes</h2>
            {source.distributions.length ? (
              <div className="distribution-list">
                {source.distributions.map((distribution) => (
                  <article key={distribution.id}>
                    <div>
                      <span className="distribution-role">{distribution.role === "archive" ? "Archived source" : distribution.role === "request_info" ? "Request information" : "Current source"}</span>
                      <h3>{getFormatLabels({ ...source, distributions: [distribution] }).join(", ")}</h3>
                      <p className="technical-only"><code>{distribution.id}</code> · role <code>{distribution.role}</code> · format <code>{distribution.format}</code></p>
                      <p className="technical-only">Workbook reference: {distribution.provenance.sheet}, row {distribution.provenance.row}, cell {distribution.provenance.cell}</p>
                    </div>
                    <a href={distribution.url} target="_blank" rel="noreferrer">Open <span aria-hidden="true">↗</span></a>
                  </article>
                ))}
              </div>
            ) : <p>No public link was supplied. Use the contact route below to ask about access.</p>}

            {source.contacts.length ? (
              <div className="contact-box">
                <h3>Request contacts from the guide</h3>
                {source.contacts.map((contact) => (
                  <div key={`${contact.provenance.cell}-${contact.raw}`}>
                    <p>{contact.raw}</p>
                    {contact.emails.map((email) => <a key={email} href={`mailto:${email}`}>{email}</a>)}
                    {contact.urls.map((url) => <a key={url} href={url} target="_blank" rel="noreferrer">{url}</a>)}
                  </div>
                ))}
              </div>
            ) : null}
            <p className="community-only"><strong>Can I copy and share the data?</strong> {source.license ?? "The guide does not say. A public link does not always mean the data can be republished."}</p>
            <p className="technical-only"><strong>Reuse rights:</strong> {source.license ?? "Not stated in the intake workbook. Public access does not by itself grant permission to redistribute."}</p>
          </section>

          <section id="interpretation">
            <p className="eyebrow">Interpretation</p>
            <h2 className="community-only">What to check before using this source</h2>
            <h2 className="technical-only">Imported notes and analytical cautions</h2>
            <div className="technical-only">
              {source.notes.length ? source.notes.map((note, index) => <p className="source-note" key={`${index}-${note}`}>{note}</p>) : <p>No notes were supplied in the intake workbook.</p>}
            </div>
            <p className="technical-only">
              Before consequential use, consult the publisher&apos;s definitions, denominator, uncertainty, suppression, provisional/final status, missingness, and comparison guidance. Missing or suppressed values are not zero; associations do not demonstrate causation.
            </p>
            <ul className="check-list community-only">
              <li>Make sure the place and group match your question.</li>
              <li>Check the year and how the measure is defined.</li>
              <li>Do not treat missing or hidden values as zero.</li>
              <li>Use the publisher&apos;s methods for important decisions.</li>
            </ul>
          </section>

          <section id="monitoring">
            <p className="eyebrow">Monitoring</p>
            <h2 className="community-only">This link has not been checked yet</h2>
            <h2 className="technical-only">Awaiting the first completed source check</h2>
            <div className="status-callout">
              <strong>Access: not checked</strong>
              <p>This record has been imported, but no automated observation has yet been published. “Request required” is an access mode, not an outage.</p>
            </div>
            <p className="community-only">A future check will tell you whether the link opened. It will not prove that the data are new or correct.</p>
            <p className="technical-only">Future weekly observations will report access, freshness, and detected change separately. A successful response will not imply that the underlying data were updated or endorsed.</p>
            <a href={sitePath("/status")}>Read the status definitions</a>
          </section>

          <section id="technical-record" className="technical-only">
            <p className="eyebrow">Provenance and citation</p>
            <h2>Trace the complete imported record</h2>
            <dl className="provenance-list">
              <div><dt>Intake workbook</dt><dd>{source.provenance.source_workbook}</dd></div>
              <div><dt>Workbook SHA-256</dt><dd><code className="breakable-code">{catalog.source_workbook.sha256}</code></dd></div>
              <div><dt>Worksheet</dt><dd>{source.provenance.sheet}</dd></div>
              <div><dt>Rows</dt><dd>{source.provenance.row_start === source.provenance.row_end ? source.provenance.row_start : `${source.provenance.row_start}–${source.provenance.row_end}`}</dd></div>
              <div><dt>Catalog schema</dt><dd><code>{catalog.schema_version}</code></dd></div>
              <div><dt>Importer version</dt><dd><code>{catalog.importer_version}</code></dd></div>
              <div><dt>Monitor status</dt><dd><code>{source.monitoring.availability_status}</code></dd></div>
            </dl>
            <h3>Field-to-cell map</h3>
            <dl className="field-map">
              {Object.entries(source.provenance.fields).map(([field, cells]) => (
                <div key={field}><dt><code>{field}</code></dt><dd>{cells.map((cell) => <code key={cell}>{cell}</code>)}</dd></div>
              ))}
            </dl>
            <div className="citation-template">
              <p><strong>Suggested source citation</strong></p>
              <p>{publisher}. <em>{title}</em>. Publisher source{latestPublished ? `, ${latestPublished.display_value}` : ""}. Accessed August 17, 2026.{primary ? ` ${primary.url}` : ""}</p>
            </div>
            <p>Cite the original publisher for analytical claims. Cite this catalog only for its descriptive metadata or monitoring history.</p>
            <div className="technical-downloads">
              <a className="secondary-button" href={sitePath("/data/reviewed-intake.json")} download>Download complete catalog JSON</a>
              <a href={sitePath("/methods")}>Read the import and monitoring methods</a>
            </div>
            <details className="raw-record">
              <summary>Show raw catalog record as JSON</summary>
              <pre>{JSON.stringify(source, null, 2)}</pre>
            </details>
          </section>

          <section id="feedback">
            <p className="eyebrow">Feedback</p>
            <h2>Know something that would improve this record?</h2>
            <p className="community-only">You do not need to know Git or write code. Choose the kind of comment you want to make, answer a short form, and a maintainer will review the evidence.</p>
            <p className="technical-only">Reports become public GitHub issues. Accepted changes are reviewed in a pull request and included in a versioned release; earlier versions remain traceable.</p>
            <div className="feedback-actions">
              <a className="button-link" href={correctionUrl} target="_blank" rel="noreferrer">Correct this record <span aria-hidden="true">↗</span></a>
              <a className="secondary-button" href={sourceStatusUrl} target="_blank" rel="noreferrer">Broken or moved source <span aria-hidden="true">↗</span></a>
              <a className="secondary-button" href={metadataUrl} target="_blank" rel="noreferrer">Comment on a measure <span aria-hidden="true">↗</span></a>
            </div>
            <p><a href={sitePath("/contribute")}>See what happens after you send a report</a></p>
          </section>
        </article>
      </div>
    </main>
  );
}
