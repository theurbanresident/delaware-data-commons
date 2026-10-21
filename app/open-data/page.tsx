import type { Metadata } from "next";
import snapshotData from "@/catalog/delaware-open-data.json";
import { sitePath } from "../lib/site-path";
import { catalog } from "../lib/catalog";
import { openDataDate } from "../lib/open-data";
import { OpenDataExplorer } from "./OpenDataExplorer";
import type { OpenDataSnapshot } from "./types";

export const metadata: Metadata = {
  title: "Delaware Open Data",
  description: "Browse a dated snapshot of Delaware Open Data portal metadata and current My Healthy Community priority links.",
};
export const dynamic = "force-static";
const snapshot = snapshotData as OpenDataSnapshot;
const priorityAssets = snapshot.mhc.priority_dataset_ids.flatMap((id) => {
  const asset = snapshot.assets.find((entry) => entry.id === id);
  return asset ? [asset] : [];
});

export default function OpenDataPage() {
  return (
    <main id="main-content">
      <header className="catalog-hero"><div className="shell">
        <p className="eyebrow">Delaware Open Data portal</p>
        <h1 className="community-only">Find public data from Delaware’s official portal.</h1>
        <h1 className="technical-only">Browse the Delaware Open Data metadata snapshot.</h1>
        <p className="community-only">Search datasets, maps, and other portal resources, then follow the publisher’s link for current information and downloads.</p>
        <p className="technical-only">A repository-versioned catalog of portal assets, publisher metadata, and available column definitions. This index is separate from the {catalog.summary.source_count} SHIP source records.</p>
        <p>Metadata checked <time dateTime={snapshot.checked_at}>{openDataDate(snapshot.checked_at)} (UTC)</time>. Publisher update dates describe the source asset, not when we checked it or the dates its observations cover.</p>
        <div className="card-actions"><a className="button-link" href={snapshot.portal.url}>Visit the official portal</a><a className="secondary-link" href={sitePath("/data/delaware-open-data.json")} download>Download metadata JSON</a><a className="secondary-link" href={sitePath(snapshot.archive.history_url)}>Metadata snapshot history</a><a className="secondary-link" href="#mhc-priority">My Healthy Community transition</a></div>
      </div></header>

      <section className="codebook-metrics-section" aria-label="Portal snapshot counts">
        <dl className="shell status-metrics open-data-metrics">
          <div><dt>Portal assets</dt><dd>{snapshot.summary.asset_count}</dd><small>All asset types in this snapshot</small></div>
          <div><dt>Datasets</dt><dd>{snapshot.summary.dataset_count}</dd><small>A subset of portal assets</small></div>
          <div><dt>SHIP sources</dt><dd>{catalog.summary.source_count}</dd><small>Separate intake; not added to portal totals</small></div>
        </dl>
      </section>

      <section className="shell open-data-context" aria-labelledby="open-data-limitations">
        <h2 id="open-data-limitations">An index of sources, with its limits visible</h2>
        <p>This dated metadata snapshot is not a live search of the portal. Immutable metadata snapshots are retained with a <a href={sitePath(snapshot.archive.history_url)}>version history</a>. Dataset payloads are not archived here. Follow the original source for current values, coverage, methodology, access conditions, and reuse terms. A listed asset or recent update does not establish fitness for use.</p>
        <p>Searches include names, descriptions, publisher tags, and available column definitions. <a href={sitePath("/datasets")}>Browse the separate SHIP catalog</a> for the original resource-guide intake, or inspect the <a href={snapshot.portal.catalog_url}>latest official catalog metadata</a> for a newer inventory.</p>
      </section>

      <OpenDataExplorer assets={snapshot.assets} />

      <section className="shell open-data-context open-data-mhc" id="mhc-priority" aria-labelledby="mhc-priority-heading">
        <p className="eyebrow">My Healthy Community</p>
        <h2 id="mhc-priority-heading">Current priority links and historical definitions</h2>
        <p><a href={snapshot.mhc.transition_url}>DHSS describes the My Healthy Community transition</a> and points visitors to priority assets on Delaware Open Data. Transition links checked <time dateTime={snapshot.mhc.checked_at}>{openDataDate(snapshot.mhc.checked_at)} (UTC)</time>.</p>
        <p><strong>The original My Healthy Community data dictionary has not been acquired.</strong> Current portal column descriptions are publisher metadata for these assets; they do not establish equivalence with the original platform’s indicators, geography, methods, or historical releases.</p>
        {snapshot.mhc.note ? <p>{snapshot.mhc.note}</p> : null}
        <div className="dataset-list">
          {priorityAssets.map((asset) => <article className="dataset-card" key={asset.id}>
            <h3><a href={asset.url}>{asset.name}</a></h3>
            <p>Portal ID: <code>{asset.id}</code> · Publisher update: {openDataDate(asset.updated_at)}</p>
            {asset.columns.length ? <details className="open-data-columns"><summary>View {asset.columns.length} publisher column definitions for {asset.name}</summary>
              {/* Keyboard focus lets readers scroll wide tables without a pointer. */}
              {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
              <div className="open-data-table-wrap" role="region" tabIndex={0} aria-label={`${asset.name} column definitions`}>
                <table><caption>Current portal columns; original MHC dictionary not acquired</caption><thead><tr><th scope="col">Column</th><th scope="col">Field / type</th><th scope="col">Publisher description</th></tr></thead>
                  <tbody>{asset.columns.map((column) => <tr key={column.field_name}><th scope="row">{column.name || column.field_name}</th><td><code>{column.field_name}</code><br />{column.data_type}</td><td>{column.description || "No description supplied"}</td></tr>)}</tbody>
                </table>
              </div>
            </details> : <p>No column definitions were supplied in this metadata snapshot.</p>}
          </article>)}
        </div>
        <p>Keep original indicator IDs and definitions distinct when the historical dictionary becomes available. The <a href={sitePath("/codebooks")}>existing codebook collection</a> separately labels publisher documentation and inferred descriptions.</p>
      </section>
    </main>
  );
}
