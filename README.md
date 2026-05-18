# Pioneer Brand Assets

Complete Pioneer brand kit and asset library, optimized for one public story: developers write business logic, and Pioneer turns it into a running Cloudflare edge app.

## Source Of Truth

The source-of-truth brand system lives in `brand-kit/`.

Pioneer should lead with:

```txt
Write business logic. Ship edge infrastructure.
```

The Demo is the strongest expression of the brand: ask AI for a checkout endpoint, generate focused TypeScript business logic, then let Pioneer wire and run the Worker, D1, Cache, Queue, auth, logs, and local Wrangler feedback loop.

## Cloudflare Wrangler Brand Portal

This repository is also a Wrangler-deployable Worker + static asset portal for `brand.find.how`.

### Local development

```bash
npm install
npm run dev
```

The build step copies the source brand assets into `dist/assets`, renders PNG companions for social SVGs, generates `dist/assets/manifest.json`, and serves the portal through the Worker in `src/index.js`.

### Deploy

```bash
npm run check
npm run deploy:dry-run
npm run deploy
```

See `DEPLOYMENT.md` for Cloudflare auth, custom domain, Durable Object migration, optional D1/KV/R2/Queue bindings, and smoke checks.

The GitHub Actions workflow in `.github/workflows/brand-find-how.yml` validates pull requests and deploys merges to `main` or `master` to `https://brand.find.how` with Wrangler. It requires `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` repository secrets.

The custom domain route is configured in `wrangler.toml`:

```toml
[[routes]]
pattern = "brand.find.how"
custom_domain = true
```

Wrangler also owns the production build hook:

```toml
[build]
command = "npm run build"
```

The Pioneer one-click deploy link is centralized as `PIONEER_DEPLOY_URL` in `wrangler.toml` and exposed through `/api/brand`.

## Product Story Assets

These assets adapt the strongest surfaces from `~/Code/Demo`: AI prompt cards, Monaco-style code frames, terminal deployment playback, Cloudflare/Wrangler feedback panels, and route-to-infrastructure diagrams.

| Directory | Use |
|------|-----|
| `social/` | Editable social card SVGs for Open Graph, X, LinkedIn, GitHub, docs, square posts, and deploy launches. PNG companions are generated at build time under `dist/assets/social/png/`. |
| `patterns/` | Reusable product visuals: editor frame, terminal deploy frame, AI prompt cards, and Cloudflare feedback panels. |
| `diagrams/` | Documentation and presentation diagrams for the compiler pipeline, route-to-infrastructure story, local feedback loop, and Cloudflare edge stack. |
| `motion/` | Animated SVG loops for code generation, terminal streaming, service binding pulses, and route tracing. |
| `buttons/` | Demo-derived Deploy to Pioneer button artwork, CSS, and HTML snippets for one-click deployment entry points. |
| `brand-kit/` | Source-of-truth positioning, messaging, tokens, UI rules, canonical code snippets, demo scripts, and launch assets. |
| `brand-kit/ui/experience-principles.md` | Applied UI rules for affordances, hierarchy, semantic color, states, motion, overlays, and dark mode. |
| `brand-kit/ui/components/` | Reusable interactive webview snippets for Monaco, xterm, Edge Artisan, docs search, and find.how navigation. |

## Edge Artisan Runtime

The brand portal now includes a real `/__artisan` Worker endpoint backed by the `ARTISAN_SESSIONS` Durable Object. The browser xterm component posts an Artisan-style command, then renders streamed NDJSON output from the Durable Object command session.

The runtime uses Durable Object storage by default and can attach optional Cloudflare bindings for `EDGE_ARTISAN_DB` (D1), `EDGE_ARTISAN_KV` (KV), `EDGE_ARTISAN_REPORTS` (R2), and `EDGE_ARTISAN_QUEUE` (Queues).

## Private Tailwind Plus Component Browser

Licensed Tailwind Plus downloads can be imported into a private, gitignored source directory and rendered as Pioneer-branded component previews under `/plus/`.

```bash
npm run plus:import -- --dry-run
npm run plus:import
npm run dev
```

The importer reads `~/Downloads/marketinguiv4` and `~/Downloads/appuiv4` by default. Local dev builds and exposes `/plus/` automatically, and the main brand kit shows a Plus UI link when the private catalog is reachable. Generated Plus output is not part of the normal public build. Production access to `/plus/*`, `/api/plus/*`, and private Plus MCP tools must stay behind Cloudflare Access; `npm run deploy:plus` injects the required `PLUS_COMPONENTS_ENABLED:true` Worker var.

The Plus browser includes Preview, HTML, React, and Vue tabs. Source tabs render a lightweight read-only syntax-highlighted editor frame with a one-click clipboard button that copies the exact generated source.

## Brand API And MCP

The Worker exposes public brand context and private Plus component APIs for automation:

| Route | Use |
|------|-----|
| `/api/brand/context` | Agent-ready positioning, colors, typography, asset URLs, UI principles, deploy actions, and Plus entrypoints. |
| `/api/assets` | Generated public brand asset manifest. |
| `/api/plus/components` | Private searchable Plus component catalog. |
| `/api/plus/source?id=<id>&format=react` | Private raw Plus component source. |
| `/mcp` | Streamable HTTP MCP endpoint for agents using `brand_get_context`, asset tools, and gated Plus component tools. |

The MCP endpoint is intended to let coding agents build Pioneer frontends from `brand.find.how` context: logos, icons, URLs, colors, typography, fonts, buttons, marketing components, and application components. Public brand tools are available broadly; Plus tools reuse the same private access gate as `/plus/`.

For component generation, agents should call `plus_find_component_code` first with a natural-language request such as "a hero for a launch page", "a sidebar shell for a dashboard", or "a pricing section for the marketing page". The tool ranks the private Pioneer-branded Tailwind Plus catalog, returns the best matching React, Vue, or HTML source, and includes alternative matches for fallback. Lower-level `plus_search_components` and `plus_get_component_source` remain available when an agent already knows the exact category or component id.

## Go-To-Market Source Assets

The minimum viable launch kit now lives under `brand-kit/assets/`:

| Asset | Path |
|------|------|
| Landing page hero | `brand-kit/assets/landing/landing-page-hero.svg` and `.png` |
| Landing copy blocks | `brand-kit/assets/landing/landing-page-copy.md` |
| Pitch deck theme | `brand-kit/assets/pitch-deck/pitch-deck-theme.pptx` |
| Cloudflare Workers Launchpad cover | `brand-kit/assets/launchpad/cloudflare-launchpad-cover.svg` and `.png` |
| Cloudflare Workers Launchpad one-pager | `brand-kit/assets/launchpad/cloudflare-workers-launchpad-one-pager.md`, `.svg`, and `.png` |

## Deploy Button Assets

The `buttons/` directory packages the better Deploy to Pioneer treatment from the Demo Wrangler app so `brand.find.how` and downstream demos use the same primary action.

| File | Use |
|------|-----|
| `buttons/pioneer-deploy-button.svg` | Dark primary button artwork for previews, docs, decks, and social cards. |
| `buttons/pioneer-deploy-strip.svg` | Wide launch strip artwork for demo pages and generated app previews. |
| `buttons/pioneer-deploy-button.css` | Reusable CSS for the primary button and deploy strip components. |
| `buttons/pioneer-deploy-button.html` | Copy-ready markup using the Pioneer bird mark from `/assets/icons-color/64x64.png`. |

## Loading Assets

Animated SVG loading marks live in `loaders/` and deploy to `/assets/loaders/`.

| File | Use |
|------|-----|
| `loaders/pioneer-wingbeat-loader.svg` | Primary AI thinking state with a sharp wingbeat and subtle trails. |
| `loaders/pioneer-signal-loader.svg` | Longer waits, routing, and network work with tactical signal rings. |
| `loaders/pioneer-fold-loader.svg` | Compact inline loading state with sequential origami fold illumination. |

## 📁 Directory Structure

```
art/
├── social/               # Social card source SVGs
├── patterns/             # Product storytelling SVG patterns
├── diagrams/             # Documentation and presentation diagrams
├── motion/               # Animated SVG product assets
├── buttons/              # Deploy to Pioneer buttons and snippets
├── brand-kit/            # Brand source of truth
├── loaders/              # Animated AI/loading SVG marks
├── icons-color/          # Full-color gradient icons (green)
├── icons-black/          # Black variant icons
├── icons-white/          # White variant icons (black iOS background)
├── pioneer-logo.svg      # Color logo mark (geometric shape only)
├── pioneer-logo-black.svg    # Black logo mark
├── pioneer-logo-white.svg    # White logo mark
├── pioneer-text.svg      # Color text logo (wordmark with gradient)
├── pioneer-text-white.svg    # White text logo
└── pioneer-text-logo-black.svg  # Black text logo
```

---

## 🎨 Logo Variants

### Text Logos (Wordmarks)

#### Color Text Logo (`pioneer-text.svg`)
Full-color gradient green wordmark with custom typography.

![Pioneer Text Color](pioneer-text.svg)

**Path:** `pioneer-text.svg`  
**Size:** 700×300px (7.9KB)  
**Use:** Branding, marketing materials, website headers, light backgrounds

---

#### Black Text Logo (`pioneer-text-logo-black.svg`)
Black wordmark for light backgrounds or print materials.

![Pioneer Text Black](pioneer-text-logo-black.svg)

**Path:** `pioneer-text-logo-black.svg`  
**Size:** 700×300px (7.4KB)  
**Use:** Print materials, minimalist designs, light backgrounds

---

#### White Text Logo (`pioneer-text-white.svg`)
White wordmark for dark backgrounds.

![Pioneer Text White](pioneer-text-white.svg)

**Path:** `pioneer-text-white.svg`  
**Size:** 700×300px (7.3KB)  
**Use:** Dark backgrounds, dark mode interfaces, overlays

---

## 🎨 Icon Variants

### Color Icons (`icons-color/`)
Full-color gradient green icons for standard use cases.

![32x32](icons-color/32x32.png) ![64x64](icons-color/64x64.png) ![128x128](icons-color/128x128.png)

### Black Icons (`icons-black/`)
Monochrome black icons for light backgrounds or minimalist designs.

![32x32](icons-black/32x32.png) ![64x64](icons-black/64x64.png) ![128x128](icons-black/128x128.png)

### White Icons (`icons-white/`)
White icons for dark backgrounds (iOS icons have black background for visibility).

![32x32](icons-white/32x32.png) ![64x64](icons-white/64x64.png) ![128x128](icons-white/128x128.png)

---

## 🖥️ Desktop Icons

### Standard PNG Icons

| Icon | Size | Path | Use Case |
|------|------|------|----------|
| ![32x32](icons-color/32x32.png) | 32×32 | `icons-*/32x32.png` | Small app icons, taskbar, system tray |
| ![64x64](icons-color/64x64.png) | 64×64 | `icons-*/64x64.png` | Medium app icons, file managers |
| ![128x128](icons-color/128x128.png) | 128×128 | `icons-*/128x128.png` | Large app icons, standard resolution |
| ![128x128@2x](icons-color/128x128@2x.png) | 256×256 | `icons-*/128x128@2x.png` | Retina/HiDPI displays (128×128 @2x) |
| ![icon](icons-color/icon.png) | 512×512 | `icons-*/icon.png` | High-resolution icon, app stores |

### Platform-Specific Bundles

#### macOS Icons (`.icns`)
**Path:** `icons-*/icon.icns`

**Use:** macOS application bundles (`.app` files)

**Contains:** Multi-resolution icon set (16px to 1024px) in a single file

**How to use:**
```json
// In tauri.conf.json
{
  "bundle": {
    "icon": ["icons-color/icon.icns"]
  }
}
```

#### Windows Icons (`.ico`)
**Path:** `icons-*/icon.ico`

**Use:** Windows executables (`.exe`), shortcuts, and **favicons** for websites

**Contains:** Multiple sizes (16, 24, 32, 48, 64, 256px) in a single file

**How to use:**
- **Desktop apps:** Embedded in `.exe` during build
- **Websites (favicon):** 
  ```html
  <link rel="icon" href="icons-color/icon.ico" type="image/x-icon">
  ```

**Note:** For modern web favicons, consider using PNG instead:
```html
<link rel="icon" type="image/png" sizes="32x32" href="icons-color/32x32.png">
<link rel="icon" type="image/png" sizes="128x128" href="icons-color/128x128.png">
```

---

## 🪟 Windows Store Icons

For Microsoft Store / AppX packages:

| Icon | Size | Path | Use Case |
|------|------|------|----------|
| ![Square30x30Logo](icons-color/Square30x30Logo.png) | 30×30 | `icons-*/Square30x30Logo.png` | Small tile |
| ![Square44x44Logo](icons-color/Square44x44Logo.png) | 44×44 | `icons-*/Square44x44Logo.png` | App list icon |
| ![Square71x71Logo](icons-color/Square71x71Logo.png) | 71×71 | `icons-*/Square71x71Logo.png` | Small tile (71×71) |
| ![Square89x89Logo](icons-color/Square89x89Logo.png) | 89×89 | `icons-*/Square89x89Logo.png` | Small tile (89×89) |
| ![Square107x107Logo](icons-color/Square107x107Logo.png) | 107×107 | `icons-*/Square107x107Logo.png` | Small tile (107×107) |
| ![Square142x142Logo](icons-color/Square142x142Logo.png) | 142×142 | `icons-*/Square142x142Logo.png` | Medium tile (142×142) |
| ![Square150x150Logo](icons-color/Square150x150Logo.png) | 150×150 | `icons-*/Square150x150Logo.png` | Medium tile |
| ![Square284x284Logo](icons-color/Square284x284Logo.png) | 284×284 | `icons-*/Square284x284Logo.png` | Large tile (284×284) |
| ![Square310x310Logo](icons-color/Square310x310Logo.png) | 310×310 | `icons-*/Square310x310Logo.png` | Large tile |
| ![StoreLogo](icons-color/StoreLogo.png) | 50×50 | `icons-*/StoreLogo.png` | Microsoft Store listing |

---

## 📱 iOS Icons

**Path:** `icons-*/ios/AppIcon-*.png`

**Use:** iOS/iPadOS app icons for Xcode projects

**Destination:** Copy to `src-tauri/gen/apple/Assets.xcassets/AppIcon.appiconset/`

### Icon Sizes

| Size | 1x | 2x | 3x | Extra 2x | Use Case |
|------|----|----|----|---------|----|
| **20pt** | ![20x20@1x](icons-color/ios/AppIcon-20x20@1x.png) 20px | ![20x20@2x](icons-color/ios/AppIcon-20x20@2x.png) 40px | ![20x20@3x](icons-color/ios/AppIcon-20x20@3x.png) 60px | ![20x20@2x-1](icons-color/ios/AppIcon-20x20@2x-1.png) | Notification icon (iOS) |
| **29pt** | ![29x29@1x](icons-color/ios/AppIcon-29x29@1x.png) 29px | ![29x29@2x](icons-color/ios/AppIcon-29x29@2x.png) 58px | ![29x29@3x](icons-color/ios/AppIcon-29x29@3x.png) 87px | ![29x29@2x-1](icons-color/ios/AppIcon-29x29@2x-1.png) | Settings icon |
| **40pt** | ![40x40@1x](icons-color/ios/AppIcon-40x40@1x.png) 40px | ![40x40@2x](icons-color/ios/AppIcon-40x40@2x.png) 80px | ![40x40@3x](icons-color/ios/AppIcon-40x40@3x.png) 120px | ![40x40@2x-1](icons-color/ios/AppIcon-40x40@2x-1.png) | Spotlight search |
| **60pt** | — | ![60x60@2x](icons-color/ios/AppIcon-60x60@2x.png) 120px | ![60x60@3x](icons-color/ios/AppIcon-60x60@3x.png) 180px | — | iPhone app icon |
| **76pt** | ![76x76@1x](icons-color/ios/AppIcon-76x76@1x.png) 76px | ![76x76@2x](icons-color/ios/AppIcon-76x76@2x.png) 152px | — | — | iPad app icon |
| **83.5pt** | — | ![83.5x83.5@2x](icons-color/ios/AppIcon-83.5x83.5@2x.png) 167px | — | — | iPad Pro app icon |
| **512pt** | — | ![512@2x](icons-color/ios/AppIcon-512@2x.png) 1024px | — | — | App Store |

**Important:** iOS icons have **no transparency** - they are filled with the specified background color (white for color/black variants, black for white variant).

---

## 🤖 Android Icons

**Path:** `icons-*/android/mipmap-*/`

**Use:** Android app icons for Android Studio projects

**Destination:** Copy to `src-tauri/gen/android/app/src/main/res/`

### Density Variants

| Density | DPI | Launcher | Round | Foreground | Use Case |
|---------|-----|----------|-------|------------|----------|
| **mdpi** | ~160 | ![ic_launcher](icons-color/android/mipmap-mdpi/ic_launcher.png) 48px | ![ic_launcher_round](icons-color/android/mipmap-mdpi/ic_launcher_round.png) 48px | ![ic_launcher_foreground](icons-color/android/mipmap-mdpi/ic_launcher_foreground.png) 108px | Low-density screens |
| **hdpi** | ~240 | ![ic_launcher](icons-color/android/mipmap-hdpi/ic_launcher.png) 72px | ![ic_launcher_round](icons-color/android/mipmap-hdpi/ic_launcher_round.png) 72px | ![ic_launcher_foreground](icons-color/android/mipmap-hdpi/ic_launcher_foreground.png) 162px | Medium-density screens |
| **xhdpi** | ~320 | ![ic_launcher](icons-color/android/mipmap-xhdpi/ic_launcher.png) 96px | ![ic_launcher_round](icons-color/android/mipmap-xhdpi/ic_launcher_round.png) 96px | ![ic_launcher_foreground](icons-color/android/mipmap-xhdpi/ic_launcher_foreground.png) 216px | High-density screens |
| **xxhdpi** | ~480 | ![ic_launcher](icons-color/android/mipmap-xxhdpi/ic_launcher.png) 144px | ![ic_launcher_round](icons-color/android/mipmap-xxhdpi/ic_launcher_round.png) 144px | ![ic_launcher_foreground](icons-color/android/mipmap-xxhdpi/ic_launcher_foreground.png) 324px | Extra-high-density screens |
| **xxxhdpi** | ~640 | ![ic_launcher](icons-color/android/mipmap-xxxhdpi/ic_launcher.png) 192px | ![ic_launcher_round](icons-color/android/mipmap-xxxhdpi/ic_launcher_round.png) 192px | ![ic_launcher_foreground](icons-color/android/mipmap-xxxhdpi/ic_launcher_foreground.png) 432px | Extra-extra-high-density screens |

### Icon Types

- **`ic_launcher.png`** - Standard square launcher icon
- **`ic_launcher_round.png`** - Circular launcher icon (for devices with round icon support)
- **`ic_launcher_foreground.png`** - Foreground layer for adaptive icons (Android 8.0+)

### Adaptive Icons

Android 8.0+ uses adaptive icons with separate foreground and background layers:

**Configuration files:**
- `mipmap-anydpi-v26/ic_launcher.xml` - Adaptive icon configuration
- `values/ic_launcher_background.xml` - Background color definition

---

## 🎯 Quick Reference: When to Use Each Icon

### Web Development
- **Favicon (legacy):** `icons-color/icon.ico` (16×16, 32×32 layers)
- **Favicon (modern):** `icons-color/32x32.png` and `icons-color/128x128.png`
- **Apple Touch Icon:** `icons-color/icon.png` (512×512, will be resized)
- **PWA Manifest:** `icons-color/icon.png`, `icons-color/128x128.png`, `icons-color/128x128@2x.png`

### Desktop Apps (Tauri)
- **macOS:** `icons-color/icon.icns`
- **Windows:** `icons-color/icon.ico`
- **Linux:** `icons-color/32x32.png`, `icons-color/128x128.png`, `icons-color/icon.png`

### Mobile Apps
- **iOS (Xcode):** All files in `icons-color/ios/`
- **Android (Android Studio):** All files in `icons-color/android/`

### App Stores
- **Apple App Store:** `icons-color/ios/AppIcon-512@2x.png` (1024×1024)
- **Google Play Store:** `icons-color/icon.png` (512×512)
- **Microsoft Store:** `icons-color/StoreLogo.png` and Square logos

---

## 🛠️ Tauri Configuration

To use these icons in your Tauri app, add to `tauri.conf.json`:

```json
{
  "bundle": {
    "icon": [
      "icons-color/32x32.png",
      "icons-color/128x128.png",
      "icons-color/128x128@2x.png",
      "icons-color/icon.icns",
      "icons-color/icon.ico"
    ]
  }
}
```

For mobile platforms, Tauri automatically places icons in the correct locations when you run:
```bash
cargo tauri android init
cargo tauri ios init
```

---

## 📝 Source Files

### Logo Marks (Geometric Shape Only)
- `pioneer-logo.svg` - Full-color gradient (927KB, contains embedded PNG)
- `pioneer-logo-black.svg` - Black variant (632KB, contains embedded PNG)
- `pioneer-logo-white.svg` - White variant (625KB, contains embedded PNG)

### Text Logos (Wordmark)
- `pioneer-text.svg` - Full-color gradient with custom typography (7.9KB)
- `pioneer-text-logo-black.svg` - Black variant (7.4KB)
- `pioneer-text-white.svg` - White variant (7.3KB)

**Note:** Text logos are not square and are intended for branding/marketing use, not app icons.

---

## 🔄 Regenerating Icons

To regenerate all icons from source SVGs:

```bash
cd /Users/zhorton/art

# Color icons
cargo tauri icon pioneer-logo.svg -o icons-color -v

# Black icons
cargo tauri icon pioneer-logo-black.svg -o icons-black -v

# White icons (with black iOS background)
cargo tauri icon pioneer-logo-white.svg -o icons-white --ios-color "#000000" -v
```

---

## 📊 Asset Statistics

- **Total icon variants:** 3 (color, black, white)
- **Icons per variant:** ~60+ files
- **Total icons generated:** ~180+ files
- **Platforms supported:** macOS, Windows, Linux, iOS, Android, Web
- **Formats:** PNG, ICNS, ICO, XML

---

## 🎨 Brand Colors

### Primary Gradient (Color Icons)
- Start: `#2D7A3E` (Dark Green)
- Middle: `#4A9D5F` (Medium Green)
- End: `#7CB342` (Light Green)

### iOS Background Colors
- Color/Black icons: `#FFFFFF` (White)
- White icons: `#000000` (Black)

---

## 📄 License

Pioneer brand assets - All rights reserved.
