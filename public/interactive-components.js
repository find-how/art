const DEMO_CODE = String.raw`import { Route, DB, Cache, Queue } from "@find-how/pioneer";

Route.post("/checkout", async ({ request }) => {
  const input = await request.json();

  const order = await DB.table("orders").create(input);

  await Cache.set(\`order:\${order.id}\`, order);

  await Queue.dispatch("send-receipt", {
    orderId: order.id,
  });

  return Response.json({ ok: true, order }, { status: 201 });
}).middleware(["auth", "verified"]);`;

const PIONEER_TYPES = String.raw`declare module "@find-how/pioneer" {
  export type HandlerContext = {
    request: Request;
    env: Record<string, unknown>;
  };

  export type RouteHandle = {
    middleware(names: string[]): RouteHandle;
  };

  export const Route: {
    post(path: string, handler: (context: HandlerContext) => Response | Promise<Response>): RouteHandle;
  };

  export const DB: {
    table(name: string): {
      create<T extends Record<string, unknown>>(input: T): Promise<T & { id: string }>;
    };
  };

  export const Cache: {
    set<T>(key: string, value: T): Promise<void>;
    get<T>(key: string): Promise<T | null>;
  };

  export const Queue: {
    dispatch(name: string, payload: Record<string, unknown>): Promise<void>;
  };
}`;

const SNIPPETS = {
  "browser-demo": String.raw`<section class="pioneer-browser-demo">
  <div id="pioneer-editor"></div>
  <div id="pioneer-terminal"></div>
  <button type="button" data-run-pioneer>Run Pioneer feedback</button>
</section>

<script src="https://cdn.jsdelivr.net/npm/monaco-editor@0.52.0/min/vs/loader.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/lib/xterm.min.js"></script>
<script type="module">
  // Register @find-how/pioneer types, create a Monaco editor, then stream
  // compile, binding, Wrangler, and smoke-test output into xterm.
</script>`,
  monaco: String.raw`<div class="pioneer-editor-frame">
  <div class="editor-toolbar">
    <strong>app/routes/web.ts</strong>
    <span>TypeScript</span>
  </div>
  <div id="pioneer-editor"></div>
</div>

<script src="https://cdn.jsdelivr.net/npm/monaco-editor@0.52.0/min/vs/loader.js"></script>
<script>
  require.config({ paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.0/min/vs" } });
  require(["vs/editor/editor.main"], () => {
    monaco.languages.typescript.typescriptDefaults.addExtraLib(PIONEER_TYPES, "file:///node_modules/@find-how/pioneer/index.d.ts");
    monaco.editor.defineTheme("pioneer-findhow", { base: "vs-dark", inherit: true, colors: { "editor.background": "#0a0a0a" } });
    monaco.editor.create(document.getElementById("pioneer-editor"), {
      value: DEMO_CODE,
      language: "typescript",
      theme: "pioneer-findhow",
      automaticLayout: true,
      minimap: { enabled: false },
      fixedOverflowWidgets: true
    });
  });
</script>`,
  xterm: String.raw`<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/css/xterm.min.css">
<div class="pioneer-terminal">
  <div id="pioneer-terminal"></div>
  <button type="button" data-replay-terminal>Replay</button>
</div>
<script src="https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/lib/xterm.min.js"></script>
<script>
  const term = new Terminal({
    cursorBlink: true,
    fontFamily: '"Commit Mono", ui-monospace, SFMono-Regular, Consolas, monospace',
    theme: { background: "#070707", foreground: "#d4d4d4", cursor: "#86efac" }
  });
  term.open(document.getElementById("pioneer-terminal"));
  term.writeln("\\x1b[32m$ pioneer deploy --local\\x1b[0m");
</script>`,
  "edge-artisan": String.raw`type Env = {
  ARTISAN_SESSIONS: DurableObjectNamespace<EdgeArtisanSession>;
  EDGE_ARTISAN_DB?: D1Database;
  EDGE_ARTISAN_KV?: KVNamespace;
  EDGE_ARTISAN_REPORTS?: R2Bucket;
  EDGE_ARTISAN_QUEUE?: Queue;
};

export default {
  async fetch(request: Request, env: Env) {
    const { command, args = [] } = await request.json() as {
      command: string;
      args?: string[];
    };

    const id = env.ARTISAN_SESSIONS.idFromName("artisan:" + command);
    const session = env.ARTISAN_SESSIONS.get(id);

    return session.fetch("https://edge-artisan.local/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ command, args }),
    });
  },
};

export class EdgeArtisanSession {
  constructor(private state: DurableObjectState, private env: Env) {}

  async fetch(request: Request) {
    const { command, args = [] } = await request.json() as {
      command: string;
      args?: string[];
    };

    const encoder = new TextEncoder();
    const emit = (line: string, kind = "normal", status = "streaming") =>
      encoder.encode(JSON.stringify({ line, kind, status }) + "\n");

    const stream = new ReadableStream({
      start: async (controller) => {
        controller.enqueue(emit("$ php artisan " + command + " " + args.join(" "), "command", "booting"));
        await this.state.storage.put("last-run", { command, args });
        controller.enqueue(emit("Durable Object claimed command session", "success", "session"));

        if (this.env.EDGE_ARTISAN_DB) {
          await this.env.EDGE_ARTISAN_DB.prepare("select count(*) as total from orders").first();
          controller.enqueue(emit("D1 query completed", "success", "d1"));
        }

        await caches.default.put(
          new Request("https://edge-artisan.local/commands/" + command),
          new Response(JSON.stringify({ command })),
        );
        controller.enqueue(emit("Cache API warmed command manifest", "success", "cache"));

        await this.env.EDGE_ARTISAN_KV?.put("artisan:last-command", command);
        await this.env.EDGE_ARTISAN_REPORTS?.put("artisan/report.json", JSON.stringify({ command, args }));
        await this.env.EDGE_ARTISAN_QUEUE?.send({ type: "report.ready", command });
        controller.enqueue(emit("KV/R2/Queue adapters completed when bound", "success", "edge"));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { "content-type": "application/x-ndjson; charset=utf-8" },
    });
  }
}`,
  "docs-search": String.raw`<button class="docs-search-trigger" type="button" data-open-search>
  <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20L16.5 16.5"/></svg>
  <span>Search docs</span>
  <kbd>⌘K</kbd>
</button>
<div class="docs-search-modal" hidden>
  <input type="search" placeholder="Search docs">
  <div data-search-results></div>
</div>`,
  "findhow-nav": String.raw`<nav class="findhow-nav">
  <a class="findhow-logo" href="/">Pioneer</a>
  <button data-flyout="platform">Platform</button>
  <button data-flyout="framework">Framework</button>
  <button data-flyout="resources">Resources</button>
  <a href="/docs">Docs</a>
  <button data-open-search>Search docs</button>
  <a href="/deploy">Deploy</a>
  <button data-mobile-menu>Menu</button>
</nav>
<div class="findhow-flyout" hidden></div>
<div class="findhow-mobile-drawer" hidden></div>`
};

const docsItems = [
  { title: "Installation", category: "Getting Started", description: "Create a Pioneer app and run it locally.", url: "/docs/installation" },
  { title: "Routing", category: "Framework", description: "Turn route definitions into Worker HTTP entrypoints.", url: "/docs/routing" },
  { title: "Database", category: "Cloudflare", description: "Use DB calls that map to D1 bindings.", url: "/docs/database" },
  { title: "Queues", category: "Cloudflare", description: "Dispatch background work through Cloudflare Queues.", url: "/docs/queues" },
  { title: "Cache", category: "Cloudflare", description: "Cache results at the edge from application code.", url: "/docs/cache" },
  { title: "Deploy", category: "Operations", description: "Run Wrangler locally, then deploy through Pioneer.", url: "/docs/deploy" }
];

const flyoutData = {
  platform: {
    title: "Platform",
    columns: [
      {
        heading: "Pioneer",
        items: [
          ["Framework", "Full-stack TypeScript for Cloudflare-native apps."],
          ["Deploy", "One-click Wrangler feedback and deploy flow."],
          ["Brand Kit", "Logos, motion, experience rules, and UI components."]
        ]
      },
      {
        heading: "Platform",
        items: [
          ["Worker", "HTTP entrypoint inferred from routes."],
          ["D1", "Database bindings from DB calls."],
          ["Queue", "Background jobs from dispatch calls."]
        ]
      },
      {
        heading: "Proof",
        items: [
          ["Local feedback", "Wrangler run plus smoke request."],
          ["Logs", "Observable request and binding output."],
          ["Deploy button", "Owned Pioneer action, not a generic handoff."]
        ]
      }
    ]
  },
  framework: {
    title: "Framework",
    columns: [
      {
        heading: "Core",
        items: [
          ["Routes", "Business intent becomes Worker routing."],
          ["Middleware", "Auth and verification in the route chain."],
          ["Responses", "Web standard Response objects."]
        ]
      },
      {
        heading: "Services",
        items: [
          ["DB", "D1 tables and migrations."],
          ["Cache", "Edge cache work from code."],
          ["Queue", "Cloudflare Queue producers."]
        ]
      },
      {
        heading: "AI-friendly",
        items: [
          ["Generated code", "Ask AI for the endpoint."],
          ["Typed APIs", "Guide the generated route shape."],
          ["Compiler moat", "Keep the public story product-first."]
        ]
      }
    ]
  },
  resources: {
    title: "Resources",
    columns: [
      {
        heading: "Developers",
        items: [
          ["Documentation", "Guides, APIs, and examples."],
          ["Demo", "Interactive route-to-infrastructure story."],
          ["GitHub", "Repo assets and social preview."]
        ]
      },
      {
        heading: "Launch",
        items: [
          ["Open Graph", "Landing and social cards."],
          ["Pitch deck", "Theme and story slides."],
          ["Launchpad", "Cloudflare Workers one-pager."]
        ]
      },
      {
        heading: "Brand",
        items: [
          ["Logo", "Mark, wordmark, app icons."],
          ["Motion", "AI thinking and deploy loops."],
          ["Experience", "States, hierarchy, dark mode, and semantic color."]
        ]
      }
    ]
  }
};

const siteNavData = {
  platform: {
    title: "Platform",
    columns: [
      {
        heading: "Brand portal",
        items: [
          ["Brand system", "Positioning, messaging, tokens, and source files.", "#brand"],
          ["Experience principles", "Affordances, hierarchy, states, motion, and overlays.", "#experience"],
          ["Components", "Reusable editor, terminal, search, and navigation surfaces.", "#components"],
          ["Deploy", "Wrangler deployment actions for brand.find.how.", "#deploy"]
        ]
      },
      {
        heading: "Assets",
        items: [
          ["Logos", "Core marks, wordmarks, app icons, and platform variants.", "#logos"],
          ["Social cards", "Open Graph, X, LinkedIn, GitHub, and docs templates.", "#social"],
          ["Motion", "Animated product loops and AI loading states.", "#motion"]
        ]
      },
      {
        heading: "Pioneer",
        items: [
          ["Framework", "Build serious TypeScript applications for the edge.", "https://find.how#framework"],
          ["Compiler", "Verify dependency graphs and generate route kernels.", "https://find.how#compiler"],
          ["Desktop", "Local HTTPS, .test DNS, proxying, and app controls.", "https://find.how#desktop"]
        ]
      }
    ]
  },
  framework: {
    title: "Framework",
    columns: [
      {
        heading: "Developer surfaces",
        items: [
          ["Route editor", "Typed Monaco examples for generated Pioneer routes.", "#component-editor"],
          ["Terminal", "Wrangler feedback, compile output, and smoke-test logs.", "#component-terminal"],
          ["Edge CLI", "Artisan-style command sessions through Durable Objects.", "#component-edge-artisan"]
        ]
      },
      {
        heading: "Runtime proof",
        items: [
          ["Routing", "HTTP entry points from expressive route definitions.", "https://find.how#framework"],
          ["D1 and queues", "Infrastructure inferred from business logic calls.", "#patterns"],
          ["Local loop", "Generated app feedback before production deploys.", "#diagrams"]
        ]
      },
      {
        heading: "Docs",
        items: [
          ["Documentation", "Pioneer guides, API notes, and examples.", "https://find.how/docs"],
          ["GitHub", "Source code and issue tracking.", "https://github.com/find-how/pioneer"],
          ["Search", "Open the command palette for docs and assets.", "#resources"]
        ]
      }
    ]
  },
  resources: {
    title: "Resources",
    columns: [
      {
        heading: "Brand kit",
        items: [
          ["Asset library", "Generated manifest and downloadable source assets.", "#resources"],
          ["Experience principles", "Applied UI rules for product and docs surfaces.", "#experience"],
          ["Color tokens", "Pioneer CSS and JSON color tokens.", "#color-system"],
          ["Deploy buttons", "One-click Pioneer deployment button artwork.", "#buttons"]
        ]
      },
      {
        heading: "Launch",
        items: [
          ["Landing hero", "Business-logic-to-edge artwork and copy.", "/assets/brand-kit/assets/landing/landing-page-hero.svg"],
          ["Pitch deck", "Presentation theme and launch framing.", "/assets/brand-kit/assets/pitch-deck/pitch-deck-theme.pptx"],
          ["Launchpad", "Cloudflare Workers one-pager.", "/assets/brand-kit/assets/launchpad/cloudflare-workers-launchpad-one-pager.md"]
        ]
      },
      {
        heading: "External",
        items: [
          ["find.how", "Main Pioneer product site.", "https://find.how"],
          ["Docs", "Framework and platform documentation.", "https://find.how/docs"],
          ["GitHub", "Pioneer organization repositories.", "https://github.com/find-how"]
        ]
      }
    ]
  }
};

const lineFocus = {
  route: { line: 3, className: "pioneer-line-route" },
  database: { line: 6, className: "pioneer-line-database" },
  cache: { line: 8, className: "pioneer-line-cache" },
  queue: { line: 10, className: "pioneer-line-queue" },
  response: { line: 14, className: "pioneer-line-response" },
  auth: { line: 15, className: "pioneer-line-auth" }
};

function showToast(message) {
  const toast = document.querySelector("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toast.classList.remove("visible"), 1800);
}

async function copyText(value, label = "Copied") {
  try {
    await navigator.clipboard.writeText(value);
    showToast(label);
  } catch {
    showToast("Clipboard unavailable");
  }
}

function downloadText(filename, value) {
  const blob = new Blob([value], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function setSnippet(id, key) {
  const node = document.querySelector(`#${id}`);
  if (node) node.textContent = SNIPPETS[key];
}

function initSnippetSurfaces() {
  setSnippet("browserDemoSnippet", "browser-demo");
  setSnippet("monacoComponentSnippet", "monaco");
  setSnippet("xtermComponentSnippet", "xterm");
  setSnippet("edgeArtisanComponentSnippet", "edge-artisan");
  setSnippet("docsSearchComponentSnippet", "docs-search");
  setSnippet("findhowNavComponentSnippet", "findhow-nav");

  const editorPreview = document.querySelector("#editorPreviewCode");
  if (editorPreview) editorPreview.textContent = DEMO_CODE;

  document.addEventListener("click", (event) => {
    const copyButton = event.target.closest("[data-copy-component]");
    if (copyButton) {
      const key = copyButton.dataset.copyComponent;
      copyText(SNIPPETS[key] || "", "Component code copied");
    }

    const downloadButton = event.target.closest("[data-download-component]");
    if (downloadButton) {
      const key = downloadButton.dataset.downloadComponent;
      const extension = key === "edge-artisan" ? "ts" : "html";
      downloadText(`pioneer-${key}.${extension}`, SNIPPETS[key] || "");
    }
  });
}

function initMonacoEditor() {
  const host = document.querySelector("#monacoEditorHost");
  const fallback = document.querySelector("#monacoFallback");
  const frame = host?.closest(".pioneer-editor-frame");
  let decorations = [];
  let editor = null;

  if (!host || !fallback || !frame) return;

  fallback.value = DEMO_CODE;

  function markUnavailable() {
    frame.classList.add("monaco-unavailable");
  }

  if (!window.require) {
    markUnavailable();
    return;
  }

  window.require.config({
    paths: {
      vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.0/min/vs"
    }
  });

  window.require(["vs/editor/editor.main"], () => {
    const tsDefaults = monaco.languages.typescript.typescriptDefaults;
    tsDefaults.setEagerModelSync(true);
    tsDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2022,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      allowNonTsExtensions: true,
      strict: true,
      noImplicitAny: true,
      esModuleInterop: true,
      lib: ["es2022", "dom", "dom.iterable"]
    });
    tsDefaults.setDiagnosticsOptions({
      noSyntaxValidation: false,
      noSemanticValidation: false,
      noSuggestionDiagnostics: false
    });
    tsDefaults.addExtraLib(PIONEER_TYPES, "file:///node_modules/@find-how/pioneer/index.d.ts");

    monaco.editor.defineTheme("pioneer-findhow", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "737373" },
        { token: "keyword", foreground: "c4b5fd" },
        { token: "string", foreground: "86efac" },
        { token: "number", foreground: "7dd3fc" },
        { token: "type", foreground: "a5dbb7" },
        { token: "function", foreground: "fde68a" },
        { token: "delimiter", foreground: "d4d4d4" }
      ],
      colors: {
        "editor.background": "#0a0a0a",
        "editor.foreground": "#e5e5e5",
        "editorLineNumber.foreground": "#525252",
        "editorLineNumber.activeForeground": "#a5dbb7",
        "editorCursor.foreground": "#86efac",
        "editor.selectionBackground": "#244332",
        "editor.inactiveSelectionBackground": "#1b2b22",
        "editor.lineHighlightBackground": "#171717",
        "editorIndentGuide.background1": "#262626",
        "editorIndentGuide.activeBackground1": "#4a9d5f",
        "editorSuggestWidget.background": "#171717",
        "editorSuggestWidget.border": "#262626",
        "editorSuggestWidget.foreground": "#d4d4d4",
        "editorSuggestWidget.selectedBackground": "#244332",
        "editorSuggestWidget.highlightForeground": "#86efac",
        "editorHoverWidget.background": "#171717",
        "editorHoverWidget.border": "#262626",
        "focusBorder": "#4a9d5f",
        "scrollbarSlider.background": "#73737355",
        "scrollbarSlider.hoverBackground": "#73737388"
      }
    });

    const model = monaco.editor.createModel(DEMO_CODE, "typescript", monaco.Uri.parse("file:///app/routes/web.ts"));
    editor = monaco.editor.create(host, {
      model,
      theme: "pioneer-findhow",
      automaticLayout: true,
      fontFamily: '"Commit Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      fontSize: 14,
      lineHeight: 23,
      minimap: { enabled: false },
      padding: { top: 18, bottom: 18 },
      scrollBeyondLastLine: false,
      smoothScrolling: true,
      tabSize: 2,
      insertSpaces: true,
      wordWrap: "on",
      renderLineHighlight: "all",
      renderWhitespace: "selection",
      guides: { indentation: true },
      quickSuggestions: { other: true, comments: false, strings: true },
      suggest: { preview: true, showStatusBar: true, showInlineDetails: true },
      inlineSuggest: { enabled: true },
      inlayHints: { enabled: "on" },
      bracketPairColorization: { enabled: true },
      fixedOverflowWidgets: true,
      overviewRulerBorder: false
    });

    window.pioneerBrandEditor = { editor, model };
  }, markUnavailable);

  document.addEventListener("click", (event) => {
    const action = event.target.closest("[data-editor-action]")?.dataset.editorAction;
    if (!action) return;

    if (action === "reset") {
      if (editor) editor.setValue(DEMO_CODE);
      fallback.value = DEMO_CODE;
      showToast("Editor reset");
    }

    if (action === "format") {
      if (editor) {
        editor.getAction("editor.action.formatDocument")?.run();
      }
      showToast("Format requested");
    }

    const focus = event.target.closest("[data-focus-line]")?.dataset.focusLine;
    if (!focus) return;
  });

  document.querySelectorAll("[data-focus-line]").forEach((button) => {
    button.addEventListener("click", () => {
      const focus = lineFocus[button.dataset.focusLine];
      document.querySelectorAll("[data-focus-line]").forEach((node) => node.classList.remove("is-active"));
      button.classList.add("is-active");
      if (!focus || !editor) return;
      const model = editor.getModel();
      decorations = editor.deltaDecorations(decorations, [
        {
          range: new monaco.Range(focus.line, 1, focus.line, model.getLineMaxColumn(focus.line)),
          options: {
            isWholeLine: true,
            className: focus.className
          }
        }
      ]);
      editor.setPosition({ lineNumber: focus.line, column: 1 });
      editor.revealLineInCenter(focus.line);
    });
  });
}

function createTerminal(hostSelector, fallbackSelector, statusSelector, options = {}) {
  const host = document.querySelector(hostSelector);
  const fallback = document.querySelector(fallbackSelector);
  const status = document.querySelector(statusSelector);
  const frame = host?.closest(".pioneer-terminal-frame");
  let term = null;

  if (!host || !fallback || !frame) {
    return null;
  }

  function setStatus(value) {
    if (status) status.textContent = value;
  }

  function clear() {
    if (term) term.clear();
    fallback.textContent = "";
  }

  function write(text, kind = "normal") {
    const ansi = {
      command: "\x1b[32m",
      success: "\x1b[36m",
      muted: "\x1b[90m",
      warn: "\x1b[33m",
      normal: "\x1b[37m"
    }[kind] || "\x1b[37m";

    if (term) {
      term.writeln(`${ansi}${text}\x1b[0m`);
    } else {
      fallback.textContent += `${text}\n`;
      fallback.scrollTop = fallback.scrollHeight;
    }
  }

  if (window.Terminal) {
    term = new window.Terminal({
      cursorBlink: true,
      convertEol: true,
      disableStdin: true,
      fontFamily: '"Commit Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      fontSize: 13,
      lineHeight: 1.45,
      rows: options.rows || 18,
      theme: {
        background: "#070707",
        foreground: "#d4d4d4",
        cursor: "#86efac",
        green: "#86efac",
        cyan: "#7dd3fc",
        yellow: "#fde68a",
        red: "#fca5a5",
        brightBlack: "#737373"
      }
    });
    term.open(host);
  } else {
    frame.classList.add("xterm-unavailable");
  }

  setStatus("ready");
  write(options.initialCommand || "$ pioneer deploy --local", "command");
  write(options.readyLine || "ready for generated app input", "muted");

  return { clear, write, setStatus };
}

const terminalLines = [
  ["$ pioneer compile app/routes/web.ts", "command", "compiling"],
  ["✓ Route.post('/checkout') -> Worker HTTP entrypoint", "success", "route"],
  ["✓ DB.table('orders') -> D1 binding checkout-db", "success", "bindings"],
  ["✓ Cache.set('order:*') -> edge cache policy", "success", "cache"],
  ["✓ Queue.dispatch('send-receipt') -> Cloudflare Queue producer", "success", "queue"],
  ["wrangler dev --local --persist", "command", "wrangler"],
  ["POST /checkout smoke request", "muted", "probing"],
  ["201 Created { ok: true, order: { id: 'ord_1042' } }", "success", "live"]
];

const artisanTerminalLines = [
  ["$ php artisan edge:report orders --queue", "command", "booting"],
  ["Worker POST /__artisan accepted command envelope", "muted", "worker"],
  ["Durable Object ARTISAN_SESSIONS.idFromName('artisan:edge:report')", "success", "session"],
  ["session lock acquired; command stream opened", "success", "streaming"],
  ["D1 prepare: select count(*) as total from orders", "command", "d1"],
  ["KV put artisan:last-command=edge:report", "success", "kv"],
  ["Cache API warmed command discovery manifest", "success", "cache"],
  ["R2 put artisan/orders-report.json", "success", "r2"],
  ["Queue send report.ready for async delivery", "success", "queue"],
  ["console.log edge.artisan.completed duration=184ms", "muted", "logs"],
  ["Command finished successfully. Edge CLI output streamed to xterm.", "success", "complete"]
];

function runTerminalSequence(terminal, runButton = null, lines = terminalLines, finalStatus = "201 created") {
  if (!terminal) return;
  terminal.clear();
  terminal.setStatus("running");
  runButton?.setAttribute("aria-busy", "true");

  lines.forEach(([text, kind, status], index) => {
    window.setTimeout(() => {
      terminal.setStatus(status);
      terminal.write(text, kind);
      if (index === lines.length - 1) {
        terminal.setStatus(finalStatus);
        runButton?.removeAttribute("aria-busy");
      }
    }, index * 520);
  });
}

function parseTerminalEvent(rawLine) {
  try {
    const event = JSON.parse(rawLine);
    return {
      line: String(event.line || ""),
      kind: event.kind || "normal",
      status: event.status || "streaming"
    };
  } catch {
    return {
      line: rawLine,
      kind: "normal",
      status: "streaming"
    };
  }
}

async function runArtisanWorkerStream(terminal, runButton = null) {
  if (!terminal) return;

  terminal.clear();
  terminal.setStatus("posting");
  runButton?.setAttribute("aria-busy", "true");

  try {
    const response = await fetch("/__artisan", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        command: "edge:report",
        args: ["orders", "--queue"]
      })
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    if (!response.body) {
      throw new Error("Worker response did not include a stream.");
    }

    terminal.setStatus("streaming");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffered = "";

    while (true) {
      const { value, done } = await reader.read();
      buffered += decoder.decode(value || new Uint8Array(), { stream: !done });

      const lines = buffered.split("\n");
      buffered = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;
        const event = parseTerminalEvent(line);
        terminal.setStatus(event.status);
        terminal.write(event.line, event.kind);
      }

      if (done) break;
    }

    if (buffered.trim()) {
      const event = parseTerminalEvent(buffered);
      terminal.setStatus(event.status);
      terminal.write(event.line, event.kind);
    }

    terminal.setStatus("complete");
  } catch (error) {
    terminal.setStatus("fallback");
    terminal.write(`Worker stream unavailable: ${error.message}`, "warn");
    terminal.write("Falling back to scripted Edge Artisan playback.", "muted");
    runTerminalSequence(terminal, runButton, artisanTerminalLines, "complete");
    return;
  } finally {
    runButton?.removeAttribute("aria-busy");
  }
}

function initTerminals() {
  const demoTerminal = createTerminal("#demoTerminalHost", "#demoTerminalFallback", "#demoTerminalStatus");
  const componentTerminal = createTerminal("#componentTerminalHost", "#componentTerminalFallback", "#componentTerminalStatus");
  const artisanTerminal = createTerminal("#artisanTerminalHost", "#artisanTerminalFallback", "#artisanTerminalStatus", {
    initialCommand: "$ php artisan edge:report orders --queue",
    readyLine: "ready to run artisan through Worker + Durable Object",
    rows: 20
  });

  document.querySelector("#runBrowserDemo")?.addEventListener("click", (event) => {
    runTerminalSequence(demoTerminal, event.currentTarget);
  });

  document.querySelector("#replayTerminalDemo")?.addEventListener("click", () => {
    runTerminalSequence(componentTerminal);
  });

  document.querySelector("#clearTerminalDemo")?.addEventListener("click", () => {
    componentTerminal?.clear();
    componentTerminal?.setStatus("ready");
  });

  document.querySelector("#runArtisanDemo")?.addEventListener("click", (event) => {
    runArtisanWorkerStream(artisanTerminal, event.currentTarget);
  });

  document.querySelector("#clearArtisanDemo")?.addEventListener("click", () => {
    artisanTerminal?.clear();
    artisanTerminal?.setStatus("ready");
  });
}

function groupByCategory(items) {
  return items.reduce((groups, item) => {
    groups[item.category] ||= [];
    groups[item.category].push(item);
    return groups;
  }, {});
}

function initDocsSearch() {
  const modal = document.querySelector("#docsSearchModal");
  const input = document.querySelector("#docsSearchInput");
  const results = document.querySelector("#docsSearchResults");
  if (!modal || !input || !results) return;

  function openSearch() {
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    input.focus();
    renderResults(input.value);
  }

  function closeSearch() {
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
  }

  function renderResults(query) {
    const normalized = query.trim().toLowerCase();
    const matches = normalized
      ? docsItems.filter((item) => [item.title, item.category, item.description].join(" ").toLowerCase().includes(normalized))
      : docsItems.slice(0, 4);

    if (!matches.length) {
      const empty = document.createElement("div");
      empty.className = "docs-search-empty";
      empty.textContent = "No docs matched that search.";
      results.replaceChildren(empty);
      return;
    }

    const groups = groupByCategory(matches);
    const nodes = Object.entries(groups).map(([category, items]) => {
      const group = document.createElement("section");
      group.className = "search-result-group";
      const heading = document.createElement("h3");
      heading.textContent = category;
      group.append(heading);

      items.forEach((item, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "search-result-item";
        button.setAttribute("aria-selected", String(index === 0));

        const title = document.createElement("strong");
        title.textContent = item.title;
        const detail = document.createElement("span");
        detail.textContent = item.description;
        button.append(title, detail);
        button.addEventListener("click", () => {
          window.localStorage.setItem("pioneer-last-doc-search", JSON.stringify(item));
          closeSearch();
          showToast(`${item.title} selected`);
        });
        group.append(button);
      });

      return group;
    });

    results.replaceChildren(...nodes);
  }

  document.querySelector("#docsSearchTrigger")?.addEventListener("click", openSearch);
  document.querySelectorAll("[data-open-search]").forEach((button) => button.addEventListener("click", openSearch));
  document.querySelectorAll("[data-close-search]").forEach((button) => button.addEventListener("click", closeSearch));
  input.addEventListener("input", () => renderResults(input.value));

  document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if ((event.metaKey || event.ctrlKey) && key === "k") {
      event.preventDefault();
      openSearch();
    }

    if (event.key === "Escape" && !modal.hidden) {
      closeSearch();
    }
  });

  renderResults("");
}

function initSiteNavigation() {
  const header = document.querySelector("#siteHeader");
  const flyout = document.querySelector("#siteFlyout");
  const triggers = Array.from(document.querySelectorAll("[data-site-flyout]"));
  const drawer = document.querySelector("#siteMobileDrawer");
  const openButton = document.querySelector("#openSiteMenu");
  const tabs = drawer?.querySelector(".site-mobile-tabs");
  const content = drawer?.querySelector(".site-mobile-content");
  if (!header || !flyout || !drawer || !openButton || !tabs || !content || !triggers.length) return;

  let activeKind = "platform";
  let closeTimer = 0;

  function clearCloseTimer() {
    window.clearTimeout(closeTimer);
  }

  function setTriggerState(kind = null) {
    triggers.forEach((trigger) => {
      trigger.setAttribute("aria-expanded", String(trigger.dataset.siteFlyout === kind));
    });
  }

  function renderFlyout(kind) {
    const data = siteNavData[kind];
    if (!data) return;

    const grid = document.createElement("div");
    grid.className = "site-flyout-grid";

    data.columns.forEach((column) => {
      const columnNode = document.createElement("section");
      columnNode.className = "site-flyout-column";

      const heading = document.createElement("h3");
      heading.textContent = column.heading;
      columnNode.append(heading);

      column.items.forEach(([title, detail, href]) => {
        const link = document.createElement("a");
        link.href = href;
        link.className = "site-flyout-item";

        const label = document.createElement("strong");
        label.textContent = title;
        const text = document.createElement("span");
        text.textContent = detail;
        link.append(label, text);
        link.addEventListener("click", closeFlyout);
        columnNode.append(link);
      });

      grid.append(columnNode);
    });

    flyout.replaceChildren(grid);
    flyout.hidden = false;
    setTriggerState(kind);
  }

  function openFlyout(kind) {
    clearCloseTimer();
    activeKind = kind;
    renderFlyout(kind);
  }

  function closeFlyout() {
    flyout.hidden = true;
    flyout.replaceChildren();
    setTriggerState(null);
  }

  function scheduleCloseFlyout() {
    clearCloseTimer();
    closeTimer = window.setTimeout(() => {
      if (!header.matches(":hover") && !flyout.matches(":hover")) closeFlyout();
    }, 160);
  }

  function renderMobileContent() {
    const data = siteNavData[activeKind];
    if (!data) return;

    tabs.replaceChildren(
      ...Object.entries(siteNavData).map(([key, value]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = value.title;
        button.setAttribute("aria-selected", String(key === activeKind));
        button.addEventListener("click", () => {
          activeKind = key;
          renderMobileContent();
        });
        return button;
      })
    );

    const groups = data.columns.map((column) => {
      const group = document.createElement("section");
      group.className = "site-mobile-group";

      const heading = document.createElement("h3");
      heading.textContent = column.heading;
      group.append(heading);

      column.items.forEach(([title, detail, href]) => {
        const link = document.createElement("a");
        link.href = href;
        link.className = "site-mobile-item";

        const label = document.createElement("strong");
        label.textContent = title;
        const text = document.createElement("span");
        text.textContent = detail;
        link.append(label, text);
        link.addEventListener("click", closeSiteMenu);
        group.append(link);
      });

      return group;
    });

    content.replaceChildren(...groups);
  }

  function openSiteMenu() {
    renderMobileContent();
    drawer.hidden = false;
    drawer.setAttribute("aria-hidden", "false");
    openButton.setAttribute("aria-expanded", "true");
    document.body.classList.add("site-nav-open");
  }

  function closeSiteMenu() {
    drawer.hidden = true;
    drawer.setAttribute("aria-hidden", "true");
    openButton.setAttribute("aria-expanded", "false");
    document.body.classList.remove("site-nav-open");
  }

  triggers.forEach((trigger) => {
    const kind = trigger.dataset.siteFlyout;
    trigger.addEventListener("mouseenter", () => openFlyout(kind));
    trigger.addEventListener("focus", () => openFlyout(kind));
    trigger.addEventListener("click", (event) => {
      event.stopPropagation();
      if (!flyout.hidden && activeKind === kind) {
        closeFlyout();
      } else {
        openFlyout(kind);
      }
    });
  });

  flyout.addEventListener("mouseenter", clearCloseTimer);
  flyout.addEventListener("mouseleave", scheduleCloseFlyout);
  header.addEventListener("mouseleave", scheduleCloseFlyout);
  openButton.addEventListener("click", openSiteMenu);

  drawer.querySelectorAll("[data-close-site-menu]").forEach((control) => {
    control.addEventListener("click", closeSiteMenu);
  });

  document.addEventListener("click", (event) => {
    if (!header.contains(event.target)) closeFlyout();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeFlyout();
      closeSiteMenu();
    }
  });

  window.addEventListener("scroll", closeFlyout, { passive: true });
}

function renderFlyout(kind) {
  const flyout = document.querySelector("#findhowFlyout");
  const data = flyoutData[kind];
  if (!flyout || !data) return;

  const grid = document.createElement("div");
  grid.className = "flyout-grid";

  data.columns.forEach((column) => {
    const columnNode = document.createElement("section");
    columnNode.className = "flyout-column";
    const heading = document.createElement("h3");
    heading.textContent = column.heading;
    columnNode.append(heading);

    column.items.forEach(([title, detail]) => {
      const link = document.createElement("a");
      link.href = "#resources";
      link.className = "flyout-item";
      const strong = document.createElement("strong");
      strong.textContent = title;
      const span = document.createElement("span");
      span.textContent = detail;
      link.append(strong, span);
      columnNode.append(link);
    });

    grid.append(columnNode);
  });

  flyout.replaceChildren(grid);
  flyout.hidden = false;
}

function initNavigationDemo() {
  const demo = document.querySelector("#findhowNavDemo");
  const flyout = document.querySelector("#findhowFlyout");
  const drawer = document.querySelector("#mobileNavDrawer");
  const tabs = drawer?.querySelector(".mobile-nav-tabs");
  const content = drawer?.querySelector(".mobile-nav-content");
  if (!demo || !flyout || !drawer || !tabs || !content) return;

  let activeMobileTab = "platform";

  demo.querySelectorAll("[data-flyout]").forEach((button) => {
    button.addEventListener("mouseenter", () => renderFlyout(button.dataset.flyout));
    button.addEventListener("click", () => renderFlyout(button.dataset.flyout));
  });

  demo.addEventListener("mouseleave", () => {
    window.setTimeout(() => {
      if (!demo.matches(":hover")) flyout.hidden = true;
    }, 180);
  });

  function renderMobileContent() {
    const data = flyoutData[activeMobileTab];
    tabs.replaceChildren(
      ...Object.keys(flyoutData).map((key) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = flyoutData[key].title;
        button.setAttribute("aria-selected", String(key === activeMobileTab));
        button.addEventListener("click", () => {
          activeMobileTab = key;
          renderMobileContent();
        });
        return button;
      })
    );

    const groups = data.columns.map((column) => {
      const group = document.createElement("section");
      group.className = "mobile-nav-group";
      const heading = document.createElement("h3");
      heading.textContent = column.heading;
      group.append(heading);
      column.items.forEach(([title, detail]) => {
        const link = document.createElement("a");
        link.href = "#resources";
        link.className = "mobile-nav-item";
        const strong = document.createElement("strong");
        strong.textContent = title;
        const span = document.createElement("span");
        span.textContent = detail;
        link.append(strong, span);
        group.append(link);
      });
      return group;
    });

    content.replaceChildren(...groups);
  }

  function openMobileNav() {
    renderMobileContent();
    drawer.hidden = false;
    drawer.setAttribute("aria-hidden", "false");
  }

  function closeMobileNav() {
    drawer.hidden = true;
    drawer.setAttribute("aria-hidden", "true");
  }

  document.querySelector("#openMobileNav")?.addEventListener("click", openMobileNav);
  document.querySelector("#closeMobileNav")?.addEventListener("click", closeMobileNav);
  document.querySelector("#closeMobileNavBackdrop")?.addEventListener("click", closeMobileNav);
}

initSnippetSurfaces();
initMonacoEditor();
initTerminals();
initSiteNavigation();
initDocsSearch();
initNavigationDemo();
