const EMPTY_VALUES = new Set(["", "unknown", "not stated", "not available", "n/a", "na", "null"]);

export function normalizeVariableText(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function tokens(value) {
  return new Set(normalizeVariableText(value).split(" ").filter(Boolean));
}

function diceSimilarity(left, right) {
  const a = tokens(left);
  const b = tokens(right);
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection += 1;
  return (2 * intersection) / (a.size + b.size);
}

function meaningfulValue(value) {
  const normalized = normalizeVariableText(value);
  return normalized && !EMPTY_VALUES.has(normalized) ? normalized : null;
}

function aliasMatch(text, alias) {
  const normalizedText = normalizeVariableText(text);
  const normalizedAlias = normalizeVariableText(alias);
  if (!normalizedText || !normalizedAlias) return null;
  if (normalizedText === normalizedAlias) return { confidence: "high", match: "exact_alias" };

  const aliasWords = normalizedAlias.split(" ");
  if (aliasWords.length === 1) return null;
  const padded = ` ${normalizedText} `;
  if (padded.includes(` ${normalizedAlias} `)) return { confidence: "medium", match: "contained_alias" };
  return null;
}

/**
 * Assign one curated concept to a variable label. This is a candidate semantic
 * classification only; it never establishes statistical comparability.
 */
export function assignConcept(variable, concepts) {
  const texts = [variable.source_variable_name, variable.label].filter(Boolean);
  const aliases = concepts
    .flatMap((concept) => concept.aliases.map((alias) => ({ concept, alias })))
    .sort((a, b) => normalizeVariableText(b.alias).length - normalizeVariableText(a.alias).length);

  for (const text of texts) {
    const matches = aliases
      .map(({ concept, alias }) => ({ concept, alias, matched: aliasMatch(text, alias) }))
      .filter((item) => item.matched);
    if (!matches.length) continue;

    const exact = matches.filter((item) => item.matched.match === "exact_alias");
    const pool = exact.length ? exact : matches;
    const longestLength = Math.max(...pool.map((item) => normalizeVariableText(item.alias).length));
    const longest = pool.filter((item) => normalizeVariableText(item.alias).length === longestLength);
    const conceptIds = new Set(longest.map((item) => item.concept.id));
    if (conceptIds.size !== 1) return null;

    const winner = longest[0];
    const winnerAlias = normalizeVariableText(winner.alias);
    const hasIndependentSecondMeaning = matches.some((item) =>
      item.concept.id !== winner.concept.id &&
      !winnerAlias.includes(normalizeVariableText(item.alias)),
    );
    if (hasIndependentSecondMeaning) return null;

    return {
      concept_id: winner.concept.id,
      concept_label: winner.concept.label,
      method: winner.matched.match,
      confidence: winner.matched.confidence,
      matched_alias: winner.alias,
    };
  }
  return null;
}

function compareField(name, leftValue, rightValue, importance = "required") {
  const left = meaningfulValue(leftValue);
  const right = meaningfulValue(rightValue);
  let status = "unknown";
  if (left && right) status = left === right ? "aligned" : "different";
  return {
    field: name,
    importance,
    status,
    left_value: leftValue ?? null,
    right_value: rightValue ?? null,
  };
}

function conceptId(variable) {
  return variable.concept_match?.concept_id ?? null;
}

/**
 * Compare two variable metadata records. The result assesses whether they are
 * worth human comparison; it does not certify that their numeric values can be
 * pooled, ranked, or placed on the same chart.
 */
export function compareVariables(left, right, conceptIndex = {}) {
  const leftConcept = conceptId(left);
  const rightConcept = conceptId(right);
  const sameConcept = Boolean(leftConcept && leftConcept === rightConcept);
  const exactLabel = normalizeVariableText(left.label) === normalizeVariableText(right.label);
  const labelSimilarity = diceSimilarity(left.label, right.label);

  const checks = [
    compareField("unit", left.unit, right.unit),
    compareField("universe", left.universe, right.universe),
    compareField("geography", left.geography, right.geography),
    compareField("time_granularity", left.time_granularity, right.time_granularity),
    compareField("data_type", left.data_type, right.data_type, "supporting"),
  ];
  const different = checks.filter((check) => check.status === "different");
  const unknown = checks.filter((check) => check.status === "unknown");
  const aligned = checks.filter((check) => check.status === "aligned");
  const requiredDifferent = different.filter((check) => check.importance === "required");
  const requiredUnknown = unknown.filter((check) => check.importance === "required");

  let score = 0;
  if (sameConcept) score += 0.58;
  else if (exactLabel) score += 0.42;
  score += Math.min(0.2, labelSimilarity * 0.2);
  score += Math.min(0.12, aligned.length * 0.03);
  score -= Math.min(0.28, different.length * 0.08);
  score -= Math.min(0.08, unknown.length * 0.016);
  if (left.evidence_kind === "published" && right.evidence_kind === "published") score += 0.05;
  score = Math.max(0, Math.min(1, score));

  const concept = sameConcept ? conceptIndex[leftConcept] : null;
  const warnings = [];
  if (!sameConcept) warnings.push("The variables do not share a curated concept assignment.");
  for (const check of different) {
    warnings.push(`${check.field.replaceAll("_", " ")} differs and must be reconciled before numeric comparison.`);
  }
  if (unknown.length) {
    warnings.push(`Metadata is missing for ${unknown.map((check) => check.field.replaceAll("_", " ")).join(", ")}.`);
  }
  if (left.evidence_kind !== "published" || right.evidence_kind !== "published") {
    warnings.push("At least one variable description is inferred rather than publisher-documented.");
  }
  for (const trap of concept?.common_traps ?? []) warnings.push(trap);

  let candidateStrength = "not_a_match";
  if (sameConcept && score >= 0.72) candidateStrength = "strong_candidate";
  else if ((sameConcept || exactLabel) && score >= 0.48) candidateStrength = "review_candidate";

  return {
    left_variable_id: left.id,
    right_variable_id: right.id,
    concept_id: sameConcept ? leftConcept : null,
    semantic_basis: sameConcept ? "shared_curated_concept" : exactLabel ? "exact_normalized_label" : "none",
    label_similarity: Number(labelSimilarity.toFixed(3)),
    candidate_score: Number(score.toFixed(3)),
    candidate_strength: candidateStrength,
    comparison_readiness: requiredDifferent.length || requiredUnknown.length ? "requires_metadata_review" : "requires_method_review",
    automated_conclusion: "Candidate match only; human review of source methods is required before comparing values.",
    checks,
    warnings: [...new Set(warnings)],
  };
}

export function buildVariableCrosswalk(codebookSources, taxonomy) {
  const conceptIndex = Object.fromEntries(taxonomy.concepts.map((concept) => [concept.id, concept]));
  const variables = codebookSources.flatMap((source) => source.variables);
  const grouped = new Map();

  for (const variable of variables) {
    if (!variable.concept_match) continue;
    const id = variable.concept_match.concept_id;
    if (!grouped.has(id)) grouped.set(id, []);
    grouped.get(id).push(variable);
  }

  const comparisons = [];
  const concepts = [];
  for (const concept of taxonomy.concepts) {
    const members = grouped.get(concept.id) ?? [];
    const sourceIds = new Set(members.map((member) => member.source_id));
    if (sourceIds.size < 2) continue;

    let pairCount = 0;
    for (let leftIndex = 0; leftIndex < members.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < members.length; rightIndex += 1) {
        const left = members[leftIndex];
        const right = members[rightIndex];
        if (left.source_id === right.source_id) continue;
        const comparison = compareVariables(left, right, conceptIndex);
        if (comparison.candidate_strength === "not_a_match") continue;
        comparisons.push(comparison);
        pairCount += 1;
      }
    }

    concepts.push({
      ...concept,
      source_count: sourceIds.size,
      variable_count: members.length,
      comparison_count: pairCount,
      variable_ids: members.map((member) => member.id).sort(),
    });
  }

  comparisons.sort((a, b) =>
    String(a.concept_id).localeCompare(String(b.concept_id)) ||
    b.candidate_score - a.candidate_score ||
    a.left_variable_id.localeCompare(b.left_variable_id) ||
    a.right_variable_id.localeCompare(b.right_variable_id),
  );

  return { concepts, comparisons };
}
