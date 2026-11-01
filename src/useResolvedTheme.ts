import { onScopeDispose, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'
import type { MetalFxTheme } from './types'

const DARK_QUERY = '(prefers-color-scheme: dark)'

export function useResolvedTheme(theme: MaybeRefOrGetter<MetalFxTheme>) {
  const mql = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(DARK_QUERY) : null
  const systemTheme = ref<'dark' | 'light'>(mql?.matches === false ? 'light' : 'dark')
  const resolved = ref<'dark' | 'light'>('dark')

  const updateSystemTheme = () => {
    if (mql) systemTheme.value = mql.matches ? 'dark' : 'light'
  }
  mql?.addEventListener('change', updateSystemTheme)
  onScopeDispose(() => mql?.removeEventListener('change', updateSystemTheme))

  watch(
    [() => toValue(theme), systemTheme],
    ([requested, system]) => {
      resolved.value = requested === 'auto' ? system : requested
    },
    { immediate: true }
  )

  return resolved
}
