/** @typedef {"community" | "technical"} ViewMode */

/**
 * @param {string | null} value
 * @returns {value is ViewMode}
 */
export function isViewMode(value) {
  return value === "community" || value === "technical";
}

/**
 * Resolve a shareable URL choice before a device preference.
 * @param {string} search
 * @param {string | null} stored
 * @returns {ViewMode}
 */
export function resolveViewMode(search, stored) {
  const params = new URLSearchParams(search);
  const requested = params.get("view") ?? params.get("mode");
  if (isViewMode(requested)) return requested;
  return isViewMode(stored) ? stored : "community";
}

/**
 * @param {string} href
 * @param {ViewMode} mode
 */
export function setViewModeInUrl(href, mode) {
  const url = new URL(href);
  url.searchParams.delete("mode");
  if (mode === "technical") url.searchParams.set("view", "technical");
  else url.searchParams.delete("view");
  return `${url.pathname}${url.search}${url.hash}`;
}

/**
 * Keep the technical view in catalog URLs when filters are rewritten.
 * @param {URLSearchParams} nextParams
 * @param {string} currentSearch
 */
export function preserveViewInParams(nextParams, currentSearch) {
  if (resolveViewMode(currentSearch, null) === "technical") {
    nextParams.set("view", "technical");
  }
  return nextParams;
}
