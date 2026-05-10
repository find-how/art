# Pioneer Deploy Button Assets

These button assets are adapted from the stronger Deploy to Pioneer treatment in `~/Code/Demo`. Use them anywhere Pioneer offers a one-click generated app or Wrangler deployment path.

## Files

| File | Use |
|------|-----|
| `pioneer-deploy-button.svg` | Dark primary button artwork for previews, docs, decks, and social cards. |
| `pioneer-deploy-strip.svg` | Wide launch strip artwork for demo pages and generated app previews. |
| `deploy-to-pioneer-button.svg` | Light standalone one-click deploy button. |
| `deploy-to-pioneer-button-dark.svg` | Dark standalone one-click deploy button. |
| `pioneer-deploy-button.css` | Reusable CSS for the primary button and deploy strip components. |
| `pioneer-deploy-button.html` | Copy-ready markup using the Pioneer bird mark from `/assets/icons-color/64x64.png`. |

## Primary Markup

```html
<link rel="stylesheet" href="/assets/buttons/pioneer-deploy-button.css">

<a
  class="pioneer-deploy-button"
  href="https://pioneer.find.how/deploy?source=brand.find.how"
  target="_blank"
  rel="noreferrer"
>
  <span class="pioneer-deploy-mark" aria-hidden="true">
    <img src="/assets/icons-color/64x64.png" alt="">
  </span>
  <span class="pioneer-deploy-copy">
    <strong>Deploy to Pioneer</strong>
    <span>Wrangler local feedback</span>
  </span>
</a>
```

The CSS includes hover shine, focus states, compact mobile layout, and a reduced-motion fallback.
