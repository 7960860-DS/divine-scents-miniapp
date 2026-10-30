<script setup lang="ts">
import { computed, ref } from 'vue'

const { catalog } = useCatalog()
const f = useFilters()
const tg = useTelegram()

const letterOf = (b: string) => {
  const c = b[0]!.toUpperCase()
  return /[A-Z]/.test(c) ? c : /[0-9]/.test(c) ? '0–9' : '#'
}
const letters = computed(() => {
  if (!catalog.value) return []
  return [...new Set(catalog.value.brands.map(letterOf))].sort((a, b) => a.length - b.length || a.localeCompare(b))
})
// популярные бренды — те, чьи ароматы чаще всего встречаются среди первых 2000 по популярности
const popular = computed(() => {
  if (!catalog.value) return []
  const score = new Map<string, number>()
  for (const p of catalog.value.products.slice(0, 2000)) score.set(p.brand, (score.get(p.brand) || 0) + 1)
  return [...score.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40).map((x) => x[0]).sort((a, b) => a.localeCompare(b))
})
const active = ref('top')
const list = computed(() => {
  if (!catalog.value) return []
  return active.value === 'top' ? popular.value : catalog.value.brands.filter((b) => letterOf(b) === active.value)
})
function pick(b: string) {
  tg.haptic('select')
  Object.assign(f, { brand: b, q: '', shown: 24 })
  navigateTo('/')
}
</script>

<template>
  <main class="page">
    <h1 class="display title">Бренды</h1>
    <div class="letters">
      <button type="button" class="chip" :class="{ on: active === 'top' }" @click="active = 'top'">Популярные</button>
      <button v-for="l in letters" :key="l" type="button" class="chip letter" :class="{ on: active === l }" @click="active = l">{{ l }}</button>
    </div>
    <div v-if="!catalog" class="state"><p>Загружаем каталог…</p></div>
    <ul v-else class="list">
      <li v-for="b in list" :key="b">
        <button type="button" @click="pick(b)">
          <span class="display">{{ b }}</span>
          <small class="muted">{{ catalog.brandCount.get(b) }}</small>
        </button>
      </li>
    </ul>
  </main>
</template>

<style scoped>
.title { font-size: 34px; margin: 6px 0 14px; }
.letters { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
.letter { min-width: 38px; justify-content: center; padding: 0 10px; }
.list { list-style: none; margin: 0; padding: 0; border-top: 1px solid var(--sep); }
.list button {
  width: 100%; display: flex; justify-content: space-between; align-items: baseline; gap: 12px;
  padding: 12px 0; border: 0; border-bottom: 1px solid var(--sep); background: none; text-align: left;
}
.list .display { font-size: 21px; overflow-wrap: anywhere; min-width: 0; }
.list small { font-variant-numeric: tabular-nums; flex: none; }
</style>
