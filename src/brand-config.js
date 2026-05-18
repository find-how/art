export const brandConfig = {
  name: "Pioneer",
  product: "Pioneer Brand Kit",
  domain: "brand.find.how",
  origin: "https://brand.find.how",
  description: "Brand guidance and assets for Pioneer: write business logic, ship edge infrastructure.",
  positioning: {
    tagline: "Write business logic. Ship edge infrastructure.",
    headline: "The full-stack TypeScript framework that compiles to the edge.",
    demoHeadline: "Ask for the endpoint. Pioneer turns the generated code into the app.",
    oneSentence:
      "Pioneer is the full-stack TypeScript framework that turns application business logic into production-ready Cloudflare edge infrastructure.",
    short: "Write business logic. Pioneer compiles the infrastructure.",
    ai: "AI writes code. Pioneer makes it deployable."
  },
  colors: [
    { name: "Pioneer Pine", hex: "#174C2A", role: "Deep action, dark-mode depth, and serious surfaces" },
    { name: "Pioneer Forest", hex: "#2D7A3E", role: "Primary action and selected state" },
    { name: "Pioneer Leaf", hex: "#4A9D5F", role: "Primary mid tone and hover state" },
    { name: "Pioneer Sprout", hex: "#7CB342", role: "Highlights, live states, and motion accents" },
    { name: "Pioneer Soft", hex: "#A5DBB7", role: "Dark-mode text, focus accents, and soft borders" },
    { name: "Pioneer Mint", hex: "#DDF4E4", role: "Soft selected backgrounds and success surfaces" },
    { name: "Ink", hex: "#161A17", role: "Text, monochrome mark, and command surfaces" },
    { name: "Mist", hex: "#F4F7EF", role: "Warm page background and calm panels" },
    { name: "Field Gold", hex: "#D9A441", role: "Cloudflare, deploy, and platform feedback" },
    { name: "Focus Sky", hex: "#0EA5E9", role: "Focus rings, response feedback, logs, and observability" },
    { name: "Warning Amber", hex: "#F59E0B", role: "Warnings and recoverable configuration issues" },
    { name: "Danger Red", hex: "#DC2626", role: "Errors, destructive actions, and failed checks" },
    { name: "Slate Blue", hex: "#456275", role: "Utility accent for secondary diagrams and metadata" }
  ],
  experiencePrinciples: [
    {
      title: "Signal affordance before explanation",
      principle:
        "Controls should read as controls through shape, state, cursor, and active treatment before any helper text is needed.",
      application:
        "Use pressed segments for filters, visible focus rings, disabled opacity, and clear hover treatment on copy, download, and deploy actions."
    },
    {
      title: "Make the route the visual hero",
      principle:
        "Pioneer sells the path from business logic to running app, so code and terminal proof should outrank decorative brand moments.",
      application:
        "Put the route, terminal result, and generated bindings near the top; keep price, metadata, and labels secondary unless they change the decision."
    },
    {
      title: "Use color semantically",
      principle:
        "Green is Pioneer action, gold is platform/deploy context, blue is response/observability, amber is warning, and red is failure.",
      application:
        "Do not use semantic colors as decoration. A colored chip, border, or line should tell the user something changed or needs attention."
    },
    {
      title: "Answer every interaction",
      principle:
        "Every click, copy, run, search, deploy, and form action needs an immediate response.",
      application:
        "Provide default, hover, pressed, focus, disabled, loading, success, warning, and error states for production UI surfaces."
    },
    {
      title: "Keep density purposeful",
      principle:
        "Pioneer tools are work surfaces, not marketing posters. The layout should stay quiet, scannable, and repeatable.",
      application:
        "Use compact headings in panels, 4px spacing steps, fixed control dimensions, and dense grids for asset libraries and dashboards."
    },
    {
      title: "Create depth with restraint",
      principle:
        "Light mode can use soft shadows, while dark mode should rely on surface contrast and borders.",
      application:
        "Cards use small shadows or none; popovers and command palettes get stronger depth because they sit above other content."
    },
    {
      title: "Protect text over media",
      principle:
        "Screenshots, diagrams, and hero artwork should never compete with the copy that explains the action.",
      application:
        "Use gradients or progressive blur overlays when text sits on imagery, and keep inspectable product screenshots clear."
    },
    {
      title: "Prefer real product evidence",
      principle:
        "The brand is strongest when it shows generated TypeScript, inferred services, Wrangler feedback, and a passing response.",
      application:
        "Use actual code, terminal lines, diagrams, and UI components instead of generic abstract shapes."
    }
  ],
  brandKitSections: [
    {
      id: "start-here",
      navLabel: "Start",
      eyebrow: "Start here",
      title: "Brand source of truth",
      description:
        "The shortest path from brand intent to usable material: positioning, canonical copy, source files, and the code example that proves the product story.",
      items: [
        {
          id: "messaging",
          title: "Messaging System",
          description: "Canonical public copy for product pages, demos, launch material, and docs introductions.",
          tags: ["Copy", "Positioning", "Reusable"],
          preview: {
            type: "messaging",
            fields: [
              { label: "Tagline", key: "tagline" },
              { label: "Short", key: "short" },
              { label: "Positioning", key: "oneSentence" },
              { label: "AI framing", key: "ai" }
            ]
          },
          code: {
            label: "brand-kit/README.md",
            href: "/assets/brand-kit/README.md",
            language: "markdown"
          },
          primaryHref: "/assets/brand-kit/README.md"
        },
        {
          id: "source-files",
          title: "Primary Source Files",
          description: "The files a designer, developer, or launch teammate should open before inventing new brand material.",
          tags: ["Docs", "Guidelines", "Source"],
          preview: {
            type: "resources",
            titles: [
              "Pioneer Brand Kit",
              "Messaging Kit",
              "Experience Principles",
              "Interactive Components",
              "Canonical Checkout Snippet"
            ]
          },
          code: {
            label: "manifest entry points",
            href: "/assets/brand-kit/README.md",
            language: "markdown"
          }
        },
        {
          id: "canonical-route",
          title: "Canonical Checkout Route",
          description: "The product proof example: a focused route that implies Worker, D1, Cache, Queue, auth, logs, and a 201 response.",
          tags: ["TypeScript", "Code", "Product proof"],
          preview: {
            type: "code",
            snippet: "canonicalCheckoutRoute",
            label: "app/routes/web.ts"
          },
          code: {
            label: "canonical-checkout-route.md",
            href: "/assets/brand-kit/code-style/canonical-checkout-route.md",
            language: "markdown"
          },
          primaryHref: "/assets/brand-kit/code-style/canonical-checkout-route.md"
        }
      ]
    },
    {
      id: "identity-system",
      navLabel: "Identity",
      eyebrow: "Identity system",
      title: "Marks, tokens, and type",
      description:
        "Core identity assets grouped by use: recognizable marks first, then the token systems that make UI and launch material consistent.",
      items: [
        {
          id: "logos",
          title: "Logo And Wordmark Set",
          description: "Color, black, and white marks for headers, app surfaces, print, and dark backgrounds.",
          tags: ["SVG", "PNG", "Downloadable"],
          preview: {
            type: "assetGrid",
            paths: [
              "pioneer-text.svg",
              "pioneer-text-logo-black.svg",
              "pioneer-text-white.svg",
              "pioneer-logo.svg",
              "pioneer-logo-black.svg",
              "pioneer-logo-white.svg"
            ],
            limit: 6
          },
          code: {
            label: "logo/README.md",
            href: "/assets/brand-kit/logo/README.md",
            language: "markdown"
          },
          primaryHref: "/assets/brand-kit/logo/README.md"
        },
        {
          id: "colors",
          title: "Color And Semantic Tokens",
          description: "Pioneer action colors, semantic feedback colors, and dark-mode surface tokens.",
          tags: ["CSS", "JSON", "Semantic"],
          preview: { type: "colors" },
          code: {
            label: "tokens.css",
            href: "/assets/brand-kit/colors/tokens.css",
            language: "css"
          },
          primaryHref: "/assets/brand-kit/colors/tokens.css"
        },
        {
          id: "typography",
          title: "Typography Scale",
          description: "Instrument Sans for interface and brand copy, Commit Mono for code, terminals, paths, and compact status text.",
          tags: ["Type", "Scale", "UI"],
          preview: { type: "typography" },
          code: {
            label: "type-scale.md",
            href: "/assets/brand-kit/typography/type-scale.md",
            language: "markdown"
          },
          primaryHref: "/assets/brand-kit/typography/type-scale.md"
        }
      ]
    },
    {
      id: "interface-components",
      navLabel: "Interface",
      eyebrow: "Interface components",
      title: "Reusable controls and work surfaces",
      description:
        "UI pieces organized by affordance: click, copy, select, search, run, inspect, and respond with state.",
      items: [
        {
          id: "deploy-button",
          title: "Deploy Button",
          description: "The primary Pioneer action treatment, with clear click affordance and reusable CSS/HTML.",
          tags: ["Button", "CTA", "HTML"],
          preview: {
            type: "assetGrid",
            filter: { types: ["Deploy button artwork"] },
            limit: 4
          },
          code: {
            label: "pioneer-deploy-button.html",
            href: "/assets/buttons/pioneer-deploy-button.html",
            language: "html"
          },
          primaryHref: "/assets/buttons/pioneer-deploy-button.html"
        },
        {
          id: "states",
          title: "Feedback States",
          description: "Default, hover, pressed, disabled, success, info, warning, and danger signifiers for product UI.",
          tags: ["Affordance", "States", "Semantic color"],
          preview: { type: "states" },
          code: {
            label: "experience-principles.md",
            href: "/assets/brand-kit/ui/experience-principles.md",
            language: "markdown"
          },
          primaryHref: "/assets/brand-kit/ui/experience-principles.md"
        },
        {
          id: "webview-components",
          title: "Webview Components",
          description: "Live editor, terminal, search, navigation, and Edge Artisan surfaces with source tabs and reuse actions.",
          tags: ["Preview", "Code", "Interactive"],
          preview: {
            type: "componentLinks",
            links: [
              { label: "Realtime Demo", href: "#component-demo", detail: "Monaco plus deploy terminal." },
              { label: "Editor", href: "#component-editor", detail: "Typed Pioneer route editor." },
              { label: "Terminal", href: "#component-terminal", detail: "Wrangler feedback console." },
              { label: "Edge CLI", href: "#component-edge-artisan", detail: "Worker Durable Object command driver." },
              { label: "Docs Search", href: "#component-search", detail: "Search trigger and command palette." },
              { label: "Navigation", href: "#component-navigation", detail: "Desktop flyouts and mobile drawer." }
            ]
          },
          code: {
            label: "components/README.md",
            href: "/assets/brand-kit/ui/components/README.md",
            language: "markdown"
          },
          primaryHref: "/assets/brand-kit/ui/components/README.md"
        }
      ]
    },
    {
      id: "product-proof",
      navLabel: "Proof",
      eyebrow: "Product proof",
      title: "Code, feedback, diagrams, and motion",
      description:
        "Assets that show Pioneer doing work: generated routes, inferred services, terminal feedback, local loops, and production-shaped outcomes.",
      items: [
        {
          id: "editor-terminal",
          title: "Route To Running App",
          description: "The combined editor and terminal story used in demos and embedded product explanations.",
          tags: ["Monaco", "xterm", "Feedback loop"],
          preview: {
            type: "componentLinks",
            links: [
              { label: "Live workbench", href: "#component-demo", detail: "Edit a route and run the Pioneer feedback loop." },
              { label: "Editor component", href: "#component-editor", detail: "Inspect the reusable Monaco surface." },
              { label: "Terminal component", href: "#component-terminal", detail: "Replay deploy and smoke-test output." }
            ]
          },
          code: {
            label: "browser-demo.html",
            href: "/assets/brand-kit/ui/components/browser-demo.html",
            language: "html"
          },
          primaryHref: "#component-demo"
        },
        {
          id: "diagrams",
          title: "Documentation Diagrams",
          description: "Pipeline, route, local HTTPS, and Cloudflare edge diagrams for docs and presentations.",
          tags: ["SVG", "Docs", "Architecture"],
          preview: {
            type: "assetGrid",
            filter: { types: ["Documentation diagram"] },
            limit: 4
          },
          code: {
            label: "diagrams/README.md",
            href: "/assets/diagrams/README.md",
            language: "markdown"
          },
          primaryHref: "/assets/diagrams/README.md"
        },
        {
          id: "motion-loading",
          title: "Motion And Loading States",
          description: "Animated product loops and AI/loading states for moments where Pioneer is generating, routing, or deploying.",
          tags: ["Motion", "Loading", "State"],
          preview: {
            type: "assetGrid",
            filters: [
              { types: ["Motion animation"] },
              { types: ["Loading animation"] }
            ],
            limit: 7
          },
          code: {
            label: "motion/README.md",
            href: "/assets/motion/README.md",
            language: "markdown"
          },
          primaryHref: "/assets/motion/README.md"
        }
      ]
    },
    {
      id: "launch-assets",
      navLabel: "Launch",
      eyebrow: "Launch assets",
      title: "Distribution and campaign material",
      description:
        "Reusable public-facing assets for social, landing pages, GitHub previews, docs covers, pitch decks, and Cloudflare launchpad submissions.",
      items: [
        {
          id: "social-cards",
          title: "Social Cards",
          description: "Open Graph, X, LinkedIn, GitHub, docs, square, and launch templates.",
          tags: ["SVG", "PNG", "Social"],
          preview: {
            type: "assetGrid",
            filter: { types: ["Social card template"] },
            limit: 6
          },
          code: {
            label: "social/README.md",
            href: "/assets/social/README.md",
            language: "markdown"
          },
          primaryHref: "/assets/social/README.md"
        },
        {
          id: "landing-pitch",
          title: "Landing, Pitch, And Launchpad",
          description: "First-viewport hero, deck theme, and Cloudflare Workers Launchpad one-pager grouped for launch execution.",
          tags: ["Landing", "Deck", "Launchpad"],
          preview: {
            type: "assetGrid",
            paths: [
              "brand-kit/assets/landing/landing-page-hero.svg",
              "brand-kit/assets/pitch-deck/pitch-deck-theme.svg",
              "brand-kit/assets/launchpad/cloudflare-workers-launchpad-one-pager.svg",
              "brand-kit/assets/docs/docs-cover.svg"
            ],
            limit: 4
          },
          code: {
            label: "landing-page-copy.md",
            href: "/assets/brand-kit/assets/landing/landing-page-copy.md",
            language: "markdown"
          },
          primaryHref: "/assets/brand-kit/assets/landing/landing-page-copy.md"
        },
        {
          id: "github-docs-assets",
          title: "GitHub And Docs Artwork",
          description: "Repository preview, docs cover, and launch visuals for surfaces where the brand needs to be inspectable at a glance.",
          tags: ["GitHub", "Docs", "Preview"],
          preview: {
            type: "assetGrid",
            paths: [
              "brand-kit/assets/github/github-social-preview.svg",
              "brand-kit/assets/docs/docs-cover.svg",
              "social/github-preview.svg",
              "social/docs-header.svg"
            ],
            limit: 4
          },
          code: {
            label: "screenshot-rules.md",
            href: "/assets/brand-kit/guidelines/screenshot-rules.md",
            language: "markdown"
          }
        }
      ]
    },
    {
      id: "asset-library",
      navLabel: "Library",
      eyebrow: "Asset library",
      title: "Search, filter, copy, and download",
      description:
        "The complete generated manifest remains available for automation and bulk browsing after the curated sections.",
      items: [
        {
          id: "manifest",
          title: "Generated Manifest",
          description: "Every copied brand asset with type, variant, platform, dimensions, MIME type, and download URL.",
          tags: ["JSON", "Automation", "Full inventory"],
          preview: { type: "manifestSummary" },
          code: {
            label: "manifest.json",
            href: "/assets/manifest.json",
            language: "json"
          },
          primaryHref: "#resources"
        }
      ]
    }
  ],
  deployActions: [
    {
      label: "Deploy to Pioneer",
      href: "https://pioneer.find.how/deploy?source=brand.find.how",
      variant: "primary",
      detail: "One-click Wrangler deploy"
    },
    {
      label: "Deploy Brand Portal",
      command: "npm run deploy",
      variant: "secondary"
    },
    {
      label: "Open brand.find.how",
      href: "https://brand.find.how",
      variant: "secondary"
    }
  ],
  resources: [
    {
      title: "Brand README",
      href: "/assets/README.md",
      detail: "Complete platform notes and asset path reference."
    },
    {
      title: "Pioneer Brand Kit",
      href: "/assets/brand-kit/README.md",
      detail: "Source-of-truth positioning, messaging, tokens, UI rules, and demo guidance."
    },
    {
      title: "Messaging Kit",
      href: "/assets/brand-kit/messaging/30-second-pitch.md",
      detail: "One-liner, pitch lengths, demo script, and audience-specific framing."
    },
    {
      title: "Color Tokens",
      href: "/assets/brand-kit/colors/tokens.css",
      detail: "Official Pioneer color tokens from the Demo visual system."
    },
    {
      title: "Interactive Components",
      href: "/assets/brand-kit/ui/components/README.md",
      detail: "Reusable Monaco editor, xterm terminal, docs search, and find.how navigation components."
    },
    {
      title: "Experience Principles",
      href: "/assets/brand-kit/ui/experience-principles.md",
      detail: "Applied UI rules for affordances, hierarchy, spacing, states, motion, overlays, and dark mode."
    },
    {
      title: "Edge Artisan Console",
      href: "/assets/brand-kit/ui/components/edge-artisan-worker.ts",
      detail: "Worker and Durable Object command driver example for Artisan-style CLI commands on Cloudflare."
    },
    {
      title: "Canonical Checkout Snippet",
      href: "/assets/brand-kit/code-style/canonical-checkout-route.md",
      detail: "The flagship route showing Worker, D1, Cache, Queue, Auth, and 201 response mapping."
    },
    {
      title: "Landing Hero",
      href: "/assets/brand-kit/assets/landing/landing-page-hero.svg",
      detail: "First-viewport hero artwork for the business-logic-to-edge-infrastructure story."
    },
    {
      title: "Pitch Deck Theme",
      href: "/assets/brand-kit/assets/pitch-deck/pitch-deck-theme.pptx",
      detail: "Native PowerPoint theme deck with the Pioneer story, demo proof, and public hierarchy."
    },
    {
      title: "Launchpad One-Pager",
      href: "/assets/brand-kit/assets/launchpad/cloudflare-workers-launchpad-one-pager.md",
      detail: "Cloudflare Workers Launchpad framing, audience, demo proof, and CTA copy."
    },
    {
      title: "Asset Manifest",
      href: "/assets/manifest.json",
      detail: "Generated inventory for automation and downstream apps."
    },
    {
      title: "Loading Assets",
      href: "/assets/loaders/README.md",
      detail: "Animated SVG loaders for AI thinking and background work states."
    },
    {
      title: "Social Cards",
      href: "/assets/social/README.md",
      detail: "Launch, docs, GitHub, LinkedIn, X, and square social templates."
    },
    {
      title: "Product Patterns",
      href: "/assets/patterns/README.md",
      detail: "Reusable editor, terminal, AI prompt, and Cloudflare feedback surfaces."
    },
    {
      title: "Docs Diagrams",
      href: "/assets/diagrams/README.md",
      detail: "Pipeline and infrastructure diagrams for documentation and presentations."
    },
    {
      title: "Motion Assets",
      href: "/assets/motion/README.md",
      detail: "Animated SVG product storytelling patterns with reduced-motion fallbacks."
    },
    {
      title: "Deploy Buttons",
      href: "/assets/buttons/README.md",
      detail: "Demo-derived Deploy to Pioneer button artwork, CSS, and HTML snippets."
    },
    {
      title: "Cloudflare Worker",
      href: "/api/brand",
      detail: "Live brand metadata endpoint."
    }
  ]
};
