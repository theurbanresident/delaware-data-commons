import { access, mkdir, readFile, readdir, rename, rmdir, unlink } from "node:fs/promises";
import path from "node:path";

// Vinext's assetPrefix controls both browser URLs and the emitted directory.
// Pages already mounts this entire export at /repository/, so only the URLs
// keep that prefix. The artifact itself must contain _next/ at its root.
const outputRoot = path.resolve("dist/client");
const prefix = (process.env.PAGES_ASSET_PREFIX ?? "").replace(/^\/+|\/+$/g, "");

async function exists(file) {
  try { await access(file); return true; } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function moveTree(source, destination) {
  await mkdir(destination, { recursive: true });
  for (const entry of await readdir(source, { withFileTypes: true })) {
    const from = path.join(source, entry.name);
    const to = path.join(destination, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Unexpected symbolic link in static assets: ${from}`);
    if (entry.isDirectory()) {
      await moveTree(from, to);
    } else if (await exists(to)) {
      const [left, right] = await Promise.all([readFile(from), readFile(to)]);
      if (!left.equals(right)) throw new Error(`Conflicting static asset: ${to}`);
      // An interrupted build may already have moved this identical file.
      await unlink(from);
    } else {
      await rename(from, to);
    }
  }
  await rmdir(source);
}

if (prefix) {
  if (prefix.split("/").some((part) => !part || part === "." || part === ".." || !/^[A-Za-z0-9._-]+$/.test(part))) {
    throw new Error("Pages asset prefix must be a local path without traversal or URL components");
  }
  const emittedAssets = path.join(outputRoot, prefix, "_next");
  const publishedAssets = path.join(outputRoot, "_next");
  if (await exists(emittedAssets)) {
    await moveTree(emittedAssets, publishedAssets);
    let emptyParent = path.dirname(emittedAssets);
    while (emptyParent !== outputRoot) {
      try { await rmdir(emptyParent); } catch (error) {
        if (error.code === "ENOTEMPTY") break;
        throw error;
      }
      emptyParent = path.dirname(emptyParent);
    }
    console.log(`Prepared Pages assets at artifact root; browser URL prefix remains /${prefix}/.`);
  }
  if (!(await exists(publishedAssets))) {
    throw new Error("Static export is missing its published _next assets");
  }
}
