"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ResponsiveFilters } from "../components/ResponsiveFilters";
import {
  getAccessLabel,
  getCaution,
  getFormatLabels,
  getGeographyHint,
  getLatestDate,
  getPlainSummary,
  getPrimaryDistribution,
  getResourceType,
  getSourceSearchText,
  getSuitability,
  getTopicAreas,
  getTopicLabels,
  sources,
  splitSourceName,
  topicAreas,
  truncate,
} from "../lib/catalog";
import { sitePath } from "../lib/site-path";
import { preserveViewInParams } from "../lib/view-mode";

type Filters = { q: string; topic: string; access: string; type: string; sort: string };
const emptyFilters: Filters = { q: "", topic: "", access: "", type: "", sort: "title" };
const resourceTypes = [...new Set(sources.map(getResourceType))].sort();

function readFilters() {
  if (typeof window === "undefined") return emptyFilters;
  const params = new URLSearchParams(window.location.search);
  return {
    q: params.get("q") ?? "",
    topic: params.get("topic") ?? "",
    access: params.get("access") ?? "",
    type: params.get("type") ?? "",
    sort: params.get("sort") ?? "title",
  };
}

function writeFilters(filters: Filters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value && !(key === "sort" && value === "title")) params.set(key, value);
  });
  preserveViewInParams(params, window.location.search);
  const suffix = params.size ? `?${params.toString()}` : "";
  window.history.pushState({}, "", `${window.location.pathname}${suffix}`);
}

export function CatalogExplorer() {
  const [filters, setFilters] = useState<Filters>(emptyFilters);

  useEffect(() => {
    const sync = () => setFilters(readFilters());
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const filtered = useMemo(() => sources
    .filter((source) => !filters.q || getSourceSearchText(source).includes(filters.q.toLowerCase()))
    .filter((source) => !filters.topic || getTopicAreas(source).some((area) => area.id === filters.topic))
    .filter((source) => !filters.access || source.access_type === filters.access)
    .filter((source) => !filters.type || getResourceType(source) === filters.type)
    .sort((a, b) => {
      if (filters.sort === "coverage") {
        const aDate = getLatestDate(a.data_source_dates)?.normalized ?? "";
        const bDate = getLatestDate(b.data_source_dates)?.normalized ?? "";
        return bDate.localeCompare(aDate) || splitSourceName(a).title.localeCompare(splitSourceName(b).title);
      }
      return splitSourceName(a).title.localeCompare(splitSourceName(b).title);
    }), [filters]);

  const hasFilters = Boolean(filters.q || filters.topic || filters.access || filters.type || filters.sort !== "title");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next = {
      q: String(data.get("q") ?? "").trim(),
      topic: String(data.get("topic") ?? ""),
      access: String(data.get("access") ?? ""),
      type: String(data.get("type") ?? ""),
      sort: String(data.get("sort") ?? "title"),
    };
    setFilters(next);
    writeFilters(next);
  }

  function clear() {
    setFilters(emptyFilters);
    writeFilters(emptyFilters);
  }

  return (
    <section className="shell catalog-layout">
      <ResponsiveFilters panelId="catalog-filter-panel">
      <form className="filter-panel" action={sitePath("/datasets")} method="get" onSubmit={submit} aria-label="Filter the data catalog" key={JSON.stringify(filters)}>
        <div className="filter-heading">
          <h2>Search and filter</h2>
          {hasFilters ? <button className="clear-button" type="button" onClick={clear}>Clear all</button> : null}
        </div>
        <label htmlFor="catalog-search">Keywords</label>
        <input id="catalog-search" name="q" type="search" defaultValue={filters.q} placeholder="Measure, topic, source, or place" />
        <label htmlFor="topic-filter">Topic area</label>
        <select id="topic-filter" name="topic" defaultValue={filters.topic}>
          <option value="">All topic areas</option>
          {topicAreas.map((area) => <option value={area.id} key={area.id}>{area.label}</option>)}
        </select>
        <p className="field-help">Broad topic areas are derived from source terms and remain under review.</p>
        <label htmlFor="access-filter">Access mode</label>
        <select id="access-filter" name="access" defaultValue={filters.access}>
          <option value="">All access modes</option>
          <option value="public">Public source</option>
          <option value="request_only">Request required</option>
        </select>
        <label htmlFor="type-filter">Resource type</label>
        <select id="type-filter" name="type" defaultValue={filters.type}>
          <option value="">All resource types</option>
          {resourceTypes.map((value) => <option value={value} key={value}>{value}</option>)}
        </select>
        <label htmlFor="sort-filter">Sort</label>
        <select id="sort-filter" name="sort" defaultValue={filters.sort}>
          <option value="title">Title, A–Z</option>
          <option value="coverage">Newest stated data coverage</option>
        </select>
        <button type="submit">Apply filters</button>
        <noscript><p className="noscript-note">Filtering requires JavaScript. The complete catalog remains visible.</p></noscript>
      </form>
      </ResponsiveFilters>

      <div className="catalog-results">
        <div className="results-heading">
          <div><p className="eyebrow">Catalog results</p><h2>{filtered.length} {filtered.length === 1 ? "source" : "sources"}</h2></div>
          <p aria-live="polite">Showing {filtered.length} of {sources.length}</p>
        </div>
        {filtered.length ? (
          <div className="dataset-list">
            {filtered.map((source) => {
              const { title, publisher } = splitSourceName(source);
              const primary = getPrimaryDistribution(source);
              const topics = getTopicLabels(source).slice(0, 4);
              const latest = getLatestDate(source.data_source_dates);
              return (
                <article className="dataset-card" key={source.id}>
                  <div className="badge-row">
                    <span className={`badge ${source.access_type === "request_only" ? "badge-request" : "badge-public"}`}>{getAccessLabel(source)}</span>
                    <span className="badge badge-review"><span className="community-only">Not reviewed yet</span><span className="technical-only">Review pending</span></span>
                  </div>
                  <h3><a href={sitePath(`/datasets/${source.id}`)}>{title}</a></h3>
                  <p className="publisher">{publisher}</p>
                  <p className="dataset-summary community-only">{getPlainSummary(source)}</p>
                  <p className="dataset-summary technical-only">{source.background ? truncate(source.background) : "A background description was not supplied in the intake workbook."}</p>
                  {topics.length ? <div className="tag-list" aria-label="Source topic terms">{topics.map((value) => <span key={value}>{value}</span>)}</div> : null}
                  <dl className="card-facts community-only">
                    <div><dt>Area listed</dt><dd>{getGeographyHint(source)}</dd></div>
                    <div><dt>Date listed</dt><dd>{latest?.display_value ?? "Not stated"}</dd></div>
                  </dl>
                  <dl className="card-facts technical-only">
                    <div><dt>Catalog ID</dt><dd><code>{source.id}</code></dd></div>
                    <div><dt>Resource</dt><dd>{getResourceType(source)}</dd></div>
                    <div><dt>Geography</dt><dd>{getGeographyHint(source)}</dd></div>
                    <div><dt>Data through</dt><dd>{latest?.display_value ?? "Not stated"}</dd></div>
                    <div><dt>Formats</dt><dd>{getFormatLabels(source).join(", ")}</dd></div>
                  </dl>
                  <p className="use-line"><strong className="community-only">What this may help with:</strong><strong className="technical-only">Analytical suitability:</strong> {getSuitability(source)}</p>
                  <p className="caution-line"><strong className="community-only">Before you use it:</strong><strong className="technical-only">Primary caution:</strong> {getCaution(source)}</p>
                  <div className="card-actions">
                    <a className="button-link" href={sitePath(`/datasets/${source.id}`)}>View details</a>
                    {primary ? <a className="secondary-link" href={primary.url} target="_blank" rel="noreferrer">Open source <span className="external-mark" aria-hidden="true">↗</span></a> : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <h2>No matching sources</h2>
            <p>Try fewer filters or a broader search term. The catalog is still being expanded and reviewed.</p>
            <button className="text-button" type="button" onClick={clear}>Show the full catalog</button>
          </div>
        )}
      </div>
    </section>
  );
}
