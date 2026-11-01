# vue-metal-fx

Animated WebGL "liquid metal" ring for Vue 3. Wrap a button, input, or chip and it gets a real-time metal border with an optional wandering glow and proximity reflections on neighbouring elements.

A Vue port of [metal-fx](https://github.com/Jakubantalik/metal-fx) by Jakub Antalik ([live demo](https://metal.jakubantalik.com)). The WebGL engine is the upstream engine unchanged; only the React wrapper was rewritten as a Vue component.

## Install

```bash
npm install github:Verassitnh/vue-metal-fx
```

## Quick start

```vue
<script setup lang="ts">
import { MetalFx } from 'vue-metal-fx'
</script>

<template>
  <MetalFx>
    <button class="upgrade-pill">Upgrade to Pro</button>
  </MetalFx>
</template>
```

`MetalFx` wraps a single child, measures it, and paints the ring on top. The child stays fully interactive.

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `enabled` | `boolean` | `true` | `false` fades the ring out and releases the engine. The slotted child stays mounted, so focus and input state survive. |
| `variant` | `'button' \| 'circle'` | `'button'` | Pill (1px ring, scale 1.6) or compact circle (2px ring, scale 1.3). |
| `preset` | `'chromatic' \| 'silver' \| 'gold'` | `'chromatic'` | Colour palette. |
| `theme` | `'auto' \| 'dark' \| 'light'` | `'auto'` | `auto` follows `prefers-color-scheme` live. Drive it from your own theme state if your app has a toggle. |
| `strength` | `number` | `1` | 0..1 opacity of the shader and glow. |
| `paused` | `boolean` | `false` | Freeze on the current frame. |
| `borderRadius` | `number` | child's radius | Explicit corner radius in px. |
| `normalizeHostStyles` | `boolean` | `true` | Strip border, outline, shadow and background from the child so they don't fight the ring. |
| `reflectionTargets` | `MaybeRefOrGetter<HTMLElement>[]` | | Neighbours that get a soft reflection of the ring (dark theme only). |
| `disableGlow` | `boolean` | `false` | Hide the wandering halo; the ring still renders. |
| `shaderScale` | `number` | per variant | Zoom into the shader pattern. |
| `ringCssPx` | `number` | per variant | Ring thickness in px. |
| `scale` | `number` | `1` | Multiplier for every absolute-pixel constant, for elements rendered at non-1x size. |

## Examples

Show the ring until the user does something:

```vue
<MetalFx :enabled="!hasSearched" style="width: 100%">
  <input v-model="query" placeholder="Search for anything..." />
</MetalFx>
```

Reflection on a neighbouring chip:

```vue
<script setup lang="ts">
import { useTemplateRef } from 'vue'
const chip = useTemplateRef<HTMLElement>('chip')
</script>

<template>
  <button ref="chip">Tools</button>
  <MetalFx variant="circle" theme="dark" :reflection-targets="[chip]">
    <button aria-label="Send" style="width: 36px; height: 36px">↑</button>
  </MetalFx>
</template>
```

## Sizing

The wrapper is `inline-flex` and sizes itself to the child. Size the child, or set a size on `MetalFx` and stretch the child to fill it.

## Performance

One shared WebGL context and one `requestAnimationFrame` loop drive every mounted instance. Offscreen instances are skipped via `IntersectionObserver`, resizes are RAF-debounced, and the GL context is released when the last instance unmounts.

## Development

```bash
bun install
bun run dev        # demo at demo/
bun run typecheck
bun run build
```

## License

MIT. Engine © Jakub Antalik, see [LICENSE](./LICENSE).
