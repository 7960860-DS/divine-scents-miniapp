<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { plural, rub, searchCatalog, type Product } from '~/utils/catalog'

const PAGE = 24
const { catalog, failed, retry } = useCatalog()
const f = useFilters()
const { count, total } = useCart()
const config = useRuntimeConfig()
const tg = useTelegram()

// поиск с небольшой задержкой, чтобы не пересчитывать на каждую букву
const qInput = ref(f.q)
let timer: ReturnType<typeof setTimeout> | undefined
watch(qInput, (v) => {
  clearTimeout(timer)
  timer = setTimeout(() => { f.q = v; f.shown = PAGE }, 160)
})

const result = computed(() => {
  const cat = catalog.value
  if (!cat) return { items: [] as Product[], fixed: null as string | null }
  const base = f.q.trim() ? searchCatalog(cat, f.q) : { items: cat.products, fixed: null }
  const items = base.items.filter((p) =>
    (!f.gender || p.g === f.gender) && (!f.brand || p.brand === f.brand) && (!f.tester || p.minT))
  return { items, fixed: base.fixed }
})
const visible = computed(() => result.value.items.slice(0, f.shown))
const filtered = computed(() => !!(f.q.trim() || f.gender || f.brand || f.tester))

const GENDERS: [number, string][] = [[0, 'Все'], [1, 'Женские'], [2, 'Мужские'], [3, 'Унисекс']]
function setGender(g: number) { f.gender = g; f.shown = PAGE; tg.haptic('select') }
function toggleTester() { f.tester = !f.tester; f.shown = PAGE; tg.haptic('select') }
function clearBrand() { f.brand = ''; f.shown = PAGE }
function reset() {
  qInput.value = ''
  Object.assign(f, { q: '', gender: 0, brand: '', tester: false, shown: PAGE })
}
function blur(e: Event) { (e.target as HTMLInputElement).blur() }

const mainText = computed(() => (count.value ? `Корзина · ${count.value} шт · ${rub(total.value)}` : null))
const goCart = () => navigateTo('/cart')
const { showFallback } = useMainButton(mainText, goCart)
</script>

<template>
  <main class="page" :class="{ 'with-dock': showFallback }">
    <header class="top">
      <div>
        <div class="wordmark">Divine Scents</div>
        <div class="tagline muted">Оригинальная парфюмерия · СДЭК по России</div>
      </div>
      <NuxtLink to="/cart" class="bag" aria-label="Корзина">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8h12l-1 12H7L6 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>
        <span v-if="count" class="n">{{ count }}</span>
      </NuxtLink>
    </header>

    <div class="search">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
      <input id="q" v-model="qInput" type="search" enterkeyhint="search" autocomplete="off"
             placeholder="Dior Sauvage, шанель шанс, баккара" aria-label="Поиск аромата" @keyup.enter="blur">
    </div>

    <div class="chips">
      <button v-for="[g, label] in GENDERS" :key="g" type="button" class="chip" :class="{ on: f.gender === g }" @click="setGender(g)">
        {{ label }}
      </button>
      <button type="button" class="chip" :class="{ on: f.tester }" @click="toggleTester">Тестеры</button>
      <NuxtLink to="/brands" class="chip">Бренды</NuxtLink>
    </div>

    <div v-if="f.brand" class="brand-filter">
      <span>{{ f.brand }}</span>
      <button type="button" aria-label="Показать все бренды" @click="clearBrand">×</button>
    </div>

    <div v-if="failed" class="state">
      <p>Не удалось загрузить каталог. Проверьте интернет.</p>
      <button type="button" class="btn-line" @click="retry">Повторить</button>
    </div>
    <div v-else-if="!catalog" class="state"><p>Загружаем каталог…</p></div>
    <template v-else>
      <p class="count muted">
        <template v-if="result.fixed">Показаны результаты для «{{ result.fixed }}» · </template>
        {{ filtered ? 'Найдено ' : 'В каталоге ' }}{{ plural(result.items.length, 'аромат', 'аромата', 'ароматов') }}
      </p>

      <div v-if="result.items.length" class="grid">
        <ProductCard v-for="p in visible" :key="p.i" :p="p" :tester="f.tester" />
      </div>
      <button v-if="result.items.length > visible.length" type="button" class="btn-line more" @click="f.shown += PAGE">
        Показать ещё · осталось {{ result.items.length - visible.length }}
      </button>

      <div v-if="!result.items.length" class="state">
        <p>Ничего не нашлось. Попробуйте написать бренд и название латиницей или напишите менеджеру — проверим у поставщиков.</p>
        <button type="button" class="btn-line" @click="reset">Сбросить поиск</button>
        <button type="button" class="link" @click="tg.openLink(config.public.managerTg)">Написать менеджеру</button>
      </div>
    </template>

    <AppBottomButton v-if="showFallback && mainText" :text="mainText" @click="goCart" />
  </main>
</template>

<style scoped>
.with-dock { padding-bottom: 96px; }
.top { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 4px 0 14px; }
.wordmark { font: 600 22px/1 var(--font-display); letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); }
.tagline { font-size: 12px; margin-top: 6px; }
.bag { position: relative; width: 42px; height: 42px; display: grid; place-items: center; border: 1px solid var(--sep); border-radius: 12px; }
.bag svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.5; }
.bag .n {
  position: absolute; top: -6px; right: -6px; min-width: 20px; height: 20px; padding: 0 5px; border-radius: 10px;
  background: var(--gold-strong); color: #fff; font-size: 11px; font-weight: 600; display: grid; place-items: center;
}
.search { position: relative; margin-bottom: 10px; }
.search svg { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; fill: none; stroke: var(--hint); stroke-width: 1.7; }
.search input {
  width: 100%; height: 46px; padding: 0 14px 0 40px; border: 1px solid var(--sep); border-radius: 12px;
  background: var(--section); font-size: 16px; outline: none;
}
.search input:focus { border-color: var(--gold); }
.search input::placeholder { color: var(--hint); }
.chips { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; margin: 0 -16px 10px; padding: 0 16px; }
.chips::-webkit-scrollbar { display: none; }
.brand-filter {
  display: inline-flex; align-items: center; gap: 6px; max-width: 100%; height: 34px; padding: 0 4px 0 12px;
  border: 1px solid var(--gold); border-radius: 17px; color: var(--gold); margin-bottom: 8px;
}
.brand-filter span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.brand-filter button { width: 28px; height: 28px; border: 0; background: none; color: inherit; font-size: 18px; }
.count { font-size: 13px; margin: 4px 0 14px; }
.grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 22px 12px; }
.more { display: block; width: 100%; margin-top: 24px; }
.link { border: 0; background: none; color: var(--gold); text-decoration: underline; text-underline-offset: 3px; }
</style>
