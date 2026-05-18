import { cp, mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const downloadsDir = path.join(process.env.HOME || "/Users/zhorton", "Downloads");

const sources = [
  {
    id: "marketing",
    label: "Marketing UI",
    from: process.env.MARKETING_UI_SOURCE || path.join(downloadsDir, "marketinguiv4")
  },
  {
    id: "app",
    label: "Application UI",
    from: process.env.APP_UI_SOURCE || path.join(downloadsDir, "appuiv4")
  }
];

const targetRoot = path.join(root, "private", "tailwind-plus", "source");
const dryRun = process.argv.includes("--dry-run");

async function exists(directory) {
  try {
    const details = await stat(directory);
    return details.isDirectory();
  } catch {
    return false;
  }
}

async function importPlus() {
  for (const source of sources) {
    if (!(await exists(source.from))) {
      throw new Error(`${source.label} source directory does not exist: ${source.from}`);
    }
  }

  if (dryRun) {
    for (const source of sources) {
      console.log(`${source.label}: ${source.from} -> ${path.join(targetRoot, source.id)}`);
    }
    return;
  }

  await mkdir(targetRoot, { recursive: true });

  for (const source of sources) {
    const target = path.join(targetRoot, source.id);
    await rm(target, { recursive: true, force: true });
    await cp(source.from, target, { recursive: true });
    console.log(`Imported ${source.label} into ${path.relative(root, target)}`);
  }
}

importPlus().catch((error) => {
  console.error(error);
  process.exit(1);
});
