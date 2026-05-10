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
    { name: "Pioneer Forest", hex: "#2D7A3E", role: "Primary anchor" },
    { name: "Pioneer Leaf", hex: "#4A9D5F", role: "Primary mid tone" },
    { name: "Pioneer Sprout", hex: "#7CB342", role: "Primary highlight" },
    { name: "Ink", hex: "#161A17", role: "Text and monochrome mark" },
    { name: "Mist", hex: "#F4F7EF", role: "Page background" },
    { name: "Field Gold", hex: "#D9A441", role: "Secondary accent" },
    { name: "Slate Blue", hex: "#456275", role: "Utility accent" }
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
