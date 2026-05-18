import { mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(root, "private", "tailwind-plus", "source");
const distRoot = path.join(root, "dist", "plus");

const libraries = [
  { id: "app", label: "Application UI" },
  { id: "marketing", label: "Marketing UI" }
];

const formats = [
  { id: "html", extension: ".html", label: "HTML" },
  { id: "react", extension: ".jsx", label: "React" },
  { id: "vue", extension: ".vue", label: "Vue" }
];

const shadeMap = new Map([
  ["50", "50"],
  ["100", "100"],
  ["200", "200"],
  ["300", "300"],
  ["400", "400"],
  ["500", "500"],
  ["600", "700"],
  ["700", "800"],
  ["800", "900"],
  ["900", "950"],
  ["950", "950"]
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
    .replace(/^\d+-/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

async function exists(directory) {
  try {
    const details = await stat(directory);
    return details.isDirectory();
  } catch {
    return false;
  }
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

function pioneerShade(shade) {
  return shadeMap.get(shade) || shade;
}

function replaceBrandColorClasses(source) {
  return source.replace(/\bindigo-(50|100|200|300|400|500|600|700|800|900|950)\b/g, (_, shade) => {
    return `pioneer-${pioneerShade(shade)}`;
  });
}

function replaceLogoUrls(source) {
  return source.replace(/https:\/\/tailwindcss\.com\/plus-assets\/img\/logos\/mark\.svg\?([^"'\s)]+)/g, (match) => {
    return match.includes("color=white") ? "/assets/pioneer-logo-white.svg" : "/assets/pioneer-logo.svg";
  });
}

function replaceGradientAccents(source) {
  return source
    .replace(/from-\[#ff80b5\]/g, "from-[#4a9d5f]")
    .replace(/to-\[#9089fc\]/g, "to-[#d9a441]")
    .replace(/from-\[#80caff\]/g, "from-[#0ea5e9]")
    .replace(/to-\[#4f46e5\]/g, "to-[#2d7a3e]");
}

function replaceSampleCopy(source) {
  return source
    .replace(/Your Company/g, "Pioneer")
    .replace(/Acme Inc\./g, "Pioneer")
    .replace(/Data to enrich your online business/g, "Write business logic. Ship edge infrastructure.")
    .replace(/Deploy to production in minutes/g, "Ship Cloudflare edge apps from focused TypeScript routes")
    .replace(/Get started/g, "Deploy to Pioneer")
    .replace(/Learn more/g, "View docs")
    .replace(/Log in/g, "Docs")
    .replace(/Start free trial/g, "Run locally")
    .replace(/Contact sales/g, "Talk to us");
}

function brandSource(source) {
  return replaceSampleCopy(replaceGradientAccents(replaceLogoUrls(replaceBrandColorClasses(source))));
}

function cleanHtmlUrl(url) {
  return url.replace(/\.html$/i, "");
}

function previewDocument(body) {
  const escapedBody = body.replace(/<\/script/gi, "<\\/script");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
    <style type="text/tailwindcss">
      @theme {
        --font-sans: "Instrument Sans", ui-sans-serif, system-ui, sans-serif;
        --color-pioneer-50: #edf9f1;
        --color-pioneer-100: #ddf4e4;
        --color-pioneer-200: #c4ebd1;
        --color-pioneer-300: #a5dbb7;
        --color-pioneer-400: #67b578;
        --color-pioneer-500: #4a9d5f;
        --color-pioneer-600: #3f8e52;
        --color-pioneer-700: #2d7a3e;
        --color-pioneer-800: #1f6434;
        --color-pioneer-900: #174c2a;
        --color-pioneer-950: #0a1f12;
      }
    </style>
    <style>
      body { margin: 0; background: #f4f7ef; font-family: "Instrument Sans", ui-sans-serif, system-ui, sans-serif; }
      img[src^="/assets/"] { object-fit: contain; }
    </style>
  </head>
  <body>
${escapedBody}
  </body>
</html>
`;
}

async function collectEntries() {
  if (!(await exists(sourceRoot))) {
    throw new Error(`Tailwind Plus source is missing. Run npm run plus:import first.`);
  }

  const entries = new Map();

  for (const library of libraries) {
    for (const format of formats) {
      const directory = path.join(sourceRoot, library.id, format.id);
      if (!(await exists(directory))) continue;

      const files = (await walk(directory)).filter((file) => path.extname(file) === format.extension);

      for (const file of files) {
        const relativePath = path.relative(directory, file).split(path.sep).join("/");
        const key = `${library.id}/${relativePath.replace(format.extension, "")}`;
        const parts = relativePath.split("/");
        const filename = parts.at(-1);
        const groupPath = parts.slice(0, -1).join("/");
        const groupParts = parts.slice(0, -1);
        const category = groupParts[0] || "components";
        const subcategory = groupParts.at(-1) || category;
        const id = slug(key);

        if (!entries.has(key)) {
          entries.set(key, {
            id,
            library: library.id,
            libraryLabel: library.label,
            category,
            categoryLabel: titleize(category),
            subcategory,
            subcategoryLabel: titleize(subcategory),
            groupPath,
            name: titleize(filename),
            formats: {}
          });
        }

        entries.get(key).formats[format.id] = {
          label: format.label,
          sourcePath: path.relative(root, file).split(path.sep).join("/"),
          originalPath: relativePath,
          extension: format.extension.replace(".", "")
        };
      }
    }
  }

  return [...entries.values()].sort((a, b) => {
    return (
      a.library.localeCompare(b.library) ||
      a.category.localeCompare(b.category) ||
      a.subcategory.localeCompare(b.subcategory) ||
      a.name.localeCompare(b.name)
    );
  });
}

async function writeBrandedSources(entries) {
  for (const entry of entries) {
    for (const [formatId, formatEntry] of Object.entries(entry.formats)) {
      const sourcePath = path.join(root, formatEntry.sourcePath);
      const source = await readFile(sourcePath, "utf8");
      const branded = brandSource(source);
      const targetPath = path.join(distRoot, "source", entry.library, formatId, formatEntry.originalPath);
      await mkdir(path.dirname(targetPath), { recursive: true });
      await writeFile(targetPath, branded);

      const sourceUrl = `/plus/source/${entry.library}/${formatId}/${formatEntry.originalPath}`;
      formatEntry.url = formatId === "html" ? cleanHtmlUrl(sourceUrl) : sourceUrl;

      if (formatId === "html") {
        const previewPath = path.join(distRoot, "previews", `${entry.id}.html`);
        await mkdir(path.dirname(previewPath), { recursive: true });
        await writeFile(previewPath, previewDocument(branded));
        entry.previewUrl = `/plus/previews/${entry.id}`;
      }
    }
  }
}

function catalogFromEntries(entries) {
  const categories = [];
  const categoryMap = new Map();

  for (const entry of entries) {
    const categoryId = `${entry.library}/${entry.category}`;
    if (!categoryMap.has(categoryId)) {
      const category = {
        id: categoryId,
        library: entry.library,
        label: entry.categoryLabel,
        count: 0,
        subcategories: []
      };
      categoryMap.set(categoryId, category);
      categories.push(category);
    }

    const category = categoryMap.get(categoryId);
    category.count += 1;

    if (!category.subcategories.some((subcategory) => subcategory.id === entry.subcategory)) {
      category.subcategories.push({
        id: entry.subcategory,
        label: entry.subcategoryLabel
      });
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    notice:
      "Private Pioneer-branded derivatives of Tailwind Plus components. Do not redistribute separately from Pioneer end products.",
    counts: {
      components: entries.length,
      app: entries.filter((entry) => entry.library === "app").length,
      marketing: entries.filter((entry) => entry.library === "marketing").length,
      html: entries.filter((entry) => entry.formats.html).length,
      react: entries.filter((entry) => entry.formats.react).length,
      vue: entries.filter((entry) => entry.formats.vue).length
    },
    libraries,
    categories,
    components: entries.map((entry) => ({
      id: entry.id,
      library: entry.library,
      libraryLabel: entry.libraryLabel,
      category: entry.category,
      categoryLabel: entry.categoryLabel,
      subcategory: entry.subcategory,
      subcategoryLabel: entry.subcategoryLabel,
      groupPath: entry.groupPath,
      name: entry.name,
      previewUrl: entry.previewUrl || null,
      formats: entry.formats
    }))
  };
}

async function writeBrowserFiles(catalog) {
  await writeFile(
    path.join(distRoot, "index.html"),
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Pioneer Private Component Browser</title>
    <link rel="icon" type="image/png" sizes="32x32" href="/assets/icons-color/32x32.png">
    <link rel="stylesheet" href="/plus/plus.css">
  </head>
  <body>
    <div id="plusApp"></div>
    <script type="module" src="/plus/plus.js"></script>
  </body>
</html>
`
  );

  await writeFile(
    path.join(distRoot, "plus.css"),
    `:root {
  color-scheme: light;
  --page: #f4f7ef;
  --surface: #ffffff;
  --surface-soft: #f8faf5;
  --ink: #161a17;
  --muted: #5e675e;
  --line: #dce5d7;
  --green: #2d7a3e;
  --green-soft: #ddf4e4;
  --radius: 8px;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--page);
  color: var(--ink);
  font-family: "Instrument Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
button, input, select { font: inherit; }
a { color: inherit; text-decoration: none; }
.shell { min-height: 100vh; }
.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid var(--line);
  background: rgba(244, 247, 239, 0.94);
  padding: 0.85rem clamp(1rem, 3vw, 2rem);
  backdrop-filter: blur(18px);
}
.brand { display: inline-flex; align-items: center; gap: 0.65rem; font-weight: 820; }
.brand img { width: 32px; height: 32px; object-fit: contain; }
.badge {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  border: 1px solid #bad7c4;
  border-radius: 999px;
  background: var(--green-soft);
  color: #174c2a;
  font-size: 0.78rem;
  font-weight: 760;
  padding: 0.18rem 0.55rem;
}
.layout {
  display: grid;
  grid-template-columns: minmax(220px, 280px) minmax(0, 1fr);
  gap: 1rem;
  width: min(1480px, calc(100vw - 32px));
  margin: 0 auto;
  padding: 1rem 0 2rem;
}
.sidebar, .panel {
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
}
.sidebar {
  position: sticky;
  top: 78px;
  align-self: start;
  max-height: calc(100vh - 94px);
  overflow: auto;
  padding: 0.75rem;
}
.sidebar h2 {
  margin: 0.4rem 0 0.75rem;
  font-size: 0.8rem;
  color: var(--green);
  text-transform: uppercase;
}
.nav-button {
  display: flex;
  width: 100%;
  justify-content: space-between;
  gap: 0.6rem;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #3f493f;
  cursor: pointer;
  font-weight: 720;
  padding: 0.5rem 0.6rem;
  text-align: left;
}
.nav-button[aria-pressed="true"] { background: var(--green); color: #fff; }
.main { display: grid; gap: 1rem; min-width: 0; }
.hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 1rem;
  align-items: end;
  padding: 1.1rem;
}
.hero h1 { margin: 0 0 0.4rem; font-size: clamp(2rem, 5vw, 4.2rem); line-height: 0.95; }
.hero p { max-width: 720px; margin: 0; color: var(--muted); }
.stats { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: end; }
.controls {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) auto auto auto;
  gap: 0.6rem;
  padding: 0.75rem;
}
.search, .select, .control-button {
  min-height: 40px;
  border: 1px solid var(--line);
  border-radius: 7px;
  background: #fff;
  color: var(--ink);
  padding: 0.55rem 0.7rem;
}
.control-button { cursor: pointer; font-weight: 760; }
.control-button[aria-pressed="true"] { border-color: var(--green); background: var(--green); color: #fff; }
.browser {
  display: grid;
  grid-template-columns: minmax(280px, 380px) minmax(0, 1fr);
  gap: 1rem;
}
.list {
  max-height: 760px;
  overflow: auto;
  padding: 0.55rem;
}
.component-row {
  display: grid;
  gap: 0.25rem;
  width: 100%;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--ink);
  cursor: pointer;
  padding: 0.72rem;
  text-align: left;
}
.component-row:hover, .component-row[aria-selected="true"] { background: #f1f7ed; }
.component-row strong { font-size: 0.96rem; }
.component-row span { color: var(--muted); font-size: 0.78rem; }
.viewer { min-width: 0; overflow: hidden; }
.viewer-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid var(--line);
  padding: 1rem;
}
.viewer-head h2 { margin: 0 0 0.3rem; }
.viewer-head p { margin: 0; color: var(--muted); }
.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  border-bottom: 1px solid var(--line);
  background: var(--surface-soft);
  padding: 0.45rem;
}
.tab {
  min-height: 34px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  cursor: pointer;
  font-weight: 760;
  padding: 0.38rem 0.64rem;
}
.tab[aria-selected="true"] { background: #fff; color: var(--green); box-shadow: 0 2px 8px rgba(22, 26, 23, 0.08); }
.preview-frame {
  display: block;
  width: 100%;
  min-height: 620px;
  border: 0;
  background: #fff;
}
.preview-frame.mobile { max-width: 390px; min-height: 760px; margin: 1rem auto; border: 1px solid var(--line); border-radius: 18px; }
.code {
  overflow: auto;
  max-height: 720px;
  margin: 0;
  background: #0a0d0b;
  color: #e7f3e4;
  padding: 1rem;
}
.code code { font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace; font-size: 0.82rem; line-height: 1.6; white-space: pre; }
.empty { padding: 2rem; color: var(--muted); }
@media (max-width: 980px) {
  .layout, .browser, .hero, .controls { grid-template-columns: 1fr; }
  .sidebar { position: static; max-height: none; }
  .stats { justify-content: flex-start; }
}
`
  );

  await writeFile(
    path.join(distRoot, "plus.js"),
    `const state = {
  catalog: null,
  library: "app",
  category: "all",
  query: "",
  format: "preview",
  mobile: false,
  selectedId: null,
  selected: null
};

const app = document.querySelector("#plusApp");

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

async function loadCatalog() {
  const response = await fetch("/api/plus/catalog.json");
  if (!response.ok) throw new Error("Private component catalog unavailable");
  return response.json();
}

function filteredComponents() {
  const query = state.query.trim().toLowerCase();
  return state.catalog.components.filter((component) => {
    const fields = [component.name, component.libraryLabel, component.categoryLabel, component.subcategoryLabel, component.groupPath].join(" ").toLowerCase();
    return (
      component.library === state.library &&
      (state.category === "all" || component.category === state.category) &&
      (!query || fields.includes(query))
    );
  });
}

function selectComponent(component) {
  state.selectedId = component.id;
  state.selected = component;
  state.format = component.previewUrl ? "preview" : Object.keys(component.formats)[0] || "preview";
  render();
}

function setLibrary(library) {
  state.library = library;
  state.category = "all";
  const first = filteredComponents()[0];
  state.selectedId = first?.id || null;
  state.selected = first || null;
  state.format = first?.previewUrl ? "preview" : Object.keys(first?.formats || {})[0] || "preview";
  render();
}

function categoryButtons() {
  const wrapper = document.createElement("div");
  wrapper.append(el("h2", "", "Categories"));

  const all = document.createElement("button");
  all.type = "button";
  all.className = "nav-button";
  all.setAttribute("aria-pressed", String(state.category === "all"));
  all.innerHTML = "<span>All</span><span>" + state.catalog.counts[state.library] + "</span>";
  all.addEventListener("click", () => {
    state.category = "all";
    render();
  });
  wrapper.append(all);

  state.catalog.categories
    .filter((category) => category.library === state.library)
    .forEach((category) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "nav-button";
      button.setAttribute("aria-pressed", String(state.category === category.id.split("/")[1]));
      button.innerHTML = "<span>" + category.label + "</span><span>" + category.count + "</span>";
      button.addEventListener("click", () => {
        state.category = category.id.split("/")[1];
        render();
      });
      wrapper.append(button);
    });

  return wrapper;
}

function componentList() {
  const list = el("div", "panel list");
  const components = filteredComponents();

  if (!components.some((component) => component.id === state.selectedId)) {
    state.selected = components[0] || null;
    state.selectedId = state.selected?.id || null;
    state.format = state.selected?.previewUrl ? "preview" : Object.keys(state.selected?.formats || {})[0] || "preview";
  } else {
    state.selected = components.find((component) => component.id === state.selectedId);
    if (state.format !== "preview" && !state.selected?.formats[state.format]) {
      state.format = state.selected?.previewUrl ? "preview" : Object.keys(state.selected?.formats || {})[0] || "preview";
    }
  }

  if (!components.length) {
    list.append(el("div", "empty", "No components match the current filters."));
    return list;
  }

  components.forEach((component) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "component-row";
    button.setAttribute("aria-selected", String(component.id === state.selectedId));
    button.innerHTML = "<strong>" + component.name + "</strong><span>" + component.categoryLabel + " / " + component.subcategoryLabel + "</span>";
    button.addEventListener("click", () => selectComponent(component));
    list.append(button);
  });

  return list;
}

function formatTabs(component) {
  const tabs = el("div", "tabs");
  const available = [];

  if (component.previewUrl) available.push(["preview", "Preview"]);
  for (const [format, details] of Object.entries(component.formats)) {
    available.push([format, details.label]);
  }

  available.forEach(([format, label]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tab";
    button.setAttribute("aria-selected", String(state.format === format));
    button.textContent = label;
    button.addEventListener("click", () => {
      state.format = format;
      renderViewerBody(component);
      tabs.querySelectorAll(".tab").forEach((tab) => tab.setAttribute("aria-selected", String(tab === button)));
    });
    tabs.append(button);
  });

  const mobile = document.createElement("button");
  mobile.type = "button";
  mobile.className = "tab";
  mobile.setAttribute("aria-selected", String(state.mobile));
  mobile.textContent = "Mobile";
  mobile.addEventListener("click", () => {
    state.mobile = !state.mobile;
    renderViewerBody(component);
    mobile.setAttribute("aria-selected", String(state.mobile));
  });
  tabs.append(mobile);

  return tabs;
}

async function renderViewerBody(component) {
  const body = document.querySelector("#viewerBody");
  if (!body) return;
  body.replaceChildren();

  if (state.format === "preview") {
    const iframe = document.createElement("iframe");
    iframe.className = "preview-frame" + (state.mobile ? " mobile" : "");
    iframe.title = component.name + " preview";
    iframe.src = component.previewUrl;
    body.append(iframe);
    return;
  }

  const format = component.formats[state.format];
  if (!format) {
    body.append(el("div", "empty", "This format is not available for this component."));
    return;
  }

  const response = await fetch(format.url);
  const code = response.ok ? await response.text() : "Source unavailable.";
  const pre = el("pre", "code");
  const codeNode = document.createElement("code");
  codeNode.textContent = code;
  pre.append(codeNode);
  body.append(pre);
}

function viewer() {
  const component = state.selected;
  const panel = el("section", "panel viewer");

  if (!component) {
    panel.append(el("div", "empty", "Select a component."));
    return panel;
  }

  const head = el("div", "viewer-head");
  const copy = el("div");
  copy.append(el("h2", "", component.name), el("p", "", component.categoryLabel + " / " + component.subcategoryLabel));
  const meta = el("div", "stats");
  Object.values(component.formats).forEach((format) => meta.append(el("span", "badge", format.label)));
  head.append(copy, meta);

  const body = el("div");
  body.id = "viewerBody";
  panel.append(head, formatTabs(component), body);
  queueMicrotask(() => renderViewerBody(component));
  return panel;
}

function controls() {
  const panel = el("div", "panel controls");

  const search = document.createElement("input");
  search.className = "search";
  search.type = "search";
  search.placeholder = "Search components";
  search.value = state.query;
  search.addEventListener("input", (event) => {
    state.query = event.currentTarget.value;
    render();
  });

  const appButton = document.createElement("button");
  appButton.type = "button";
  appButton.className = "control-button";
  appButton.setAttribute("aria-pressed", String(state.library === "app"));
  appButton.textContent = "Application UI";
  appButton.addEventListener("click", () => setLibrary("app"));

  const marketingButton = document.createElement("button");
  marketingButton.type = "button";
  marketingButton.className = "control-button";
  marketingButton.setAttribute("aria-pressed", String(state.library === "marketing"));
  marketingButton.textContent = "Marketing UI";
  marketingButton.addEventListener("click", () => setLibrary("marketing"));

  const source = document.createElement("a");
  source.className = "control-button";
  source.href = "/api/plus/catalog.json";
  source.textContent = "Catalog JSON";

  panel.append(search, appButton, marketingButton, source);
  return panel;
}

function render() {
  const shell = el("div", "shell");
  const topbar = el("header", "topbar");
  topbar.innerHTML = '<a class="brand" href="/"><img src="/assets/icons-color/64x64.png" alt="">Pioneer</a><span class="badge">Private Tailwind Plus derivatives</span>';

  const layout = el("div", "layout");
  const sidebar = el("aside", "sidebar");
  sidebar.append(categoryButtons());

  const main = el("main", "main");
  const hero = el("section", "panel hero");
  hero.innerHTML = '<div><h1>Component browser</h1><p>Pioneer-branded application and marketing UI components adapted from licensed Tailwind Plus source. Keep this private.</p></div><div class="stats"><span class="badge">' +
    state.catalog.counts.components +
    ' components</span><span class="badge">' +
    state.catalog.counts.html +
    ' HTML</span><span class="badge">' +
    state.catalog.counts.react +
    ' React</span><span class="badge">' +
    state.catalog.counts.vue +
    ' Vue</span></div>';

  const browser = el("section", "browser");
  browser.append(componentList(), viewer());
  main.append(hero, controls(), browser);
  layout.append(sidebar, main);
  shell.append(topbar, layout);
  app.replaceChildren(shell);
}

loadCatalog()
  .then((catalog) => {
    state.catalog = catalog;
    state.selected = filteredComponents()[0] || null;
    state.selectedId = state.selected?.id || null;
    render();
  })
  .catch((error) => {
    console.error(error);
    app.innerHTML = '<div class="empty">Private component catalog unavailable.</div>';
  });
`
  );

  await writeFile(path.join(distRoot, "catalog.json"), `${JSON.stringify(catalog, null, 2)}\n`);
}

export async function buildPlus() {
  await rm(distRoot, { recursive: true, force: true });
  await mkdir(distRoot, { recursive: true });

  const entries = await collectEntries();
  await writeBrandedSources(entries);
  const catalog = catalogFromEntries(entries);
  await writeBrowserFiles(catalog);

  console.log(`Built ${catalog.counts.components} private Plus components into ${path.relative(root, distRoot)}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  buildPlus().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
