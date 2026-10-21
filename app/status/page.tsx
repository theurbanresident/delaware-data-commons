import type { Metadata } from "next";
import { catalog, getLatestDate, getPrimaryDistribution, sources, splitSourceName } from "../lib/catalog";
import { Notice, PageIntro } from "../components/Content";
import { sitePath } from "../lib/site-path";
import openData from "@/catalog/delaware-open-data.json";
import { openDataDate } from "../lib/open-data";

export const metadata: Metadata = {
  title: "Source status",
  description: "The latest Delaware Open Data metadata capture and the separate SHIP monitoring publication baseline.",
};

const previewSources = sources.slice(0, 10);

export default function StatusPage() {
  const currentTargets = sources.filter((source) => getPrimaryDistribution(source)).length;

  return (
    <main id="main-content">
      <PageIntro eyebrow="Source status" title="Know what was checked, and what was preserved.">
        <p className="community-only">
          The Delaware Open Data metadata inventory has been checked and preserved. SHIP source monitoring is a separate process whose observations have not yet been published here.
        </p>
        <p className="technical-only">
          The portal metadata snapshot is published with provenance and history. A successful metadata capture does not establish data freshness, dataset payload preservation, or availability for every SHIP source.
        </p>
      </PageIntro>

      <section className="shell status-overview" aria-labelledby="monitor-heading">
        <div className="monitor-heartbeat">
          <span className="status-icon" aria-hidden="true">○</span>
          <div>
            <p className="eyebrow">Delaware Open Data metadata</p>
            <h2 id="monitor-heading">{openData.summary.asset_count} portal assets indexed</h2>
            <p>Checked <time dateTime={openData.checked_at}>{openDataDate(openData.checked_at)} (UTC)</time>. Dataset rows were not downloaded.</p>
            <p><a href={sitePath("/open-data")}>Browse the current portal snapshot</a> · <a href={sitePath("/data/open-data/history.json")}>Metadata capture history</a></p>
          </div>
        </div>
        <dl className="status-metrics">
          <div><dt>SHIP records imported</dt><dd>{catalog.summary.source_count}</dd><small>All need curator review</small></div>
          <div><dt>SHIP source links</dt><dd>{currentTargets}</dd><small>Observations not yet published here</small></div>
          <div><dt>Request-only sources</dt><dd>{catalog.summary.request_only_source_count}</dd><small>Not treated as outages</small></div>
          <div><dt>Confirmed incidents</dt><dd>0</dd><small>None assessed yet</small></div>
        </dl>
      </section>

      <section className="status-definitions">
        <div className="shell">
          <div className="section-heading">
            <div>
              <p className="eyebrow">How to read status</p>
              <h2 className="community-only">Four questions are better than one green light.</h2>
              <h2 className="technical-only">Separate observations, never one “health” score</h2>
            </div>
          </div>
          <div className="axis-grid community-only">
            <article><span>01</span><h3>Can we reach it?</h3><p>Did the expected public page or file open when we checked?</p></article>
            <article><span>02</span><h3>How old are the data?</h3><p>What time period does the publisher say the data cover?</p></article>
            <article><span>03</span><h3>Did it change?</h3><p>Did the file, page, or way the data are arranged appear to change?</p></article>
            <article><span>04</span><h3>Did a person review it?</h3><p>Automation can spot clues. A person must decide what an important change means.</p></article>
          </div>
          <div className="axis-grid technical-only">
            <article><span>01</span><h3>Access</h3><p>Available, degraded, temporarily unavailable, unavailable, retired or replaced, or unknown/manual.</p></article>
            <article><span>02</span><h3>Freshness</h3><p>Within expected cadence, overdue, cadence unknown, or not applicable.</p></article>
            <article><span>03</span><h3>Change</h3><p>No detected change, content update, structure change, publisher-reported methodology change, or review pending.</p></article>
          </div>
          <Notice title="Opening a link does not prove the data are new">
            <p className="community-only">A page can open and still contain old, incomplete, or changed information. We keep the link check separate from the publisher&apos;s update date.</p>
            <p className="technical-only">“Checked” records when this project observed a source. “Updated” is reserved for a publisher content release. A weekly observation cannot support a percentage-uptime claim.</p>
          </Notice>
        </div>
      </section>

      <section className="shell status-table-section">
        <div className="section-heading">
          <div><p className="eyebrow">Separate SHIP queue</p><h2>Sources awaiting published observations</h2></div>
          <a className="text-link" href={sitePath("/datasets")}>View all {sources.length} sources →</a>
        </div>
        {/* Horizontal tables need a keyboard-focusable scroll region. */}
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
        <div className="table-scroll" tabIndex={0} role="region" aria-label="Source monitoring queue">
          <table>
            <caption>Ten representative SHIP sources; monitoring results have not yet been published to this site</caption>
            <thead><tr><th scope="col">Source</th><th scope="col">How to get it</th><th scope="col">Data listed through</th><th scope="col">Link check</th><th scope="col">Human review</th></tr></thead>
            <tbody>
              {previewSources.map((source) => {
                const { title } = splitSourceName(source);
                return (
                  <tr key={source.id}>
                    <th scope="row"><a href={sitePath(`/datasets/${source.id}`)}>{title}</a></th>
                    <td>{source.access_type === "request_only" ? "Request required" : "Public link listed"}</td>
                    <td>{getLatestDate(source.data_source_dates)?.display_value ?? "Not stated"}</td>
                    <td><span className="status-text">○ Not published</span></td>
                    <td><span className="community-only">Not reviewed yet</span><span className="technical-only">Imported · pending</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="phase-note">
        <div className="shell phase-note-inner">
          <p className="eyebrow">Next observation</p>
          <h2 className="community-only">The first check gives us a starting point.</h2>
          <h2 className="technical-only">The first scan establishes a baseline—not an outage history.</h2>
          <p className="community-only">Later checks can show when links move, fail more than once, or come back. A person will review the evidence before calling a source retired.</p>
          <p className="technical-only">Later scans can identify moves, sustained failures, recoveries, and structural changes. Human review remains necessary before classifying retirement or a methodology change.</p>
        </div>
      </section>
    </main>
  );
}
