"use client";

import { useMemo, useState } from "react";
import { compareVariables } from "../lib/variable-comparison.js";
import type { CodebookVariable, CrosswalkConcept, VariableComparison } from "../lib/codebooks";
import { sitePath } from "../lib/site-path";

type Props = {
  concepts: CrosswalkConcept[];
  sources: ComparisonSource[];
};

type ComparableVariable = Pick<
  CodebookVariable,
  "id" | "source_id" | "source_variable_name" | "label" | "definition" | "data_type" | "unit" | "universe" | "geography" | "time_granularity" | "evidence_kind" | "concept_match"
>;

export type ComparisonSource = {
  source_id: string;
  source_name: string;
  variables: ComparableVariable[];
};

function firstPair(concept: CrosswalkConcept, variableMap: Map<string, ComparableVariable>) {
  const members = concept.variable_ids.map((id) => variableMap.get(id)).filter((item): item is ComparableVariable => Boolean(item));
  const left = members[0] ?? null;
  const right = members.find((item) => item.source_id !== left?.source_id) ?? null;
  return [left?.id ?? "", right?.id ?? ""] as const;
}

function statusLabel(status: string) {
  if (status === "aligned") return "Same wording in the metadata";
  if (status === "different") return "Different—review needed";
  return "Not documented for one or both";
}

function sourceTitle(sourceId: string, sourceMap: Map<string, ComparisonSource>) {
  return sourceMap.get(sourceId)?.source_name ?? sourceId;
}

export function ComparisonExplorer({ concepts, sources }: Props) {
  const variableMap = useMemo(() => new Map(sources.flatMap((source) => source.variables.map((variable) => [variable.id, variable] as const))), [sources]);
  const sourceMap = useMemo(() => new Map(sources.map((source) => [source.source_id, source])), [sources]);
  const conceptIndex = useMemo(() => Object.fromEntries(concepts.map((concept) => [concept.id, concept])), [concepts]);
  const firstConcept = concepts[0];
  const [conceptId, setConceptId] = useState(firstConcept?.id ?? "");
  const initialPair = firstConcept ? firstPair(firstConcept, variableMap) : ["", ""];
  const [leftId, setLeftId] = useState(initialPair[0]);
  const [rightId, setRightId] = useState(initialPair[1]);

  const concept = concepts.find((item) => item.id === conceptId) ?? firstConcept;
  const members = useMemo(() => concept?.variable_ids.map((id) => variableMap.get(id)).filter((item): item is ComparableVariable => Boolean(item)) ?? [], [concept, variableMap]);
  const left = variableMap.get(leftId) ?? members[0] ?? null;
  const rightOptions = members.filter((item) => item.source_id !== left?.source_id);
  const right = rightOptions.find((item) => item.id === rightId) ?? rightOptions[0] ?? null;
  const result = left && right ? compareVariables(left, right, conceptIndex) as VariableComparison : null;

  function changeConcept(nextId: string) {
    const next = concepts.find((item) => item.id === nextId);
    setConceptId(nextId);
    if (!next) return;
    const [nextLeft, nextRight] = firstPair(next, variableMap);
    setLeftId(nextLeft);
    setRightId(nextRight);
  }

  function changeLeft(nextId: string) {
    setLeftId(nextId);
    const nextLeft = variableMap.get(nextId);
    if (!nextLeft) return;
    const nextRight = members.find((item) => item.source_id !== nextLeft.source_id);
    setRightId(nextRight?.id ?? "");
  }

  if (!concept) return <p>No cross-source concept candidates are available.</p>;

  return (
    <div className="comparison-workspace">
      <section className="comparison-controls" aria-labelledby="comparison-controls-title">
        <div>
          <p className="eyebrow">Choose what to inspect</p>
          <h2 id="comparison-controls-title">Build a metadata comparison</h2>
          <p>This compares definitions and context—not the data values themselves.</p>
        </div>
        <div className="comparison-fields">
          <label htmlFor="concept-select">Shared idea</label>
          <select id="concept-select" value={concept.id} onChange={(event) => changeConcept(event.target.value)}>
            {concepts.map((item) => <option key={item.id} value={item.id}>{item.label} ({item.source_count} sources)</option>)}
          </select>

          <label htmlFor="left-variable">First source and variable</label>
          <select id="left-variable" value={left?.id ?? ""} onChange={(event) => changeLeft(event.target.value)}>
            {members.map((item) => <option key={item.id} value={item.id}>{sourceTitle(item.source_id, sourceMap)} — {item.label}</option>)}
          </select>

          <label htmlFor="right-variable">Second source and variable</label>
          <select id="right-variable" value={right?.id ?? ""} onChange={(event) => setRightId(event.target.value)}>
            {rightOptions.map((item) => <option key={item.id} value={item.id}>{sourceTitle(item.source_id, sourceMap)} — {item.label}</option>)}
          </select>
        </div>
      </section>

      {left && right && result ? (
        <section className="comparison-result" aria-live="polite">
          <div className="comparison-concept">
            <p className="eyebrow">Candidate shared concept</p>
            <h2>{concept.label}</h2>
            <p>{concept.definition}</p>
            <p className="technical-only"><strong>Concept ID:</strong> <code>{concept.id}</code> · <strong>Candidate score:</strong> {result.candidate_score.toFixed(3)} · <strong>Basis:</strong> <code>{result.semantic_basis}</code></p>
          </div>

          <div className="comparison-pair">
            {[left, right].map((variable, index) => (
              <article key={variable.id}>
                <span className="comparison-side">{index === 0 ? "First source" : "Second source"}</span>
                <h3>{variable.label}</h3>
                <p>{sourceTitle(variable.source_id, sourceMap)}</p>
                <span className={`evidence-chip evidence-chip-${variable.evidence_kind}`}>{variable.evidence_kind === "published" ? "Publisher-documented" : "Inferred—needs verification"}</span>
                <p className="variable-definition">{variable.definition ?? "No publisher definition was located."}</p>
                <a href={sitePath(`/codebooks/${variable.source_id}`)}>Open full codebook record</a>
                <p className="technical-only"><code>{variable.id}</code></p>
              </article>
            ))}
          </div>

          <section className="comparison-checks" aria-labelledby="comparison-checks-title">
            <h3 id="comparison-checks-title">
              <span className="community-only">What lines up—and what does not</span>
              <span className="technical-only">Automated metadata checks</span>
            </h3>
            <p className="table-scroll-hint">Swipe or scroll horizontally to see all columns.</p>
            {/* Keyboard focus lets readers scroll the table without a pointer. */}
            {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
            <div className="table-scroll" role="region" tabIndex={0} aria-label="Selected variable metadata comparison">
              <table>
                <caption>Metadata checks for the selected variable pair.</caption>
                <thead><tr><th scope="col">Check</th><th scope="col">Result</th><th scope="col">First source</th><th scope="col">Second source</th></tr></thead>
                <tbody>
                  {result.checks.filter((check) => check.importance === "required" || check.status !== "unknown").map((check) => (
                    <tr key={check.field}>
                      <th scope="row">{check.field.replaceAll("_", " ")}</th>
                      <td><span className={`comparison-status comparison-status-${check.status}`}>{statusLabel(check.status)}</span></td>
                      <td>{check.left_value ?? "Not documented"}</td>
                      <td>{check.right_value ?? "Not documented"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="comparison-warning">
            <h3>Human review is still required</h3>
            <p className="community-only">A matching topic name is a starting point. Read both source methods before putting the numbers next to each other.</p>
            <p className="technical-only">Automated conclusion: {result.automated_conclusion} Readiness state: <code>{result.comparison_readiness}</code>.</p>
            <ul>{result.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
          </aside>

          <div className="comparison-dimensions technical-only">
            <h3>Concept-specific dimensions to review</h3>
            <ul>{concept.comparison_dimensions.map((dimension) => <li key={dimension}>{dimension}</li>)}</ul>
          </div>
        </section>
      ) : <p>Select two variables from different sources.</p>}
    </div>
  );
}
