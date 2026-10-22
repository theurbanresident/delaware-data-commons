import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const clientRoot = path.resolve(fileURLToPath(new URL("../dist/client/", import.meta.url)));
const configuredPrefix = process.env.NEXT_PUBLIC_BASE_PATH ?? process.env.PAGES_ASSET_PREFIX ?? "";
const basePath = configuredPrefix === "/" ? "" : configuredPrefix.replace(/\/$/, "");
const siteOrigin = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://static-export.invalid").origin;

async function htmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const results = await Promise.all(entries.map(async (entry) => {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) return htmlFiles(filename);
    return entry.isFile() && entry.name.endsWith(".html") ? [filename] : [];
  }));
  return results.flat();
}

function attributes(tag) {
  const values = {};
  for (const match of tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gs)) {
    values[match[1].toLowerCase()] = match[3].replaceAll("&amp;", "&");
  }
  return values;
}

function pageAssets(html) {
  const assets = [];
  for (const match of html.matchAll(/<(script|link)\b[^>]*>/gi)) {
    const attrs = attributes(match[0]);
    if (match[1].toLowerCase() === "script" && attrs.src) {
      assets.push({ url: attrs.src, kind: "script" });
    } else if (match[1].toLowerCase() === "link" && attrs.href) {
      const rel = (attrs.rel ?? "").toLowerCase().split(/\s+/);
      if (rel.includes("stylesheet")) assets.push({ url: attrs.href, kind: "stylesheet" });
      if (rel.includes("modulepreload")) assets.push({ url: attrs.href, kind: "script" });
    }
  }
  return assets;
}

test("every exported HTML stylesheet and script resolves to a nonempty deployed file", async () => {
  const pages = await htmlFiles(clientRoot);
  assert.ok(pages.length > 0, `No exported HTML found in ${clientRoot}`);
  const verified = new Map();
  let localReferences = 0;
  let stylesheetReferences = 0;

  for (const filename of pages) {
    const relativePage = path.relative(clientRoot, filename).split(path.sep).join("/");
    const documentUrl = new URL(`${basePath}/${relativePage}`, siteOrigin);
    const html = await readFile(filename, "utf8");
    for (const asset of pageAssets(html)) {
      const resolved = new URL(asset.url, documentUrl);
      if (resolved.origin !== siteOrigin) continue;
      assert.ok(resolved.pathname.startsWith(`${basePath}/`), `${relativePage}: ${asset.url} is outside deployment base ${basePath || "/"}`);
      // Pages itself mounts the artifact at basePath. Strip it exactly once;
      // an extra project directory in the artifact must fail this lookup.
      const deployedPath = decodeURIComponent(resolved.pathname.slice(basePath.length + 1));
      const expected = path.resolve(clientRoot, deployedPath);
      assert.ok(expected.startsWith(`${clientRoot}${path.sep}`), `${relativePage}: asset escapes export root: ${asset.url}`);
      const diagnostic = `${relativePage}: ${asset.url} must exist at ${expected}`;
      localReferences += 1;
      if (asset.kind === "stylesheet") stylesheetReferences += 1;
      if (verified.has(expected)) {
        assert.equal(verified.get(expected), asset.kind, diagnostic);
        continue;
      }

      let content;
      try {
        const info = await stat(expected);
        assert.ok(info.isFile() && info.size > 0, `${diagnostic} (missing or empty file)`);
        content = await readFile(expected, "utf8");
      } catch (error) {
        assert.fail(`${diagnostic}: ${error.message}`);
      }
      assert.doesNotMatch(content.trimStart(), /^(?:<!doctype\s+html|<html\b)/i, `${diagnostic} (HTML served as an asset)`);
      if (asset.kind === "stylesheet") {
        assert.equal(path.extname(expected), ".css", `${diagnostic} (stylesheet must be CSS)`);
        assert.match(content, /\{[^}]*\}/s, `${diagnostic} (no CSS rules found)`);
      } else {
        assert.ok([".js", ".mjs"].includes(path.extname(expected)), `${diagnostic} (script must be JavaScript)`);
        assert.match(content, /\b(?:import|export|function|const|var|let)\b|=>/, `${diagnostic} (no JavaScript program found)`);
      }
      verified.set(expected, asset.kind);
    }
  }
  assert.ok(localReferences > 0, "No local script assets were checked");
  assert.ok(stylesheetReferences > 0, "No local stylesheet assets were checked");
});
