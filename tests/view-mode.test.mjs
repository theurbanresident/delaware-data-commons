import assert from "node:assert/strict";
import test from "node:test";

import {
  preserveViewInParams,
  resolveViewMode,
  setViewModeInUrl,
} from "../app/lib/view-mode.js";

test("view resolution defaults to community and gives URL precedence", () => {
  assert.equal(resolveViewMode("", null), "community");
  assert.equal(resolveViewMode("", "technical"), "technical");
  assert.equal(resolveViewMode("?view=community", "technical"), "community");
  assert.equal(resolveViewMode("?view=technical", "community"), "technical");
  assert.equal(resolveViewMode("?mode=technical", null), "technical");
  assert.equal(resolveViewMode("?view=unknown", "technical"), "technical");
});

test("shareable mode URLs preserve filters and fragments", () => {
  assert.equal(
    setViewModeInUrl("https://example.test/datasets?q=health#results", "technical"),
    "/datasets?q=health&view=technical#results",
  );
  assert.equal(
    setViewModeInUrl("https://example.test/datasets?q=health&view=technical#results", "community"),
    "/datasets?q=health#results",
  );
});

test("catalog filter rewrites preserve the technical view only", () => {
  const technical = preserveViewInParams(new URLSearchParams({ q: "health" }), "?view=technical&topic=health");
  assert.equal(technical.toString(), "q=health&view=technical");

  const community = preserveViewInParams(new URLSearchParams({ q: "health" }), "?topic=health");
  assert.equal(community.toString(), "q=health");
});
