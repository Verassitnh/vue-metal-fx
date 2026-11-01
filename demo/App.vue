<script setup lang="ts">
import { ref } from 'vue'
import { MetalFx, type MetalFxPreset, type MetalFxTheme } from '../src'

const presets: MetalFxPreset[] = ['chromatic', 'silver', 'gold']
const preset = ref<MetalFxPreset>('chromatic')
const theme = ref<Exclude<MetalFxTheme, 'auto'>>('dark')
const strength = ref(1)
const enabled = ref(true)
const paused = ref(false)
const chip = ref<HTMLElement>()
</script>

<template>
  <main :class="theme">
    <div class="controls">
      <select v-model="preset">
        <option v-for="p in presets" :key="p" :value="p">{{ p }}</option>
      </select>
      <button @click="theme = theme === 'dark' ? 'light' : 'dark'">{{ theme }}</button>
      <label><input v-model="enabled" type="checkbox" /> enabled</label>
      <label><input v-model="paused" type="checkbox" /> paused</label>
      <input v-model.number="strength" type="range" min="0" max="1" step="0.05" />
    </div>

    <MetalFx :enabled :preset :theme :strength :paused>
      <button class="pill">Upgrade to Pro</button>
    </MetalFx>

    <div class="row">
      <button ref="chip" class="chip">Tools</button>
      <MetalFx variant="circle" :preset :theme :strength :paused :reflection-targets="[chip]">
        <button class="send" aria-label="Send">↑</button>
      </MetalFx>
    </div>

    <MetalFx :enabled :preset :theme :strength :paused style="width: 520px">
      <input class="search" placeholder="Search for anything..." />
    </MetalFx>
  </main>
</template>

<style>
body {
  margin: 0;
  font-family: system-ui, sans-serif;
}
main {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 32px;
}
main.dark {
  background: #070707;
  color: #f8f8f8;
}
main.light {
  background: #f4f4f4;
  color: #1d1d1d;
}
.controls {
  display: flex;
  gap: 12px;
  align-items: center;
}
.pill {
  height: 40px;
  padding: 0 24px;
  border-radius: 999px;
  color: inherit;
  font: inherit;
  cursor: pointer;
}
.row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.chip {
  height: 36px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid currentColor;
  background: transparent;
  color: inherit;
}
.send {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  color: inherit;
}
.search {
  width: 100%;
  height: 56px;
  padding: 0 24px;
  border-radius: 999px;
  color: inherit;
  font: inherit;
}
</style>
