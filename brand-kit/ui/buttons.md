# Buttons

Buttons should be direct, compact, and action-oriented.

## Primary Actions

Primary actions use Pioneer green and should describe a product action:

- Deploy to Pioneer
- Run with Wrangler
- Generate endpoint
- View local app

## Secondary Actions

Secondary actions use white or mist backgrounds with thin borders:

- Copy command
- View source
- Open docs
- Download asset

## Button Copy Rules

- Start with a verb.
- Avoid vague labels like "Learn more" when a concrete action exists.
- Keep text short enough to fit on mobile.
- Pair unfamiliar icon-only actions with tooltips.

## Required States

Every button needs:

- Default
- Hover
- Active or pressed
- Focus-visible
- Disabled
- Loading, when the action waits on compilation, deploy, search, or network work

Use pressed state for toggle buttons and segmented controls. Use disabled state only when the action truly cannot run; otherwise let the user click and show validation feedback.

## Signifiers

- Primary buttons use filled Pioneer green.
- Secondary buttons use white or mist surfaces with a clear border.
- Ghost buttons are allowed inside toolbars and navigation, but they need a visible hover state.
- Destructive buttons use red only for destructive or failed states.
- Copy buttons should show a success toast or inline confirmation after click.
