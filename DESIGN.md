# myDon Design System

This document describes the design philosophy, token system, patterns, and component conventions used across myDon. Reference it when making UI changes or building new features.

---

## Core Philosophy

**Flat, fluid, contrast-first.** Visual grouping comes from surface-vs-background color contrast alone — not from borders, shadows, or outlines. A white box on a gray page needs no border. This is the single most important principle.

- **No decorative borders on content cards.** Borders only appear as row dividers inside groups (hairline, `outline-variant`) or on interactive form elements (inputs, selects).
- **Shadows are whisper-thin.** `0 1px 3px rgb(0 0 0 / 0.07)` on light mode. Zero on dark (background contrast does the work).
- **No visual noise.** Every pixel of chrome must justify its existence.

The aesthetic reference is Apple iOS settings / Linear / Stripe — confident whitespace, no heavy decoration.

---

## Color Tokens

All tokens are defined once in `:root` using `light-dark()`. There are **no separate dark-mode overrides** — never duplicate token definitions in a `@media (prefers-color-scheme: dark)` block or `.dark` class. All values resolve automatically.

### Surface Stack (three layers)

| Token                   | Light     | Dark      | Role                                |
| ----------------------- | --------- | --------- | ----------------------------------- |
| `--sys-background`      | `#f0f2f5` | `#111316` | Page background — slightly gray     |
| `--sys-surface`         | `#ffffff` | `#1a1c1e` | Content groups — white / near-black |
| `--sys-surface-variant` | `#dfe3eb` | `#43474e` | Hover states, secondary fills       |

The contrast between `background` and `surface` is the sole visual separator for content groups. Do not add borders to supplement it.

### Primary (blue seed `#1667ff`)

| Token                        | Role                                          |
| ---------------------------- | --------------------------------------------- |
| `--sys-primary`              | CTA buttons, active links, focus rings        |
| `--sys-on-primary`           | Text/icons on primary bg                      |
| `--sys-primary-container`    | Active nav items, selected states (soft fill) |
| `--sys-on-primary-container` | Text on primary-container                     |

### Text

| Token                      | Role                                 |
| -------------------------- | ------------------------------------ |
| `--sys-on-surface`         | Body text, headings                  |
| `--sys-on-surface-variant` | Secondary text, labels, placeholders |
| `--sys-on-background`      | Same as on-surface (alias)           |

### Semantic

| Token             | Role                                         |
| ----------------- | -------------------------------------------- |
| `--sys-error`     | Errors, destructive, negative amounts        |
| `--sys-income`    | Success, positive amounts (green)            |
| `--sys-expense`   | Expenses (red alias, same as error-adjacent) |
| `--color-warning` | Warnings, caution states                     |

### Outline

| Token                   | Role                                          |
| ----------------------- | --------------------------------------------- |
| `--sys-outline-variant` | Row dividers, form borders at rest            |
| `--sys-outline`         | Stronger borders (focused states, separators) |

### Usage rules

- Use `light-dark()` for any value that differs between modes. Never write separate `:root` blocks.
- Prefer token names over raw hex values in all CSS.
- `color-mix(in srgb, var(--sys-primary) N%, var(--sys-surface))` for tonal fills.

---

## Typography

**Font:** Inter Variable (`@fontsource-variable/inter`). Always the only typeface.

| Context         | Size                    | Weight          | Notes                                                     |
| --------------- | ----------------------- | --------------- | --------------------------------------------------------- |
| Page title (h1) | `text-2xl` / `text-4xl` | `font-bold`     | Hero numbers use `tracking-tight`                         |
| Section heading | `text-lg`               | `font-semibold` |                                                           |
| Body            | `text-sm`               | `font-normal`   | Default for list rows                                     |
| Secondary text  | `text-xs`               | `font-normal`   | Subtitles, meta                                           |
| Section label   | `0.6875rem`             | `font-semibold` | Uppercase, `letter-spacing: 0.06em`, `on-surface-variant` |
| Micro label     | `0.625rem` (10px)       | `font-medium`   | Bottom nav labels                                         |

**Monetary values always use `tabular-nums`** (`font-variant-numeric: tabular-nums`). This prevents layout shift as digits change and keeps decimal points aligned in lists.

---

## Spacing & Radius

| Token         | Value  | Usage                         |
| ------------- | ------ | ----------------------------- |
| `--radius-sm` | `6px`  | Small chips, badges           |
| `--radius-md` | `10px` | Buttons, inputs, nav items    |
| `--radius-lg` | `14px` | Content groups (`page-group`) |
| `--radius-xl` | `20px` | Bottom nav, large modals      |

Page padding scale: `p-4` mobile → `p-6` tablet → `p-8` desktop.

---

## Layout Patterns

### `page-group` / `page-item`

The primary content container pattern. Used everywhere lists or grouped settings appear.

```css
/* Container: surface bg, rounded corners, whisper shadow */
.page-group {
  background-color: var(--sys-surface);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 1px 3px light-dark(rgb(0 0 0 / 0.07), rgb(0 0 0 / 0));
}

/* Row: flex, min-height, horizontal padding */
.page-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 3.25rem;
  padding: 0.625rem 1rem;
  gap: 0.75rem;
}

/* Divider between rows */
.page-item:not(:last-child) {
  border-bottom: 1px solid var(--sys-outline-variant);
}
```

**Rules:**

- Never add a border to `.page-group` itself.
- Use `page-item` for all rows inside a group. Row dividers come automatically.
- Prefix group with `page-section-label` above it (not inside it with a border-b).
- On mobile, groups can be stripped to flat lists (no background) when space is tight — apply `page-group` styles only at `lg:` breakpoint using a component-scoped CSS class.

### `page-section-label`

Small uppercase label that sits **above** a group, never inside it.

```css
.page-section-label {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--sys-on-surface-variant);
  padding: 0 0.25rem;
  margin-bottom: 0.375rem;
}
```

### Two-column sticky layout

Used on detail pages (account detail, manage page). Left panel is sticky; right panel scrolls with the window.

```css
.detail-layout {
  display: grid;
  grid-template-columns: 22rem 1fr; /* or 13rem for narrower nav */
  align-items: start;
  gap: 2rem;
}
.detail-left {
  position: sticky;
  top: 1.5rem;
  min-width: 0; /* prevent grid blowout */
}
.detail-right {
  min-width: 0;
}
```

Always add `min-width: 0` to grid children to prevent content from expanding past its track.

---

## Liquid Glass

Used exclusively on **floating elements** that sit above scrolling content: bottom nav, floating back button, scroll-triggered title overlays. Never on static content sections.

**iOS is the target, so the baseline is honest glassmorphism, not refraction.** Real per-pixel refraction (`backdrop-filter: url(#svgFilter)`) is Chromium-only — iOS Safari does not support it — so don't rely on it. The dependable recipe is a _moderate_ readable blur over a translucent tint plate with a strong white rim-light. Too much blur hides the background; too little kills foreground legibility — `blur(7px)` + a ~0.32 tint is the balance point.

```css
background: light-dark(rgb(255 255 255 / 0.32), rgb(28 30 34 / 0.42));
backdrop-filter: blur(7px) saturate(160%);
-webkit-backdrop-filter: blur(7px) saturate(160%);
box-shadow:
  0 10px 30px light-dark(rgb(0 0 0 / 0.14), rgb(0 0 0 / 0.5)),
  inset 0 0 0 1px light-dark(rgb(255 255 255 / 0.5), rgb(255 255 255 / 0.12)),
  /* rim */ inset 0 1px 0 light-dark(rgb(255 255 255 / 0.75), rgb(255 255 255 / 0.16)); /* top sheen */
```

The rim + top-sheen are inset box-shadows (no opaque `border`, no `::before` needed). Smaller chips (back button) can drop the outer shadow but keep blur + rim.

**Real iOS material:** layer Apple's private property _after_ the CSS recipe so it wins where available (WKWebView with system appearance) and is silently ignored everywhere else:

```css
@supports (-apple-visual-effect: -apple-system-glass-material) {
  .floating-glass {
    background: transparent;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    -apple-visual-effect: -apple-system-glass-material;
  }
}
```

**Shape:** floating glass is a **full capsule** — `border-radius: 999px`. Any pill that slides inside it (e.g. the bottom-nav active indicator) is also `999px`, which keeps the radii concentric automatically.

**Selection:** keep the active pill _faint_ (tint ≈ primary 4% over white 0.16) — the colour shift of the active icon/label is the real cue, not a strong blob.

**Motion (interactive glass, e.g. bottom nav):** the active indicator is one absolutely-positioned pill. Its position/size come from the tabs' **measured** `getBoundingClientRect()` (cached per resize/route, lerped for a fractional finger position) written as px `--ind-x` / `--ind-w`, with a `calc()` percentage only as a first-paint fallback — measuring avoids the sub-pixel drift that `calc()` accumulates the further right you go. The base transition is a gentle spring on travel (`translate 0.46s cubic-bezier(0.32, 1.3, 0.42, 1)`) but a fast, **non-bouncy** size snap-back (`scale 0.2s cubic-bezier(0.2, 0, 0, 1)`); `--nav-stretch` applies the horizontal liquid stretch during a gesture.

The pill carries a lens: an `::after` with `backdrop-filter` (`brightness(1.06) saturate(1.15)` at rest) masked by an elliptical `--lens-bezel` radial-gradient so refraction is concentrated at the rounded perimeter and the centre stays clear — the blur boundary curves with the capsule instead of ending on a hard seam. In motion the lens becomes true frosted glass (`blur(3px) brightness(1.12) saturate(1.4)`).

Three escalating states share the indicator and **must stay ordered** `--pressing` → `--moving` → `--dragging` (equal specificity, last wins; dragging is last so it wins if `moving` is also set): `--pressing` is a gentle pop (`scale ≈ ×1.05`) + soft halo; `--moving` (tap / route slide) bulges the pill a touch **taller than the bar** (`scale-y 1.22`) and lifts it to `z-index: 2` so the lens refracts the icons it slides over, keeping the base spring slide; `--dragging` (finger) uses its own quick transition with **no `translate` tween** so the pill tracks the finger 1:1, swells more (`scale-y 1.24`) with a tight primary halo, and also sits at `z-index: 2`. Press feedback _magnifies_ an inner content wrapper (`.bottom-nav-item-inner`: `1.04` active, `1.12` pressed), never the hit area. Tabs centre with `display: grid; place-items: center` + `min-width: 0` (equal slots regardless of label length/locale). Gate the spring, bulge and loupe behind `@media (prefers-reduced-motion: reduce)` — it pins `scale: 1` and near-instant transitions.

**Sheets (mobile "More"):** overflow/identity belongs in a bottom sheet, not crammed into a tab. The 5th tab is a normal icon+label tab (`ellipsis` / "More") so the bar keeps one rhythm; tapping it opens a glass sheet (scrim + rounded floating panel, grabber, avatar/name/email header, grouped inset rows). Mount it with `@if`, flip an `.is-shown` class on the next frame so the `translate` slide-in runs, and delay unmount by the transition duration on close. Dismiss via scrim tap, `Escape`, row selection, or a 1:1 swipe-down on the grabber zone (`.is-dragging` drops the tween; release past a threshold closes). Keep it a separate signal from any desktop user-menu so the two never interfere.

**Do not use** `light-dark()` with gradient values — it only accepts color values. For gradient backgrounds that differ between modes, use a base rule + `@media (prefers-color-scheme: dark)` override (as the top-safe-blur and indicator-stretch rules do).

---

## Buttons (`appBtn` directive)

Sizes: `xs` / `sm` / (default) / `lg`. Variants:

| Variant     | Background                       | Use              |
| ----------- | -------------------------------- | ---------------- |
| `primary`   | `--sys-primary`                  | Main CTA         |
| `secondary` | `--sys-surface` + outline border | Secondary action |
| `ghost`     | Transparent                      | Tertiary, cancel |
| `success`   | `--sys-income`                   | Confirm, approve |
| `error`     | `--sys-error`                    | Destructive      |
| `warning`   | `--color-warning`                | Caution action   |

Buttons have `border-radius: 0.5rem` (rounded-lg), `0.15s` transitions, and a focus ring (`2px solid primary, offset 2px`). The loading state uses a CSS `::before` spinner — no separate spinner component needed inside button content.

---

## Forms

**Inputs / selects:** `border: 1px solid outline-variant` at rest, `border-color: primary` + `box-shadow` focus ring on focus. Background `--sys-surface`. Border-radius `0.5rem`.

Inside modals, inputs stay on `--sys-surface` background (same token; the modal's own surface provides the contrast layer).

**Field component (`app-field`):** wraps label + input with consistent spacing. Always use for form fields in modals and forms. Label uses `.label` class (`text-sm font-medium`).

---

## Modals

```css
.modal-box {
  background-color: var(--sys-surface);
  border: none; /* no border — shadow provides depth */
  border-radius: 1rem;
  box-shadow:
    0 8px 32px rgb(0 0 0 / 0.18),
    0 2px 8px rgb(0 0 0 / 0.1);
  max-width: 32rem;
  padding: 1.5rem;
}
```

- `modal-header` has a bottom border (`outline-variant`) and contains the title.
- `modal-footer` has a top border and is right-aligned (`justify-end`).
- Backdrop: `rgb(0 0 0 / 0.5)` + `backdrop-filter: blur(4px)`.

---

## Toggles

Borderless pill toggle. Color communicates state — no border decoration.

- **Off:** `--sys-surface-variant` track, white/muted thumb with subtle shadow.
- **On:** `--sys-primary` track, `--sys-on-primary` thumb.
- Thumb uses `top: 50%; transform: translateY(-50%)` for pixel-perfect vertical centering regardless of context.
- Host element: `:host { display: inline-flex; align-items: center }` so it participates correctly in flex layouts.

Sizes: `sm` (2.25rem × 1.125rem) / default (2.75rem × 1.5rem) / `lg` (3.25rem × 1.75rem).

---

## Icons

**Lucide Angular** (`lucide-angular`). Icons must be registered in two places in `app.config.ts`:

1. The ES import at the top.
2. Inside the `LucideIconProvider` object in `useValue`.

Both registrations are required — missing either causes a runtime error. Icon names in templates use kebab-case (`name="arrow-left"`).

---

## Dark Mode

- Color scheme is `light dark` (auto) by default. `.light` / `.dark` classes force a mode.
- All tokens use `light-dark()` — **never** write `@media (prefers-color-scheme: dark)` for token overrides.
- Exception: gradient backgrounds (e.g. scroll overlay) cannot use `light-dark()` and require a media query.
- Shadow intensity: light mode uses subtle shadows; dark mode uses `rgb(0 0 0 / 0)` (invisible) since background contrast handles depth.

---

## Responsive Strategy

- **Mobile-first.** Base styles target mobile; `md:` / `lg:` progressively enhance.
- Sidebar: `hidden md:flex` (desktop only). Bottom nav: `flex md:hidden` (mobile only).
- Page groups: flat lists on mobile (no `page-group` background), grouped cards on desktop — applied via component-scoped CSS at `@media (width >= 1024px)`.
- Two-column layouts activate at `lg:` (1024px). Left panel becomes sticky.
- Safe area insets: use `env(safe-area-inset-top)` / `env(safe-area-inset-bottom)` for fixed elements near screen edges.

---

## What to Avoid

- **Borders on card containers.** Use surface contrast.
- **Heavy shadows.** Nothing above `0 4px 16px rgb(0 0 0 / 0.12)` for floating UI.
- **Inline templates or styles.** Every component has separate `.ts` / `.html` / `.css` files.
- **Duplicate dark-mode token definitions.** One `light-dark()` call per token.
- **`light-dark()` with non-color values.** Gradients, lengths, and other CSS types are invalid inside `light-dark()`.
- **Borders as decoration.** Borders are structural (row dividers, form fields) not decorative.
- **Adding features beyond the task.** Don't abstract or refactor while fixing a bug.
