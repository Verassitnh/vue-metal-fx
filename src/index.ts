export { default as MetalFx } from './MetalFx.vue'

export type { MetalFxProps, MetalFxVariant, MetalFxTheme, MetalFxPreset } from './types'

export {
  PRESETS,
  hexToRgb,
  type Preset,
  type PresetMode,
  type PresetName,
  type PresetTheme,
} from './engine/presets'

export {
  createInstance,
  destroyInstance,
  updateInstance,
  setSharedPreset,
  pauseShared,
  resumeShared,
} from './engine/renderer/loop'

export type { MetalFxInstance } from './engine/renderer/core'
