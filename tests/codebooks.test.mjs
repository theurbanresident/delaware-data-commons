import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const catalog = JSON.parse(await readFile(new URL("../catalog/reviewed-intake.json", import.meta.url), "utf8"));
const codebooks = JSON.parse(await readFile(new URL("../catalog/codebooks.json", import.meta.url), "utf8"));
const taxonomy = JSON.parse(await readFile(new URL("../catalog/concept-taxonomy.json", import.meta.url), "utf8"));
const crosswalk = JSON.parse(await readFile(new URL("../catalog/variable-crosswalk.json", import.meta.url), "utf8"));

const sourcesById = new Map(codebooks.sources.map((source) => [source.source_id, source]));
const variablesById = new Map(codebooks.sources.flatMap((source) => source.variables.map((variable) => [variable.id, variable])));

test("codebook research covers every catalog source exactly once", () => {
  const catalogIds = catalog.sources.map((source) => source.id).sort();
  const codebookIds = codebooks.sources.map((source) => source.source_id).sort();
  assert.deepEqual(codebookIds, catalogIds);
  assert.equal(new Set(codebookIds).size, 37);
  assert.equal(codebooks.summary.source_count, 37);
});

test("publisher documentation and inference have enforceable evidence rules", () => {
  const variables = [...variablesById.values()];
  assert.equal(new Set(variables.map((variable) => variable.id)).size, variables.length);
  assert.ok(variables.some((variable) => variable.evidence_kind === "published"));
  assert.ok(variables.some((variable) => variable.evidence_kind === "inferred"));

  for (const variable of variables) {
    assert.ok(["published", "inferred"].includes(variable.evidence_kind), variable.id);
    if (variable.evidence_kind === "published") {
      assert.match(variable.evidence_url, /^https?:\/\//, variable.id);
    } else {
      assert.ok(variable.inference_basis?.trim(), variable.id);
      assert.ok(variable.confidence !== null && variable.confidence !== undefined, variable.id);
    }
  }
});

test("request-only sources remain an access category, not invented public codebooks", () => {
  const requestOnly = codebooks.sources.filter((source) => source.access_type === "request_only");
  assert.equal(requestOnly.length, 7);
  assert.equal(requestOnly.every((source) => source.codebook_status === "request_only"), true);
});

test("concept taxonomy has unique identifiers and aliases", () => {
  const ids = taxonomy.concepts.map((concept) => concept.id);
  const aliases = taxonomy.concepts.flatMap((concept) => concept.aliases.map((alias) => alias.toLowerCase()));
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(aliases).size, aliases.length);
});

test("crosswalk candidates always compare different sources and never claim automatic readiness", () => {
  for (const comparison of crosswalk.comparisons) {
    const left = variablesById.get(comparison.left_variable_id);
    const right = variablesById.get(comparison.right_variable_id);
    assert.ok(left, comparison.left_variable_id);
    assert.ok(right, comparison.right_variable_id);
    assert.notEqual(left.source_id, right.source_id, `${left.id} / ${right.id}`);
    assert.equal(left.concept_match?.concept_id, right.concept_match?.concept_id);
    assert.ok(["requires_metadata_review", "requires_method_review"].includes(comparison.comparison_readiness));
    assert.match(comparison.automated_conclusion, /human review/i);
    assert.notEqual(comparison.candidate_strength, "not_a_match");
  }
});

test("machine-readable codebook outputs are byte-identical to public assets", async () => {
  const pairs = [
    ["../catalog/codebooks.json", "../public/data/codebooks.json"],
    ["../catalog/variable-crosswalk.json", "../public/data/variable-crosswalk.json"],
    ["../catalog/concept-taxonomy.json", "../public/data/concept-taxonomy.json"],
  ];
  for (const [catalogPath, publicPath] of pairs) {
    assert.equal(
      await readFile(new URL(catalogPath, import.meta.url), "utf8"),
      await readFile(new URL(publicPath, import.meta.url), "utf8"),
    );
  }
});

test("source and variable crosswalk references remain internally complete", () => {
  for (const source of codebooks.sources) assert.ok(sourcesById.has(source.source_id));
  for (const concept of crosswalk.concepts) {
    for (const variableId of concept.variable_ids) assert.ok(variablesById.has(variableId), variableId);
  }
});
