import type { MetalFxInstance } from './engine/renderer/core'
import { setGlowCallback } from './engine/renderer/loop'
import { updateGlow, type GlowHandles } from './engine/glow/glow'

type ThemeGetter = () => 'dark' | 'light'

const glowEntries = new Map<MetalFxInstance, { handles: GlowHandles; theme: ThemeGetter }>()

setGlowCallback((inst, nowMs) => {
  const entry = glowEntries.get(inst)
  if (entry) updateGlow(entry.handles, inst, nowMs, inst.opacityMul, entry.theme())
})

export function setGlowEntry(inst: MetalFxInstance, handles: GlowHandles, theme: ThemeGetter) {
  glowEntries.set(inst, { handles, theme })
}

export function deleteGlowEntry(inst: MetalFxInstance) {
  glowEntries.delete(inst)
}
