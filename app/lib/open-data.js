/**
 * Search publisher metadata without treating an omitted field as a match.
 * @param {import('../open-data/types').OpenDataAsset[]} assets
 * @param {{q: string, type: string, publisher: string, category: string, tag: string}} filters
 */
export function filterOpenDataAssets(assets, filters) {
  const terms = filters.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return assets.filter((asset) => {
    if (filters.type && asset.asset_type !== filters.type) return false;
    if (filters.publisher && asset.publisher !== filters.publisher) return false;
    if (filters.category && asset.category !== filters.category) return false;
    if (filters.tag && !asset.tags.includes(filters.tag)) return false;
    const text = [asset.id, asset.name, asset.description, asset.publisher, asset.category, ...asset.tags,
      ...asset.columns.flatMap((column) => [column.field_name, column.name, column.description])]
      .filter(Boolean).join(" ").toLowerCase();
    return terms.every((term) => text.includes(term));
  }).sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
}

/** @param {string | null | undefined} value */
export function openDataDate(value) {
  if (!value || Number.isNaN(Date.parse(value))) return "Not stated";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
  }).format(new Date(value));
}
