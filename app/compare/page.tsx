import type { Metadata } from "next";
import { codebookSources, variableCrosswalk } from "../lib/codebooks";
import { sitePath } from "../lib/site-path";
import { ComparisonExplorer, type ComparisonSource } from "./ComparisonExplorer";

export const metadata: Metadata = {
  title: "Compare variable definitions",
  description: "Compare the metadata behind similar variables across Delaware-relevant data sources.",
};

export const dynamic = "force-static";

const comparisonSources: ComparisonSource[] = codebookSources
  .map((source) => ({
    source_id: source.source_id,
    source_name: source.source_name,
    variables: source.variables
      .filter((variable) => variable.concept_match)
      .map((variable) => ({
        id: variable.id,
        source_id: variable.source_id,
        source_variable_name: variable.source_variable_name,
        label: variable.label,
        definition: variable.definition,
        data_type: variable.data_type,
        unit: variable.unit,
        universe: variable.universe,
        geography: variable.geography,
        time_granularity: variable.time_granularity,
        evidence_kind: variable.evidence_kind,
        concept_match: variable.concept_match,
      })),
  }))
  .filter((source) => source.variables.length);

export default function ComparePage() {
  return (
    <main id="main-content">
      <header className="catalog-hero compare-hero">
        <div className="shell">
          <p className="eyebrow">Variable crosswalk</p>
          <h1 className="community-only">Check whether two data items really mean the same thing.</h1>
          <h1 className="technical-only">Evaluate candidate semantic matches across source codebooks.</h1>
          <p className="community-only">Choose an idea, then two sources. The checker will show where the descriptions match, differ, or are missing.</p>
          <p className="technical-only">The deterministic matcher uses curated aliases and field-level checks. It does not transform values or certify statistical comparability.</p>
        </div>
      </header>
      <section className="shell compare-intro">
        <div className="plain-caution">
          <strong>This is a comparison assistant, not an automatic green light.</strong>
          <p>Similar names can hide different populations, units, years, geographies, survey questions, or suppression rules.</p>
          <p><a href={sitePath("/guides/prompts#compare-variables")}>Copy the guided comparison prompt</a></p>
        </div>
      </section>
      <section className="shell compare-section">
        <ComparisonExplorer concepts={variableCrosswalk.concepts} sources={comparisonSources} />
      </section>
    </main>
  );
}
