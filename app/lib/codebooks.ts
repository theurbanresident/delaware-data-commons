import rawCodebooks from "@/catalog/codebooks.json";
import rawCrosswalk from "@/catalog/variable-crosswalk.json";

export type EvidenceKind = "published" | "inferred";

export type ConceptMatch = {
  concept_id: string;
  concept_label: string;
  method: string;
  confidence: string | number;
  matched_alias: string;
};

export type CodebookVariable = {
  id: string;
  source_id: string;
  source_variable_name: string | null;
  label: string;
  definition: string | null;
  data_type: string | null;
  unit: string | null;
  universe: string | null;
  geography: string | null;
  time_granularity: string | null;
  categories: unknown[];
  missing_codes: unknown[];
  suppression_rules: unknown[];
  comparability_notes: string[];
  evidence_kind: EvidenceKind;
  evidence_url: string | null;
  confidence: string;
  inference_basis: string | null;
  provenance: Record<string, unknown>;
  intake_occurrences: Array<Record<string, unknown>>;
  concept_match: ConceptMatch | null;
};

export type CodebookArtifact = {
  title: string;
  url: string;
  format: string | null;
  authority: string | null;
  applies_to: string | null;
  notes: string | null;
};

export type CodebookSource = {
  source_id: string;
  source_name: string;
  access_type: "public" | "request_only";
  codebook_status: "published" | "partial_published" | "none_found" | "not_applicable" | "request_only";
  summary: string;
  source_urls: string[];
  codebook_artifacts: CodebookArtifact[];
  published_variable_count: number;
  inferred_variable_count: number;
  variables: CodebookVariable[];
  crosswalk_hints: unknown[];
  research_notes: unknown[];
  research_date: string;
  research_batch: string;
};

export type ComparisonCheck = {
  field: string;
  importance: string;
  status: "aligned" | "different" | "unknown";
  left_value: string | null;
  right_value: string | null;
};

export type VariableComparison = {
  left_variable_id: string;
  right_variable_id: string;
  concept_id: string | null;
  semantic_basis: string;
  label_similarity: number;
  candidate_score: number;
  candidate_strength: "strong_candidate" | "review_candidate" | "not_a_match";
  comparison_readiness: "requires_metadata_review" | "requires_method_review";
  automated_conclusion: string;
  checks: ComparisonCheck[];
  warnings: string[];
};

export type CrosswalkConcept = {
  id: string;
  label: string;
  domain: string;
  definition: string;
  aliases: string[];
  comparison_dimensions: string[];
  common_traps: string[];
  source_count: number;
  variable_count: number;
  comparison_count: number;
  variable_ids: string[];
};

type Codebooks = {
  schema_version: string;
  research_cutoff: string;
  method_note: string;
  summary: {
    source_count: number;
    source_with_public_documentation_count: number;
    source_without_public_codebook_count: number;
    request_only_source_count: number;
    variable_count: number;
    published_variable_count: number;
    inferred_variable_count: number;
    concept_assigned_variable_count: number;
  };
  sources: CodebookSource[];
};

type Crosswalk = {
  schema_version: string;
  research_cutoff: string;
  method_note: string;
  safety_note: string;
  summary: {
    concept_count: number;
    comparison_count: number;
    strong_candidate_count: number;
    review_candidate_count: number;
  };
  concepts: CrosswalkConcept[];
  comparisons: VariableComparison[];
};

export const codebooks = rawCodebooks as Codebooks;
export const codebookSources = codebooks.sources;
export const variableCrosswalk = rawCrosswalk as Crosswalk;

export const codebookBySourceId = new Map(codebookSources.map((source) => [source.source_id, source]));
export const variableById = new Map(
  codebookSources.flatMap((source) => source.variables.map((variable) => [variable.id, variable] as const)),
);

export function codebookStatusLabel(status: CodebookSource["codebook_status"]) {
  if (status === "published") return "Public codebook located";
  if (status === "partial_published") return "Some public documentation located";
  if (status === "none_found") return "No public codebook located";
  if (status === "request_only") return "Documentation requires a request";
  return "A variable codebook may not apply";
}

export function evidenceLabel(kind: EvidenceKind) {
  return kind === "published" ? "Publisher-documented" : "Inferred—needs verification";
}

export function formatMetadataValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "Not documented";
  if (Array.isArray(value)) {
    if (!value.length) return "Not documented";
    return value.map((item) => typeof item === "string" ? item : JSON.stringify(item)).join("; ");
  }
  return String(value);
}
