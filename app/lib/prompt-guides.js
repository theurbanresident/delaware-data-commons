/**
 * Compose the provider-neutral prompt copied from the prompt guide library.
 * The same text is used in Community and Technical views.
 * @param {Record<string, any>} guide
 * @param {string[]} sharedRules
 */
export function buildPromptText(guide, sharedRules) {
  const inputs = guide.required_inputs.map(
    (input) => `- ${input.label}: ${input.placeholder}`,
  );
  const rules = [...sharedRules, ...guide.instructions].map(
    (rule, index) => `${index + 1}. ${rule}`,
  );
  const outputs = guide.output_sections.map(
    (section, index) => `${index + 1}. ${section}`,
  );
  const checkpoints = guide.human_review.checkpoints.map(
    (checkpoint) => `- ${checkpoint}`,
  );

  return [
    `DELAWARE DATA COMMONS PROMPT GUIDE: ${guide.title}`,
    `Guide version: ${guide.version} (${guide.status})`,
    "",
    "GOAL",
    guide.task,
    "",
    "WHAT I WILL PROVIDE",
    ...inputs,
    "",
    "RULES FOR THIS TASK",
    ...rules,
    "",
    "RETURN THESE SECTIONS",
    ...outputs,
    "",
    `HUMAN REVIEW: ${guide.human_review.level.toUpperCase()}`,
    guide.human_review.why,
    ...checkpoints,
    "",
    "Begin by checking whether the needed evidence is present. Ask focused questions when a required detail is missing; do not fill the gap yourself.",
  ].join("\n");
}
