<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  ref,
  shallowRef,
  toValue,
  watch,
  type ComponentPublicInstance,
} from 'vue'
import type { MetalFxInstance } from './engine/renderer/core'
import {
  createInstance,
  destroyInstance,
  registerGlowInstance,
  setInstanceVisible,
  setSharedPreset,
  unregisterGlowInstance,
  updateInstance,
} from './engine/renderer/loop'
import { injectGlow } from './engine/glow/glow'
import { deleteGlowEntry, setGlowEntry } from './glowBridge'
import { addReflectionTarget, removeReflectionTarget } from './engine/reflection/paint'
import { scheduleReflectionPaint } from './engine/reflection/reflectionScheduler'
import { ensureStylesInjected } from './styles'
import { useResolvedTheme } from './useResolvedTheme'
import type { MetalFxProps } from './types'

const props = withDefaults(defineProps<MetalFxProps>(), {
  enabled: true,
  variant: 'button',
  preset: 'chromatic',
  theme: 'auto',
  strength: 1,
  paused: false,
  normalizeHostStyles: true,
  disableGlow: false,
  scale: 1,
})

ensureStylesInjected()

const root = ref<HTMLElement>()
const content = ref<HTMLElement>()
const ready = ref(false)
const instance = shallowRef<MetalFxInstance | null>(null)

const resolvedTheme = useResolvedTheme(() => props.theme)
const shape = computed(() => (props.variant === 'circle' ? 'circle' : 'pill'))
const clampedStrength = computed(() => Math.max(0, Math.min(1, props.strength)))

function resolveRadius(width: number, height: number) {
  if (shape.value === 'circle') return Math.min(width, height) / 2

  const child = content.value?.firstElementChild
  const childRadius = child ? parseFloat(getComputedStyle(child).borderTopLeftRadius) : NaN
  const raw = props.borderRadius ?? (Number.isFinite(childRadius) ? childRadius : 0)
  return Math.min(raw, Math.min(width, height) / 2)
}

function applyRadius(host: HTMLElement, cornerRadius: number) {
  host.style.setProperty('--mfx-radius', `${cornerRadius}px`)
  host.style.borderRadius = `${cornerRadius}px`
}

function measure(host: HTMLElement) {
  const rect = host.getBoundingClientRect()
  const cssWidth = Math.max(1, Math.round(rect.width))
  const cssHeight = Math.max(1, Math.round(rect.height))
  return { cssWidth, cssHeight, cornerRadius: resolveRadius(cssWidth, cssHeight) }
}

const MIN_GLOW_PX = 8

let teardown: (() => void) | null = null
let mountedOverlay: HTMLElement | null = null

function mountEngine(host: HTMLElement, overlay: HTMLElement) {
  const canvas = overlay.querySelector('canvas')!
  const glowHost = overlay.querySelector<HTMLElement>('[data-mfx-glow-host]')!
  const initial = measure(host)

  const inst = createInstance({
    hostCanvas: canvas,
    ...initial,
    kind: shape.value,
    paused: props.paused,
    shaderScale: props.shaderScale,
    ringCssPx: props.ringCssPx,
    scale: props.scale,
    opacityMul: clampedStrength.value,
    onFirstCopy: () => (ready.value = true),
  })
  setSharedPreset(props.preset, resolvedTheme.value)
  applyRadius(host, initial.cornerRadius)

  const injectSizedGlow = (size: ReturnType<typeof measure>) => {
    glowHost.innerHTML = ''
    if (size.cssWidth < MIN_GLOW_PX || size.cssHeight < MIN_GLOW_PX) return

    const handles = injectGlow(glowHost, {
      width: size.cssWidth,
      height: size.cssHeight,
      cornerRadius: size.cornerRadius,
      kind: shape.value,
      scale: props.scale,
    })
    setGlowEntry(inst, handles, () => resolvedTheme.value)
  }
  injectSizedGlow(initial)
  registerGlowInstance(inst)

  let resizeRaf = 0
  const resizeObserver = new ResizeObserver(() => {
    if (resizeRaf !== 0) return
    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = 0
      const next = measure(host)
      updateInstance(inst, next)
      applyRadius(host, next.cornerRadius)
      injectSizedGlow(next)
    })
  })
  resizeObserver.observe(host)

  const intersectionObserver = new IntersectionObserver(
    entries => entries.forEach(entry => setInstanceVisible(inst, entry.isIntersecting)),
    { rootMargin: '64px' }
  )
  intersectionObserver.observe(host)

  instance.value = inst

  return () => {
    resizeObserver.disconnect()
    intersectionObserver.disconnect()
    if (resizeRaf !== 0) cancelAnimationFrame(resizeRaf)
    deleteGlowEntry(inst)
    unregisterGlowInstance(inst)
    destroyInstance(inst)
    instance.value = null
    host.style.removeProperty('--mfx-radius')
    host.style.removeProperty('border-radius')
  }
}

function bindOverlay(el: Element | ComponentPublicInstance | null) {
  const overlay = el instanceof HTMLElement ? el : null
  if (overlay === mountedOverlay) return

  teardown?.()
  teardown = null
  mountedOverlay = overlay
  if (!overlay?.parentElement) return

  ready.value = false
  teardown = mountEngine(overlay.parentElement, overlay)
}

onBeforeUnmount(() => teardown?.())

watch([() => props.preset, resolvedTheme], ([preset, theme]) => setSharedPreset(preset, theme))

watch(
  [
    instance,
    () => props.paused,
    clampedStrength,
    () => props.shaderScale,
    () => props.ringCssPx,
    () => props.scale,
  ],
  ([inst, paused, opacityMul, shaderScale, ringCssPx, scale]) => {
    if (!inst) return
    updateInstance(inst, {
      paused,
      opacityMul,
      scale,
      ...(shaderScale !== undefined && { shaderScale }),
      ...(ringCssPx !== undefined && { ringCssPx }),
    })
  }
)

watch([instance, () => props.borderRadius, resolvedTheme], ([inst]) => {
  if (!inst || !root.value) return
  const cornerRadius = resolveRadius(inst.cssWidth, inst.cssHeight)
  updateInstance(inst, { cornerRadius })
  applyRadius(root.value, cornerRadius)
})

watch(
  [instance, () => props.reflectionTargets, resolvedTheme],
  ([inst, targets, theme], _, onCleanup) => {
    if (!inst || !root.value || !targets || theme !== 'dark') return

    const live = targets.map(target => toValue(target)).filter(el => el instanceof HTMLElement)
    inst.onAfterFrame = scheduleReflectionPaint
    for (const el of live) addReflectionTarget(el, inst, root.value)

    onCleanup(() => {
      inst.onAfterFrame = undefined
      for (const el of live) removeReflectionTarget(el)
    })
  },
  { deep: true }
)
</script>

<template>
  <div
    ref="root"
    :class="enabled ? 'metal-fx-root' : 'metal-fx-root-disabled'"
    :data-variant="variant"
    :data-shape="shape"
    :data-theme="resolvedTheme"
    :data-paused="paused || undefined"
    :data-normalize="enabled && normalizeHostStyles ? 'true' : 'false'"
    :style="{ '--mfx-strength': String(clampedStrength) }"
  >
    <Transition name="metal-fx-fade">
      <div
        v-if="enabled"
        :key="`${shape}:${resolvedTheme}`"
        :ref="bindOverlay"
        class="metal-fx-overlay"
        :data-ready="ready || undefined"
        aria-hidden="true"
      >
        <canvas class="metal-fx-canvas" />
        <div class="metal-fx-inner" />
        <div data-mfx-glow-host class="metal-fx-glow-host" :style="{ display: disableGlow ? 'none' : undefined }" />
      </div>
    </Transition>
    <div ref="content" class="metal-fx-content">
      <slot />
    </div>
  </div>
</template>
