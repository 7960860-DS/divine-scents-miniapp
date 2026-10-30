<script setup lang="ts">
import { computed, useId } from 'vue'

// Нарисованный флакон вместо фото: форма и цвет «жидкости» стабильно зависят от названия аромата.
const props = defineProps<{ seed: string }>()
const clipId = 'b' + useId().replace(/[^a-zA-Z0-9_-]/g, '')

const SHAPES = [
  { body: { t: 'rect', x: 34, y: 48, w: 52, h: 98, r: 4 }, level: 66, neck: [52, 38, 16, 12], cap: [44, 12, 32, 28, 2], hl: [40, 56, 74], sh: 30 },
  { body: { t: 'circle', cx: 60, cy: 102, r: 44 }, level: 74, neck: [53, 50, 14, 12], cap: [48, 18, 24, 34, 3], hl: [26, 86, 32], sh: 36 },
  { body: { t: 'rect', x: 24, y: 66, w: 72, h: 80, r: 10 }, level: 82, neck: [52, 56, 16, 12], cap: [42, 28, 36, 30, 2], hl: [31, 76, 56], sh: 38 },
  { body: { t: 'rect', x: 42, y: 44, w: 36, h: 102, r: 8 }, level: 62, neck: [54, 36, 12, 10], cap: [46, 8, 28, 30, 14], hl: [47, 54, 80], sh: 22 },
] as const
const JUICE = ['#D9B57A', '#E3A08A', '#C98B5E', '#E8C7A0', '#B9A0C9', '#9DB7CF', '#D7CFB4', '#E59BAA', '#A7BE9B', '#93532A', '#E3A65C', '#C9C3E0']

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}
const h = computed(() => hash(props.seed))
const s = computed(() => SHAPES[h.value % SHAPES.length]!)
const color = computed(() => JUICE[(h.value >>> 8) % JUICE.length]!)
</script>

<template>
  <svg class="bottle" viewBox="0 0 120 160" aria-hidden="true">
    <ellipse cx="60" cy="152" :rx="s.sh" ry="4.5" style="fill: var(--shadow)" />
    <defs>
      <clipPath :id="clipId">
        <rect v-if="s.body.t === 'rect'" :x="s.body.x" :y="s.body.y" :width="s.body.w" :height="s.body.h" :rx="s.body.r" />
        <circle v-else :cx="s.body.cx" :cy="s.body.cy" :r="s.body.r" />
      </clipPath>
    </defs>
    <rect :x="s.neck[0]" :y="s.neck[1]" :width="s.neck[2]" :height="s.neck[3]" style="fill: var(--glass-stroke)" />
    <g :clip-path="`url(#${clipId})`">
      <rect x="0" y="0" width="120" height="160" style="fill: var(--glass)" />
      <rect x="0" :y="s.level" width="120" height="100" :fill="color" opacity="0.9" />
      <rect :x="s.hl[0]" :y="s.hl[1]" width="4" :height="s.hl[2]" rx="2" fill="#fff" opacity="0.5" />
    </g>
    <rect v-if="s.body.t === 'rect'" :x="s.body.x" :y="s.body.y" :width="s.body.w" :height="s.body.h" :rx="s.body.r"
          style="fill: none; stroke: var(--glass-stroke); stroke-width: 1.2" />
    <circle v-else :cx="s.body.cx" :cy="s.body.cy" :r="s.body.r" style="fill: none; stroke: var(--glass-stroke); stroke-width: 1.2" />
    <rect :x="s.cap[0]" :y="s.cap[1]" :width="s.cap[2]" :height="s.cap[3]" :rx="s.cap[4]" style="fill: var(--gold)" />
  </svg>
</template>

<style scoped>
.bottle { height: 100%; width: auto; aspect-ratio: 3 / 4; max-width: 100%; display: block; }
</style>
