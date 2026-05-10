const state = {
  brand: null,
  manifest: null,
  query: "",
  variant: "All",
  platform: "All"
};

const elements = {
  deployActions: document.querySelector("#deployActions"),
  deployActionsLarge: document.querySelector("#deployActionsLarge"),
  sourceHeadline: document.querySelector("#sourceHeadline"),
  sourceSentence: document.querySelector("#sourceSentence"),
  positioningGrid: document.querySelector("#positioningGrid"),
  brandSourceLinks: document.querySelector("#brandSourceLinks"),
  canonicalSnippet: document.querySelector("#canonicalSnippet"),
  assetSummary: document.querySelector("#assetSummary"),
  visibleCount: document.querySelector("#visibleCount"),
  logoGrid: document.querySelector("#logoGrid"),
  socialGrid: document.querySelector("#socialGrid"),
  patternGrid: document.querySelector("#patternGrid"),
  diagramGrid: document.querySelector("#diagramGrid"),
  loaderGrid: document.querySelector("#loaderGrid"),
  motionGrid: document.querySelector("#motionGrid"),
  buttonGrid: document.querySelector("#buttonGrid"),
  iconSetGrid: document.querySelector("#iconSetGrid"),
  resourceGrid: document.querySelector("#resourceGrid"),
  assetGrid: document.querySelector("#assetGrid"),
  swatchGrid: document.querySelector("#swatchGrid"),
  variantFilters: document.querySelector("#variantFilters"),
  platformFilters: document.querySelector("#platformFilters"),
  search: document.querySelector("#assetSearch"),
  toast: document.querySelector("#toast")
};

const preferredLogoNames = [
  "pioneer-text.svg",
  "pioneer-text-logo-black.svg",
  "pioneer-text-white.svg",
  "pioneer-logo.svg",
  "pioneer-logo-black.svg",
  "pioneer-logo-white.svg"
];

const platformOrder = ["All", "Brand", "Social", "Landing page", "Pitch deck", "Launchpad", "Product pattern", "Documentation", "Design tokens", "Interface", "Motion", "Web and desktop", "iOS", "Android", "Windows and web", "Windows Store", "macOS"];
const variantOrder = ["All", "Color", "Black", "White", "Social", "Product", "Diagram", "Button", "Brand Kit", "Animated", "Resource"];

const canonicalSnippet = [
  'import { Route, DB, Cache, Queue } from "@find-how/pioneer";',
  "",
  'Route.post("/checkout", async ({ request }) => {',
  "  const input = await request.json();",
  "",
  '  const order = await DB.table("orders").create(input);',
  "",
  "  await Cache.set(`order:${order.id}`, order);",
  "",
  '  await Queue.dispatch("send-receipt", {',
  "    orderId: order.id,",
  "  });",
  "",
  "  return Response.json({ ok: true, order }, { status: 201 });",
  '}).middleware(["auth", "verified"]);'
].join("\n");

const primarySourceTitles = new Set([
  "Pioneer Brand Kit",
  "Messaging Kit",
  "Interactive Components",
  "Edge Artisan Console",
  "Canonical Checkout Snippet",
  "Landing Hero",
  "Pitch Deck Theme",
  "Launchpad One-Pager",
  "Deploy Buttons"
]);

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function dimensionLabel(asset) {
  if (!asset.dimensions) return asset.extension.toUpperCase();
  return `${asset.dimensions.width}x${asset.dimensions.height}`;
}

function isPreviewable(asset) {
  return ["svg", "png"].includes(asset.extension);
}

function isDarkPreview(asset) {
  return asset.variant === "White" || asset.type === "Deploy button artwork";
}

function isCheckerPreview(asset) {
  return asset.extension === "svg" && !isDarkPreview(asset);
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("visible");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => {
    elements.toast.classList.remove("visible");
  }, 1800);
}

async function copyText(value, label = "Copied") {
  try {
    await navigator.clipboard.writeText(value);
    showToast(label);
  } catch {
    showToast("Clipboard unavailable");
  }
}

function assetAbsoluteUrl(asset) {
  return new URL(asset.url, window.location.origin).toString();
}

function isPioneerDeployAction(action) {
  return action.label?.toLowerCase() === "deploy to pioneer";
}

function createPioneerDeployButton(action, className = "") {
  const control = action.href ? document.createElement("a") : document.createElement("button");

  if (action.href) {
    control.href = action.href;
    control.target = "_blank";
    control.rel = "noreferrer";
  } else {
    control.type = "button";
    control.addEventListener("click", () => copyText(action.command, "Command copied"));
  }

  control.className = `pioneer-deploy-button ${className}`.trim();
  control.innerHTML = `
    <span class="pioneer-deploy-mark" aria-hidden="true">
      <img src="/assets/icons-color/64x64.png" alt="">
    </span>
    <span class="pioneer-deploy-copy">
      <strong>${action.label}</strong>
      <span>${action.detail || "Wrangler local feedback"}</span>
    </span>
  `;

  return control;
}

function createButton(action, className = "") {
  if (isPioneerDeployAction(action)) {
    return createPioneerDeployButton(action, className);
  }

  if (action.href) {
    const anchor = document.createElement("a");
    anchor.className = `button ${action.variant || "secondary"} ${className}`.trim();
    anchor.href = action.href;
    anchor.textContent = action.label;
    anchor.rel = "noreferrer";
    return anchor;
  }

  const button = document.createElement("button");
  button.type = "button";
  button.className = `button ${action.variant || "secondary"} ${className}`.trim();
  button.textContent = action.label;
  button.addEventListener("click", () => copyText(action.command, "Command copied"));
  return button;
}

function renderDeployActions() {
  const actions = state.brand?.deployActions || [];
  elements.deployActions.replaceChildren(...actions.map((action) => createButton(action)));
  elements.deployActionsLarge.replaceChildren(...actions.map((action) => createButton(action)));
}

function renderSwatches() {
  const swatches = state.brand?.colors || [];
  const nodes = swatches.map((swatch) => {
    const node = document.createElement("article");
    node.className = "swatch";
    node.innerHTML = `
      <div class="swatch-color" style="background:${swatch.hex}"></div>
      <div class="swatch-body">
        <strong>${swatch.name}</strong>
        <span>${swatch.hex}</span>
        <span>${swatch.role}</span>
      </div>
    `;
    node.addEventListener("click", () => copyText(swatch.hex, `${swatch.hex} copied`));
    return node;
  });

  elements.swatchGrid.replaceChildren(...nodes);
}

function renderResources() {
  const resources = state.brand?.resources || [];
  const nodes = resources.map((resource) => {
    const article = document.createElement("article");
    article.className = "resource-card";
    article.innerHTML = `
      <div>
        <h3>${resource.title}</h3>
        <p>${resource.detail}</p>
      </div>
      <a class="button compact" href="${resource.href}">Open</a>
    `;
    return article;
  });

  elements.resourceGrid.replaceChildren(...nodes);
}

function renderBrandSource() {
  const positioning = state.brand?.positioning || {};
  const messages = [
    ["Tagline", positioning.tagline],
    ["Main headline", positioning.headline],
    ["Demo headline", positioning.demoHeadline],
    ["AI framing", positioning.ai]
  ].filter(([, value]) => value);

  elements.sourceHeadline.textContent = positioning.short || "Write business logic. Pioneer compiles the infrastructure.";
  elements.sourceSentence.textContent =
    positioning.oneSentence || "Pioneer turns application business logic into production-ready Cloudflare edge infrastructure.";
  elements.canonicalSnippet.textContent = canonicalSnippet;

  const messageRows = messages.map(([label, value]) => {
    const row = document.createElement("div");
    row.className = "message-row";
    const labelNode = document.createElement("span");
    labelNode.textContent = label;
    const valueNode = document.createElement("strong");
    valueNode.textContent = value;
    row.append(labelNode, valueNode);
    return row;
  });

  const sourceLinks = (state.brand?.resources || [])
    .filter((resource) => primarySourceTitles.has(resource.title))
    .map((resource) => {
      const link = document.createElement("a");
      link.className = "source-link";
      link.href = resource.href;

      const title = document.createElement("strong");
      title.textContent = resource.title;
      const detail = document.createElement("span");
      detail.textContent = resource.detail;
      link.append(title, detail);
      return link;
    });

  elements.positioningGrid.replaceChildren(...messageRows);
  elements.brandSourceLinks.replaceChildren(...sourceLinks);
}

function filterOptions(key, order) {
  const values = new Set(state.manifest.assets.map((asset) => asset[key]));
  return order.filter((value) => value === "All" || values.has(value));
}

function renderSegments(container, values, selected, onSelect) {
  const nodes = values.map((value) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "segment";
    button.textContent = value;
    button.setAttribute("aria-pressed", String(value === selected));
    button.addEventListener("click", () => onSelect(value));
    return button;
  });

  container.replaceChildren(...nodes);
}

function renderFilters() {
  renderSegments(elements.variantFilters, filterOptions("variant", variantOrder), state.variant, (value) => {
    state.variant = value;
    renderAllAssetViews();
  });

  renderSegments(elements.platformFilters, filterOptions("platform", platformOrder), state.platform, (value) => {
    state.platform = value;
    renderAllAssetViews();
  });
}

function matchesFilters(asset) {
  const query = state.query.trim().toLowerCase();
  const fields = [asset.name, asset.path, asset.type, asset.variant, asset.platform, asset.extension].join(" ").toLowerCase();

  return (
    (state.variant === "All" || asset.variant === state.variant) &&
    (state.platform === "All" || asset.platform === state.platform) &&
    (!query || fields.includes(query))
  );
}

function previewNode(asset, extraClass = "") {
  const preview = document.createElement("div");
  preview.className = ["preview", extraClass, isDarkPreview(asset) ? "dark" : "", isCheckerPreview(asset) ? "checker" : ""]
    .filter(Boolean)
    .join(" ");

  if (isPreviewable(asset)) {
    const image = document.createElement("img");
    image.src = asset.url;
    image.alt = asset.name;
    image.loading = "lazy";
    preview.append(image);
  } else {
    const fallback = document.createElement("div");
    fallback.className = "file-preview";
    fallback.textContent = asset.extension;
    preview.append(fallback);
  }

  return preview;
}

function metaPills(asset) {
  const values = [asset.variant, asset.platform, dimensionLabel(asset), formatBytes(asset.bytes)];
  return values.map((value) => `<span class="pill">${value}</span>`).join("");
}

function cardActions(asset) {
  const wrapper = document.createElement("div");
  wrapper.className = "card-actions";

  const download = document.createElement("a");
  download.className = "button compact";
  download.href = asset.downloadUrl;
  download.download = asset.path.split("/").pop();
  download.textContent = "Download";

  const copy = document.createElement("button");
  copy.className = "button compact ghost";
  copy.type = "button";
  copy.textContent = "Copy URL";
  copy.addEventListener("click", () => copyText(assetAbsoluteUrl(asset), "Asset URL copied"));

  wrapper.append(download, copy);
  return wrapper;
}

function showcaseCard(asset) {
  const article = document.createElement("article");
  article.className = "showcase-card";

  const preview = document.createElement("div");
  preview.className = [
    "showcase-preview",
    asset.platform === "Motion" ||
    asset.path.includes("og-") ||
    asset.path.includes("github") ||
    asset.path.includes("launch") ||
    asset.type === "Deploy button artwork"
      ? "dark"
      : ""
  ]
    .filter(Boolean)
    .join(" ");

  const image = document.createElement("img");
  image.src = asset.url;
  image.alt = asset.name;
  image.loading = "lazy";
  preview.append(image);

  const body = document.createElement("div");
  body.className = "card-body";
  body.innerHTML = `
    <div>
      <h3>${asset.name}</h3>
      <div class="path-line" title="${asset.path}">${asset.path}</div>
    </div>
    <div class="meta-line">${metaPills(asset)}</div>
  `;
  body.append(cardActions(asset));
  article.append(preview, body);
  return article;
}

function assetCard(asset, className = "asset-card") {
  const article = document.createElement("article");
  article.className = className;
  article.append(previewNode(asset, className === "asset-card" ? "asset-preview" : ""));

  const body = document.createElement("div");
  body.className = "card-body";
  body.innerHTML = `
    <div>
      <h3>${asset.name}</h3>
      <div class="path-line" title="${asset.path}">${asset.path}</div>
    </div>
    <div class="meta-line">${metaPills(asset)}</div>
  `;
  body.append(cardActions(asset));
  article.append(body);
  return article;
}

function renderLogos() {
  const logos = preferredLogoNames
    .map((name) => state.manifest.assets.find((asset) => asset.path === name))
    .filter(Boolean);

  elements.logoGrid.replaceChildren(...logos.map((asset) => assetCard(asset, "logo-card")));
}

function renderCollection(grid, predicate) {
  const assets = state.manifest.assets.filter(predicate);
  grid.replaceChildren(...assets.map(showcaseCard));
}

function renderShowcases() {
  renderCollection(elements.socialGrid, (asset) => asset.type === "Social card template");
  renderCollection(elements.patternGrid, (asset) => asset.type === "Product pattern");
  renderCollection(elements.diagramGrid, (asset) => asset.type === "Documentation diagram");
  renderCollection(elements.motionGrid, (asset) => asset.type === "Motion animation");
}

function renderButtons() {
  renderCollection(elements.buttonGrid, (asset) => asset.type === "Deploy button artwork");
}

function renderLoaders() {
  const loaders = state.manifest.assets.filter((asset) => asset.type === "Loading animation");
  const nodes = loaders.map((asset) => {
    const article = document.createElement("article");
    article.className = "loader-card";

    const preview = document.createElement("div");
    preview.className = "loader-preview";
    preview.innerHTML = `<img src="${asset.url}" alt="${asset.name}" loading="lazy">`;

    const body = document.createElement("div");
    body.className = "card-body";
    body.innerHTML = `
      <div>
        <h3>${asset.name}</h3>
        <div class="path-line" title="${asset.path}">${asset.path}</div>
      </div>
      <div class="meta-line">${metaPills(asset)}</div>
    `;
    body.append(cardActions(asset));
    article.append(preview, body);
    return article;
  });

  elements.loaderGrid.replaceChildren(...nodes);
}

function renderIconSets() {
  const families = ["icons-color", "icons-black", "icons-white"];
  const nodes = families.map((family) => {
    const assets = state.manifest.assets.filter((asset) => asset.family === family);
    const icon32 = assets.find((asset) => asset.path.endsWith("32x32.png"));
    const icon128 = assets.find((asset) => asset.path.endsWith("128x128.png"));
    const icon512 = assets.find((asset) => asset.path.endsWith("icon.png"));
    const variant = assets[0]?.variant || family.replace("icons-", "");
    const platforms = [...new Set(assets.map((asset) => asset.platform))].sort();

    const article = document.createElement("article");
    article.className = "icon-set-card";
    article.innerHTML = `
      <div>
        <h3>${variant} icon set</h3>
        <p class="section-note">${assets.length} files across ${platforms.join(", ")}</p>
      </div>
      <div class="icon-row ${variant === "White" ? "dark" : ""}">
        ${[icon32, icon128, icon512]
          .filter(Boolean)
          .map((asset) => `<img src="${asset.url}" alt="${asset.name}" loading="lazy">`)
          .join("")}
      </div>
      <div class="meta-line">
        ${platforms.map((platform) => `<span class="pill">${platform}</span>`).join("")}
      </div>
    `;
    return article;
  });

  elements.iconSetGrid.replaceChildren(...nodes);
}

function renderAssets() {
  const filtered = state.manifest.assets.filter(matchesFilters);
  elements.visibleCount.textContent = `${filtered.length} of ${state.manifest.counts.assets} assets`;

  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No assets match the current filters.";
    elements.assetGrid.replaceChildren(empty);
    return;
  }

  elements.assetGrid.replaceChildren(...filtered.map((asset) => assetCard(asset)));
}

function renderSummary() {
  const { counts } = state.manifest;
  elements.assetSummary.textContent = `${counts.assets} files, ${counts.variants} variants, ${counts.platforms} platform groups`;
}

function renderAllAssetViews() {
  renderFilters();
  renderLogos();
  renderShowcases();
  renderButtons();
  renderLoaders();
  renderIconSets();
  renderAssets();
  renderSummary();
}

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}`);
  }

  return response.json();
}

async function boot() {
  const [brand, manifest] = await Promise.all([loadJson("/api/brand"), loadJson("/assets/manifest.json")]);
  state.brand = brand;
  state.manifest = manifest;

  renderDeployActions();
  renderBrandSource();
  renderResources();
  renderSwatches();
  renderAllAssetViews();
}

elements.search.addEventListener("input", (event) => {
  state.query = event.currentTarget.value;
  renderAssets();
});

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-copy]");
  if (!button) return;
  copyText(button.dataset.copy, "Command copied");
});

boot().catch((error) => {
  console.error(error);
  elements.assetGrid.innerHTML = `<div class="empty-state">Brand assets could not be loaded.</div>`;
});
