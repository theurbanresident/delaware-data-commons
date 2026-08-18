import rawCatalog from "@/catalog/reviewed-intake.json";

export type CatalogDate = {
  raw_value: string | number;
  display_value: string;
  normalized: string | null;
  precision: string;
  cell: string;
};

export type CatalogTopic = {
  id: string;
  category: string | null;
  measures: string[];
  measures_raw: string;
  publication_date: CatalogDate | null;
  data_source_date: CatalogDate | null;
  provenance: {
    sheet: string;
    row: number;
    cells: Record<string, string>;
  };
};

export type CatalogDistribution = {
  id: string;
  url: string;
  role: "current" | "archive" | "request_info";
  format: string;
  topic_id: string | null;
  display_text: string;
  hyperlink_target: string | null;
  provenance: { sheet: string; row: number; cell: string };
};

export type CatalogContact = {
  raw: string;
  emails: string[];
  phones: string[];
  urls: string[];
  hyperlink_target: string | null;
  provenance: { sheet: string; row: number; cell: string };
};

export type CatalogSource = {
  id: string;
  name: string;
  background: string | null;
  access_type: "public" | "request_only";
  review_status: "imported-unverified";
  notes: string[];
  topics: CatalogTopic[];
  publication_dates: CatalogDate[];
  data_source_dates: CatalogDate[];
  distributions: CatalogDistribution[];
  contacts: CatalogContact[];
  license: string | null;
  monitoring: { availability_status: string; last_checked_at: string | null };
  provenance: {
    source_workbook: string;
    sheet: string;
    row_start: number;
    row_end: number;
    fields: Record<string, string[]>;
  };
};

type Catalog = {
  schema_version: string;
  importer_version: string;
  catalog_type: string;
  review_status: string;
  source_workbook: {
    filename: string;
    sha256: string;
    worksheets: Record<string, string>;
    context: string;
    request_only_note: string;
  };
  summary: {
    source_count: number;
    public_source_count: number;
    request_only_source_count: number;
    topic_count: number;
    distribution_count: number;
  };
  sources: CatalogSource[];
};

export const catalog = rawCatalog as Catalog;
export const sources = catalog.sources;

const smallWords = new Set(["a", "an", "and", "at", "for", "in", "of", "on", "or", "the", "to", "with"]);
const acronyms = new Set(["BRFSS", "CDC", "DE", "DHSS", "DPH", "HRSA", "STIPDA", "US", "USA", "YRBS"]);

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split(/(\s+|[-/])/)
    .map((part, index) => {
      const upper = part.toUpperCase();
      if (acronyms.has(upper)) return upper;
      if (!/[a-z]/i.test(part)) return part;
      if (index > 0 && smallWords.has(part)) return part;
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join("")
    .replace(/\(([a-z])/g, (_, letter: string) => `(${letter.toUpperCase()}`);
}

export function displayTitle(value: string) {
  const letters = value.replace(/[^A-Za-z]/g, "");
  const uppercaseShare = letters.length
    ? letters.replace(/[^A-Z]/g, "").length / letters.length
    : 0;
  return uppercaseShare > 0.88 ? titleCase(value) : value;
}

export function splitSourceName(source: CatalogSource) {
  const display = displayTitle(source.name.trim());
  const match = display.match(/^(.*)\s+\(([^()]*)\)$/);
  return {
    title: match?.[1]?.trim() || display,
    publisher: match?.[2]?.trim() || "Publisher not yet separated from the intake record",
  };
}

export const topicAreas = [
  { id: "health", label: "Health", pattern: /health|cancer|birth|maternal|mortality|pregnan|infant|injury|nutrition|smoking|behavioral|care|wellness|insurance/i },
  { id: "demographics", label: "Population and demographics", pattern: /demograph|population|household|famil/i },
  { id: "economy", label: "Economy, income, and workforce", pattern: /economic|employment|workforce|income|poverty|wage|labor/i },
  { id: "housing", label: "Housing", pattern: /housing|rental/i },
  { id: "food", label: "Food access", pattern: /food/i },
  { id: "education", label: "Education", pattern: /education|school|student/i },
  { id: "public-safety", label: "Public safety", pattern: /crime|arrest|offender|law enforcement|safety|violence|victim|clearance/i },
  { id: "environment", label: "Environment", pattern: /environment|climate|air|water/i },
  { id: "transportation", label: "Transportation", pattern: /transport/i },
  { id: "government", label: "Government and civic life", pattern: /government|finance|leadership|civic|funding/i },
] as const;

export function getTopicLabels(source: CatalogSource) {
  return [...new Set(source.topics.map((topic) => topic.category).filter((value): value is string => Boolean(value)))];
}

export function getTopicAreas(source: CatalogSource) {
  const text = getTopicLabels(source).join(" ");
  return topicAreas.filter((area) => area.pattern.test(text));
}

export function getMeasureCount(source: CatalogSource) {
  return source.topics.reduce((total, topic) => total + topic.measures.length, 0);
}

export function getLatestDate(dates: CatalogDate[]) {
  if (!dates.length) return null;
  return [...dates].sort((a, b) => String(a.normalized ?? "").localeCompare(String(b.normalized ?? ""))).at(-1) ?? null;
}

export function getPrimaryDistribution(source: CatalogSource) {
  return source.distributions.find((distribution) => distribution.role === "current") ?? source.distributions[0] ?? null;
}

export function getResourceType(source: CatalogSource) {
  const value = source.name.toLowerCase();
  if (source.access_type === "request_only") return "Request-only source";
  if (/portal|data reports|reports \(\d+\)|databases/.test(value)) return "Collection or portal";
  if (/projection|forecast/.test(value)) return "Projection";
  if (/survey|brfss|yrbs/.test(value)) return "Survey";
  if (/report|rankings|profile|statistics/.test(value)) return "Report series";
  return "Public data source";
}

export function getFormatLabels(source: CatalogSource) {
  if (source.access_type === "request_only") return ["By request"];
  const values = source.distributions.map((distribution) => {
    const url = distribution.url.toLowerCase();
    if (/\.pdf(?:$|\?)/.test(url) || /pdf/i.test(distribution.display_text)) return "PDF";
    if (/\/api\/|api\./.test(url)) return "API or direct file";
    if (/\.csv(?:$|\?)/.test(url)) return "CSV";
    if (/\.xlsx?(?:$|\?)/.test(url)) return "Excel";
    return "Web page";
  });
  return [...new Set(values.length ? values : ["Web page"])];
}

export function getAccessLabel(source: CatalogSource) {
  return source.access_type === "request_only" ? "Request required" : "Public access listed";
}

export function getGeographyHint(source: CatalogSource) {
  const text = `${source.background ?? ""} ${source.notes.join(" ")}`;
  if (/neighbou?rhood/i.test(text)) return "Neighborhood or local areas noted";
  if (/census tract/i.test(text)) return "Census tracts noted";
  if (/zip code|zipcode/i.test(text)) return "ZIP Codes noted";
  if (/county|counties|new castle|kent|sussex/i.test(text)) return "County coverage noted";
  if (/municipal|municipality|city|wilmington/i.test(text)) return "Municipal coverage noted";
  if (/nationwide|national/i.test(text)) return "National source with Delaware data";
  if (/statewide|state level|state of delaware/i.test(text)) return "Statewide coverage noted";
  return "Geography needs curator review";
}

export function getSuitability(source: CatalogSource) {
  const type = getResourceType(source);
  if (type === "Survey") return "Population estimates, behaviors, and subgroup comparisons when the sample supports them.";
  if (type === "Projection") return "Planning scenarios and future population estimates—not observed outcomes.";
  if (type === "Collection or portal") return "Discovering multiple related resources; review each child dataset separately.";
  if (type === "Request-only source") return "Locating evidence that requires direct contact with the named organization.";
  if (type === "Report series") return "Published context, trends, and indicators with a citable release.";
  return "Finding published measures and the organization responsible for them.";
}

export function getCaution(source: CatalogSource) {
  const type = getResourceType(source);
  if (type === "Survey") return "Survey estimates can have sampling uncertainty and may not support small-area claims.";
  if (type === "Projection") return "A projection is a modeled scenario, not a measured future result.";
  if (type === "Collection or portal") return "Coverage and methods can differ across resources in this collection.";
  if (type === "Request-only source") return "Availability, fields, timing, and reuse conditions must be confirmed with the source.";
  return "Confirm definitions, geography, and limitations in the publisher’s methodology before use.";
}

export function getSourceSearchText(source: CatalogSource) {
  return [
    source.name,
    source.background ?? "",
    source.notes.join(" "),
    ...source.topics.flatMap((topic) => [topic.category ?? "", ...topic.measures]),
  ].join(" ").toLowerCase();
}

export function truncate(value: string, length = 210) {
  if (value.length <= length) return value;
  const shortened = value.slice(0, length - 1).replace(/\s+\S*$/, "");
  return `${shortened}…`;
}
