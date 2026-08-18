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
        <p>
          The monitor and source inventory are in place. No endpoint is labeled available or unavailable until a completed observation is published.
        </p>
      </PageIntro>

      <section className="shell status-overview" aria-labelledby="monitor-heading">
        <div className="monitor-heartbeat">
          <span className="status-icon" aria-hidden="true">○</span>
          <div>
            <p className="eyebrow">Monitor heartbeat</p>
            <h2 id="monitor-heading">Awaiting first completed scan</h2>
            <p>Weekly automation is configured, but this public preview does not yet contain a verified observation.</p>
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
            <div><p className="eyebrow">How to read status</p><h2>Three axes, never one “health” score</h2></div>
          </div>
          <div className="axis-grid">
            <article><span>01</span><h3>Access</h3><p>Available, degraded, temporarily unavailable, unavailable, retired or replaced, or unknown/manual.</p></article>
            <article><span>02</span><h3>Freshness</h3><p>Within expected cadence, overdue, cadence unknown, or not applicable.</p></article>
            <article><span>03</span><h3>Change</h3><p>No detected change, content update, structure change, publisher-reported methodology change, or review pending.</p></article>
          </div>
          <Notice title="Checked does not mean updated">
            <p>“Checked” records when this project observed a source. “Updated” is reserved for a publisher content release. A weekly observation cannot support a percentage-uptime claim.</p>
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
            <thead><tr><th scope="col">Source</th><th scope="col">Access mode</th><th scope="col">Data through</th><th scope="col">Access status</th><th scope="col">Review</th></tr></thead>
            <tbody>
              {previewSources.map((source) => {
                const { title } = splitSourceName(source);
                return (
                  <tr key={source.id}>
                    <th scope="row"><a href={sitePath(`/datasets/${source.id}`)}>{title}</a></th>
                    <td>{source.access_type === "request_only" ? "Request required" : "Public link listed"}</td>
                    <td>{getLatestDate(source.data_source_dates)?.display_value ?? "Not stated"}</td>
                    <td><span className="status-text">○ Not checked</span></td>
                    <td>Imported · pending</td>
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
          <h2>The first scan establishes a baseline—not an outage history.</h2>
          <p>Later scans can identify moves, sustained failures, recoveries, and structural changes. Human review remains necessary before classifying retirement or a methodology change.</p>
        </div>
      </section>
    </main>
  );
}
