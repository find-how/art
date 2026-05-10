import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const colors = {
  ink: "#161A17",
  black: "#0A0A0A",
  forest: "#2D7A3E",
  leaf: "#4A9D5F",
  sprout: "#7CB342",
  soft: "#A5DBB7",
  mist: "#F4F7EF",
  gold: "#D9A441",
  slate: "#456275",
  sky: "#0284C7",
  line: "#DCE5D7",
  paper: "#FFFFFF"
};

const codeLines = [
  "Route.post('/checkout', async ({ request, DB, Queue, Cache }) => {",
  "  const order = await DB.table('orders').create(await request.json())",
  "  Cache.set(`order:${order.id}`, order, { ttl: 60 * 15 })",
  "  await Queue.dispatch('send-receipt', { orderId: order.id })",
  "  return Response.json(order, { status: 201 })",
  "}).middleware(['auth', 'verified'])"
];

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function bird(x = 0, y = 0, scale = 1, id = "bird") {
  return `
  <g transform="translate(${x} ${y}) scale(${scale})">
    <defs>
      <linearGradient id="${id}-g" x1="8" y1="17" x2="500" y2="493" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="${colors.forest}"/>
        <stop offset=".52" stop-color="${colors.leaf}"/>
        <stop offset="1" stop-color="${colors.sprout}"/>
      </linearGradient>
      <linearGradient id="${id}-w" x1="230" y1="50" x2="500" y2="170" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="${colors.leaf}"/>
        <stop offset="1" stop-color="#B8EA4F"/>
      </linearGradient>
    </defs>
    <path fill="url(#${id}-g)" d="M8 110 46 73 46 110Z"/>
    <path fill="url(#${id}-g)" d="M56 66H96L170 153 133 190H56Z"/>
    <path fill="url(#${id}-g)" d="M150 190 305 26 305 190Z"/>
    <path fill="url(#${id}-w)" d="M317 17 486 23 317 177Z"/>
    <path fill="url(#${id}-w)" d="M421 99 500 55 474 46Z"/>
    <path fill="url(#${id}-g)" d="M64 202H303L237 383Z"/>
    <path fill="url(#${id}-g)" d="M307 229 306 493 227 440Z"/>
  </g>`;
}

function background(width, height, id, dark = false) {
  const base = dark ? colors.black : colors.mist;
  const grid = dark ? "rgba(255,255,255,.055)" : "rgba(22,26,23,.055)";
  return `
  <defs>
    <linearGradient id="${id}-bg" x1="0" y1="0" x2="${width}" y2="${height}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${base}"/>
      <stop offset=".58" stop-color="${dark ? "#101A13" : "#FFFFFF"}"/>
      <stop offset="1" stop-color="${dark ? "#183522" : "#EAF2E4"}"/>
    </linearGradient>
    <radialGradient id="${id}-glow-a" cx="22%" cy="18%" r="55%">
      <stop offset="0" stop-color="${colors.soft}" stop-opacity="${dark ? ".22" : ".34"}"/>
      <stop offset="1" stop-color="${colors.soft}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="${id}-glow-b" cx="86%" cy="86%" r="48%">
      <stop offset="0" stop-color="${colors.gold}" stop-opacity="${dark ? ".22" : ".20"}"/>
      <stop offset="1" stop-color="${colors.gold}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="${id}-grid" width="42" height="42" patternUnits="userSpaceOnUse">
      <path d="M42 0H0V42" fill="none" stroke="${grid}" stroke-width="1"/>
    </pattern>
    <filter id="${id}-shadow" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="22" stdDeviation="24" flood-color="#0A0A0A" flood-opacity="${dark ? ".46" : ".20"}"/>
    </filter>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#${id}-bg)"/>
  <rect width="${width}" height="${height}" fill="url(#${id}-glow-a)"/>
  <rect width="${width}" height="${height}" fill="url(#${id}-glow-b)"/>
  <rect width="${width}" height="${height}" fill="url(#${id}-grid)"/>`;
}

function label(x, y, text, fill = colors.forest) {
  return `<text x="${x}" y="${y}" fill="${fill}" font-family="Inter, Instrument Sans, Arial, sans-serif" font-size="24" font-weight="800" letter-spacing="0">${esc(text)}</text>`;
}

function multiline({ x, y, lines, size, weight = 800, fill = colors.ink, lineHeight = 1.08, family = "Inter, Instrument Sans, Arial, sans-serif" }) {
  return lines
    .map((line, index) => `<text x="${x}" y="${y + index * size * lineHeight}" fill="${fill}" font-family="${family}" font-size="${size}" font-weight="${weight}" letter-spacing="0">${esc(line)}</text>`)
    .join("\n");
}

function codeBlock(x, y, width, id, options = {}) {
  const lineHeight = options.lineHeight || 34;
  const height = 74 + codeLines.length * lineHeight;
  const lines = codeLines
    .map((line, index) => {
      const ly = y + 72 + index * lineHeight;
      const color = index === 0 ? "#7DD3FC" : index === 1 ? "#86EFAC" : index === 2 ? "#FACC15" : index === 3 ? "#38BDF8" : index === 4 ? "#FB923C" : "#A5DBB7";
      return `
      <rect x="${x + 20}" y="${ly - 22}" width="${index === 0 ? width - 70 : width - 120}" height="28" rx="6" fill="${color}" opacity=".09"/>
      <text x="${x + 30}" y="${ly}" fill="${color}" font-family="Commit Mono, SFMono-Regular, Consolas, monospace" font-size="19" font-weight="700">${esc(line)}</text>`;
    })
    .join("");

  return `
  <g filter="url(#${id}-shadow)">
    <clipPath id="${id}-codeclip">
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="18"/>
    </clipPath>
    <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="18" fill="#0A0A0A" stroke="#262626"/>
    <rect x="${x}" y="${y}" width="${width}" height="48" rx="18" fill="#171717"/>
    <circle cx="${x + 26}" cy="${y + 24}" r="6" fill="#EF4444"/>
    <circle cx="${x + 48}" cy="${y + 24}" r="6" fill="#F59E0B"/>
    <circle cx="${x + 70}" cy="${y + 24}" r="6" fill="#22C55E"/>
    <text x="${x + 96}" y="${y + 31}" fill="#A5DBB7" font-family="Commit Mono, SFMono-Regular, Consolas, monospace" font-size="16" font-weight="700">app/routes/web.ts</text>
    <g clip-path="url(#${id}-codeclip)">
      ${lines}
    </g>
  </g>`;
}

function terminalBlock(x, y, width, id) {
  const lines = [
    ["$ pioneer deploy app/routes/web.ts --local", "#86EFAC"],
    ["Analyzing Route.post('/checkout')", "#D4D4D4"],
    ["Inferred services: Worker, D1, Cache, Queue, Auth", "#7DD3FC"],
    ["D1 migrations applied locally: checkout-db", "#86EFAC"],
    ["Ready on http://127.0.0.1:8789", "#86EFAC"],
    ["HTTP/1.1 201 Created", "#7DD3FC"]
  ];

  return `
  <g filter="url(#${id}-shadow)">
    <clipPath id="${id}-termclip">
      <rect x="${x}" y="${y}" width="${width}" height="300" rx="18"/>
    </clipPath>
    <rect x="${x}" y="${y}" width="${width}" height="300" rx="18" fill="#070707" stroke="#262626"/>
    <rect x="${x}" y="${y}" width="${width}" height="50" rx="18" fill="#171717"/>
    <circle cx="${x + 26}" cy="${y + 25}" r="6" fill="#EF4444"/>
    <circle cx="${x + 48}" cy="${y + 25}" r="6" fill="#F59E0B"/>
    <circle cx="${x + 70}" cy="${y + 25}" r="6" fill="#22C55E"/>
    <text x="${x + 96}" y="${y + 32}" fill="#A3A3A3" font-family="Commit Mono, SFMono-Regular, Consolas, monospace" font-size="16" font-weight="700">pioneer deploy --local</text>
    <g clip-path="url(#${id}-termclip)">
      ${lines.map(([line, fill], index) => `<text x="${x + 28}" y="${y + 88 + index * 34}" fill="${fill}" font-family="Commit Mono, SFMono-Regular, Consolas, monospace" font-size="18" font-weight="700">${esc(line)}</text>`).join("\n")}
    </g>
  </g>`;
}

function socialCard({ file, width, height, title, subtitle, kicker, dark = false, mode = "code" }) {
  const id = file.replace(/[^a-z0-9]/gi, "-");
  const textFill = dark ? "#FFFFFF" : colors.ink;
  const muted = dark ? "#B7C8B7" : "#4B554C";
  const square = height / width > .92;
  const titleSize = square ? 64 : width > 1300 ? 78 : 58;
  const mediaX = square ? Math.round(width * .52) : Math.round(width * .60);
  const mediaY = square ? Math.round(height * .22) : Math.round(height * .23);
  const mediaWidth = square ? Math.round(width * .40) : Math.round(width * .32);
  const card = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">Pioneer ${esc(title.join(" "))}</title>
  <desc id="desc">${esc(subtitle)}</desc>
  ${background(width, height, id, dark)}
  ${bird(width - 260, height - 250, .42, `${id}-bird`)}
  <rect x="${Math.round(width * .055)}" y="${Math.round(height * .085)}" width="${Math.round(width * .89)}" height="${Math.round(height * .83)}" rx="28" fill="${dark ? "rgba(10,10,10,.44)" : "rgba(255,255,255,.66)"}" stroke="${dark ? "rgba(255,255,255,.12)" : "rgba(22,26,23,.10)"}"/>
  ${label(Math.round(width * .09), Math.round(height * .17), kicker, dark ? colors.soft : colors.forest)}
  ${multiline({ x: Math.round(width * .09), y: Math.round(height * .31), lines: title, size: titleSize, fill: textFill, lineHeight: .98 })}
  <text x="${Math.round(width * .09)}" y="${Math.round(height * .69)}" fill="${muted}" font-family="Inter, Instrument Sans, Arial, sans-serif" font-size="${Math.round(width > 1300 ? 31 : 26)}" font-weight="650">${esc(subtitle)}</text>
  ${mode === "terminal" ? terminalBlock(mediaX, mediaY, mediaWidth, id) : codeBlock(mediaX, mediaY, mediaWidth, id, { lineHeight: width > 1300 ? 33 : 29 })}
  <text x="${Math.round(width * .09)}" y="${Math.round(height * .84)}" fill="${dark ? "#DCE5D7" : colors.ink}" font-family="Commit Mono, SFMono-Regular, Consolas, monospace" font-size="${Math.round(width > 1300 ? 22 : 18)}" font-weight="700">find.how/pioneer</text>
</svg>`;
  return [path.join("social", file), card];
}

function diagram({ file, title, subtitle, steps, kind }) {
  const id = file.replace(/[^a-z0-9]/gi, "-");
  const width = 1440;
  const height = 900;
  const stepWidth = 236;
  const startX = 120;
  const y = 420;
  const stepSvg = steps.map((step, index) => {
    const x = startX + index * 255;
    const active = index % 2 === 0;
    const accent = [colors.leaf, colors.sky, colors.gold, colors.sprout, colors.slate][index % 5];
    return `
    <g>
      <rect x="${x}" y="${y}" width="${stepWidth}" height="154" rx="18" fill="${active ? "#FFFFFF" : "#F8FAF5"}" stroke="${accent}" stroke-opacity=".42"/>
      <circle cx="${x + 36}" cy="${y + 40}" r="16" fill="${accent}" opacity=".18"/>
      <circle cx="${x + 36}" cy="${y + 40}" r="7" fill="${accent}"/>
      <text x="${x + 62}" y="${y + 45}" fill="${colors.ink}" font-family="Inter, Instrument Sans, Arial, sans-serif" font-size="24" font-weight="800">${esc(step.title)}</text>
      <text x="${x + 24}" y="${y + 92}" fill="#59645A" font-family="Inter, Instrument Sans, Arial, sans-serif" font-size="18" font-weight="650">${esc(step.detail)}</text>
      ${index < steps.length - 1 ? `<path d="M${x + stepWidth + 18} ${y + 76}H${x + stepWidth + 55}" stroke="${colors.forest}" stroke-width="5" stroke-linecap="round"/><path d="M${x + stepWidth + 55} ${y + 76}l-13-10v20Z" fill="${colors.forest}"/>` : ""}
    </g>`;
  }).join("");

  const extra = kind === "stack" ? `
    <g transform="translate(170 642)">
      ${["Worker", "D1", "Cache", "Queue", "Auth", "Logs"].map((item, index) => `<rect x="${index * 178}" y="0" width="148" height="62" rx="31" fill="${index % 2 ? colors.ink : colors.forest}"/><text x="${index * 178 + 74}" y="39" text-anchor="middle" fill="#fff" font-family="Commit Mono, SFMono-Regular, Consolas, monospace" font-size="19" font-weight="800">${item}</text>`).join("")}
    </g>` : `
    <path d="M176 674 C394 762 712 760 1014 662 C1120 628 1207 604 1280 626" fill="none" stroke="${colors.gold}" stroke-width="8" stroke-linecap="round" stroke-dasharray="18 20" opacity=".66"/>`;

  return [path.join("diagrams", file), `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">${esc(title)}</title>
  <desc id="desc">${esc(subtitle)}</desc>
  ${background(width, height, id, false)}
  ${bird(1060, 82, .42, `${id}-bird`)}
  ${label(118, 128, "Pioneer Diagram", colors.forest)}
  ${multiline({ x: 118, y: 236, lines: [title], size: 70, fill: colors.ink })}
  <text x="120" y="304" fill="#59645A" font-family="Inter, Instrument Sans, Arial, sans-serif" font-size="28" font-weight="650">${esc(subtitle)}</text>
  ${stepSvg}
  ${extra}
</svg>`];
}

function patternEditor() {
  return [path.join("patterns", "editor-frame.svg"), `
<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="900" viewBox="0 0 1440 900" role="img" aria-labelledby="title desc">
  <title id="title">Pioneer editor frame</title>
  <desc id="desc">Reusable brand pattern for AI-generated code in Monaco-style editor chrome.</desc>
  ${background(1440, 900, "pattern-editor", true)}
  ${label(96, 108, "Pattern / Editor", colors.soft)}
  ${multiline({ x: 96, y: 210, lines: ["Generated code", "to edge services"], size: 74, fill: "#FFFFFF", lineHeight: .98 })}
  ${codeBlock(560, 128, 760, "pattern-editor", { lineHeight: 38 })}
  <g transform="translate(96 610)">
    ${["Route", "D1", "Cache", "Queue", "Auth"].map((item, index) => `<rect x="${index * 136}" y="0" width="112" height="54" rx="27" fill="${index % 2 ? colors.slate : colors.forest}"/><text x="${index * 136 + 56}" y="35" text-anchor="middle" fill="#fff" font-family="Commit Mono, SFMono-Regular, Consolas, monospace" font-size="18" font-weight="800">${item}</text>`).join("")}
  </g>
</svg>`];
}

function patternTerminal() {
  return [path.join("patterns", "terminal-deploy-frame.svg"), `
<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="900" viewBox="0 0 1440 900" role="img" aria-labelledby="title desc">
  <title id="title">Pioneer terminal deploy frame</title>
  <desc id="desc">Reusable brand pattern for deployment terminal playback.</desc>
  ${background(1440, 900, "pattern-terminal", false)}
  ${label(96, 108, "Pattern / Terminal", colors.forest)}
  ${multiline({ x: 96, y: 210, lines: ["Local Wrangler", "feedback loop"], size: 78, fill: colors.ink, lineHeight: .98 })}
  ${terminalBlock(606, 140, 700, "pattern-terminal")}
  <g transform="translate(96 612)">
    ${["Compile", "Bind", "Data", "Observe", "Run"].map((item, index) => `<rect x="${index * 142}" y="0" width="118" height="60" rx="12" fill="${index < 4 ? "#FFFFFF" : colors.forest}" stroke="${colors.line}"/><text x="${index * 142 + 59}" y="38" text-anchor="middle" fill="${index < 4 ? colors.ink : "#FFFFFF"}" font-family="Inter, Instrument Sans, Arial, sans-serif" font-size="18" font-weight="800">${item}</text>`).join("")}
  </g>
</svg>`];
}

function patternPrompts() {
  const questions = [
    ["What did AI write?", "Show the endpoint"],
    ["Where is the server?", "Highlight Route.post"],
    ["Where do services come from?", "DB, Cache, Queue"],
    ["How is checkout protected?", "Auth middleware"]
  ];
  return [path.join("patterns", "ai-prompt-cards.svg"), `
<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="900" viewBox="0 0 1440 900" role="img" aria-labelledby="title desc">
  <title id="title">Pioneer AI prompt cards</title>
  <desc id="desc">Reusable brand pattern for interactive AI prompt cards around generated code.</desc>
  ${background(1440, 900, "pattern-prompts", false)}
  ${label(96, 108, "Pattern / AI Prompts", colors.forest)}
  ${multiline({ x: 96, y: 210, lines: ["Ask the generated", "code what it becomes"], size: 74, fill: colors.ink, lineHeight: .98 })}
  ${codeBlock(484, 172, 760, "pattern-prompts", { lineHeight: 34 })}
  ${questions.map(([title, detail], index) => {
    const side = index % 2 === 0 ? 140 : 1030;
    const yy = 360 + Math.floor(index / 2) * 182;
    return `<g transform="translate(${side} ${yy}) rotate(${index % 2 === 0 ? "-5" : "5"})">
      <rect width="272" height="112" rx="18" fill="#FFFFFF" stroke="${colors.line}" filter="url(#pattern-prompts-shadow)"/>
      <circle cx="36" cy="34" r="16" fill="${colors.soft}" opacity=".42"/>
      <text x="62" y="38" fill="${colors.ink}" font-family="Inter, Instrument Sans, Arial, sans-serif" font-size="20" font-weight="800">${esc(title)}</text>
      <text x="24" y="78" fill="#59645A" font-family="Commit Mono, SFMono-Regular, Consolas, monospace" font-size="15" font-weight="700">${esc(detail)}</text>
    </g>`;
  }).join("")}
</svg>`];
}

function patternCloudflare() {
  const panels = [
    ["Worker", "checkout-app", "Running locally"],
    ["Bindings", "DB + Cache + Queue", "Auto-wired"],
    ["D1", "orders table", "Orders saved"],
    ["Queue", "receipt worker", "Queued"],
    ["Analytics", "logs + traces", "Observable"]
  ];
  return [path.join("patterns", "cloudflare-feedback-panels.svg"), `
<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="900" viewBox="0 0 1440 900" role="img" aria-labelledby="title desc">
  <title id="title">Pioneer Cloudflare feedback panels</title>
  <desc id="desc">Reusable brand pattern for Wrangler and Cloudflare service feedback.</desc>
  ${background(1440, 900, "pattern-cloudflare", false)}
  ${label(96, 108, "Pattern / Wrangler", colors.gold)}
  ${multiline({ x: 96, y: 210, lines: ["What Pioneer ran", "from the code"], size: 76, fill: colors.ink, lineHeight: .98 })}
  <g transform="translate(96 430)">
    ${panels.map(([title, detail, metric], index) => `<g transform="translate(${index * 246} 0)">
      <rect width="220" height="134" rx="18" fill="#FFFFFF" stroke="${index === 0 ? colors.gold : colors.line}" filter="url(#pattern-cloudflare-shadow)"/>
      <text x="22" y="42" fill="${colors.ink}" font-family="Inter, Instrument Sans, Arial, sans-serif" font-size="24" font-weight="850">${title}</text>
      <text x="22" y="74" fill="#59645A" font-family="Commit Mono, SFMono-Regular, Consolas, monospace" font-size="15" font-weight="700">${detail}</text>
      <rect x="22" y="94" width="128" height="28" rx="14" fill="${colors.soft}" opacity=".32"/>
      <text x="36" y="113" fill="${colors.forest}" font-family="Commit Mono, SFMono-Regular, Consolas, monospace" font-size="13" font-weight="800">${metric}</text>
    </g>`).join("")}
  </g>
  <rect x="330" y="625" width="770" height="112" rx="18" fill="#FFF7ED" stroke="#FDBA74"/>
  <text x="370" y="672" fill="#9A3412" font-family="Inter, Instrument Sans, Arial, sans-serif" font-size="26" font-weight="850">127.0.0.1:8789 / checkout-app</text>
  <text x="370" y="711" fill="#59645A" font-family="Commit Mono, SFMono-Regular, Consolas, monospace" font-size="18" font-weight="700">POST /checkout -> 201 Created</text>
</svg>`];
}

function motionAsset({ file, title, content }) {
  return [path.join("motion", file), content(title)];
}

function motionCode(title) {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="720" height="405" viewBox="0 0 720 405" role="img" aria-labelledby="title desc">
  <title id="title">${esc(title)}</title>
  <desc id="desc">Animated code generated reveal pattern.</desc>
  <defs>
    <style>
      .line { opacity: 0; transform: translateY(10px); animation: in 1800ms ease infinite; }
      .line:nth-child(2) { animation-delay: 120ms; }
      .line:nth-child(3) { animation-delay: 240ms; }
      .line:nth-child(4) { animation-delay: 360ms; }
      .line:nth-child(5) { animation-delay: 480ms; }
      .line:nth-child(6) { animation-delay: 600ms; }
      .scan { animation: scan 1800ms ease-in-out infinite; }
      @keyframes in { 0%, 18% { opacity: 0; transform: translateY(10px); } 36%, 88% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; } }
      @keyframes scan { 0% { transform: translateY(62px); opacity: 0; } 34% { opacity: .85; } 80% { transform: translateY(300px); opacity: 0; } 100% { opacity: 0; } }
      @media (prefers-reduced-motion: reduce) { .line, .scan { animation: none; opacity: 1; transform: none; } }
    </style>
  </defs>
  <rect width="720" height="405" rx="0" fill="#0A0A0A"/>
  <rect x="52" y="48" width="616" height="310" rx="18" fill="#111111" stroke="#262626"/>
  <rect x="52" y="48" width="616" height="48" rx="18" fill="#171717"/>
  <text x="82" y="79" fill="#A5DBB7" font-family="Commit Mono, Consolas, monospace" font-size="16" font-weight="800">app/routes/web.ts</text>
  <g transform="translate(82 134)" font-family="Commit Mono, Consolas, monospace" font-size="17" font-weight="800">
    ${codeLines.map((line, index) => `<text class="line" x="0" y="${index * 34}" fill="${["#7DD3FC", "#86EFAC", "#FACC15", "#38BDF8", "#FB923C", "#A5DBB7"][index]}">${esc(line)}</text>`).join("")}
  </g>
  <rect class="scan" x="72" y="0" width="576" height="18" rx="9" fill="${colors.soft}" opacity=".7"/>
</svg>`;
}

function motionTerminal(title) {
  const lines = ["$ pioneer deploy --local", "Inferred services: Worker, D1, Cache, Queue", "Ready on http://127.0.0.1:8789", "HTTP/1.1 201 Created"];
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="720" height="405" viewBox="0 0 720 405" role="img" aria-labelledby="title desc">
  <title id="title">${esc(title)}</title>
  <desc id="desc">Animated terminal streaming pattern.</desc>
  <defs>
    <style>
      .term-line { opacity: 0; animation: line 2200ms steps(1, end) infinite; }
      .term-line:nth-child(2) { animation-delay: 300ms; }
      .term-line:nth-child(3) { animation-delay: 650ms; }
      .term-line:nth-child(4) { animation-delay: 1000ms; }
      .cursor { animation: blink 700ms steps(2, start) infinite; }
      @keyframes line { 0%, 8% { opacity: 0; } 12%, 90% { opacity: 1; } 100% { opacity: 0; } }
      @keyframes blink { 50% { opacity: 0; } }
      @media (prefers-reduced-motion: reduce) { .term-line, .cursor { animation: none; opacity: 1; } }
    </style>
  </defs>
  <rect width="720" height="405" fill="#070707"/>
  <rect x="56" y="50" width="608" height="302" rx="18" fill="#0A0A0A" stroke="#262626"/>
  <rect x="56" y="50" width="608" height="48" rx="18" fill="#171717"/>
  <text x="88" y="82" fill="#A3A3A3" font-family="Commit Mono, Consolas, monospace" font-size="16" font-weight="800">pioneer deploy --local</text>
  <g transform="translate(88 144)" font-family="Commit Mono, Consolas, monospace" font-size="18" font-weight="800">
    ${lines.map((line, index) => `<text class="term-line" x="0" y="${index * 44}" fill="${index === 0 ? "#86EFAC" : index === 3 ? "#7DD3FC" : "#D4D4D4"}">${esc(line)}</text>`).join("")}
    <rect class="cursor" x="0" y="184" width="12" height="22" fill="#86EFAC"/>
  </g>
</svg>`;
}

function motionPulse(title) {
  const items = ["Route", "DB", "Cache", "Queue", "Auth"];
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="720" height="405" viewBox="0 0 720 405" role="img" aria-labelledby="title desc">
  <title id="title">${esc(title)}</title>
  <desc id="desc">Animated service binding pulse pattern.</desc>
  <defs>
    <style>
      .node { animation: pulse 1900ms ease-in-out infinite; transform-origin: center; }
      .node:nth-child(2) { animation-delay: 140ms; }
      .node:nth-child(3) { animation-delay: 280ms; }
      .node:nth-child(4) { animation-delay: 420ms; }
      .node:nth-child(5) { animation-delay: 560ms; }
      .link { stroke-dasharray: 14 16; animation: dash 1200ms linear infinite; }
      @keyframes pulse { 0%, 100% { filter: brightness(1); transform: scale(1); } 45% { filter: brightness(1.18); transform: scale(1.04); } }
      @keyframes dash { to { stroke-dashoffset: -60; } }
      @media (prefers-reduced-motion: reduce) { .node, .link { animation: none; } }
    </style>
  </defs>
  <rect width="720" height="405" fill="${colors.mist}"/>
  <path class="link" d="M92 202H628" fill="none" stroke="${colors.forest}" stroke-width="5" stroke-linecap="round"/>
  <g font-family="Inter, Arial, sans-serif" font-size="20" font-weight="850">
    ${items.map((item, index) => `<g class="node" transform="translate(${74 + index * 132} 152)">
      <rect width="112" height="96" rx="20" fill="${index % 2 ? colors.ink : colors.forest}"/>
      <text x="56" y="56" text-anchor="middle" fill="#FFFFFF">${item}</text>
    </g>`).join("")}
  </g>
</svg>`;
}

function motionTrace(title) {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="720" height="405" viewBox="0 0 720 405" role="img" aria-labelledby="title desc">
  <title id="title">${esc(title)}</title>
  <desc id="desc">Animated route to infrastructure trace pattern.</desc>
  <defs>
    <style>
      .trace { stroke-dasharray: 680; stroke-dashoffset: 680; animation: trace 2100ms ease-in-out infinite; }
      .spark { animation: spark 2100ms ease-in-out infinite; offset-path: path("M110 206 C220 96 378 96 458 204 S575 314 628 206"); }
      @keyframes trace { 0% { stroke-dashoffset: 680; opacity: .3; } 52% { stroke-dashoffset: 0; opacity: 1; } 100% { stroke-dashoffset: 0; opacity: .18; } }
      @keyframes spark { 0% { offset-distance: 0%; opacity: 0; } 20% { opacity: 1; } 72% { offset-distance: 100%; opacity: 1; } 100% { offset-distance: 100%; opacity: 0; } }
      @media (prefers-reduced-motion: reduce) { .trace, .spark { animation: none; stroke-dashoffset: 0; opacity: 1; } }
    </style>
  </defs>
  <rect width="720" height="405" fill="#0A0A0A"/>
  <path class="trace" d="M110 206 C220 96 378 96 458 204 S575 314 628 206" fill="none" stroke="${colors.soft}" stroke-width="8" stroke-linecap="round"/>
  <circle class="spark" r="10" fill="${colors.gold}"/>
  <rect x="58" y="160" width="120" height="92" rx="18" fill="${colors.forest}"/>
  <text x="118" y="213" text-anchor="middle" fill="#FFFFFF" font-family="Commit Mono, Consolas, monospace" font-size="18" font-weight="850">Route</text>
  <rect x="540" y="160" width="128" height="92" rx="18" fill="${colors.slate}"/>
  <text x="604" y="213" text-anchor="middle" fill="#FFFFFF" font-family="Commit Mono, Consolas, monospace" font-size="18" font-weight="850">Edge</text>
</svg>`;
}

const files = [
  socialCard({
    file: "og-ai-to-edge.svg",
    width: 1200,
    height: 630,
    kicker: "Pioneer by find.how",
    title: ["AI-generated code", "to edge infrastructure"],
    subtitle: "TypeScript routes become Workers, D1, Cache, Queues, Auth, and deploy feedback.",
    dark: true,
    mode: "code"
  }),
  socialCard({
    file: "twitter-ai-to-edge.svg",
    width: 1200,
    height: 675,
    kicker: "Pioneer / AI to Worker",
    title: ["Ask for the endpoint.", "Run the app."],
    subtitle: "Pioneer turns generated business logic into a local Wrangler feedback loop.",
    dark: false,
    mode: "terminal"
  }),
  socialCard({
    file: "linkedin-edge-framework.svg",
    width: 1200,
    height: 627,
    kicker: "Edge-native framework",
    title: ["Application code", "to Cloudflare shape"],
    subtitle: "Route, database, cache, queue, auth, and deploy from the code you already wrote.",
    dark: false,
    mode: "code"
  }),
  socialCard({
    file: "square-code-to-edge.svg",
    width: 1080,
    height: 1080,
    kicker: "Pioneer",
    title: ["8 lines do", "the work"],
    subtitle: "Create order. Cache it. Queue receipt. Return success.",
    dark: true,
    mode: "code"
  }),
  socialCard({
    file: "github-preview.svg",
    width: 1280,
    height: 640,
    kicker: "@find-how/pioneer",
    title: ["TypeScript framework", "for the edge"],
    subtitle: "A verified path from app code to Cloudflare Workers.",
    dark: true,
    mode: "terminal"
  }),
  socialCard({
    file: "docs-header.svg",
    width: 1600,
    height: 900,
    kicker: "Pioneer Docs",
    title: ["Build locally.", "Deploy deliberately."],
    subtitle: "Route-driven application code with inferred edge services and Wrangler feedback.",
    dark: false,
    mode: "code"
  }),
  socialCard({
    file: "launch-deploy.svg",
    width: 1200,
    height: 630,
    kicker: "One-click deploy",
    title: ["Deploy to Pioneer", "with local proof"],
    subtitle: "Generated Worker, bound services, migrations, and smoke test before remote release.",
    dark: true,
    mode: "terminal"
  }),
  diagram({
    file: "pipeline-discover-verify-generate.svg",
    title: "Discover, verify, generate",
    subtitle: "A compiler-shaped brand story for turning code intent into runnable edge apps.",
    kind: "flow",
    steps: [
      { title: "Discover", detail: "Read app code" },
      { title: "Verify", detail: "Check routes and services" },
      { title: "Generate", detail: "Emit Worker shape" },
      { title: "Run", detail: "Wrangler feedback" },
      { title: "Ship", detail: "Deploy deliberately" }
    ]
  }),
  diagram({
    file: "route-to-infrastructure.svg",
    title: "Route to infrastructure",
    subtitle: "Route.post describes the entrypoint. Pioneer infers the services around it.",
    kind: "stack",
    steps: [
      { title: "Route", detail: "POST /checkout" },
      { title: "DB", detail: "orders table" },
      { title: "Cache", detail: "fast reads" },
      { title: "Queue", detail: "receipt job" },
      { title: "Auth", detail: "verified gate" }
    ]
  }),
  diagram({
    file: "local-https-loop.svg",
    title: "Local feedback loop",
    subtitle: "Develop against local URLs, HTTPS expectations, and Wrangler output before shipping.",
    kind: "flow",
    steps: [
      { title: "Code", detail: "app/routes/web.ts" },
      { title: "Compile", detail: ".pioneer target" },
      { title: "Wrangler", detail: "local Worker" },
      { title: "Smoke", detail: "201 response" },
      { title: "Inspect", detail: "logs and bindings" }
    ]
  }),
  diagram({
    file: "cloudflare-edge-stack.svg",
    title: "Cloudflare edge stack",
    subtitle: "The brand surface for Worker, D1, Cache, Queue, Auth, and Observability.",
    kind: "stack",
    steps: [
      { title: "Worker", detail: "HTTP runtime" },
      { title: "D1", detail: "database" },
      { title: "Cache", detail: "edge cache" },
      { title: "Queue", detail: "background job" },
      { title: "Logs", detail: "feedback" }
    ]
  }),
  patternEditor(),
  patternTerminal(),
  patternPrompts(),
  patternCloudflare(),
  motionAsset({ file: "code-generated-reveal.svg", title: "Pioneer code generated reveal", content: motionCode }),
  motionAsset({ file: "terminal-stream.svg", title: "Pioneer terminal stream", content: motionTerminal }),
  motionAsset({ file: "service-binding-pulse.svg", title: "Pioneer service binding pulse", content: motionPulse }),
  motionAsset({ file: "route-trace.svg", title: "Pioneer route trace", content: motionTrace }),
  [path.join("social", "README.md"), `# Pioneer Social Cards

Editable SVG social templates for launch, docs, repository previews, and product announcements.

The build step also renders PNG companions into \`dist/assets/social/png/\` when \`sharp\` is installed.

Recommended defaults:

| Use | Source |
| --- | --- |
| Open Graph | \`og-ai-to-edge.svg\` |
| X/Twitter | \`twitter-ai-to-edge.svg\` |
| LinkedIn | \`linkedin-edge-framework.svg\` |
| Square social | \`square-code-to-edge.svg\` |
| GitHub preview | \`github-preview.svg\` |
| Docs hero | \`docs-header.svg\` |
| Launch/deploy | \`launch-deploy.svg\` |
`],
  [path.join("patterns", "README.md"), `# Pioneer Product Patterns

Reusable SVG surfaces adapted from \`~/Code/Demo\`.

| Pattern | Use |
| --- | --- |
| \`editor-frame.svg\` | AI-generated code screenshot surface. |
| \`terminal-deploy-frame.svg\` | Deployment playback and CLI screenshots. |
| \`ai-prompt-cards.svg\` | Interactive AI explainer cards. |
| \`cloudflare-feedback-panels.svg\` | Worker, bindings, D1, queue, and observability panels. |
`],
  [path.join("diagrams", "README.md"), `# Pioneer Diagrams

Editable SVG diagrams for docs, presentations, and launch posts.

These cover the core brand story: AI-generated app code, compiler verification, inferred services, local Wrangler feedback, and deploy-ready Cloudflare shape.
`],
  [path.join("motion", "README.md"), `# Pioneer Motion Assets

Self-contained animated SVG motion patterns for product pages, docs, and social clips.

All motion assets include reduced-motion fallbacks.
`]
];

for (const [relativePath, content] of files) {
  const fullPath = path.join(root, relativePath);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, `${content.trim()}\n`);
}

console.log(`Generated ${files.length} brand expansion assets.`);
