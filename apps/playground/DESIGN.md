---
colors:
  primitives:
    primary: "#0A84FF"
    secondary: "#647586"
    tertiary: "#9CB6CE"
    neutral-strong: "#101418"
    neutral-muted: "#566170"
    danger: "#D70015"
  semantic:
    color-canvas: "#F5F5F7"
    color-canvas-tint: "#F4F6F9"
    color-surface-standard: "rgba(255, 255, 255, 0.90)"
    color-surface-raised: "rgba(255, 255, 255, 0.96)"
    color-surface-glass: "rgba(255, 255, 255, 0.76)"
    color-surface-glass-strong: "rgba(255, 255, 255, 0.88)"
    color-surface-scrim: "rgba(247, 248, 250, 0.88)"
    color-container-emphasis: "rgba(10, 132, 255, 0.06)"
    color-ink: "#101418"
    color-ink-muted: "#566170"
    color-primary: "#0A84FF"
    color-primary-strong: "#005ECB"
    color-secondary: "#647586"
    color-tertiary: "#9CB6CE"
    color-tertiary-emphasis: "rgba(156, 182, 206, 0.12)"
    color-outline: "rgba(16, 20, 24, 0.08)"
    color-outline-strong: "rgba(16, 20, 24, 0.16)"
    color-contrast-strong: "rgba(16, 20, 24, 0.72)"
    color-danger: "#D70015"
    color-focus-ring: "rgba(10, 132, 255, 0.24)"
    color-stage-glow: "rgba(10, 132, 255, 0.08)"
typography:
  font-sans: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", "Roboto Flex", "Noto Sans", sans-serif'
  font-mono: '"SF Mono", "IBM Plex Mono", "Roboto Mono", monospace'
  roles:
    display:
      size: "clamp(1.45rem, 2.35vw, 1.95rem)"
      line-height: "1.02"
      weight: 610
    headline:
      size: "clamp(1.25rem, 2vw, 1.6rem)"
      line-height: "1.05"
      weight: 600
    title:
      size: "1rem"
      line-height: "1.25"
      weight: 590
    body:
      size: "0.9375rem"
      line-height: "1.5"
      weight: 400
    label:
      size: "0.6875rem"
      line-height: "1.2"
      weight: 600
spacing:
  space-1: 4
  space-2: 6
  space-3: 10
  space-4: 14
  space-5: 18
  space-6: 22
  space-7: 28
  space-8: 36
radii:
  radius-control: "12px"
  radius-card: "18px"
  radius-panel: "22px"
  radius-hero: "24px"
  radius-pill: "999px"
elevation:
  shadow-raised: "0 12px 30px rgba(16, 20, 24, 0.08)"
  shadow-floating: "0 18px 44px rgba(16, 20, 24, 0.10)"
  blur-glass: "18px"
  blur-soft: "10px"
motion:
  duration-fast: "140ms"
  duration-medium: "220ms"
  duration-slow: "320ms"
  ease-standard: "cubic-bezier(0.2, 0, 0, 1)"
  ease-emphasized: "cubic-bezier(0.24, 0.86, 0.28, 1)"
  motion-spring-like: "cubic-bezier(0.22, 0.9, 0.3, 1)"
---

# Playground Design Tokens

`apps/playground` stays light-only. This pass keeps the denser utility layout, scales back oversized display type, and softens emphasis surfaces toward Apple's latest light chrome guidance.

## Principles

- Liquid Glass stays on chrome only: landing header, playground intro, and command dock.
- Editors, code panels, preview stages, warnings, and loading surfaces stay raised and readable.
- `primary` is reserved for focus, hover, and ripple feedback. The share button stays neutral in its resting state, then picks up state color only when feedback matters. `secondary` is quiet metadata. `tertiary` is limited to selected preset emphasis. `danger` is only for failure and unsafe states.
- `DESIGN.md` and `src/tokens.css` stay in manual 1:1 sync.

## Semantic Tokens

- `color-tertiary-emphasis` is the selected preset fill.
- `color-container-emphasis` is the subtle blue wash used for restrained highlight surfaces.
- `color-surface-scrim` is the page-level light field behind chrome.
- `color-stage-glow` is reserved for the preview halo.
- `color-contrast-strong` strengthens text and outlines under higher-contrast conditions.
- `motion-spring-like` is the standard entry/state easing for this app.

## Accessibility

- Interactive surfaces always animate. Hover stays color-first, press feedback uses ripple on buttons, and cross-document navigation uses View Transitions when supported. Under `prefers-reduced-motion: reduce`, durations collapse and travel is removed.
- Under `prefers-contrast: more`, glass shifts toward raised surfaces and outlines become stronger.
