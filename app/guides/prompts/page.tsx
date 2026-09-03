import type { Metadata } from "next";
import promptCatalog from "../../../catalog/prompt-guides.json";
import { Notice, PageIntro } from "../../components/Content";
import { sitePath } from "../../lib/site-path";
import { PromptLibrary, type PromptGuideCatalog } from "./PromptLibrary";

export const metadata: Metadata = {
  title: "Prompt guide library",
  description: "Copy provider-neutral prompts for careful interpretation, comparison, citation, and communication of Delaware public data.",
};

export default function PromptGuidesPage() {
  return (
    <main id="main-content">
      <PageIntro eyebrow="Guides · Prompt library" title="A careful starting point for working with public data and AI.">
        <p className="community-only">
          Choose a task, copy the prompt, and paste it into ChatGPT, Codex, Claude, or another AI tool. The prompt helps organize evidence and point out gaps. It does not replace a person&apos;s review.
        </p>
        <p className="technical-only">
          These provider-neutral prompt guides turn the Commons&apos; interpretation rules into reusable, versioned workflows. The copied prompt is identical in both views; Technical view adds provenance, assumptions, and review metadata.
        </p>
      </PageIntro>

      <section className="shell prompt-intro-grid" aria-label="How to use prompt guides">
        <div>
          <p className="eyebrow">Use a guide in four steps</p>
          <ol className="prompt-quick-steps">
            <li><span>1</span><p><strong>Choose the task.</strong> Start with the work you need to do, not the AI tool.</p></li>
            <li><span>2</span><p><strong>Gather public evidence.</strong> Bring the publisher page, codebook, dates, and data you are allowed to share.</p></li>
            <li><span>3</span><p><strong>Copy and fill in the prompt.</strong> Replace the bracketed notes. The site does not send your text or data to an AI provider.</p></li>
            <li><span>4</span><p><strong>Complete the human check.</strong> Verify the source and ask the named people to review high-risk choices.</p></li>
          </ol>
        </div>
        <div>
          <Notice title="Do not paste private or restricted information" tone="caution">
            <p>Use only public material you have permission to share. Do not paste personal records, client details, protected health information, passwords, confidential files, or unpublished restricted data into an AI service.</p>
          </Notice>
          <Notice title="A prompt is a checklist, not proof">
            <p className="community-only">AI can organize notes, explain terms, and show what is missing. It cannot decide whether two measures truly match or whether a claim is safe and fair.</p>
            <p className="technical-only">A prompt can standardize questions and output sections. It cannot authenticate a source, certify statistical comparability, complete a privacy determination, or supply missing domain and community knowledge.</p>
          </Notice>
        </div>
      </section>

      <section className="human-boundary">
        <div className="shell human-boundary-grid">
          <div>
            <p className="eyebrow">Where people add the most value</p>
            <h2>Use AI to organize evidence. Keep judgment with people.</h2>
          </div>
          <div className="boundary-columns">
            <article>
              <h3>Useful drafting help</h3>
              <ul>
                <li>Organize definitions and dates</li>
                <li>List missing metadata</li>
                <li>Prepare a citation format</li>
                <li>Draft a clearer explanation</li>
              </ul>
            </article>
            <article>
              <h3>Human decision needed</h3>
              <ul>
                <li>Decide whether measures mean the same thing</li>
                <li>Explain a break, trend, or cause</li>
                <li>Approve joins, privacy, and reuse</li>
                <li>Publish grant, policy, or community claims</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="shell prompt-library-section">
        <PromptLibrary catalog={promptCatalog as PromptGuideCatalog} />
        <noscript>
          <p className="noscript-note">All prompts are shown without JavaScript. Select the prompt text and copy it manually; search and copy buttons require JavaScript.</p>
        </noscript>
      </section>

      <section className="prompt-data-note">
        <div className="shell">
          <p className="community-only">These guides will change as people test them. Each accepted improvement keeps an earlier version in the project history.</p>
          <p className="technical-only">The canonical guide catalog is versioned and schema-validated. The public machine-readable copy is available at <a href={sitePath("/data/prompt-guides.json")}>/data/prompt-guides.json</a>; accepted semantic changes follow the project&apos;s review policy.</p>
        </div>
      </section>
    </main>
  );
}
