import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  assignConcept,
  compareVariables,
  normalizeVariableText,
} from "../app/lib/variable-comparison.js";

const taxonomy = JSON.parse(await readFile(new URL("../catalog/concept-taxonomy.json", import.meta.url), "utf8"));

function variable(id, sourceId, label, extras = {}) {
  const value = {
    id,
    source_id: sourceId,
    label,
    source_variable_name: null,
    evidence_kind: "published",
    unit: null,
    universe: null,
    geography: null,
    time_granularity: null,
    data_type: null,
    ...extras,
  };
  value.concept_match = assignConcept(value, taxonomy.concepts);
  return value;
}

test("normalization is deterministic and retains semantic words", () => {
  assert.equal(normalizeVariableText("Race & Ethnicity (%)"), "race and ethnicity");
});

test("sex and gender identity are never silently paired", () => {
  const sex = variable("sex-a", "source-a", "Sex");
  const gender = variable("gender-b", "source-b", "Gender identity");
  assert.equal(sex.concept_match.concept_id, "sex");
  assert.equal(gender.concept_match.concept_id, "gender_identity");
  assert.equal(compareVariables(sex, gender).candidate_strength, "not_a_match");
});

test("age does not match age-adjusted mortality", () => {
  const age = variable("age-a", "source-a", "Age");
  const mortality = variable("mortality-b", "source-b", "Age-adjusted mortality rate");
  assert.equal(age.concept_match.concept_id, "age");
  assert.notEqual(mortality.concept_match?.concept_id, "age");
});

test("a grouped label with two independent outcomes remains unassigned", () => {
  const cancer = variable("cancer", "source-a", "Cancer incidence and cancer mortality rates");
  const birthOutcomes = variable("birth", "source-b", "Low birth weight and preterm birth");
  assert.equal(cancer.concept_match, null);
  assert.equal(birthOutcomes.concept_match, null);
});

test("a more specific nested concept wins over its general parent phrase", () => {
  const childFood = variable("food", "source-a", "Child food insecurity rate");
  assert.equal(childFood.concept_match.concept_id, "child_food_insecurity");
});

test("a shared concept produces a candidate with explicit method review", () => {
  const left = variable("left", "source-a", "Infant mortality rate", {
    unit: "deaths per 1,000 live births",
    universe: "resident live births",
    geography: "county",
    time_granularity: "five-year pooled period",
  });
  const right = variable("right", "source-b", "Infant mortality", {
    unit: "deaths per 1,000 live births",
    universe: "resident live births",
    geography: "county",
    time_granularity: "five-year pooled period",
  });
  const result = compareVariables(left, right, Object.fromEntries(taxonomy.concepts.map((concept) => [concept.id, concept])));
  assert.equal(result.concept_id, "infant_mortality");
  assert.equal(result.candidate_strength, "strong_candidate");
  assert.equal(result.comparison_readiness, "requires_method_review");
  assert.match(result.automated_conclusion, /human review/i);
});

test("different units are surfaced, not normalized away", () => {
  const left = variable("left", "source-a", "Teen birth rate", { unit: "births per 1,000 females ages 15–19" });
  const right = variable("right", "source-b", "Teen births", { unit: "count" });
  const result = compareVariables(left, right);
  assert.equal(result.checks.find((check) => check.field === "unit").status, "different");
  assert.equal(result.comparison_readiness, "requires_metadata_review");
  assert.match(result.warnings.join(" "), /unit differs/i);
});
