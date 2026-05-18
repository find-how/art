# Experience Principles

Pioneer brand work should make the product feel obvious before it explains itself. The strongest surfaces show a short route, the services Pioneer inferred, the terminal feedback, and the final running app state.

## Principles

| Principle | Apply it in Pioneer | Avoid |
|-----------|---------------------|-------|
| Signal affordance before explanation | Buttons, filters, tabs, links, copy controls, and deploy actions need clear shape, cursor, hover, pressed, focus, disabled, and loading states. | Instructional copy that compensates for unclear controls. |
| Make the route the visual hero | Put generated TypeScript and terminal proof near the top of product, docs, and launch surfaces. | Abstract artwork that hides the product behavior. |
| Use hierarchy aggressively | The route, deploy action, current status, and final response should be larger, closer to the top, or more colorful than supporting metadata. | Equal-weight labels that make a product screen read like a spreadsheet. |
| Keep density purposeful | Dashboards, asset libraries, editors, and terminals should be compact, scannable, and repeatable. | Marketing-scale type inside panels or dense tools. |
| Use color semantically | Green means Pioneer action or success, gold means Cloudflare/deploy context, blue means response/logs/observability, amber means warning, red means failure. | Color used only to decorate a neutral state. |
| Answer every interaction | Every copy, run, search, deploy, and form action needs immediate feedback and a completion state. | Clicks that appear to do nothing. |
| Create depth with restraint | Use soft shadows in light mode; use surface contrast, borders, and saturation control in dark mode. | Shadows that become the first thing people notice. |
| Protect text over media | Use gradients, scrims, or progressive blur when text sits on screenshots or artwork. | Text directly over busy imagery. |

## Required UI States

Every production Pioneer component should define:

- Default
- Hover
- Active or pressed
- Focus-visible
- Disabled
- Loading, when the action waits on network, compilation, or deploy work
- Success
- Warning, when the action can continue but needs attention
- Error, when the action failed or cannot continue

## Type And Layout Rules

- Use Instrument Sans for product UI and brand copy.
- Use Commit Mono for code, terminal output, paths, command labels, and compact status text.
- Keep letter spacing at `0`.
- Do not scale font size directly with viewport width.
- Use 4px spacing steps: `4`, `8`, `12`, `16`, `24`, `32`, `48`, `64`.
- Keep cards at `8px` radius or less.
- Keep dashboard and tool headings compact. Reserve hero-scale text for true first-viewport hero areas.

## Dark Mode

Dark mode should not be a black version of the light palette. Use:

- `#0A0D0B` for terminal and editor depth.
- `#111713` for raised dark panels.
- `#26352A` for dark borders.
- Lower-saturation green fills with brighter green text for chips.
- Borders and surface contrast instead of strong shadows.

## Overlay Rules

When text sits on screenshots, product imagery, or social artwork:

- Preserve the inspectable part of the image.
- Add a directional gradient behind text.
- Add progressive blur only when the gradient is not enough.
- Keep the copy short enough that it does not cover the product evidence.
