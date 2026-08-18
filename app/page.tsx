import {
  catalog,
  getGeographyHint,
  getMeasureCount,
  getTopicLabels,
  sources,
  splitSourceName,
} from "./lib/catalog";
import { sitePath } from "./lib/site-path";

const featuredIds = [
  "src-behavioral-risk-factor-survey-center-for-applied-demogra-c6d5cb05bd",
  "src-map-the-meal-gap-2025-feeding-america-d9b6eb75e3",
  "src-delaware-census-data-us-census-b02aa6a52f",
];

const featuredSources = featuredIds
  .map((id) => sources.find((source) => source.id === id))
  .filter((source): source is (typeof sources)[number] => Boolean(source));

export default function Home() {
  return (
    <main id="main-content">
      <section className="hero">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Delaware community data catalog</p>
            <h1 className="community-only">Find Delaware data you can understand, explain, and check.</h1>
            <h1 className="technical-only">Trace Delaware public data from source metadata to monitored access.</h1>
            <p className="hero-deck community-only">
              Search for public information, learn what it may help answer, and see what to check before you use it in a grant, report, or community conversation.
            </p>
            <p className="hero-deck technical-only">
              Search public sources for grants, research, and policy; understand
              their coverage, distributions, identifiers, import provenance, and monitoring state.
            </p>
            <form className="search-panel" action={sitePath("/datasets")} role="search">
              <label htmlFor="home-search">What data are you looking for?</label>
              <div className="search-row">
                <input
                  id="home-search"
                  name="q"
                  type="search"
                  placeholder="Try “food insecurity,” “teen mental health,” or “Kent County”"
                />
                <button type="submit">Search the catalog</button>
              </div>
            </form>
            <p className="search-hint">
              Browse by topic, place, publisher, years available, and access type.
            </p>
            <div className="hero-links" aria-label="Popular tasks">
              <a href={sitePath("/status")}>View source status</a>
              <a href={sitePath("/guides/grants")}>Build a grant need statement</a>
              <a href={sitePath("/contribute")}>Share a correction</a>
            </div>
          </div>

          <aside className="snapshot-card" aria-labelledby="snapshot-title">
            <p className="card-kicker">Catalog snapshot</p>
            <h2 id="snapshot-title">What is indexed today</h2>
            <dl className="snapshot-grid">
              <div><dt>Sources</dt><dd>{catalog.summary.source_count}</dd></div>
              <div><dt><span className="community-only">Topic groups</span><span className="technical-only">Topic records</span></dt><dd>{catalog.summary.topic_count}</dd></div>
              <div><dt><span className="community-only">Source links</span><span className="technical-only">Distributions</span></dt><dd>{catalog.summary.distribution_count}</dd></div>
              <div><dt>Request-only</dt><dd>{catalog.summary.request_only_source_count}</dd></div>
            </dl>
            <div className="review-note">
              <span className="status-dot" aria-hidden="true" />
              <p><strong>Verification underway.</strong> Records were imported from the SHIP resource guide and are being reviewed source by source.</p>
            </div>
          </aside>
        </div>
      </section>

      <section className="trust-strip" aria-label="How to read catalog status">
        <div className="shell trust-grid">
          <div>
            <span className="trust-number">01</span>
            <p className="community-only"><strong>Check the original source.</strong><br />The publisher is still the official source.</p>
            <p className="technical-only"><strong>Publisher remains authoritative.</strong><br />Catalog metadata never replaces upstream methodology.</p>
          </div>
          <div>
            <span className="trust-number">02</span>
            <p className="community-only"><strong>An open link is only one clue.</strong><br />Data can be old or hard to compare even when a page opens.</p>
            <p className="technical-only"><strong>Status is multidimensional.</strong><br />Access, freshness, integrity, change, and review are separate observations.</p>
          </div>
          <div>
            <span className="trust-number">03</span>
            <p className="community-only"><strong>Missing sources stay visible.</strong><br />A moved or retired source remains part of the public history.</p>
            <p className="technical-only"><strong>Lifecycle history is retained.</strong><br />Retired, request-only, and superseded records keep stable identifiers.</p>
          </div>
        </div>
      </section>

      <section className="catalog-preview shell" id="catalog">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Start with a source</p>
            <h2>Recently added to the catalog</h2>
          </div>
          <a className="text-link" href={sitePath("/datasets")}>View all {catalog.summary.source_count} sources <span aria-hidden="true">→</span></a>
        </div>
        <div className="source-grid">
          {featuredSources.map((source) => {
            const { title, publisher } = splitSourceName(source);
            return (
            <article className="source-card" key={source.id}>
              <div className="source-status"><span className="community-only">Not reviewed yet</span><span className="technical-only">Imported · review pending</span></div>
              <h3>{title}</h3>
              <p className="publisher">{publisher}</p>
              <div className="tag-list" aria-label="Topics">
                {getTopicLabels(source).slice(0, 3).map((topic) => <span key={topic}>{topic}</span>)}
              </div>
              <p className="coverage"><strong>{getMeasureCount(source)} measure labels</strong><br />{getGeographyHint(source)}</p>
              <a href={sitePath(`/datasets/${source.id}`)} aria-label={`View ${title} in the catalog`}>View source details <span aria-hidden="true">→</span></a>
            </article>
          );})}
        </div>
      </section>

      <section className="phase-note">
        <div className="shell phase-note-inner">
          <p className="eyebrow">Building in public</p>
          <h2>A catalog first. A responsible data commons next.</h2>
          <p>
            This first phase documents what exists, where it comes from, and
            whether it remains usable. Analysis-ready products will be added
            only after licensing, privacy, and comparability reviews.
          </p>
        </div>
      </section>

    </main>
  );
}
