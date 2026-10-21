import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { filterOpenDataAssets, openDataDate } from "../app/lib/open-data.js";

const empty = { q: "", type: "", publisher: "", category: "", tag: "" };
const assets = [
  { id: "abcd-1234", name: "Vaccinations", description: "Public estimates", asset_type: "dataset", publisher: "DHSS", category: "Health", tags: ["vaccination"], columns: [{ field_name: "age_adjusted", name: "Adjusted", description: "Age adjustment indicator" }] },
  { id: "wxyz-5678", name: "Air map", description: null, asset_type: "map", publisher: "DNREC", category: "Environment", tags: ["air"], columns: [] },
];

test("portal search combines terms across metadata and column definitions", () => {
  assert.equal(filterOpenDataAssets(assets, { ...empty, q: " DHSS age_adjusted " })[0].id, "abcd-1234");
  assert.equal(filterOpenDataAssets(assets, { ...empty, q: "wxyz-5678" })[0].name, "Air map");
  assert.equal(filterOpenDataAssets(assets, { ...empty, q: "age_adjusted absent" }).length, 0);
});

test("portal filters combine exact publisher, category, type and tag values", () => {
  assert.equal(filterOpenDataAssets(assets, { ...empty, type: "dataset", publisher: "DHSS", category: "Health", tag: "vaccination" }).length, 1);
  assert.equal(filterOpenDataAssets(assets, { ...empty, publisher: "DHSS", tag: "air" }).length, 0);
  assert.deepEqual(filterOpenDataAssets(assets, empty).map((asset) => asset.name), ["Air map", "Vaccinations"]);
});

test("snapshot dates use UTC and missing publisher dates stay unknown", () => {
  assert.equal(openDataDate("2026-10-21T00:30:00Z"), "October 21, 2026");
  assert.equal(openDataDate(null), "Not stated");
  assert.equal(openDataDate("invalid"), "Not stated");
});

test("static portal page exposes accessible filters, provenance and full metadata download", async () => {
  const html = await readFile(new URL("../dist/client/open-data.html", import.meta.url), "utf8");
  assert.match(html, /<main id="main-content">/);
  assert.match(html, /<label for="open-data-search">Keywords or dataset ID<\/label>/);
  for (const name of ["type", "publisher", "category", "tag"]) {
    assert.match(html, new RegExp(`<label for="open-data-${name}">`));
    assert.match(html, new RegExp(`<select id="open-data-${name}"`));
  }
  assert.match(html, /role="status" aria-live="polite"/);
  assert.match(html, /Dataset payloads are not archived here/);
  assert.match(html, /original My Healthy Community data dictionary has not been acquired/);
  assert.match(html, /href="[^"]*\/data\/delaware-open-data\.json"[^>]*download/);
  assert.match(html, /Metadata checked <time dateTime="|Metadata checked <time datetime="/);
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length, "portal page contains repeated IDs");
});
