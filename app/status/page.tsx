import type { Metadata } from "next";
import { catalog, getLatestDate, getPrimaryDistribution, sources, splitSourceName } from "../lib/catalog";
import { Notice, PageIntro } from "../components/Content";
import { sitePath } from "../lib/site-path";

export const metadata: Metadata = {
  title: "Source status",
  description: "How Delaware Data Commons reports access, freshness, and change—and the current pre-scan baseline.",
};

const previewSources = sources.slice(0, 10);

export default function StatusPage() {
  const currentTargets = sources.filter((source) => getPrimaryDistribution(source)).length;

  return (
    <main id="main-content">
      <PageIntro eyebrow="Source status" title="A transparent baseline before the first weekly scan.">
        <p className="community-only">
          This page will show whether a source link opens, how old its listed data are, whether something changed, and whether a person reviewed the result.
        </p>
        <p className="technical-only">
          The monitor and source inventory are in place. No endpoint is labeled available or unavailable until a completed observation is published.
        </p>
      </PageIntro>

      <section className="shell status-overview" aria-labelledby="monitor-heading">
        <div className="monitor-heartbeat">
          <span className="status-icon" aria-hidden="true">○</span>
          <div>
            <p className="eyebrow">Monitor heartbeat</p>
            <h2 id="monitor-heading">Awaiting first completed scan</h2>
            <p className="community-only">The weekly checker is ready, but it has not published its first result.</p>
            <p className="technical-only">Weekly automation is configured, but this public preview does not yet contain a verified observation.</p>
          </div>
        </div>
        <dl className="status-metrics">
          <div><dt>Records imported</dt><dd>{catalog.summary.source_count}</dd><small>All need curator review</small></div>
          <div><dt>Current public targets</dt><dd>{currentTargets}</dd><small>Awaiting first check</small></div>
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
          <div><p className="eyebrow">Initial queue</p><h2>Sources awaiting observation</h2></div>
          <a className="text-link" href={sitePath("/datasets")}>View all {sources.length} sources →</a>
        </div>
        {/* Horizontal tables need a keyboard-focusable scroll region. */}
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
        <div className="table-scroll" tabIndex={0} role="region" aria-label="Source monitoring queue">
          <table>
            <caption>Ten representative imported sources before the first automated scan</caption>
            <thead><tr><th scope="col">Source</th><th scope="col">How to get it</th><th scope="col">Data listed through</th><th scope="col">Link check</th><th scope="col">Human review</th></tr></thead>
            <tbody>
              {previewSources.map((source) => {
                const { title } = splitSourceName(source);
                return (
                  <tr key={source.id}>
                    <th scope="row"><a href={sitePath(`/datasets/${source.id}`)}>{title}</a></th>
                    <td>{source.access_type === "request_only" ? "Request required" : "Public link listed"}</td>
                    <td>{getLatestDate(source.data_source_dates)?.display_value ?? "Not stated"}</td>
                    <td><span className="status-text">○ Not checked</span></td>
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
