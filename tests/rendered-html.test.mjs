import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const clientRoot = new URL("../dist/client/", import.meta.url);

async function readBuilt(path) {
  return readFile(new URL(path, clientRoot), "utf8");
}

function head(html) {
  return html.match(/<head>([\s\S]*?)<\/head>/i)?.[1] ?? "";
}

function meta(html, attribute, value) {
  const tags = head(html).match(/<meta\b[^>]*>/gi) ?? [];
  const tag = tags.find((candidate) => new RegExp(`${attribute}=["']${value}["']`, "i").test(candidate));
  return tag?.match(/content=["']([^"']*)["']/i)?.[1];
}

test("exports every public route as static HTML", async () => {
  const required = ["index.html", "datasets.html", "status.html", "methods.html", "about.html", "guides.html", "guides/grants.html", "404.html"];
  await Promise.all(required.map((path) => readBuilt(path)));

  const detailFiles = (await readdir(new URL("datasets/", clientRoot))).filter((name) => name.endsWith(".html"));
  assert.equal(detailFiles.length, 37);
});

test("homepage presents the catalog baseline without claiming source health", async () => {
  const html = await readBuilt("index.html");
  assert.match(html, /<title>Delaware Data Commons<\/title>/i);
  assert.match(html, /Delaware community data catalog/);
  assert.match(html, /Find trustworthy Delaware data for grants, research, policy, and community questions/);
  assert.match(html, /<dd>37<\/dd>/);
  assert.match(html, /Verification underway/);
  assert.doesNotMatch(html, /all systems operational/i);
  assert.match(html, /href="#main-content"/);
  assert.match(meta(html, "property", "og:image") ?? "", /^https:\/\/.+\/og\.png$/);
  assert.match(meta(html, "name", "twitter:image") ?? "", /^https:\/\/.+\/og\.png$/);
});

test("catalog exports all records and accessible filter labels", async () => {
  const html = await readBuilt("datasets.html");
  assert.match(html, /Showing <!-- -->37<!-- --> of <!-- -->37/);
  assert.match(html, /<label for="catalog-search">Keywords<\/label>/);
  assert.match(html, /<label for="access-filter">Access mode<\/label>/);
  assert.match(html, /Request required/);
  assert.match(html, /Review pending/);
  assert.doesNotMatch(html, /quality score/i);
});

test("detail metadata is record-specific and clears the inherited social card", async () => {
  const cases = [
    ["datasets/src-behavioral-risk-factor-survey-center-for-applied-demogra-c6d5cb05bd.html", "Behavioral Risk Factor Survey"],
    ["datasets/src-de-211-960365651a.html", "DE 211"],
  ];

  for (const [path, title] of cases) {
    const html = await readBuilt(path);
    assert.match(head(html), new RegExp(`<title>${title} · Delaware Data Commons<\\/title>`));
    assert.equal(meta(html, "property", "og:title"), title);
    assert.equal(meta(html, "name", "twitter:title"), title);
    assert.equal(meta(html, "property", "og:image"), undefined);
    assert.equal(meta(html, "name", "twitter:image"), undefined);
    assert.ok(meta(html, "name", "description"));
  }
});

test("request-only records are an access mode, not an outage", async () => {
  const html = await readBuilt("datasets/src-de-211-960365651a.html");
  assert.match(html, /Request required/);
  assert.match(html, /access mode, not an outage/i);
  assert.match(html, /Not yet checked/);
  assert.doesNotMatch(html, /class="[^"]*(unavailable|outage)/i);
});

test("machine-readable catalog is published with the reviewed intake", async () => {
  const catalog = JSON.parse(await readBuilt("data/reviewed-intake.json"));
  assert.deepEqual(catalog.summary, {
    source_count: 37,
    public_source_count: 30,
    request_only_source_count: 7,
    topic_count: 126,
    distribution_count: 49,
  });
  assert.equal(catalog.sources.every((source) => source.review_status === "imported-unverified"), true);
});
