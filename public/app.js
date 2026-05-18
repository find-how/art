const state = {
  brand: null,
  manifest: null,
  query: "",
  variant: "All",
  platform: "All",
  codeCache: new Map()
};

const elements = {
  deployActions: document.querySelector("#deployActions"),
  deployActionsLarge: document.querySelector("#deployActionsLarge"),
  brandKitSections: document.querySelector("#brandKitSections"),
  sourceHeadline: document.querySelector("#sourceHeadline"),
  sourceSentence: document.querySelector("#sourceSentence"),
  positioningGrid: document.querySelector("#positioningGrid"),
  brandSourceLinks: document.querySelector("#brandSourceLinks"),
  canonicalSnippet: document.querySelector("#canonicalSnippet"),
  experiencePrinciples: document.querySelector("#experiencePrinciples"),
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
  plusDevLink: document.querySelector("#plusDevLink"),
  plusComponentCard: document.querySelector("#plusComponentCard"),
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

let brandKitSectionObserver = null;

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
  "Experience Principles",
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

function createTextElement(tagName, className, text) {
  const node = document.createElement(tagName);
  if (className) node.className = className;
  node.textContent = text || "";
  return node;
}

function assetMatchesFilter(asset, filter = {}) {
  if (filter.types && !filter.types.includes(asset.type)) return false;
  if (filter.families && !filter.families.includes(asset.family)) return false;
  if (filter.platforms && !filter.platforms.includes(asset.platform)) return false;
  if (filter.variants && !filter.variants.includes(asset.variant)) return false;
  if (filter.extensions && !filter.extensions.includes(asset.extension)) return false;
  if (filter.pathPrefix && !asset.path.startsWith(filter.pathPrefix)) return false;
  return true;
}

function assetsForPreview(preview = {}) {
  if (!state.manifest?.assets) return [];

  let assets = [];

  if (preview.paths) {
    assets = preview.paths.map((assetPath) => state.manifest.assets.find((asset) => asset.path === assetPath)).filter(Boolean);
  } else if (preview.filters) {
    const seen = new Set();
    for (const filter of preview.filters) {
      for (const asset of state.manifest.assets.filter((candidate) => assetMatchesFilter(candidate, filter))) {
        if (seen.has(asset.path)) continue;
        seen.add(asset.path);
        assets.push(asset);
      }
    }
  } else if (preview.filter) {
    assets = state.manifest.assets.filter((asset) => assetMatchesFilter(asset, preview.filter));
  }

  return assets.slice(0, preview.limit || assets.length);
}

function createTagList(tags = []) {
  const wrapper = document.createElement("div");
  wrapper.className = "brand-kit-tags";
  wrapper.append(...tags.map((tag) => createTextElement("span", "pill", tag)));
  return wrapper;
}

function createBrandKitAssetTile(asset) {
  const tile = document.createElement("article");
  tile.className = "brand-kit-asset-tile";

  const thumb = document.createElement("div");
  thumb.className = ["brand-kit-asset-thumb", isDarkPreview(asset) ? "dark" : "", isCheckerPreview(asset) ? "checker" : ""]
    .filter(Boolean)
    .join(" ");

  if (isPreviewable(asset)) {
    const image = document.createElement("img");
    image.src = asset.url;
    image.alt = asset.name;
    image.loading = "lazy";
    thumb.append(image);
  } else {
    thumb.append(createTextElement("span", "file-preview", asset.extension));
  }

  const body = document.createElement("div");
  body.className = "brand-kit-asset-body";
  body.append(createTextElement("strong", "", asset.name), createTextElement("span", "path-line", asset.path));

  const actions = document.createElement("div");
  actions.className = "brand-kit-asset-actions";

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

  actions.append(download, copy);
  tile.append(thumb, body, actions);
  return tile;
}

function renderMessagingPreview(preview) {
  const wrapper = document.createElement("div");
  wrapper.className = "brand-kit-message-list";
  const positioning = state.brand?.positioning || {};

  const rows = (preview.fields || []).map((field) => {
    const row = document.createElement("div");
    row.className = "message-row";
    row.append(createTextElement("span", "", field.label), createTextElement("strong", "", positioning[field.key]));
    return row;
  });

  wrapper.append(...rows);
  return wrapper;
}

function renderResourcePreview(preview) {
  const wrapper = document.createElement("div");
  wrapper.className = "brand-kit-source-list";
  const resources = state.brand?.resources || [];
  const requested = new Set(preview.titles || []);

  const links = resources
    .filter((resource) => requested.has(resource.title))
    .map((resource) => {
      const link = document.createElement("a");
      link.className = "source-link";
      link.href = resource.href;
      link.append(createTextElement("strong", "", resource.title), createTextElement("span", "", resource.detail));
      return link;
    });

  wrapper.append(...links);
  return wrapper;
}

function renderCodePreview(preview) {
  const pre = document.createElement("pre");
  pre.className = "branded-code brand-kit-code-preview";
  const code = document.createElement("code");
  code.textContent = preview.snippet === "canonicalCheckoutRoute" ? canonicalSnippet : "";
  pre.append(code);
  return pre;
}

function renderAssetGridPreview(preview) {
  const wrapper = document.createElement("div");
  wrapper.className = "brand-kit-preview-assets";
  const assets = assetsForPreview(preview);

  if (!assets.length) {
    wrapper.append(createTextElement("div", "empty-state", "No matching assets found."));
    return wrapper;
  }

  wrapper.append(...assets.map(createBrandKitAssetTile));
  return wrapper;
}

function renderColorPreview() {
  const wrapper = document.createElement("div");
  wrapper.className = "brand-kit-color-grid";

  const nodes = (state.brand?.colors || []).map((swatch) => {
    const node = document.createElement("button");
    node.type = "button";
    node.className = "brand-kit-color-swatch";
    node.addEventListener("click", () => copyText(swatch.hex, `${swatch.hex} copied`));

    const color = document.createElement("span");
    color.className = "brand-kit-color-chip";
    color.style.background = swatch.hex;

    const body = document.createElement("span");
    body.className = "brand-kit-color-copy";
    body.append(createTextElement("strong", "", swatch.name), createTextElement("span", "", swatch.hex));

    node.append(color, body);
    return node;
  });

  wrapper.append(...nodes);
  return wrapper;
}

function renderTypographyPreview() {
  const wrapper = document.createElement("div");
  wrapper.className = "brand-kit-type-preview";
  wrapper.innerHTML = `
    <div class="type-sample type-sample-display">
      <span>Instrument Sans</span>
      <strong>Write business logic. Ship edge infrastructure.</strong>
    </div>
    <div class="type-sample type-sample-body">
      <span>Product UI</span>
      <p>Pioneer lets developers scan the route, binding inference, terminal feedback, and response state without reading a manual.</p>
    </div>
    <div class="type-sample type-sample-mono">
      <span>Commit Mono</span>
      <code>pioneer deploy --local --smoke /checkout</code>
    </div>
  `;
  return wrapper;
}

function renderStatePreview() {
  const wrapper = document.createElement("div");
  wrapper.className = "brand-kit-state-preview";
  wrapper.innerHTML = `
    <div class="state-button-row" aria-label="Button state examples">
      <button class="state-button" type="button">Default</button>
      <button class="state-button is-hovered" type="button">Hover</button>
      <button class="state-button is-pressed" type="button">Pressed</button>
      <button class="state-button" type="button" disabled>Disabled</button>
    </div>
    <div class="semantic-chip-row" aria-label="Semantic color examples">
      <span class="semantic-chip success">Deploy ready</span>
      <span class="semantic-chip info">201 response</span>
      <span class="semantic-chip warning">Binding missing</span>
      <span class="semantic-chip danger">Check failed</span>
    </div>
  `;
  return wrapper;
}

function renderComponentLinksPreview(preview) {
  const wrapper = document.createElement("div");
  wrapper.className = "brand-kit-component-links";

  const links = (preview.links || []).map((entry) => {
    const link = document.createElement("a");
    link.className = "component-link-card";
    link.href = entry.href;
    link.append(createTextElement("span", "", entry.label), createTextElement("strong", "", entry.detail));
    return link;
  });

  wrapper.append(...links);
  return wrapper;
}

function renderManifestSummaryPreview() {
  const wrapper = document.createElement("div");
  wrapper.className = "brand-kit-manifest-summary";
  const counts = state.manifest?.counts || { assets: 0, variants: 0, platforms: 0 };

  [
    ["Assets", counts.assets],
    ["Variants", counts.variants],
    ["Platform groups", counts.platforms]
  ].forEach(([label, value]) => {
    const stat = document.createElement("div");
    stat.append(createTextElement("span", "", label), createTextElement("strong", "", String(value)));
    wrapper.append(stat);
  });

  const link = document.createElement("a");
  link.className = "button";
  link.href = "#resources";
  link.textContent = "Browse full library";
  wrapper.append(link);
  return wrapper;
}

function renderBrandKitPreview(item) {
  const preview = item.preview || {};

  if (preview.type === "messaging") return renderMessagingPreview(preview);
  if (preview.type === "resources") return renderResourcePreview(preview);
  if (preview.type === "code") return renderCodePreview(preview);
  if (preview.type === "assetGrid") return renderAssetGridPreview(preview);
  if (preview.type === "colors") return renderColorPreview();
  if (preview.type === "typography") return renderTypographyPreview();
  if (preview.type === "states") return renderStatePreview();
  if (preview.type === "componentLinks") return renderComponentLinksPreview(preview);
  if (preview.type === "manifestSummary") return renderManifestSummaryPreview();

  return createTextElement("div", "empty-state", "Preview unavailable.");
}

function codeCacheKey(item) {
  if (item.code?.snippet) return `snippet:${item.code.snippet}`;
  return item.code?.href || item.id;
}

async function sourceTextFor(item) {
  if (!item.code) return "";

  const key = codeCacheKey(item);
  if (state.codeCache.has(key)) return state.codeCache.get(key);

  let value = "";
  if (item.code.snippet === "canonicalCheckoutRoute") {
    value = canonicalSnippet;
  } else if (item.code.href) {
    const response = await fetch(item.code.href);
    if (!response.ok) {
      throw new Error(`${item.code.href} returned ${response.status}`);
    }
    value = await response.text();
  }

  state.codeCache.set(key, value);
  return value;
}

async function loadCodePanel(item, codeNode, statusNode) {
  if (!item.code || codeNode.dataset.loaded === "true") return;

  statusNode.textContent = "Loading source...";
  try {
    const source = await sourceTextFor(item);
    codeNode.textContent = source;
    codeNode.dataset.loaded = "true";
    statusNode.textContent = item.code.label || "Source";
  } catch (error) {
    console.error(error);
    codeNode.textContent = "Source could not be loaded.";
    statusNode.textContent = "Unavailable";
  }
}

async function copyItemCode(item) {
  try {
    const source = await sourceTextFor(item);
    await copyText(source, "Code copied");
  } catch {
    showToast("Source unavailable");
  }
}

function createBrandKitItemActions(item) {
  const actions = document.createElement("div");
  actions.className = "brand-kit-item-actions";

  if (item.primaryHref) {
    const open = document.createElement("a");
    open.className = "button compact";
    open.href = item.primaryHref;
    open.textContent = item.primaryHref.startsWith("#") ? "Open preview" : "Open";
    actions.append(open);
  }

  if (item.code) {
    const copy = document.createElement("button");
    copy.className = "button compact ghost";
    copy.type = "button";
    copy.textContent = "Copy code";
    copy.addEventListener("click", () => copyItemCode(item));
    actions.append(copy);
  }

  if (item.code?.href && item.code.href !== item.primaryHref) {
    const source = document.createElement("a");
    source.className = "button compact ghost";
    source.href = item.code.href;
    source.textContent = "Source";
    actions.append(source);
  }

  return actions;
}

function setBrandKitTab(card, selected, item, codeNode, statusNode) {
  card.querySelectorAll("[data-brand-kit-tab]").forEach((button) => {
    const active = button.dataset.brandKitTab === selected;
    button.setAttribute("aria-selected", String(active));
  });

  card.querySelectorAll("[data-brand-kit-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.brandKitPanel !== selected;
  });

  if (selected === "code") {
    loadCodePanel(item, codeNode, statusNode);
  }
}

function createBrandKitCard(item, section) {
  const card = document.createElement("article");
  card.className = "brand-kit-item-card";

  const header = document.createElement("div");
  header.className = "brand-kit-item-header";
  const copy = document.createElement("div");
  copy.append(createTextElement("h3", "", item.title), createTextElement("p", "", item.description));
  header.append(copy, createTagList(item.tags));

  const panelId = `brand-kit-${section.id}-${item.id}`;
  const tabs = document.createElement("div");
  tabs.className = "brand-kit-tabs";
  tabs.setAttribute("role", "tablist");
  tabs.setAttribute("aria-label", `${item.title} views`);

  const previewTab = document.createElement("button");
  previewTab.type = "button";
  previewTab.id = `${panelId}-preview-tab`;
  previewTab.dataset.brandKitTab = "preview";
  previewTab.setAttribute("role", "tab");
  previewTab.setAttribute("aria-controls", `${panelId}-preview-panel`);
  previewTab.setAttribute("aria-selected", "true");
  previewTab.textContent = "Preview";
  tabs.append(previewTab);

  let codeNode = null;
  let codeStatus = null;

  if (item.code) {
    const codeTab = document.createElement("button");
    codeTab.type = "button";
    codeTab.id = `${panelId}-code-tab`;
    codeTab.dataset.brandKitTab = "code";
    codeTab.setAttribute("role", "tab");
    codeTab.setAttribute("aria-controls", `${panelId}-code-panel`);
    codeTab.setAttribute("aria-selected", "false");
    codeTab.textContent = "Code";
    tabs.append(codeTab);
  }

  const previewPanel = document.createElement("div");
  previewPanel.className = "brand-kit-panel";
  previewPanel.id = `${panelId}-preview-panel`;
  previewPanel.dataset.brandKitPanel = "preview";
  previewPanel.setAttribute("role", "tabpanel");
  previewPanel.setAttribute("aria-labelledby", `${panelId}-preview-tab`);
  previewPanel.append(renderBrandKitPreview(item));

  const panels = [previewPanel];

  if (item.code) {
    const codePanel = document.createElement("div");
    codePanel.className = "brand-kit-panel brand-kit-code-panel";
    codePanel.id = `${panelId}-code-panel`;
    codePanel.dataset.brandKitPanel = "code";
    codePanel.setAttribute("role", "tabpanel");
    codePanel.setAttribute("aria-labelledby", `${panelId}-code-tab`);
    codePanel.hidden = true;

    const codeHeader = document.createElement("div");
    codeHeader.className = "brand-kit-code-header";
    codeStatus = createTextElement("span", "", item.code.label || "Source");
    codeHeader.append(codeStatus);

    const pre = document.createElement("pre");
    codeNode = document.createElement("code");
    codeNode.textContent = "Source will load when this tab is selected.";
    pre.append(codeNode);
    codePanel.append(codeHeader, pre);
    panels.push(codePanel);
  }

  tabs.addEventListener("click", (event) => {
    const selected = event.target.closest("[data-brand-kit-tab]")?.dataset.brandKitTab;
    if (!selected) return;
    setBrandKitTab(card, selected, item, codeNode, codeStatus);
  });

  card.append(header, tabs, ...panels, createBrandKitItemActions(item));
  return card;
}

function setActiveBrandKitSection(id) {
  if (!elements.brandKitSections) return;

  elements.brandKitSections.querySelectorAll(".brand-kit-section-nav a").forEach((link) => {
    const active = link.getAttribute("href") === `#${id}`;
    if (active) {
      link.setAttribute("aria-current", "true");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function initBrandKitSectionObserver(sectionNodes) {
  if (brandKitSectionObserver) {
    brandKitSectionObserver.disconnect();
    brandKitSectionObserver = null;
  }

  if (!sectionNodes.length) return;
  setActiveBrandKitSection(sectionNodes[0].id);

  if (!("IntersectionObserver" in window)) return;

  brandKitSectionObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top));

      if (visible[0]) {
        setActiveBrandKitSection(visible[0].target.id);
      }
    },
    {
      rootMargin: "-30% 0px -55% 0px",
      threshold: [0, 0.2, 0.5]
    }
  );

  sectionNodes.forEach((section) => brandKitSectionObserver.observe(section));
}

function renderBrandKitSections() {
  if (!elements.brandKitSections) return;

  const sections = state.brand?.brandKitSections || [];
  const nav = document.createElement("nav");
  nav.className = "brand-kit-section-nav";
  nav.setAttribute("aria-label", "Brand kit sections");
  nav.append(
    ...sections.map((section) => {
      const link = document.createElement("a");
      link.href = `#brand-kit-${section.id}`;
      link.textContent = section.navLabel || section.title;
      return link;
    })
  );

  const sectionNodes = sections.map((section) => {
    const node = document.createElement("section");
    node.className = "brand-kit-config-section";
    node.id = `brand-kit-${section.id}`;

    const heading = document.createElement("div");
    heading.className = "section-heading";
    const titleBlock = document.createElement("div");
    titleBlock.append(createTextElement("p", "eyebrow", section.eyebrow), createTextElement("h2", "", section.title));
    heading.append(titleBlock, createTextElement("p", "section-note", section.description));

    const grid = document.createElement("div");
    grid.className = "brand-kit-item-grid";
    grid.append(...(section.items || []).map((item) => createBrandKitCard(item, section)));

    node.append(heading, grid);
    return node;
  });

  elements.brandKitSections.replaceChildren(nav, ...sectionNodes);
  initBrandKitSectionObserver(sectionNodes);
}

function renderDeployActions() {
  const actions = state.brand?.deployActions || [];
  if (elements.deployActions) {
    elements.deployActions.replaceChildren(...actions.map((action) => createButton(action)));
  }
  if (elements.deployActionsLarge) {
    elements.deployActionsLarge.replaceChildren(...actions.map((action) => createButton(action)));
  }
}

function renderSwatches() {
  if (!elements.swatchGrid) return;

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
  if (!elements.resourceGrid) return;

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
  if (!elements.sourceHeadline || !elements.sourceSentence || !elements.canonicalSnippet) return;

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

  if (elements.positioningGrid) {
    elements.positioningGrid.replaceChildren(...messageRows);
  }
  if (elements.brandSourceLinks) {
    elements.brandSourceLinks.replaceChildren(...sourceLinks);
  }
}

function renderExperiencePrinciples() {
  if (!elements.experiencePrinciples) return;

  const principles = state.brand?.experiencePrinciples || [];
  const nodes = principles.map((principle, index) => {
    const article = document.createElement("article");
    article.className = "principle-card";

    const marker = document.createElement("span");
    marker.className = "principle-index";
    marker.textContent = String(index + 1).padStart(2, "0");

    const body = document.createElement("div");
    body.className = "principle-body";

    const title = document.createElement("h3");
    title.textContent = principle.title;

    const description = document.createElement("p");
    description.textContent = principle.principle;

    const application = document.createElement("p");
    application.className = "principle-application";
    application.textContent = principle.application;

    body.append(title, description, application);
    article.append(marker, body);
    return article;
  });

  elements.experiencePrinciples.replaceChildren(...nodes);
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
  if (!elements.logoGrid) return;

  const logos = preferredLogoNames
    .map((name) => state.manifest.assets.find((asset) => asset.path === name))
    .filter(Boolean);

  elements.logoGrid.replaceChildren(...logos.map((asset) => assetCard(asset, "logo-card")));
}

function renderCollection(grid, predicate) {
  if (!grid) return;

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
  if (!elements.loaderGrid) return;

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
  if (!elements.iconSetGrid) return;

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
  if (!elements.assetGrid || !elements.visibleCount) return;

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
  if (!elements.assetSummary) return;

  const { counts } = state.manifest;
  elements.assetSummary.textContent = `${counts.assets} files, ${counts.variants} variants, ${counts.platforms} platform groups`;
}

function renderAllAssetViews() {
  renderFilters();
  renderAssets();
  renderSummary();
}

async function renderDevPlusLinks() {
  const targets = [elements.plusDevLink, elements.plusComponentCard].filter(Boolean);
  if (!targets.length) return;

  try {
    const response = await fetch("/api/plus/catalog.json", { cache: "no-store" });
    if (!response.ok) return;

    const catalog = await response.json();
    const count = catalog?.counts?.components;
    if (elements.plusComponentCard && count) {
      elements.plusComponentCard.querySelector("strong").textContent = `${count} Pioneer-branded Tailwind Plus components.`;
    }

    targets.forEach((target) => {
      target.hidden = false;
    });
  } catch {
    targets.forEach((target) => {
      target.hidden = true;
    });
  }
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
  renderExperiencePrinciples();
  renderBrandKitSections();
  renderResources();
  renderSwatches();
  renderAllAssetViews();
  renderDevPlusLinks();
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
