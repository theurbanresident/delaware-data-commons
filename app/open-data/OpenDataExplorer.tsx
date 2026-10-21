"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { filterOpenDataAssets, openDataDate } from "../lib/open-data";
import { preserveViewInParams } from "../lib/view-mode";
import { sitePath } from "../lib/site-path";
import type { OpenDataAsset } from "./types";

type Filters = { q: string; type: string; publisher: string; category: string; tag: string };
const emptyFilters: Filters = { q: "", type: "", publisher: "", category: "", tag: "" };
const pageSize = 24;

function readFilters(): Filters {
  const params = new URLSearchParams(window.location.search);
  return Object.fromEntries(Object.keys(emptyFilters).map((key) => [key, params.get(key) ?? ""])) as Filters;
}

function writeFilters(filters: Filters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); });
  preserveViewInParams(params, window.location.search);
  window.history.pushState({}, "", `${window.location.pathname}${params.size ? `?${params}` : ""}`);
}

export function OpenDataExplorer({ assets }: { assets: OpenDataAsset[] }) {
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const options = useMemo(() => ({
    type: [...new Set(assets.map((asset) => asset.asset_type))].sort(),
    publisher: [...new Set(assets.map((asset) => asset.publisher).filter((value): value is string => Boolean(value)))].sort(),
    category: [...new Set(assets.map((asset) => asset.category).filter((value): value is string => Boolean(value)))].sort(),
    tag: [...new Set(assets.flatMap((asset) => asset.tags))].sort(),
  }), [assets]);
  const filtered = useMemo(() => filterOpenDataAssets(assets, filters), [assets, filters]);

  useEffect(() => {
    const sync = () => { setFilters(readFilters()); setVisibleCount(pageSize); };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  function update(next: Filters) {
    setFilters(next);
    setVisibleCount(pageSize);
    writeFilters(next);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    update(Object.fromEntries(Object.keys(emptyFilters).map((key) => [key, String(data.get(key) ?? "").trim()])) as Filters);
  }

  return (
    <section className="shell catalog-layout open-data-explorer" aria-labelledby="open-data-browse-heading">
      <form className="filter-panel" action={sitePath("/open-data")} method="get" onSubmit={submit} key={JSON.stringify(filters)} aria-label="Filter Delaware Open Data assets">
        <div className="filter-heading"><h2>Search and filter</h2></div>
        <label htmlFor="open-data-search">Keywords or dataset ID</label>
        <input id="open-data-search" name="q" type="search" defaultValue={filters.q} placeholder="Topic, column, or publisher" />
        {([
          ["type", "Asset type", "All asset types"],
          ["publisher", "Publisher", "All publishers"],
          ["category", "Category", "All categories"],
          ["tag", "Publisher tag", "All tags"],
        ] as const).map(([key, label, all]) => (
          <div className="open-data-filter" key={key}>
            <label htmlFor={`open-data-${key}`}>{label}</label>
            <select id={`open-data-${key}`} name={key} defaultValue={filters[key]}>
              <option value="">{all}</option>
              {options[key].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </div>
        ))}
        <p className="field-help">Categories, tags, and publisher names come from portal metadata; they are not a Commons review.</p>
        <button type="submit">Apply filters</button>
        {Object.values(filters).some(Boolean) ? <button className="clear-button" type="button" onClick={() => update(emptyFilters)}>Clear all filters</button> : null}
        <noscript><p>Filtering and showing more require JavaScript. <a href={sitePath("/data/delaware-open-data.json")}>Download all metadata as JSON</a> or browse the official portal using the link above.</p></noscript>
      </form>

      <div className="catalog-results">
        <div className="results-heading">
          <div><p className="eyebrow">Official portal metadata</p><h2 id="open-data-browse-heading">Browse portal assets</h2></div>
          <p role="status" aria-live="polite">Showing {Math.min(visibleCount, filtered.length)} of {filtered.length} matching assets ({assets.length} total)</p>
        </div>
        {filtered.length ? (
          <>
            <div className="dataset-list" id="open-data-results">
              {filtered.slice(0, visibleCount).map((asset) => (
                <article className="dataset-card" key={asset.id}>
                  <div className="badge-row"><span className="badge badge-public">{asset.asset_type}</span>{asset.category ? <span className="badge badge-review">{asset.category}</span> : null}</div>
                  <h3><a href={asset.url}>{asset.name}</a></h3>
                  <p className="publisher">{asset.publisher || "Publisher not stated in portal metadata"}</p>
                  <p className="dataset-summary">{asset.description ? `${asset.description.slice(0, 320)}${asset.description.length > 320 ? "…" : ""}` : "No description supplied in portal metadata."}</p>
                  {asset.tags.length ? <div className="tag-list" aria-label="Publisher tags">{asset.tags.slice(0, 6).map((tag) => <span key={tag}>{tag}</span>)}</div> : null}
                  <dl className="card-facts">
                    <div><dt>Publisher update</dt><dd>{openDataDate(asset.updated_at)}</dd></div>
                    <div><dt>Portal ID</dt><dd><code>{asset.id}</code></dd></div>
                  </dl>
                  <div className="card-actions"><a className="button-link" href={asset.url}>Open on Delaware Open Data</a><a className="secondary-link technical-only" href={asset.metadata_url}>Publisher metadata</a></div>
                </article>
              ))}
            </div>
            {visibleCount < filtered.length ? <button className="open-data-show-more" type="button" aria-controls="open-data-results" onClick={() => setVisibleCount((count) => count + pageSize)}>Show {Math.min(pageSize, filtered.length - visibleCount)} more assets</button> : null}
          </>
        ) : <div className="empty-state"><h3>No matching portal assets</h3><p>Try a broader term or remove a filter. This is a dated snapshot, so check the official portal for newer entries.</p><button type="button" onClick={() => update(emptyFilters)}>Show all portal assets</button></div>}
      </div>
    </section>
  );
}
