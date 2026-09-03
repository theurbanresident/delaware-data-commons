import type { Metadata } from "next";
import { Notice, PageIntro } from "../components/Content";
import { sitePath } from "../lib/site-path";

export const metadata: Metadata = {
  title: "Why this site exists and how it was built",
  description: "The purpose, creation process, limits, governance, and preservation approach of Delaware Data Commons.",
};

const myHealthyCommunityArticle = "https://pmc.ncbi.nlm.nih.gov/articles/PMC8352406/";
const myHealthyCommunityTransition = "https://dhss.delaware.gov/dph/homepage/about/health-data-stats/my-healthy-community/";
const lastMileArticle = "https://drivendata.co/blog/last-mile-public-data";

export default function AboutPage() {
  return (
    <main id="main-content">
      <PageIntro eyebrow="About this project" title="Why this site exists and how it was built.">
        <p className="community-only">
          Delaware has useful public data, but it is spread across many websites and files. This site gives people one place to find sources, understand them, and see what still needs to be checked.
        </p>
        <p className="technical-only">
          Delaware Data Commons is an independent discovery and documentation layer. It connects source records, definitions, evidence, access observations, and revision history without replacing the original publisher.
        </p>
      </PageIntro>

      <article className="shell prose prose-centered about-community community-only">
        <section>
          <p className="eyebrow">Why we made it</p>
          <h2>Finding a public file is only the first step.</h2>
          <p>
            Delaware data cover health, housing, food, education, jobs, safety, and many other needs. But the information is spread across agency pages, reports, dashboards, and spreadsheets. Links move. Websites change. Definitions can be hard to find.
          </p>
          <p>
            The earlier <a href={myHealthyCommunityArticle} target="_blank" rel="noreferrer">My Healthy Community platform <span aria-hidden="true">↗</span></a> showed the value of one place for community health information. The original site is no longer available in the same form. Delaware Health and Social Services says its data are <a href={myHealthyCommunityTransition} target="_blank" rel="noreferrer">being moved while a next phase is planned <span aria-hidden="true">↗</span></a>. This Commons is an independent project inspired by that need. It is not an official replacement.
          </p>
          <p>
            People still need to know who made the data, what a number means, which people and places it covers, whether it is current, and whether it can be compared with another source. This work between finding a file and using it well is often called the <a href={lastMileArticle} target="_blank" rel="noreferrer">last mile of public data <span aria-hidden="true">↗</span></a>.
          </p>
          <Notice title="The publisher is still the official source">
            <p>The Commons helps you find and check evidence. It does not approve a dataset or replace the publisher&apos;s definitions and methods.</p>
          </Notice>
        </section>

        <section>
          <p className="eyebrow">How we made the first version</p>
          <h2>We turned a community source list into a traceable catalog.</h2>
          <ol className="about-steps">
            <li><span>1</span><div><h3>Start with the SHIP resource guide</h3><p>A Delaware group had already listed public data sources in a spreadsheet. We used it as the starting point, not as proof that every source was correct.</p></div></li>
            <li><span>2</span><div><h3>Keep a paper trail</h3><p>We kept the original wording and the spreadsheet row and cell for each item. That helps people trace a description and correct mistakes.</p></div></li>
            <li><span>3</span><div><h3>Check the original publishers</h3><p>We looked for official pages, downloads, codebooks, survey forms, and methods. Exact publisher definitions are labeled as documented.</p></div></li>
            <li><span>4</span><div><h3>Mark what is not confirmed</h3><p>If we could not find an exact public definition, we kept the helpful label but marked it as inferred. Inferred means it still needs to be checked.</p></div></li>
            <li><span>5</span><div><h3>Give each source a stable record</h3><p>A source keeps the same catalog ID when a link or title changes. Its pages, files, dashboards, and request routes are recorded separately.</p></div></li>
            <li><span>6</span><div><h3>Add careful computer checks</h3><p>A weekly check can report whether a public link answered. Another tool can suggest similar variables. Neither tool decides that data are correct or safe to compare.</p></div></li>
            <li><span>7</span><div><h3>Show two views of the same facts</h3><p>Community view gives shorter explanations. Technical view adds evidence and methods. Both views use the same record.</p></div></li>
            <li><span>8</span><div><h3>Invite corrections and keep versions</h3><p>A visitor can send a guided report. A person checks the evidence before a change is accepted, and the earlier version stays in the project history.</p></div></li>
          </ol>
        </section>

        <section>
          <h2>Where people are still needed</h2>
          <p>A computer can organize evidence and point out gaps. People must make the hard choices. Human review matters most when:</p>
          <ul className="check-list">
            <li>two measures have similar names but may mean different things;</li>
            <li>a definition, denominator, place, or time period is unclear;</li>
            <li>values are missing or hidden to protect privacy;</li>
            <li>data are joined for a small place or group;</li>
            <li>a source may have moved, changed, or ended; or</li>
            <li>a number will support a grant, policy, funding, or health decision.</li>
          </ul>
          <p><a className="button-link" href={sitePath("/guides/prompts")}>Use the prompt guide library</a></p>
        </section>

        <section>
          <h2>What this phase does not yet do</h2>
          <p>This Phase 0 and Phase 1 site is mainly a guide to sources, definitions, evidence, and source status. It does not promise a complete set of ready-to-use numbers. Combined data products will be added only after checks for meaning, permission, privacy, and quality.</p>
          <p>A moved or retired source stays in the catalog because its history still matters. A copy of the data can be saved only when permission, privacy, and storage rules allow it.</p>
        </section>
      </article>

      <div className="shell content-layout about-technical technical-only">
        <aside className="section-nav" aria-label="On this page">
          <strong>On this page</strong>
          <a href="#technical-purpose">Purpose</a>
          <a href="#technical-terms">Key terms</a>
          <a href="#technical-process">Creation steps</a>
          <a href="#technical-people">Human review</a>
          <a href="#technical-limits">Limits</a>
        </aside>

        <article className="prose">
          <section id="technical-purpose">
            <p className="eyebrow">Purpose</p>
            <h2>Why the project was created</h2>
            <p>
              Delaware public data are distributed across agencies, universities, nonprofit organizations, national programs, reports, dashboards, downloadable files, and request processes. A resource can be public while remaining difficult to discover, interpret, compare, cite, or retrieve later.
            </p>
            <p>
              The former <a href={myHealthyCommunityArticle} target="_blank" rel="noreferrer">My Healthy Community platform <span aria-hidden="true">↗</span></a> demonstrated the usefulness of a shared access point. Its transition also shows the continuity risk created when discovery and interpretation depend on one application. Delaware Data Commons is an independent project inspired by that need, not an official continuation or state record.
            </p>
            <p>
              The project addresses the <a href={lastMileArticle} target="_blank" rel="noreferrer">last-mile public-data problem <span aria-hidden="true">↗</span></a>: the work between locating a resource and using it responsibly. That includes defining fields, matching population and geographic coverage, separating data periods from release dates, tracking changes, checking reuse rights, and leaving enough evidence for another person to reproduce or challenge a result.
            </p>
          </section>

          <section id="technical-terms">
            <p className="eyebrow">A short glossary</p>
            <h2>Three ideas used throughout this site</h2>
            <div className="term-stack">
              <article>
                <h3>GitHub: an online project folder with change history</h3>
                <p>A <strong>repository</strong> is the project&apos;s shared folder. An <strong>issue</strong> is a numbered report or discussion. A <strong>pull request</strong> is a proposed set of changes that people can review. A <strong>commit</strong> is a saved point in the change history. A <strong>release</strong> is a named version meant for reuse or citation.</p>
                <p>GitHub makes earlier versions easier to inspect. It does not guarantee that a project will remain online forever.</p>
              </article>
              <article>
                <h3>Provenance: the evidence trail</h3>
                <p>Provenance records where information came from and what happened to it. Here, that trail can include a spreadsheet cell, publisher page, codebook, review date, transformation script, and accepted correction.</p>
                <p>Provenance does not prove that a fact is correct. It makes the origin and processing visible so another person can audit, reproduce, or challenge it.</p>
              </article>
              <article>
                <h3>Data permanence: keeping information usable over time</h3>
                <p>No ordinary website is permanent. Publishers can remove files, links can break, organizations can close, and a GitHub repository can move or disappear.</p>
                <p>The Commons improves continuity with stable IDs, retained records for retired sources, versioned releases, and checksums—digital fingerprints that can show whether a saved file changed. True long-term preservation also needs independent deposits when licensing and privacy rules allow them.</p>
              </article>
            </div>
          </section>

          <section id="technical-process">
            <p className="eyebrow">Creation process</p>
            <h2>How the current site was assembled</h2>
            <ol className="technical-process-list">
              <li><strong>Set the scope and safeguards.</strong> The project is a discovery and documentation layer. Publisher statements, curator judgments, community knowledge, and automated observations remain different claim types.</li>
              <li><strong>Import the intake workbook with its context.</strong> A script converted the Delaware SHIP resource guide into structured records while retaining workbook, worksheet, row, and cell references. Imported records started as review pending.</li>
              <li><strong>Give records a consistent structure.</strong> A source is separated from its access routes, such as pages, files, dashboards, APIs, and request processes. A schema—a set of required fields and validation rules—checks the machine-readable structure.</li>
              <li><strong>Research documentation source by source.</strong> The review looked for publisher codebooks, questionnaires, table definitions, API descriptions, and methods pages. Direct evidence and inferred labels remain visibly separate.</li>
              <li><strong>Generate repeatable outputs.</strong> Scripts produce public codebook records, a concept taxonomy, and candidate variable matches. Automated tests check required fields, links between records, and important interpretation rules.</li>
              <li><strong>Render two explanations from one record.</strong> Community and Technical views change the amount and style of explanation in the browser. They do not maintain separate catalogs or change source metadata.</li>
              <li><strong>Create conservative comparison candidates.</strong> The comparison function checks unit, population, geography, time, and data type. It suggests pairs for review; it never certifies that values are interchangeable.</li>
              <li><strong>Separate access from quality.</strong> A scheduled monitor attempts to retrieve expected public resources. A successful response does not show that the data are current, complete, methodologically sound, or right for a decision.</li>
              <li><strong>Connect corrections to version history.</strong> Guided reports can become reviewed pull requests. The accepted commit becomes a new saved version, while earlier versions remain visible.</li>
              <li><strong>Preserve only when rights and risk allow.</strong> Metadata and status history can remain even when an upstream file cannot be copied. Source snapshots require compatible reuse rights and privacy review.</li>
            </ol>
          </section>

          <section id="technical-people">
            <p className="eyebrow">Review boundary</p>
            <h2>Automation prepares evidence; people make material decisions</h2>
            <p>Human review is essential for semantic harmonization, denominators, suppression, geographic joins, trend breaks, causal language, grant-ready claims, licensing, privacy and mosaic risk, and culturally appropriate interpretation. A model may help organize the record, but it cannot supply missing local knowledge or authorize a consequential use.</p>
            <p>The <a href={sitePath("/guides/prompts")}>Prompt guide library</a> makes this boundary concrete. Each reusable guide includes a review level, named checkpoints, a version, and a provenance note. The copied prompt is the same in both site views.</p>
          </section>

          <section id="technical-limits">
            <p className="eyebrow">Current phase</p>
            <h2>A metadata-first foundation, not yet a complete data warehouse</h2>
            <p>Phase 0 and Phase 1 catalog and document sources, definitions, evidence, access routes, and status. They do not certify numerical comparability or provide a complete analysis-ready store. Future “baked” data products must include exact source versions, transformation code, dictionaries, tests, provenance, compatible rights, and privacy review.</p>
            <Notice title="GitHub is version history, not guaranteed preservation" tone="caution">
              <p>Important releases should eventually be deposited in an independent preservation service that can issue a persistent identifier. A persistent identifier is a long-lived reference designed to keep pointing to the saved version even when ordinary web addresses change.</p>
            </Notice>
          </section>
        </article>
      </div>

      <section className="about-shared">
        <div className="shell about-shared-grid">
          <div>
            <p className="eyebrow">Who it is for</p>
            <h2>Designed for public use and public review.</h2>
          </div>
          <div className="audience-grid">
            <div><h3>Community organizations</h3><p>Find defensible local evidence and understand its limits.</p></div>
            <div><h3>Researchers</h3><p>Trace versions, fields, methods, and evidence.</p></div>
            <div><h3>Policy analysts</h3><p>See release, revision, geographic, and comparison context.</p></div>
            <div><h3>Residents</h3><p>Explore public evidence without needing a GitHub account.</p></div>
          </div>
        </div>
      </section>

      <article className="shell prose prose-centered about-governance">
        <section>
          <h2>Governance commitments</h2>
          <ul className="check-list">
            <li>At least two maintainers and named dataset stewards.</li>
            <li>Public methods, decisions, corrections, and retirement history.</li>
            <li>Two-person review for semantic harmonization and derived indicators.</li>
            <li>Community review of terminology, priority questions, and potentially harmful uses.</li>
            <li>Separate licensing for code, metadata, upstream copies, and derived products.</li>
          </ul>
        </section>

        <section id="corrections">
          <h2>Corrections and source updates</h2>
          <p className="community-only">If a link moved, a description is wrong, or a measure needs a better explanation, use a short guided form. You do not need to write code.</p>
          <p className="technical-only">Publisher and community corrections become structured GitHub issues. Accepted edits are reviewed in a pull request and released as a new version; stable record identifiers and prior history are retained.</p>
          <p><a className="button-link" href={sitePath("/contribute")}>Choose a feedback form</a></p>
        </section>
      </article>
    </main>
  );
}
