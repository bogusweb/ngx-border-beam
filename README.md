# ngx-border-beam

[![npm](https://img.shields.io/npm/v/ngx-border-beam)](https://www.npmjs.com/package/ngx-border-beam)
[![demo](https://img.shields.io/badge/demo-GitHub%20Pages-blue)](https://bogusweb.github.io/ngx-border-beam/)
[![license](https://img.shields.io/npm/l/ngx-border-beam)](./LICENSE)

Animated border beam effect for Angular. A lightweight standalone component that adds a traveling or breathing glow animation around any element — cards, buttons, inputs, or search bars.

Angular wrapper for the [border-beam](https://github.com/Jakubantalik/border-beam) React component by [Jakub Antalik](https://github.com/Jakubantalik). Same visual engine (the framework-agnostic CSS generator and rAF pulse driver are shared verbatim), same presets, same defaults.

**Live demo & playground:** https://bogusweb.github.io/ngx-border-beam/

## Install

```bash
ng add ngx-border-beam
```

or plain npm:

```bash
npm install ngx-border-beam
```

Requires Angular 22+ (signal inputs). Zero runtime dependencies beyond `tslib`. No setup is needed either way — the component is standalone with no global styles, assets or providers; `ng add` just installs the package and prints a getting-started snippet.

## Quick start

```ts
import { Component } from '@angular/core';
import { NgxBorderBeam } from 'ngx-border-beam';

@Component({
  selector: 'app-root',
  imports: [NgxBorderBeam],
  template: `
    <ngx-border-beam>
      <div style="padding: 32px; border-radius: 16px; background: #1d1d1d">
        Your content here
      </div>
    </ngx-border-beam>
  `,
})
export class App {}
```

The component wraps your projected content and overlays the animated beam effect. It auto-detects the `border-radius` of the first projected element. It can also be applied as an attribute: `<div ngxBorderBeam>…</div>`.

## Types

Built-in presets control the glow style and motion. They fall into two families:

### Rotate (traveling beam)

```html
<ngx-border-beam size="md">   <!-- Full border glow (default) -->
<ngx-border-beam size="sm">   <!-- Compact glow for small elements -->
<ngx-border-beam size="line"> <!-- Bottom-only traveling glow -->
```

### Pulse (breathing glow, no rotation)

```html
<ngx-border-beam size="pulse-inner">   <!-- Glow breathes inside the border -->
<ngx-border-beam size="pulse-outside"> <!-- Halo blooms outward beyond the element -->
```

`pulse-outside` caveats (same as the React original): the wrapped element must be **opaque** (the glow renders behind it and blooms outward), the layout needs room around it (the wrapper is `overflow: visible`), and the idle hairline rides the wrapped element's own 1px border — add one if it has none.

## Inputs

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `size` | `'sm' \| 'md' \| 'line' \| 'pulse-inner' \| 'pulse-outside'` | `'md'` | Size/type preset |
| `colorVariant` | `'colorful' \| 'mono' \| 'ocean' \| 'sunset' \| 'forest' \| 'candy' \| 'ice' \| 'gold'` | `'colorful'` | Color variant |
| `theme` | `'dark' \| 'light' \| 'auto'` | `'dark'` | Adapts colors to the background; `'auto'` follows `prefers-color-scheme` |
| `staticColors` | `boolean` | `false` | Disable the hue-shift animation |
| `duration` | `number` | `1.96` / `3.1` / `2.3` | Rotation/travel duration in seconds (border / line / pulse) |
| `active` | `boolean` | `true` | Play/pause with fade in/out |
| `borderRadius` | `number` | auto-detected | Override the detected radius (px) |
| `brightness` | `number` | per-type (`1.3`) | Glow brightness multiplier |
| `saturation` | `number` | from theme preset | Glow saturation multiplier |
| `hueRange` | `number` | `30` | Hue rotation range in degrees (capped at 13 for `line`) |
| `glowSize` | `number` | `1` | Multiplies the blur radius of every glow layer (tighter < 1, softer > 1) |
| `css` | `string` | — | Extra CSS appended after the generated stylesheet; `{id}` is replaced with the instance id |
| `strength` | `number` | `1` | Overall effect opacity (0–1); beam layers only |

## Outputs

| Output | Description |
| --- | --- |
| `activate` | Fade-in animation completed |
| `deactivate` | Fade-out animation completed |

## How it works

Each instance injects a per-instance generated stylesheet into `<head>` (scoped by a unique `data-beam` id — no global styles, no class collisions). Three layers (beam stroke, inner glow, blurred bloom) are painted with stacked radial gradients, masked border rings, and a rotating conic gradient. Rotate types animate via CSS `@property` keyframes; pulse types are driven by a single shared `requestAnimationFrame` loop throttled to ~30 fps across all instances. Animations pause automatically while the element is scrolled offscreen (`IntersectionObserver`) and respect `prefers-reduced-motion`.

## Requirements

- Angular 22+
- A browser with CSS `@property` support (Chrome 85+, Safari 15.4+, Firefox 128+); degrades to stepped motion without it

## Development

This repo is an Angular CLI workspace:

- `projects/ngx-border-beam` — the library (published as `ngx-border-beam`)
- `projects/demo` — the docs/playground site deployed to GitHub Pages

```bash
npm install
npm run build:lib     # library + ng-add schematics -> dist/ngx-border-beam
ng serve demo         # docs site at http://localhost:4200
npm run build:demo    # docs site for GitHub Pages (base href /ngx-border-beam/)
```

The demo resolves `ngx-border-beam` through the workspace `tsconfig.json` path mapping to `dist/ngx-border-beam`, so rebuild the library after editing its sources. Note that `ng build` recreates `dist/`, which stales a running `ng serve` — restart it after a library rebuild.

### Syncing with the React original

`projects/ngx-border-beam/src/lib/styles.ts` and `pulseDriver.ts` are verbatim copies of the React library's framework-agnostic core (`packages/border-beam/src/` in the upstream monorepo). When the upstream visual engine changes, re-copy those two files; only `ngx-border-beam.ts` (the component) and `types.ts` are Angular-specific.

### Releasing

1. Bump `version` in `projects/ngx-border-beam/package.json`.
2. Commit, then tag and push: `git tag v1.0.0 && git push --tags`.
3. The `publish` workflow builds the library and runs `npm publish` from `dist/ngx-border-beam` (needs an `NPM_TOKEN` repository secret with publish rights).

Manual alternative: `npm run release` (build + `npm publish` from `dist/ngx-border-beam`).

The docs site deploys automatically on every push to `main` via the `pages` workflow.

## Credits

- **Original component, visual engine and design** — [Jakub Antalik](https://github.com/Jakubantalik) ([X](https://x.com/jakubantalik)) · [border-beam](https://github.com/Jakubantalik/border-beam) · [beam.jakubantalik.com](https://beam.jakubantalik.com)
- **Angular wrapper** — Paweł Bogusławski ([GitHub](https://github.com/bogusweb) · [X](https://x.com/Sztimpfer))

All visual work (gradients, animations, presets, the CSS generator and the pulse driver) is Jakub Antalik's; this package only adapts the React component layer to Angular.

## License

[MIT](./LICENSE)
