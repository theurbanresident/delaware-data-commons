import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, readdir, stat, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, webkit, devices } from "playwright";

const root = fileURLToPath(new URL("../dist/client/", import.meta.url));
const output = fileURLToPath(new URL("../outputs/browser/", import.meta.url));
const prefix = (process.env.NEXT_PUBLIC_BASE_PATH ?? process.env.PAGES_ASSET_PREFIX ?? "").replace(/\/$/, "");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png" };

async function pages(directory = root) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => {
    const filename = path.join(directory, entry.name);
    return entry.isDirectory() ? pages(filename) : entry.name.endsWith(".html") ? [filename] : [];
  }))).flat().sort();
}

// Mount the exact artifact once, at the repository path, just as Pages does.
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    if (!pathname.startsWith(`${prefix}/`)) { response.writeHead(404).end(); return; }
    const filename = path.resolve(root, pathname.slice(prefix.length + 1) || "index.html");
    if (!filename.startsWith(root)) { response.writeHead(404).end(); return; }
    const candidates = [filename, `${filename}.html`, path.join(filename, "index.html")];
    for (const candidate of candidates) {
      const info = await stat(candidate).catch(() => null);
      if (!info?.isFile()) continue;
      response.writeHead(200, { "Content-Type": `${types[path.extname(candidate)] ?? "application/octet-stream"}; charset=utf-8` });
      response.end(await readFile(candidate));
      return;
    }
    response.writeHead(404).end();
  } catch {
    response.writeHead(500).end();
  }
});

const exportedPages = await pages();
assert.ok(exportedPages.length > 0, "Build the static site before browser checks");
await mkdir(output, { recursive: true });
await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
const origin = `http://127.0.0.1:${server.address().port}`;
const base = `${origin}${prefix}`;
const primaryRoutes = ["/", "/datasets", "/open-data", "/codebooks", "/compare", "/status", "/guides", "/guides/prompts", "/contribute", "/methods", "/about"];

try {
  for (const [name, engine, options] of [
    ["phone", webkit, devices["iPhone 13"]],
    ["tablet", webkit, devices["iPad (gen 7)"]],
    ["desktop", chromium, { viewport: { width: 1280, height: 900 } }],
  ]) {
    const browser = await engine.launch({ headless: true });
    const context = await browser.newContext(options);
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(`${page.url()}: ${error.stack ?? error.message}`));
    page.on("console", (message) => { if (message.type() === "error") errors.push(`${page.url()}: ${message.text()}`); });
    page.on("requestfailed", (request) => errors.push(`${request.url()}: ${request.failure()?.errorText}`));
    page.on("response", (response) => {
      if (response.url().startsWith(origin) && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
    });

    async function healthy() {
      await page.waitForFunction(() => window.__NEXT_HYDRATED === true || document.documentElement.id === "__next_error__", null, { timeout: 15000 });
      assert.equal(await page.locator("html").getAttribute("id"), null, `Error boundary at ${page.url()}`);
      await page.locator('.primary-navigation[data-enhanced="true"]').waitFor();
      assert.deepEqual(errors, [], `Browser errors on ${name}`);
      const state = await page.evaluate(() => ({
        styled: getComputedStyle(document.body).margin === "0px" && document.styleSheets.length > 0,
        width: innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      assert.ok(state.styled, `Styles missing at ${page.url()}`);
      assert.ok(state.scrollWidth <= state.width + 1, `Horizontal page overflow at ${page.url()}: ${JSON.stringify(state)}`);
    }

    async function visit(route) {
      const response = await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
      assert.equal(response.status(), 200, route);
      await healthy();
    }

    async function openFilters() {
      const toggle = page.getByRole("button", { name: /Search and filters/ });
      if (await toggle.isVisible()) await toggle.click();
    }

    try {
      // Check every source/codebook deep link on phone, plus all primary pages
      // in each viewport. Exclude no routes merely because they share a layout.
      const routes = name === "phone"
        ? exportedPages.map((filename) => {
          const relative = path.relative(root, filename).split(path.sep).join("/");
          return relative === "index.html" ? "/" : `/${relative.replace(/\.html$/, "")}`;
        })
        : primaryRoutes;
      for (const route of routes) await visit(route);

      await visit("/");
      await page.screenshot({ path: path.join(output, `${name}-home.png`) });
      await page.getByRole("radio", { name: "Technical", exact: true }).check();
      assert.equal(new URL(page.url()).searchParams.get("view"), "technical");
      await page.reload({ waitUntil: "networkidle" });
      await healthy();
      assert.equal(await page.locator("html").getAttribute("data-view-mode"), "technical");
      await page.getByRole("radio", { name: "Community", exact: true }).check();
      const menu = page.getByRole("button", { name: "Menu" });
      if (await menu.isVisible()) await menu.click();
      await page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "Catalog", exact: true }).click();
      await page.waitForLoadState("networkidle");
      await healthy();
      await openFilters();
      await page.locator("#catalog-search").fill("food");
      await page.getByRole("button", { name: "Apply filters", exact: true }).click();
      assert.equal(new URL(page.url()).searchParams.get("q"), "food");
      assert.match(await page.locator(".results-heading").innerText(), /Showing [1-9]\d* of 37/);
      await page.goBack({ waitUntil: "networkidle" });
      await healthy();
      assert.match(await page.locator(".results-heading").innerText(), /Showing 37 of 37/);

      await visit("/open-data");
      await page.getByRole("button", { name: "Show 24 more assets" }).click();
      assert.equal(await page.locator("#open-data-results article").count(), 48);
      await openFilters();
      await page.locator("#open-data-search").fill("t97k-sk8c");
      await page.getByRole("button", { name: "Apply filters", exact: true }).click();
      assert.equal(await page.locator("#open-data-results article").count(), 1);
      await healthy();
      await visit("/compare");
      const select = page.locator("#concept-select");
      await select.selectOption(await select.locator("option").nth(1).getAttribute("value"));
      await healthy();
      await page.screenshot({ path: path.join(output, `${name}.png`) });
      console.log(`${name}: ${routes.length} pages and navigation/search/view/comparison checks passed`);
    } catch (error) {
      await page.screenshot({ path: path.join(output, `${name}-failure.png`), fullPage: true }).catch(() => {});
      console.error(`${name} failed at ${page.url()}\n${errors.join("\n")}`);
      throw error;
    } finally {
      await browser.close();
    }
  }
} finally {
  await new Promise((resolve) => server.close(resolve));
}
