import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { assignConcept, buildVariableCrosswalk, normalizeVariableText } from "../app/lib/variable-comparison.js";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");
const researchFiles = ["batch-a.json", "batch-b.json", "batch-c.json"];

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function stableId(prefix, ...parts) {
  const digest = createHash("sha256").update(parts.join("\u241f")).digest("hex").slice(0, 12);
  return `${prefix}-${digest}`;
}

function nullable(value) {
  if (value === undefined || value === null || value === "") return null;
  return value;
}

function array(value) {
  if (Array.isArray(value)) return value.filter((item) => item !== undefined && item !== null && item !== "");
  return value === undefined || value === null || value === "" ? [] : [value];
}

function normalizeEvidenceKind(value) {
  if (value === "published" || value === "inferred") return value;
  throw new Error(`Variable evidence_kind must be published or inferred, received: ${value}`);
}

const codebookStatuses = new Set(["published", "partial_published", "none_found", "not_applicable", "request_only"]);

function normalizeResearchedVariable(source, variable, index) {
  const evidenceKind = normalizeEvidenceKind(variable.evidence_kind);
  const evidenceUrl = nullable(variable.evidence_url);
  const inferenceBasis = nullable(variable.inference_basis);
  if (evidenceKind === "published" && !evidenceUrl) {
    throw new Error(`${source.id}: published variable ${index + 1} is missing evidence_url`);
  }
  if (evidenceKind === "inferred" && !inferenceBasis) {
    throw new Error(`${source.id}: inferred variable ${index + 1} is missing inference_basis`);
  }

  const label = nullable(variable.label) ?? nullable(variable.source_variable_name);
  if (!label) throw new Error(`${source.id}: variable ${index + 1} has no label or source_variable_name`);
  const key = nullable(variable.source_variable_name) ?? label;
  return {
    id: stableId("var", source.id, normalizeVariableText(key)),
    source_id: source.id,
    source_variable_name: nullable(variable.source_variable_name),
    label,
    definition: nullable(variable.definition),
    data_type: nullable(variable.data_type),
    unit: nullable(variable.unit),
    universe: nullable(variable.universe),
    geography: nullable(variable.geography),
    time_granularity: nullable(variable.time_granularity),
    categories: array(variable.categories),
    missing_codes: array(variable.missing_codes),
    suppression_rules: array(variable.suppression_rules),
    comparability_notes: array(variable.comparability_notes),
    evidence_kind: evidenceKind,
    evidence_url: evidenceUrl,
    confidence: nullable(variable.confidence) ?? (evidenceKind === "published" ? "high" : "low"),
    inference_basis: inferenceBasis,
    provenance: {
      kind: evidenceKind === "published" ? "publisher_documentation" : "researcher_inference",
      evidence_url: evidenceUrl,
      research_batch: source.__batch,
    },
    intake_occurrences: [],
    concept_match: null,
  };
}

function intakeMeasureOccurrences(source) {
  const byLabel = new Map();
  for (const topic of source.topics) {
    for (const measure of topic.measures) {
      const normalized = normalizeVariableText(measure);
      if (!normalized) continue;
      if (!byLabel.has(normalized)) byLabel.set(normalized, { label: measure, occurrences: [] });
      byLabel.get(normalized).occurrences.push({
        topic_id: topic.id,
        topic_category: topic.category,
        workbook_sheet: topic.provenance.sheet,
        workbook_row: topic.provenance.row,
        workbook_cell: topic.provenance.cells.measures,
      });
    }
  }
  return byLabel;
}

function addIntakeVariables(source, variables) {
  const occurrences = intakeMeasureOccurrences(source);
  const documentedKeys = new Map();
  for (const variable of variables) {
    for (const value of [variable.source_variable_name, variable.label]) {
      const normalized = normalizeVariableText(value);
      if (normalized) documentedKeys.set(normalized, variable);
    }
  }

  for (const [normalized, entry] of occurrences) {
    const documented = documentedKeys.get(normalized);
    if (documented) {
      documented.intake_occurrences.push(...entry.occurrences);
      continue;
    }
    variables.push({
      id: stableId("var", source.id, normalized),
      source_id: source.id,
      source_variable_name: null,
      label: entry.label,
      definition: null,
      data_type: null,
      unit: null,
      universe: null,
      geography: null,
      time_granularity: null,
      categories: [],
      missing_codes: [],
      suppression_rules: [],
      comparability_notes: [
        "The phrase was imported from the SHIP resource guide and has not been verified as a field name or publisher-defined measure.",
      ],
      evidence_kind: "inferred",
      evidence_url: null,
      confidence: "low",
      inference_basis: "The SHIP intake workbook lists this phrase in a measures cell. No exact publisher-documented variable matched during this research pass.",
      provenance: {
        kind: "intake_workbook_measure_label",
        source_workbook: source.provenance.source_workbook,
        occurrences: entry.occurrences,
      },
      intake_occurrences: entry.occurrences,
      concept_match: null,
    });
  }
  return variables;
}

function deduplicateVariables(variables) {
  const byIdentity = new Map();
  for (const variable of variables) {
    const key = normalizeVariableText(variable.source_variable_name ?? variable.label);
    const existing = byIdentity.get(key);
    if (!existing || (existing.evidence_kind === "inferred" && variable.evidence_kind === "published")) {
      byIdentity.set(key, variable);
    }
  }
  return [...byIdentity.values()];
}

function validateResearch(catalog, researchSources) {
  const catalogIds = new Set(catalog.sources.map((source) => source.id));
  const researchIds = new Set();
  for (const source of researchSources) {
    if (!catalogIds.has(source.source_id)) throw new Error(`Research contains unknown source_id: ${source.source_id}`);
    if (researchIds.has(source.source_id)) throw new Error(`Research contains duplicate source_id: ${source.source_id}`);
    researchIds.add(source.source_id);
  }
  const missing = [...catalogIds].filter((id) => !researchIds.has(id));
  if (missing.length) throw new Error(`Research is missing ${missing.length} catalog sources: ${missing.join(", ")}`);
}

function codebookSummary(status, artifacts, publishedCount, inferredCount) {
  if (status === "request_only") return "This source requires a request. Public variable documentation was not assumed.";
  if (status === "not_applicable") return "This catalog entry is not a dataset-level resource, so a conventional variable codebook may not apply.";
  if (status === "none_found") return `No public codebook was located in this research pass; ${inferredCount} intake label${inferredCount === 1 ? " is" : "s are"} clearly marked as inferred.`;
  if (status === "partial_published") return `${artifacts.length} public documentation artifact${artifacts.length === 1 ? "" : "s"} located; coverage is partial and remaining intake labels are inferred.`;
  return `${artifacts.length} public documentation artifact${artifacts.length === 1 ? "" : "s"} located with ${publishedCount} publisher-documented variable record${publishedCount === 1 ? "" : "s"}.`;
}

async function build() {
  const catalog = await readJson(resolve(projectRoot, "catalog", "reviewed-intake.json"));
  const taxonomyPath = resolve(projectRoot, "catalog", "concept-taxonomy.json");
  const taxonomyText = await readFile(taxonomyPath, "utf8");
  const taxonomy = JSON.parse(taxonomyText);
  const batches = await Promise.all(researchFiles.map(async (file) => {
    const path = resolve(projectRoot, "research", "codebooks", file);
    const batch = await readJson(path);
    return { ...batch, __file: file };
  }));
  const researchSources = batches.flatMap((batch) =>
    batch.sources.map((source) => ({ ...source, __batch: batch.__file, __research_date: batch.research_date })),
  );
  validateResearch(catalog, researchSources);
  const researchById = new Map(researchSources.map((source) => [source.source_id, source]));

  const sources = catalog.sources.map((source) => {
    const research = researchById.get(source.id);
    if (!codebookStatuses.has(research.codebook_status)) {
      throw new Error(`${source.id}: unsupported codebook_status ${research.codebook_status}`);
    }
    let variables = array(research.variables).map((variable, index) =>
      normalizeResearchedVariable({ ...source, __batch: research.__batch }, variable, index),
    );
    variables = addIntakeVariables(source, variables);
    variables = deduplicateVariables(variables);
    variables = variables.map((variable) => ({
      ...variable,
      concept_match: assignConcept(variable, taxonomy.concepts),
    })).sort((a, b) => a.label.localeCompare(b.label) || a.id.localeCompare(b.id));

    const artifacts = array(research.codebook_artifacts).map((artifact) => ({
      title: artifact.title,
      url: artifact.url,
      format: nullable(artifact.format),
      authority: nullable(artifact.authority),
      applies_to: nullable(artifact.applies_to),
      notes: nullable(artifact.notes),
    }));
    const publishedCount = variables.filter((variable) => variable.evidence_kind === "published").length;
    const inferredCount = variables.filter((variable) => variable.evidence_kind === "inferred").length;
    return {
      source_id: source.id,
      source_name: source.name,
      access_type: source.access_type,
      codebook_status: research.codebook_status,
      summary: codebookSummary(research.codebook_status, artifacts, publishedCount, inferredCount),
      source_urls: array(research.source_urls),
      codebook_artifacts: artifacts,
      published_variable_count: publishedCount,
      inferred_variable_count: inferredCount,
      variables,
      crosswalk_hints: array(research.crosswalk_hints),
      research_notes: array(research.research_notes),
      research_date: research.__research_date,
      research_batch: research.__batch,
    };
  });

  const researchCutoff = batches.map((batch) => batch.research_date).filter(Boolean).sort().at(-1) ?? null;
  const allVariables = sources.flatMap((source) => source.variables);
  const codebooks = {
    schema_version: "1.0.0",
    catalog_schema_version: catalog.schema_version,
    generated_by: "scripts/build_codebooks.mjs",
    research_cutoff: researchCutoff,
    method_note: "Publisher-documented variables retain direct evidence links. Inferred variables are unverified labels or research interpretations and are never silently promoted to publisher definitions.",
    summary: {
      source_count: sources.length,
      source_with_public_documentation_count: sources.filter((source) => ["published", "partial_published"].includes(source.codebook_status)).length,
      source_without_public_codebook_count: sources.filter((source) => source.codebook_status === "none_found").length,
      request_only_source_count: sources.filter((source) => source.codebook_status === "request_only").length,
      variable_count: allVariables.length,
      published_variable_count: allVariables.filter((variable) => variable.evidence_kind === "published").length,
      inferred_variable_count: allVariables.filter((variable) => variable.evidence_kind === "inferred").length,
      concept_assigned_variable_count: allVariables.filter((variable) => variable.concept_match).length,
    },
    sources,
  };

  const builtCrosswalk = buildVariableCrosswalk(sources, taxonomy);
  const crosswalk = {
    schema_version: "1.0.0",
    generated_by: "scripts/build_codebooks.mjs",
    research_cutoff: researchCutoff,
    method_note: taxonomy.method,
    safety_note: "A candidate match is not a finding of comparability. Review definition, unit, universe, geography, reference period, suppression, and methodology before comparing numeric values.",
    summary: {
      concept_count: builtCrosswalk.concepts.length,
      comparison_count: builtCrosswalk.comparisons.length,
      strong_candidate_count: builtCrosswalk.comparisons.filter((item) => item.candidate_strength === "strong_candidate").length,
      review_candidate_count: builtCrosswalk.comparisons.filter((item) => item.candidate_strength === "review_candidate").length,
    },
    concepts: builtCrosswalk.concepts,
    comparisons: builtCrosswalk.comparisons,
  };

  const outputs = [
    ["catalog/codebooks.json", codebooks],
    ["public/data/codebooks.json", codebooks],
    ["catalog/variable-crosswalk.json", crosswalk],
    ["public/data/variable-crosswalk.json", crosswalk],
  ];
  for (const [relativePath, value] of outputs) {
    const path = resolve(projectRoot, relativePath);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  }
  await writeFile(resolve(projectRoot, "public", "data", "concept-taxonomy.json"), taxonomyText, "utf8");

  console.log(JSON.stringify({ codebooks: codebooks.summary, crosswalk: crosswalk.summary }, null, 2));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  build().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

export { build };
