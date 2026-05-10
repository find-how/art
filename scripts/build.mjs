import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { brandConfig } from "../src/brand-config.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(root, "dist");
const publicDir = path.join(root, "public");
const assetsDir = path.join(distDir, "assets");

const rootAssetFiles = [
  "README.md",
  "pioneer-logo.svg",
  "pioneer-logo-black.svg",
  "pioneer-logo-white.svg",
  "pioneer-text.svg",
  "pioneer-text-logo-black.svg",
  "pioneer-text-white.svg"
];

const assetDirectories = ["icons-color", "icons-black", "icons-white", "loaders", "social", "patterns", "diagrams", "motion", "buttons", "brand-kit"];

const mimeByExtension = new Map([
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".ico", "image/x-icon"],
  [".icns", "image/icns"],
  [".xml", "application/xml"],
  [".md", "text/markdown"],
  [".json", "application/json"],
  [".html", "text/html"],
  [".css", "text/css"],
  [".ts", "text/typescript"],
  [".pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"]
]);

function slug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function titleize(value) {
  return value
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function variantFor(relativePath) {
  if (relativePath.startsWith("social/")) {
    return "Social";
  }

  if (relativePath.startsWith("patterns/")) {
    return "Product";
  }

  if (relativePath.startsWith("diagrams/")) {
    return "Diagram";
  }

  if (relativePath.startsWith("motion/")) {
    return "Animated";
  }

  if (relativePath.startsWith("buttons/")) {
    return "Button";
  }

  if (relativePath.startsWith("brand-kit/")) {
    return "Brand Kit";
  }

  if (relativePath.startsWith("loaders/")) {
    return "Animated";
  }

  if (relativePath.includes("icons-color") || relativePath.endsWith("pioneer-logo.svg") || relativePath.endsWith("pioneer-text.svg")) {
    return "Color";
  }

  if (relativePath.includes("icons-black") || relativePath.includes("-black")) {
    return "Black";
  }

  if (relativePath.includes("icons-white") || relativePath.includes("-white")) {
    return "White";
  }

  return "Resource";
}

function platformFor(relativePath, extension) {
  if (relativePath.startsWith("social/")) return "Social";
  if (relativePath.startsWith("patterns/")) return "Product pattern";
  if (relativePath.startsWith("diagrams/")) return "Documentation";
  if (relativePath.startsWith("motion/")) return "Motion";
  if (relativePath.startsWith("buttons/")) return "Interface";
  if (relativePath.startsWith("brand-kit/colors/")) return "Design tokens";
  if (relativePath.startsWith("brand-kit/logo/")) return "Brand";
  if (relativePath.startsWith("brand-kit/ui/")) return "Interface";
  if (relativePath.startsWith("brand-kit/assets/landing/")) return "Landing page";
  if (relativePath.startsWith("brand-kit/assets/pitch-deck/")) return "Pitch deck";
  if (relativePath.startsWith("brand-kit/assets/launchpad/")) return "Launchpad";
  if (relativePath.startsWith("brand-kit/assets/docs/")) return "Documentation";
  if (relativePath.startsWith("brand-kit/assets/")) return "Social";
  if (relativePath.startsWith("brand-kit/")) return "Documentation";
  if (relativePath.startsWith("loaders/")) return "Interface";
  if (relativePath.includes("/ios/")) return "iOS";
  if (relativePath.includes("/android/")) return "Android";
  if (relativePath.includes("Square") || relativePath.includes("StoreLogo")) return "Windows Store";
  if (extension === ".ico") return "Windows and web";
  if (extension === ".icns") return "macOS";
  if (extension === ".svg") return "Brand";
  if (extension === ".md" || extension === ".json") return "Documentation";
  return "Web and desktop";
}

function typeFor(relativePath, extension) {
  const basename = path.basename(relativePath);

  if (relativePath.startsWith("social/png/") && extension === ".png") return "Social card image";
  if (relativePath.startsWith("social/") && extension === ".svg") return "Social card template";
  if (relativePath.startsWith("social/") && extension === ".md") return "Social guide";
  if (relativePath.startsWith("patterns/") && extension === ".svg") return "Product pattern";
  if (relativePath.startsWith("patterns/") && extension === ".md") return "Pattern guide";
  if (relativePath.startsWith("diagrams/") && extension === ".svg") return "Documentation diagram";
  if (relativePath.startsWith("diagrams/") && extension === ".md") return "Diagram guide";
  if (relativePath.startsWith("motion/") && extension === ".svg") return "Motion animation";
  if (relativePath.startsWith("motion/") && extension === ".md") return "Motion guide";
  if (relativePath.startsWith("buttons/") && extension === ".svg") return "Deploy button artwork";
  if (relativePath.startsWith("buttons/") && extension === ".css") return "Deploy button CSS";
  if (relativePath.startsWith("buttons/") && extension === ".html") return "Deploy button snippet";
  if (relativePath.startsWith("buttons/") && extension === ".md") return "Deploy button guide";
  if (relativePath.startsWith("brand-kit/colors/") && extension === ".css") return "Design token CSS";
  if (relativePath.startsWith("brand-kit/colors/") && extension === ".json") return "Design token JSON";
  if (relativePath.startsWith("brand-kit/logo/") && extension === ".svg") return "Brand kit logo";
  if (relativePath.startsWith("brand-kit/logo/") && extension === ".png") return "Brand kit icon";
  if (relativePath.startsWith("brand-kit/ui/components/") && extension === ".html") return "Interactive component snippet";
  if (relativePath.startsWith("brand-kit/ui/components/") && extension === ".ts") return "Interactive component source";
  if (relativePath.startsWith("brand-kit/ui/components/") && extension === ".md") return "Interactive component guide";
  if (relativePath.startsWith("brand-kit/assets/landing/") && extension === ".svg") return "Landing page template";
  if (relativePath.startsWith("brand-kit/assets/landing/") && extension === ".png") return "Landing page image";
  if (relativePath.startsWith("brand-kit/assets/landing/") && extension === ".md") return "Landing page guide";
  if (relativePath.startsWith("brand-kit/assets/pitch-deck/") && extension === ".svg") return "Pitch deck template";
  if (relativePath.startsWith("brand-kit/assets/pitch-deck/") && extension === ".png") return "Pitch deck image";
  if (relativePath.startsWith("brand-kit/assets/pitch-deck/") && extension === ".pptx") return "Pitch deck theme";
  if (relativePath.startsWith("brand-kit/assets/pitch-deck/") && extension === ".md") return "Pitch deck guide";
  if (relativePath.startsWith("brand-kit/assets/launchpad/") && extension === ".svg") return "Launchpad template";
  if (relativePath.startsWith("brand-kit/assets/launchpad/") && extension === ".png") return "Launchpad image";
  if (relativePath.startsWith("brand-kit/assets/launchpad/") && extension === ".md") return "Launchpad guide";
  if (relativePath.startsWith("brand-kit/assets/docs/") && extension === ".svg") return "Docs cover template";
  if (relativePath.startsWith("brand-kit/assets/docs/") && extension === ".png") return "Docs cover image";
  if (relativePath.startsWith("brand-kit/assets/") && extension === ".svg") return "Brand kit social template";
  if (relativePath.startsWith("brand-kit/assets/") && extension === ".png") return "Brand kit image";
  if (relativePath.startsWith("brand-kit/demo/") && extension === ".svg") return "Demo thumbnail template";
  if (relativePath.startsWith("brand-kit/demo/") && extension === ".png") return "Demo thumbnail image";
  if (relativePath.startsWith("brand-kit/") && extension === ".md") return "Brand kit guide";
  if (relativePath.startsWith("loaders/") && extension === ".svg") return "Loading animation";
  if (relativePath.startsWith("loaders/") && extension === ".md") return "Loader guide";
  if (extension === ".css") return "Stylesheet";
  if (extension === ".md") return "Guide";
  if (extension === ".json") return "Data";
  if (relativePath.includes("/android/")) return basename.endsWith(".xml") ? "Android config" : "Android icon";
  if (relativePath.includes("/ios/")) return "iOS icon";
  if (extension === ".icns") return "macOS icon bundle";
  if (extension === ".ico") return "Windows icon bundle";
  if (basename.includes("text")) return "Wordmark";
  if (basename.includes("logo")) return "Logo mark";
  if (basename.includes("Square") || basename.includes("StoreLogo")) return "Store tile";
  if (extension === ".png") return "App icon";
  if (extension === ".svg") return "Vector logo";
  return "Asset";
}

function dimensionsFromName(relativePath) {
  const basename = path.basename(relativePath);
  const squareMatch = basename.match(/(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)/i);

  if (squareMatch) {
    const scale = basename.includes("@3x") ? 3 : basename.includes("@2x") ? 2 : 1;
    return {
      width: Math.round(Number(squareMatch[1]) * scale),
      height: Math.round(Number(squareMatch[2]) * scale)
    };
  }

  const squareLogoMatch = basename.match(/Square(\d+)x(\d+)Logo/i);
  if (squareLogoMatch) {
    return {
      width: Number(squareLogoMatch[1]),
      height: Number(squareLogoMatch[2])
    };
  }

  if (basename === "StoreLogo.png") return { width: 50, height: 50 };
  if (basename === "icon.png") return { width: 512, height: 512 };
  return null;
}

function dimensionsFromPng(buffer) {
  if (
    buffer.length >= 24 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20)
    };
  }

  return null;
}

function dimensionsFromSvg(text) {
  const svgTag = text.match(/<svg\b([^>]*)>/i);
  const svgAttributes = svgTag?.[1] || "";
  const width = svgAttributes.match(/\bwidth="([0-9.]+)"/i);
  const height = svgAttributes.match(/\bheight="([0-9.]+)"/i);

  if (width && height) {
    return {
      width: Math.round(Number(width[1])),
      height: Math.round(Number(height[1]))
    };
  }

  const viewBox = text.match(/\bviewBox="([0-9.\s-]+)"/i);
  if (!viewBox) return null;

  const values = viewBox[1].trim().split(/\s+/).map(Number);
  if (values.length !== 4 || values.some(Number.isNaN)) return null;

  return {
    width: Math.round(values[2]),
    height: Math.round(values[3])
  };
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
      continue;
    }

    if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

async function readDimensions(fullPath, relativePath, extension) {
  if (extension === ".png") {
    return dimensionsFromPng(await readFile(fullPath)) || dimensionsFromName(relativePath);
  }

  if (extension === ".svg") {
    return dimensionsFromSvg(await readFile(fullPath, "utf8")) || dimensionsFromName(relativePath);
  }

  return dimensionsFromName(relativePath);
}

async function buildManifest() {
  const files = await walk(assetsDir);
  const assets = [];

  for (const fullPath of files) {
    const relativePath = path.relative(assetsDir, fullPath).split(path.sep).join("/");
    if (relativePath === "manifest.json") continue;

    const extension = path.extname(relativePath).toLowerCase();
    const stats = await stat(fullPath);
    const dimensions = await readDimensions(fullPath, relativePath, extension);
    const type = typeFor(relativePath, extension);
    const variant = variantFor(relativePath);
    const platform = platformFor(relativePath, extension);
    const basename = path.basename(relativePath);
    const family = relativePath.split("/")[0];

    assets.push({
      id: slug(relativePath),
      name: titleize(basename),
      path: relativePath,
      url: `/assets/${relativePath}`,
      downloadUrl: `/assets/${relativePath}`,
      extension: extension.replace(".", ""),
      mimeType: mimeByExtension.get(extension) || "application/octet-stream",
      bytes: stats.size,
      dimensions,
      type,
      variant,
      platform,
      family
    });
  }

  assets.sort((a, b) => {
    const weight = (asset) => {
      if (asset.type.includes("Wordmark")) return 0;
      if (asset.type.includes("Logo")) return 1;
      if (asset.family === "icons-color") return 2;
      if (asset.family === "icons-black") return 3;
      if (asset.family === "icons-white") return 4;
      return 5;
    };

    return weight(a) - weight(b) || a.platform.localeCompare(b.platform) || a.path.localeCompare(b.path);
  });

  return {
    generatedAt: new Date().toISOString(),
    brand: {
      name: brandConfig.name,
      domain: brandConfig.domain,
      origin: brandConfig.origin
    },
    counts: {
      assets: assets.length,
      variants: [...new Set(assets.map((asset) => asset.variant))].length,
      platforms: [...new Set(assets.map((asset) => asset.platform))].length
    },
    assets
  };
}

async function copyAssetSources() {
  await mkdir(assetsDir, { recursive: true });

  for (const file of rootAssetFiles) {
    await cp(path.join(root, file), path.join(assetsDir, file));
  }

  for (const directory of assetDirectories) {
    await cp(path.join(root, directory), path.join(assetsDir, directory), { recursive: true });
  }
}

async function renderSocialPng() {
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.warn("Skipping social PNG rendering because sharp is not installed.");
    return;
  }

  const socialDir = path.join(assetsDir, "social");
  const pngDir = path.join(socialDir, "png");
  const entries = await readdir(socialDir, { withFileTypes: true });
  await mkdir(pngDir, { recursive: true });

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".svg")) continue;

    const sourcePath = path.join(socialDir, entry.name);
    const targetPath = path.join(pngDir, entry.name.replace(/\.svg$/i, ".png"));
    await sharp(sourcePath).png({ compressionLevel: 9 }).toFile(targetPath);
  }
}

async function build() {
  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });
  await cp(publicDir, distDir, { recursive: true });
  await copyAssetSources();
  await renderSocialPng();

  const manifest = await buildManifest();
  await writeFile(path.join(assetsDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(path.join(distDir, "brand.json"), `${JSON.stringify(brandConfig, null, 2)}\n`);

  console.log(`Built ${manifest.counts.assets} assets into ${path.relative(root, distDir)}`);
}

build().catch((error) => {
  console.error(error);
  process.exit(1);
});
