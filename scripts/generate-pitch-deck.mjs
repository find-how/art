import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outPath = path.join(root, "brand-kit/assets/pitch-deck/pitch-deck-theme.pptx");

const SLIDE_W = 12192000;
const SLIDE_H = 6858000;
const PPT_FONT_SANS = "Arial";
const PPT_FONT_MONO = "Courier New";

const C = {
  ink: "161A17",
  mist: "F4F7EF",
  forest: "2D7A3E",
  leaf: "4A9D5F",
  sprout: "7CB342",
  soft: "CFE7B7",
  gold: "D9A441",
  white: "FFFFFF",
  muted: "525252",
  code: "171717",
  codeMuted: "737373",
  codeText: "E5E5E5",
  border: "DCE5D7"
};

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function emu(inches) {
  return Math.round(inches * 914400);
}

function writeAt(dir, file, content) {
  return writeFile(path.join(dir, file), content);
}

async function ensureDir(dir, child) {
  await mkdir(path.join(dir, child), { recursive: true });
}

function solid(color) {
  return `<a:solidFill><a:srgbClr val="${color}"/></a:solidFill>`;
}

function noLine() {
  return `<a:ln><a:noFill/></a:ln>`;
}

function shape(id, x, y, w, h, color, opts = {}) {
  const radius = opts.radius ? "roundRect" : "rect";
  const line = opts.line ? `<a:ln w="${opts.lineWidth || 12700}"><a:solidFill><a:srgbClr val="${opts.line}"/></a:solidFill></a:ln>` : noLine();
  return `
    <p:sp>
      <p:nvSpPr><p:cNvPr id="${id}" name="Shape ${id}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
      <p:spPr>
        <a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${w}" cy="${h}"/></a:xfrm>
        <a:prstGeom prst="${radius}"><a:avLst/></a:prstGeom>
        ${solid(color)}
        ${line}
      </p:spPr>
      <p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody>
    </p:sp>`;
}

function triangle(id, x, y, w, h, color, rot = 0) {
  return `
    <p:sp>
      <p:nvSpPr><p:cNvPr id="${id}" name="Mark ${id}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
      <p:spPr>
        <a:xfrm rot="${rot}"><a:off x="${x}" y="${y}"/><a:ext cx="${w}" cy="${h}"/></a:xfrm>
        <a:prstGeom prst="rtTriangle"><a:avLst/></a:prstGeom>
        ${solid(color)}
        ${noLine()}
      </p:spPr>
      <p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody>
    </p:sp>`;
}

function textBox(id, x, y, w, h, lines, opts = {}) {
  const align = opts.align ? `<a:jc val="${opts.align}"/>` : "";
  const paragraphs = lines.map((line, index) => {
    const size = (line.size || opts.size || 2800) * 100;
    const color = line.color || opts.color || C.ink;
    const bold = line.bold ?? opts.bold ? ' b="1"' : "";
    const font = line.mono || opts.mono ? PPT_FONT_MONO : PPT_FONT_SANS;
    const spacing = index === 0 ? "" : `<a:spcBef><a:spcPts val="${line.before || opts.before || 600}"/></a:spcBef>`;
    return `<a:p><a:pPr>${align}${spacing}</a:pPr><a:r><a:rPr lang="en-US" sz="${size}"${bold}><a:solidFill><a:srgbClr val="${color}"/></a:solidFill><a:latin typeface="${font}"/></a:rPr><a:t>${esc(line.text ?? line)}</a:t></a:r><a:endParaRPr lang="en-US" sz="${size}"/></a:p>`;
  }).join("");

  return `
    <p:sp>
      <p:nvSpPr><p:cNvPr id="${id}" name="Text ${id}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
      <p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${w}" cy="${h}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/>${noLine()}</p:spPr>
      <p:txBody><a:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0"/><a:lstStyle/>${paragraphs}</p:txBody>
    </p:sp>`;
}

function footer(id, slideNo) {
  return textBox(id, emu(0.65), emu(7.05), emu(12), emu(0.24), [
    { text: `Pioneer by find.how / ${slideNo}`, size: 9, mono: true, color: C.muted, bold: true }
  ]);
}

function slideXml(id, shapes) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
      ${shapes.join("\n")}
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>`;
}

const slides = [
  [
    shape(2, 0, 0, SLIDE_W, SLIDE_H, C.white),
    shape(3, emu(0.55), emu(0.55), emu(12.25), emu(6.25), C.mist, { radius: true, line: C.border }),
    shape(4, emu(0.55), emu(0.55), emu(4.35), emu(6.25), C.ink, { radius: true }),
    triangle(5, emu(1.15), emu(1.35), emu(0.9), emu(0.9), C.sprout, 2700000),
    textBox(6, emu(1.12), emu(2.7), emu(3.3), emu(1.6), [
      { text: "Pioneer", size: 50, bold: true, color: C.white },
      { text: "BY FIND.HOW", size: 13, mono: true, bold: true, color: C.soft, before: 1200 }
    ]),
    textBox(7, emu(5.55), emu(1.7), emu(6.7), emu(2.3), [
      { text: "Write business logic.", size: 44, bold: true, color: C.ink },
      { text: "Ship edge infrastructure.", size: 44, bold: true, color: C.forest, before: 600 }
    ]),
    textBox(8, emu(5.6), emu(4.2), emu(6.5), emu(0.8), [
      { text: "The full-stack TypeScript framework that compiles to the edge.", size: 18, color: C.muted, bold: true }
    ]),
    textBox(9, emu(5.6), emu(5.35), emu(6.5), emu(0.45), [
      { text: "AI writes code. Pioneer makes it deployable.", size: 14, mono: true, color: C.gold, bold: true }
    ])
  ],
  [
    shape(2, 0, 0, SLIDE_W, SLIDE_H, C.white),
    textBox(3, emu(0.75), emu(0.55), emu(11.5), emu(1.2), [
      { text: "The wedge", size: 16, mono: true, color: C.forest, bold: true },
      { text: "Generated code still needs infrastructure.", size: 37, bold: true, color: C.ink, before: 550 }
    ]),
    shape(4, emu(0.8), emu(2.1), emu(3.55), emu(3.6), C.mist, { radius: true, line: C.border }),
    shape(5, emu(4.9), emu(2.1), emu(3.55), emu(3.6), C.mist, { radius: true, line: C.border }),
    shape(6, emu(9.0), emu(2.1), emu(3.55), emu(3.6), C.ink, { radius: true }),
    textBox(7, emu(1.1), emu(2.45), emu(2.9), emu(2.5), [
      { text: "AI", size: 30, bold: true, color: C.ink },
      { text: "Generates useful business logic quickly.", size: 18, color: C.muted, before: 800 }
    ]),
    textBox(8, emu(5.2), emu(2.45), emu(2.9), emu(2.5), [
      { text: "Gap", size: 30, bold: true, color: C.ink },
      { text: "The code still needs routes, bindings, jobs, auth, logs, and a deploy path.", size: 18, color: C.muted, before: 800 }
    ]),
    textBox(9, emu(9.3), emu(2.45), emu(2.9), emu(2.5), [
      { text: "Pioneer", size: 30, bold: true, color: C.white },
      { text: "Turns generated business logic into a running Cloudflare-shaped app.", size: 18, color: C.soft, before: 800 }
    ]),
    footer(10, 2)
  ],
  [
    shape(2, 0, 0, SLIDE_W, SLIDE_H, C.white),
    textBox(3, emu(0.75), emu(0.55), emu(11.8), emu(0.9), [
      { text: "Canonical demo", size: 15, mono: true, color: C.forest, bold: true },
      { text: "Ask for checkout. Pioneer runs the app.", size: 34, bold: true, color: C.ink, before: 450 }
    ]),
    shape(4, emu(0.8), emu(1.85), emu(5.8), emu(4.7), C.code, { radius: true }),
    textBox(5, emu(1.1), emu(2.12), emu(5.2), emu(3.9), [
      { text: "app/routes/web.ts", size: 12, mono: true, color: C.codeMuted, bold: true },
      { text: 'Route.post("/checkout", async ({ request }) => {', size: 13, mono: true, color: C.codeText, before: 700 },
      { text: '  const order = await DB.table("orders").create(input);', size: 13, mono: true, color: C.soft, before: 350 },
      { text: "  await Cache.set(`order:${order.id}`, order);", size: 13, mono: true, color: C.soft, before: 350 },
      { text: '  await Queue.dispatch("send-receipt", { orderId: order.id });', size: 13, mono: true, color: C.soft, before: 350 },
      { text: "  return Response.json({ ok: true, order }, { status: 201 });", size: 13, mono: true, color: C.codeText, before: 350 },
      { text: '}).middleware(["auth", "verified"]);', size: 13, mono: true, color: C.codeText, before: 350 }
    ]),
    shape(6, emu(7.0), emu(1.85), emu(5.3), emu(4.7), C.mist, { radius: true, line: C.border }),
    textBox(7, emu(7.35), emu(2.18), emu(4.7), emu(3.65), [
      { text: "Route -> Worker HTTP entrypoint", size: 18, bold: true, color: C.ink },
      { text: "DB -> D1 checkout-db", size: 18, bold: true, color: C.forest, before: 650 },
      { text: "Cache -> edge cache", size: 18, bold: true, color: C.forest, before: 650 },
      { text: "Queue -> send-receipt job", size: 18, bold: true, color: C.forest, before: 650 },
      { text: "Wrangler -> 201 Created", size: 18, bold: true, color: C.gold, before: 650 }
    ]),
    footer(8, 3)
  ],
  [
    shape(2, 0, 0, SLIDE_W, SLIDE_H, C.white),
    textBox(3, emu(0.75), emu(0.55), emu(11.8), emu(1.2), [
      { text: "Product hierarchy", size: 15, mono: true, color: C.forest, bold: true },
      { text: "Public story first. Compiler proof second.", size: 34, bold: true, color: C.ink, before: 450 }
    ]),
    shape(4, emu(0.85), emu(2.05), emu(5.45), emu(3.8), C.mist, { radius: true, line: C.border }),
    shape(5, emu(7.0), emu(2.05), emu(5.45), emu(3.8), C.ink, { radius: true }),
    textBox(6, emu(1.2), emu(2.4), emu(4.8), emu(2.8), [
      { text: "Public", size: 26, bold: true, color: C.ink },
      { text: "Full-stack TypeScript framework", size: 18, color: C.muted, before: 650 },
      { text: "Compiles to Cloudflare edge infrastructure", size: 18, color: C.muted, before: 400 },
      { text: "AI-friendly generated business logic", size: 18, color: C.muted, before: 400 }
    ]),
    textBox(7, emu(7.35), emu(2.4), emu(4.8), emu(2.8), [
      { text: "Moat", size: 26, bold: true, color: C.white },
      { text: "Rust compiler", size: 18, color: C.soft, before: 650 },
      { text: "TypeGraph", size: 18, color: C.soft, before: 400 },
      { text: "Cloudflare mapping and verification", size: 18, color: C.soft, before: 400 }
    ]),
    textBox(8, emu(1.0), emu(6.15), emu(11.3), emu(0.5), [
      { text: "The market-facing wedge is the demo: AI generates useful app code. Pioneer makes it real.", size: 14, mono: true, color: C.gold, bold: true }
    ]),
    footer(9, 4)
  ]
];

async function writePptxParts(dir) {
  const dirs = [
    "_rels",
    "docProps",
    "ppt/_rels",
    "ppt/slides/_rels",
    "ppt/slideMasters/_rels",
    "ppt/slideLayouts/_rels",
    "ppt/theme"
  ];

  for (const child of dirs) await ensureDir(dir, child);

  await writeAt(dir, "[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  ${slides.map((_, i) => `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join("\n  ")}
</Types>`);

  await writeAt(dir, "_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`);

  await writeAt(dir, "docProps/core.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Pioneer Pitch Deck Theme</dc:title>
  <dc:creator>find.how</dc:creator>
  <cp:keywords>Pioneer, Cloudflare, TypeScript, brand kit</cp:keywords>
  <dc:description>Pitch deck starter for Pioneer brand messaging.</dc:description>
</cp:coreProperties>`);

  await writeAt(dir, "docProps/app.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Pioneer Brand Kit</Application>
  <PresentationFormat>On-screen Show (16:9)</PresentationFormat>
  <Slides>${slides.length}</Slides>
</Properties>`);

  await writeAt(dir, "ppt/presentation.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>
  <p:sldIdLst>${slides.map((_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 2}"/>`).join("")}</p:sldIdLst>
  <p:sldSz cx="${SLIDE_W}" cy="${SLIDE_H}" type="wide"/>
  <p:notesSz cx="6858000" cy="9144000"/>
  <p:defaultTextStyle/>
</p:presentation>`);

  await writeAt(dir, "ppt/_rels/presentation.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
  ${slides.map((_, i) => `<Relationship Id="rId${i + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`).join("\n  ")}
</Relationships>`);

  await writeAt(dir, "ppt/slideMasters/slideMaster1.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
  <p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles>
</p:sldMaster>`);

  await writeAt(dir, "ppt/slideMasters/_rels/slideMaster1.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>`);

  await writeAt(dir, "ppt/slideLayouts/slideLayout1.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1">
  <p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>`);

  await writeAt(dir, "ppt/slideLayouts/_rels/slideLayout1.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`);

  await writeAt(dir, "ppt/theme/theme1.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Pioneer">
  <a:themeElements>
    <a:clrScheme name="Pioneer"><a:dk1><a:srgbClr val="${C.ink}"/></a:dk1><a:lt1><a:srgbClr val="${C.white}"/></a:lt1><a:dk2><a:srgbClr val="${C.code}"/></a:dk2><a:lt2><a:srgbClr val="${C.mist}"/></a:lt2><a:accent1><a:srgbClr val="${C.forest}"/></a:accent1><a:accent2><a:srgbClr val="${C.leaf}"/></a:accent2><a:accent3><a:srgbClr val="${C.sprout}"/></a:accent3><a:accent4><a:srgbClr val="${C.gold}"/></a:accent4><a:accent5><a:srgbClr val="${C.muted}"/></a:accent5><a:accent6><a:srgbClr val="${C.soft}"/></a:accent6><a:hlink><a:srgbClr val="${C.forest}"/></a:hlink><a:folHlink><a:srgbClr val="${C.forest}"/></a:folHlink></a:clrScheme>
    <a:fontScheme name="Pioneer"><a:majorFont><a:latin typeface="${PPT_FONT_SANS}"/></a:majorFont><a:minorFont><a:latin typeface="${PPT_FONT_SANS}"/></a:minorFont></a:fontScheme>
    <a:fmtScheme name="Pioneer"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="12700"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme>
  </a:themeElements>
</a:theme>`);

  for (const [i, content] of slides.entries()) {
    await writeAt(dir, `ppt/slides/slide${i + 1}.xml`, slideXml(i + 1, content));
    await writeAt(dir, `ppt/slides/_rels/slide${i + 1}.xml.rels`, `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>`);
  }
}

async function main() {
  const tmp = await mkdtemp(path.join(tmpdir(), "pioneer-pptx-"));
  try {
    await writePptxParts(tmp);
    await mkdir(path.dirname(outPath), { recursive: true });
    await rm(outPath, { force: true });
    await execFileAsync("zip", ["-qr", outPath, "."], { cwd: tmp });
    console.log(path.relative(root, outPath));
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
