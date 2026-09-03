import { copyFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(root, "catalog", "prompt-guides.json");
const publicDirectory = path.join(root, "public", "data");
const publicPath = path.join(publicDirectory, "prompt-guides.json");

const catalog = JSON.parse(await readFile(sourcePath, "utf8"));
const ids = new Set();

if (catalog.schema_version !== "1.0.0" || !Array.isArray(catalog.shared_rules)) {
  throw new Error("Prompt guide catalog has an unsupported structure.");
}

for (const guide of catalog.guides ?? []) {
  if (!guide.id || ids.has(guide.id)) {
    throw new Error(`Prompt guide IDs must be present and unique: ${guide.id ?? "missing"}`);
  }
  ids.add(guide.id);
  if (!guide.human_review?.level || !guide.human_review?.checkpoints?.length) {
    throw new Error(`Prompt guide ${guide.id} needs a human-review level and checkpoints.`);
  }
  if (!guide.required_inputs?.length || !guide.instructions?.length || !guide.output_sections?.length) {
    throw new Error(`Prompt guide ${guide.id} is missing required prompt parts.`);
  }
}

await mkdir(publicDirectory, { recursive: true });
await copyFile(sourcePath, publicPath);
console.log(`Published ${ids.size} prompt guides to public/data/prompt-guides.json`);
