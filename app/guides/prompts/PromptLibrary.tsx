"use client";

import { useEffect, useMemo, useState } from "react";
import { githubIssueUrl } from "../../lib/github";
import { buildPromptText } from "../../lib/prompt-guides.js";
import { sitePath } from "../../lib/site-path";

type ReviewLevel = "required" | "recommended";

type PromptGuide = {
  id: string;
  version: string;
  status: "pilot" | "reviewed" | "retired";
  title: string;
  category: string;
  category_label: string;
  task: string;
  community_summary: string;
  technical_notes: string;
  when_to_use: string;
  required_inputs: Array<{ label: string; placeholder: string }>;
  instructions: string[];
  output_sections: string[];
  human_review: {
    level: ReviewLevel;
    why: string;
    checkpoints: string[];
  };
  related_routes: string[];
  provenance: {
    basis: string;
    last_reviewed: string;
    reviewer_role: string;
  };
};

export type PromptGuideCatalog = {
  schema_version: string;
  updated_at: string;
  purpose: string;
  shared_rules: string[];
  review_levels: Record<ReviewLevel, {
    label: string;
    community_explanation: string;
    technical_explanation: string;
  }>;
  guides: PromptGuide[];
};

type CopyState = "idle" | "copied" | "error";

function includesQuery(guide: PromptGuide, query: string) {
  if (!query) return true;
  return [
    guide.title,
    guide.category_label,
    guide.task,
    guide.community_summary,
    guide.technical_notes,
    guide.when_to_use,
    ...guide.required_inputs.map((input) => input.label),
    ...guide.human_review.checkpoints,
  ].join(" ").toLocaleLowerCase().includes(query);
}

export function PromptLibrary({ catalog }: { catalog: PromptGuideCatalog }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [review, setReview] = useState<"all" | ReviewLevel>("all");
  const [copyStates, setCopyStates] = useState<Record<string, CopyState>>({});

  useEffect(() => {
    const targetId = window.location.hash.slice(1);
    if (!targetId) return;
    const target = document.getElementById(targetId);
    const details = target?.querySelector("details");
    if (details instanceof HTMLDetailsElement) details.open = true;
  }, []);

  const categories = useMemo(
    () => Array.from(new Map(catalog.guides.map((guide) => [guide.category, guide.category_label]))),
    [catalog.guides],
  );

  const visibleGuides = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return catalog.guides.filter((guide) => (
      (category === "all" || guide.category === category)
      && (review === "all" || guide.human_review.level === review)
      && includesQuery(guide, normalizedQuery)
    ));
  }, [catalog.guides, category, query, review]);

  const hasFilters = Boolean(query || category !== "all" || review !== "all");

  function clearFilters() {
    setQuery("");
    setCategory("all");
    setReview("all");
  }

  async function copyPrompt(guide: PromptGuide) {
    const prompt = buildPromptText(guide, catalog.shared_rules);
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(prompt);
      setCopyStates((current) => ({ ...current, [guide.id]: "copied" }));
    } catch {
      setCopyStates((current) => ({ ...current, [guide.id]: "error" }));
    }
  }

  return (
    <div className="prompt-workspace">
      <aside className="prompt-filter-panel" aria-labelledby="prompt-filter-title">
        <div className="filter-heading">
          <h2 id="prompt-filter-title">Find a prompt guide</h2>
          {hasFilters && <button className="clear-button" type="button" onClick={clearFilters}>Clear</button>}
        </div>

        <label htmlFor="prompt-search">Task or keyword</label>
        <input
          id="prompt-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Try “grant,” “missing,” or “join”"
        />

        <label htmlFor="prompt-category">Type of task</label>
        <select id="prompt-category" value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="all">All task types</option>
          {categories.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
        </select>

        <label htmlFor="prompt-review">Human review</label>
        <select
          id="prompt-review"
          value={review}
          onChange={(event) => setReview(event.target.value as "all" | ReviewLevel)}
        >
          <option value="all">All review levels</option>
          <option value="required">Review required</option>
          <option value="recommended">Review recommended</option>
        </select>

        <p className="field-help">Filtering happens on this page. Nothing you type here is sent to an AI service.</p>
      </aside>

      <section className="prompt-results" aria-labelledby="prompt-results-title">
        <div className="results-heading">
          <h2 id="prompt-results-title">Prompt guides</h2>
          <p aria-live="polite">Showing {visibleGuides.length} of {catalog.guides.length}</p>
        </div>

        {visibleGuides.length === 0 ? (
          <div className="empty-state">
            <h2>No guides match those filters.</h2>
            <p>Try a broader word or clear the filters.</p>
            <button className="text-button" type="button" onClick={clearFilters}>Show all prompt guides</button>
          </div>
        ) : (
          <div className="prompt-guide-list">
            {visibleGuides.map((guide) => {
              const promptText = buildPromptText(guide, catalog.shared_rules);
              const copyState = copyStates[guide.id] ?? "idle";
              const reviewDefinition = catalog.review_levels[guide.human_review.level];
              return (
                <article className="prompt-guide-card" id={guide.id} key={guide.id}>
                  <div className="prompt-card-topline">
                    <span className="prompt-category">{guide.category_label}</span>
                    <span className={`review-badge review-badge-${guide.human_review.level}`}>
                      {reviewDefinition.label}
                    </span>
                  </div>
                  <h3>{guide.title}</h3>
                  <p className="community-only">{guide.community_summary}</p>
                  <p className="technical-only">{guide.technical_notes}</p>
                  <p className="prompt-when"><strong>Use it:</strong> {guide.when_to_use}</p>

                  <details className="prompt-details">
                    <summary>Open guide and copy prompt</summary>
                    <div className="prompt-details-body">
                      <section aria-labelledby={`${guide.id}-gather`}>
                        <h4 id={`${guide.id}-gather`}>What to gather first</h4>
                        <ul>
                          {guide.required_inputs.map((input) => <li key={input.label}>{input.label}</li>)}
                        </ul>
                      </section>

                      <section className="human-review-box" aria-labelledby={`${guide.id}-review`}>
                        <h4 id={`${guide.id}-review`}>{reviewDefinition.label}</h4>
                        <p className="community-only">{reviewDefinition.community_explanation}</p>
                        <p className="technical-only">{reviewDefinition.technical_explanation}</p>
                        <p>{guide.human_review.why}</p>
                        <ul>
                          {guide.human_review.checkpoints.map((checkpoint) => <li key={checkpoint}>{checkpoint}</li>)}
                        </ul>
                      </section>

                      <div className="prompt-copy-heading">
                        <div>
                          <h4>Copy-and-paste prompt</h4>
                          <p>Replace the bracketed placeholders after you paste it into the AI tool you choose.</p>
                          <p>If automatic copy is blocked, select the prompt text and copy it manually.</p>
                        </div>
                        <button
                          className="copy-prompt-button"
                          type="button"
                          onClick={() => copyPrompt(guide)}
                          aria-label={`Copy prompt: ${guide.title}`}
                        >
                          {copyState === "copied" ? "Copied" : "Copy full prompt"}
                        </button>
                      </div>
                      <textarea
                        className="prompt-text"
                        readOnly
                        rows={18}
                        value={promptText}
                        aria-label={`Prompt text for ${guide.title}`}
                      />
                      <p className={`copy-status copy-status-${copyState}`} role="status" aria-live="polite">
                        {copyState === "copied" && "Prompt copied. Paste it into the AI tool you choose."}
                        {copyState === "error" && "Automatic copy was blocked. Select the prompt text and copy it manually."}
                      </p>

                      <div className="technical-only prompt-provenance">
                        <h4>Guide record</h4>
                        <dl>
                          <div><dt>Stable ID</dt><dd><code>{guide.id}</code></dd></div>
                          <div><dt>Version</dt><dd>{guide.version} · {guide.status}</dd></div>
                          <div><dt>Review basis</dt><dd>{guide.provenance.basis}</dd></div>
                          <div><dt>Reviewed</dt><dd>{guide.provenance.last_reviewed} · {guide.provenance.reviewer_role}</dd></div>
                        </dl>
                      </div>

                      <div className="prompt-related-links">
                        <strong>Related site pages</strong>
                        {guide.related_routes.map((route) => (
                          <a href={sitePath(route)} key={route}>{route}</a>
                        ))}
                        <a
                          href={githubIssueUrl({ template: "prompt-guide.yml", title: `[Prompt guide] ${guide.title} (${guide.id})` })}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Suggest an improvement <span aria-hidden="true">↗</span>
                        </a>
                      </div>
                    </div>
                  </details>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
