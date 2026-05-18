# Palette

Pioneer uses a mostly neutral product palette with green as the action system. Supporting colors exist for meaning, not decoration.

## Usage Rules

- Green means Pioneer action, generation, deploy, success, bindings, and working system.
- Black and near-black mean code, terminal, and serious developer surfaces.
- Amber and gold mean Cloudflare, deploy, and platform feedback.
- Sky blue means observability, response, logs, and success feedback.
- Amber means warnings and recoverable configuration issues.
- Red means failed checks, errors, and destructive actions.
- Mint backgrounds are for selected, success, and generated states. Do not use mint as a general page wash.

## Hierarchy

1. White background
2. Black text and code
3. Pioneer green action
4. Cloudflare amber/gold accent
5. Blue feedback and observability

Do not make Pioneer look like Cloudflare. Cloudflare is the platform. Pioneer is the framework layer.

## Core Colors

| Token | Hex | Use |
|-------|-----|-----|
| Pioneer Pine | `#174C2A` | Deep action, dark-mode depth, serious surfaces. |
| Pioneer Forest | `#2D7A3E` | Primary action, selected controls, success. |
| Pioneer Leaf | `#4A9D5F` | Hover, active accents, live generation. |
| Pioneer Sprout | `#7CB342` | Highlights, motion accents, generated-state glow. |
| Pioneer Soft | `#A5DBB7` | Dark-mode text, focus accents, and soft borders. |
| Pioneer Mint | `#DDF4E4` | Soft selected backgrounds and success surfaces. |
| Ink | `#161A17` | Text, monochrome mark, command surfaces. |
| Mist | `#F4F7EF` | Warm calm backgrounds. |
| Field Gold | `#D9A441` | Cloudflare/deploy context. |
| Focus Sky | `#0EA5E9` | Focus rings, response feedback, logs. |
| Warning Amber | `#F59E0B` | Warnings and recoverable issues. |
| Danger Red | `#DC2626` | Errors and destructive actions. |
| Slate Blue | `#456275` | Secondary diagrams and metadata. |

## State Mapping

| State | Background | Text | Border |
|-------|------------|------|--------|
| Default action | `#2D7A3E` | `#FFFFFF` | `#2D7A3E` |
| Hover action | `#4A9D5F` | `#FFFFFF` | `#4A9D5F` |
| Pressed action | `#174C2A` | `#FFFFFF` | `#174C2A` |
| Selected soft | `#DDF4E4` | `#174C2A` | `#A5DBB7` |
| Disabled | `#F5F5F5` | `#A3A3A3` | `#E5E5E5` |
| Focus | transparent | current | `#0EA5E9` ring |
| Success | `#DDF4E4` | `#174C2A` | `#2D7A3E` |
| Warning | `#FEF3C7` | `#92400E` | `#F59E0B` |
| Error | `#FEE2E2` | `#991B1B` | `#DC2626` |

## Dark Mode

Use dark mode to separate layers through surface contrast:

| Token | Hex | Use |
|-------|-----|-----|
| Dark page | `#0A0D0B` | Editor, terminal, and full dark backgrounds. |
| Dark surface | `#111713` | Raised panels on dark page. |
| Dark elevated | `#18231B` | Popovers, menus, and active panels. |
| Dark border | `#26352A` | Low-contrast separation. |
| Dark text | `#E7F3E4` | Primary text. |
| Dark muted | `#9CA3AF` | Secondary text. |

Dark-mode chips should usually invert intensity: lower-saturation fills with brighter text.
