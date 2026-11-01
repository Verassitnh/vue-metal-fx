import type { MaybeRefOrGetter } from 'vue'

export type MetalFxVariant = 'button' | 'circle'

export type MetalFxTheme = 'dark' | 'light' | 'auto'

export type MetalFxPreset = 'chromatic' | 'silver' | 'gold'

export interface MetalFxProps {
  enabled?: boolean
  variant?: MetalFxVariant
  preset?: MetalFxPreset
  theme?: MetalFxTheme
  strength?: number
  paused?: boolean
  borderRadius?: number
  normalizeHostStyles?: boolean
  reflectionTargets?: ReadonlyArray<MaybeRefOrGetter<HTMLElement | null | undefined>>
  disableGlow?: boolean
  shaderScale?: number
  ringCssPx?: number
  scale?: number
}
