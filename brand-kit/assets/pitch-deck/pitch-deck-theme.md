# Pitch Deck Theme

## Cover

```txt
Pioneer
Write business logic. Ship edge infrastructure.
```

## Theme

- white backgrounds
- black text
- Pioneer green for action and proof
- amber/gold for Cloudflare platform feedback
- black editor and terminal surfaces
- small Commit Mono labels

The generated `.pptx` uses PowerPoint-safe font fallbacks so it opens cleanly on stock machines. For final designed decks, install Instrument Sans and Commit Mono and swap the theme fonts back to the official brand typefaces.

## Slide Types

1. Cover
2. Problem: generated code still needs infrastructure
3. Demo: checkout endpoint
4. Product: code maps to Worker, D1, Cache, Queue, Auth, Logs
5. Market: framework layer for Cloudflare's developer platform
6. Moat: compiler and TypeGraph
7. Ask / roadmap

## Default Footer

```txt
Pioneer by find.how
```

## Generated File

Run this from the repository root:

```bash
npm run deck
```

The generated PowerPoint file is:

```txt
brand-kit/assets/pitch-deck/pitch-deck-theme.pptx
```
