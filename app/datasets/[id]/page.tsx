import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getAccessLabel,
  getCaution,
  getFormatLabels,
  getGeographyHint,
  getLatestDate,
  getMeasureCount,
  getPrimaryDistribution,
  getResourceType,
  getSuitability,
  getTopicLabels,
  sources,
  splitSourceName,
  truncate,
} from "../../lib/catalog";
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

  return (
    <main id="main-content">
      <header className="dataset-hero">
        <div className="shell">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <a href={sitePath("/datasets")}>Data catalog</a><span aria-hidden="true">/</span><span aria-current="page">Source detail</span>
          </nav>
          <div className="badge-row">
            <span className={`badge ${source.access_type === "request_only" ? "badge-request" : "badge-public"}`}>{getAccessLabel(source)}</span>
            <span className="badge badge-review">Imported · review pending</span>
          </div>
          <h1>{title}</h1>
          <p className="dataset-publisher">{publisher}</p>
          <p className="dataset-lede">{source.background ?? "The intake workbook did not include a background description for this source."}</p>
          <div className="hero-actions">
            {primary ? <a className="button-link" href={primary.url} target="_blank" rel="noreferrer">Open publisher source <span aria-hidden="true">↗</span></a> : null}
            <a className="secondary-button" href="#access">See access details</a>
          </div>
        </div>
      </header>

      <div className="shell detail-layout">
        <aside className="detail-sidebar" aria-label="Source summary">
          <dl>
            <div><dt>Catalog ID</dt><dd><code>{source.id}</code></dd></div>
            <div><dt>Resource type</dt><dd>{getResourceType(source)}</dd></div>
            <div><dt>Geography</dt><dd>{getGeographyHint(source)}</dd></div>
            <div><dt>Data through</dt><dd>{latestData?.display_value ?? "Not stated"}</dd></div>
            <div><dt>Published</dt><dd>{latestPublished?.display_value ?? "Not stated"}</dd></div>
            <div><dt>Last checked</dt><dd>{source.monitoring.last_checked_at ?? "Not yet checked"}</dd></div>
          </dl>
          <a href="#provenance">How this record was imported</a>
        </aside>

        <article className="prose detail-prose">
          <section id="overview">
            <p className="eyebrow">Overview</p>
            <h2>What this record represents</h2>
            <p><strong>Useful for:</strong> {getSuitability(source)}</p>
            <p><strong>Check first:</strong> {getCaution(source)}</p>
            <div className="definition-grid">
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
            <p>This catalog entry helps locate and assess a source. It does not establish that every listed measure is comparable across years or places.</p>
          </section>

          <section id="coverage">
            <p className="eyebrow">Coverage</p>
            <h2>Topics and measures in the intake guide</h2>
            {source.topics.length ? (
              <div className="topic-sections">
                {source.topics.map((topic) => (
                  <section key={topic.id}>
                    <h3>{topic.category || "Category not supplied"}</h3>
                    <ul className="measure-list">
                      {topic.measures.map((measure) => <li key={measure}>{measure}</li>)}
                    </ul>
                    <dl className="topic-dates">
                      <div><dt>Data period</dt><dd>{topic.data_source_date?.display_value ?? "Not stated"}</dd></div>
                      <div><dt>Published</dt><dd>{topic.publication_date?.display_value ?? "Not stated"}</dd></div>
                    </dl>
                  </section>
                ))}
              </div>
            ) : <p>No structured topic records were included in the intake workbook.</p>}
          </section>

          <section id="access">
            <p className="eyebrow">Access</p>
            <h2>Publisher and request routes</h2>
            {source.distributions.length ? (
              <div className="distribution-list">
                {source.distributions.map((distribution) => (
                  <article key={distribution.id}>
                    <div>
                      <span className="distribution-role">{distribution.role === "archive" ? "Archived source" : distribution.role === "request_info" ? "Request information" : "Current source"}</span>
                      <h3>{getFormatLabels({ ...source, distributions: [distribution] }).join(", ")}</h3>
                      <p>Workbook reference: {distribution.provenance.sheet}, cell {distribution.provenance.cell}</p>
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
            <p><strong>Reuse rights:</strong> {source.license ?? "Not stated in the intake workbook. Public access does not by itself grant permission to redistribute."}</p>
          </section>

          <section id="interpretation">
            <p className="eyebrow">Interpretation</p>
            <h2>Notes and cautions</h2>
            {source.notes.length ? source.notes.map((note, index) => <p className="source-note" key={`${index}-${note}`}>{note}</p>) : <p>No notes were supplied in the intake workbook.</p>}
            <p>
              Before consequential use, consult the publisher&apos;s definitions, denominator, uncertainty, suppression, provisional/final status, missingness, and comparison guidance. Missing or suppressed values are not zero; associations do not demonstrate causation.
            </p>
          </section>

          <section id="monitoring">
            <p className="eyebrow">Monitoring</p>
            <h2>Awaiting the first completed source check</h2>
            <div className="status-callout">
              <strong>Access: not checked</strong>
              <p>This record has been imported, but no automated observation has yet been published. “Request required” is an access mode, not an outage.</p>
            </div>
            <p>Future weekly observations will report access, freshness, and detected change separately. A successful response will not imply that the underlying data were updated or endorsed.</p>
            <a href={sitePath("/status")}>Read the status definitions</a>
          </section>

          <section id="provenance">
            <p className="eyebrow">Provenance and citation</p>
            <h2>Trace this record to its source</h2>
            <dl className="provenance-list">
              <div><dt>Intake workbook</dt><dd>{source.provenance.source_workbook}</dd></div>
              <div><dt>Worksheet</dt><dd>{source.provenance.sheet}</dd></div>
              <div><dt>Rows</dt><dd>{source.provenance.row_start === source.provenance.row_end ? source.provenance.row_start : `${source.provenance.row_start}–${source.provenance.row_end}`}</dd></div>
              <div><dt>Catalog schema</dt><dd>Version 1.0.0</dd></div>
            </dl>
            <div className="citation-template">
              <p><strong>Suggested source citation</strong></p>
              <p>{publisher}. <em>{title}</em>. Publisher source{latestPublished ? `, ${latestPublished.display_value}` : ""}. Accessed August 17, 2026.{primary ? ` ${primary.url}` : ""}</p>
            </div>
            <p>Cite the original publisher for analytical claims. Cite this catalog only for its descriptive metadata or monitoring history.</p>
          </section>

          <section id="feedback">
            <p className="eyebrow">Feedback</p>
            <h2>Found an error or a better source?</h2>
            <p>Corrections are recorded transparently and do not silently replace publisher information.</p>
            <a className="button-link" href={sitePath("/about#corrections")}>See how to report a correction</a>
          </section>
        </article>
      </div>
    </main>
  );
}
