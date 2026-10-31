<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { CONC_LABEL, FORMAT, GENDER_LABEL, mlText, plural, rub, type Product, type Variant } from '~/utils/catalog'
import { MAX_QTY } from '~/utils/order'

const route = useRoute()
const { catalog } = useCatalog()
const f = useFilters()
const cart = useCart()
const tg = useTelegram()
const { photoOf } = usePhotos()

const p = computed<Product | null>(() => catalog.value?.products[Number(route.params.id)] ?? null)
const conc = ref('')
const key = ref('')
const qty = ref(1)
const added = ref(false)

// по умолчанию — флакон около 100 мл без пометок; если включён фильтр «Тестеры» — тестер
function pickDefault(list: Variant[]): Variant {
  const pool = f.tester ? list.filter((x) => x.f === 1) : list.filter((x) => x.f === 0 && !x.cond)
  const from = pool.length ? pool : list
  return from.reduce((a, b) => (Math.abs(b.ml - 90) < Math.abs(a.ml - 90) ? b : a))
}
watch(p, (pp) => {
  if (!pp) return
  const d = pickDefault(pp.v)
  conc.value = d.c
  key.value = d.key
  qty.value = 1
}, { immediate: true })

const list = computed(() => (p.value ? p.value.v.filter((x) => x.c === conc.value) : []))
watch(conc, () => {
  if (list.value.length && !list.value.some((x) => x.key === key.value)) key.value = pickDefault(list.value).key
})
const sel = computed(() => p.value?.v.find((x) => x.key === key.value) ?? null)

function setConc(c: string) { conc.value = c; tg.haptic('select') }
function setKey(k: string) { key.value = k; tg.haptic('select') }
function step(d: number) { qty.value = Math.min(MAX_QTY, Math.max(1, qty.value + d)); tg.haptic('select') }

let addedTimer: ReturnType<typeof setTimeout> | undefined
function add() {
  if (!p.value || !sel.value) return
  cart.add(p.value, sel.value, qty.value)
  tg.haptic('success')
  added.value = true
  clearTimeout(addedTimer)
  addedTimer = setTimeout(() => { added.value = false }, 3000)
}

const mainText = computed(() => (sel.value ? `В корзину · ${rub(sel.value.price * qty.value)}` : null))
const { showFallback } = useMainButton(mainText, add)
</script>

<template>
  <main class="page" :class="{ 'with-dock': showFallback }">
    <div v-if="!catalog" class="state"><p>Загружаем каталог…</p></div>
    <div v-else-if="!p" class="state">
      <p>Аромат не найден — возможно, каталог обновился.</p>
      <NuxtLink to="/" class="btn-line">В каталог</NuxtLink>
    </div>
    <template v-else>
      <div class="hero" :class="{ 'has-photo': !!photoOf(p.brand, p.name) }"><ProductArt :brand="p.brand" :name="p.name" /></div>
      <p class="eyebrow">{{ p.brand }}</p>
      <h1 class="display name">{{ p.name }}</h1>
      <p class="meta muted">
        {{ [GENDER_LABEL[p.g] ? 'Аромат ' + GENDER_LABEL[p.g] : '', plural(p.v.length, 'вариант', 'варианта', 'вариантов')].filter(Boolean).join(' · ') }}
      </p>

      <div v-if="p.concs.length > 1" class="concs">
        <button v-for="c in p.concs" :key="c" type="button" class="chip" :class="{ on: c === conc }" @click="setConc(c)">
          {{ c || 'Без указания' }}
        </button>
      </div>

      <section class="variants" aria-label="Формат и объём">
        <p class="eyebrow">{{ CONC_LABEL[conc] ?? conc }}</p>
        <button v-for="x in list" :key="x.key" type="button" class="variant" :class="{ on: x.key === key }"
                :aria-pressed="x.key === key" @click="setKey(x.key)">
          <span>
            <b>{{ FORMAT[x.f] }} {{ mlText(x.ml) }}</b>
            <small v-if="x.cond" class="muted"> · {{ x.cond }}</small>
          </span>
          <span class="display price">{{ rub(x.price) }}</span>
        </button>
      </section>

      <p v-if="p.minT" class="note muted">Тестер — тот же оригинальный аромат в простой упаковке, обычно без крышки.</p>

      <div class="qty-row">
        <span class="muted">Количество</span>
        <div class="qty">
          <button type="button" aria-label="Меньше" @click="step(-1)">−</button>
          <output>{{ qty }}</output>
          <button type="button" aria-label="Больше" @click="step(1)">+</button>
        </div>
      </div>
      <p class="note muted">Цена за штуку, без доставки. Наличие подтвердит менеджер.</p>

      <div v-if="added" class="toast" role="status">
        Добавлено в корзину · <NuxtLink to="/cart">Перейти</NuxtLink>
      </div>
    </template>

    <AppBottomButton v-if="showFallback && mainText" :text="mainText" @click="add" />
  </main>
</template>

<style scoped>
.with-dock { padding-bottom: 96px; }
.hero {
  height: 240px; display: flex; align-items: center; justify-content: center; padding: 24px; margin-bottom: 18px;
  border-radius: 18px; background: radial-gradient(circle at 50% 58%, var(--halo), transparent 68%), var(--section);
}
.hero.has-photo { background: #fff; padding: 12px; }
.name { font-size: 34px; margin: 6px 0 6px; overflow-wrap: anywhere; }
.meta { font-size: 14px; margin: 0 0 16px; }
.concs { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
.variants { display: grid; gap: 6px; }
.variants .eyebrow { margin: 0 0 4px; }
.variant {
  display: flex; justify-content: space-between; align-items: center; gap: 12px; min-height: 52px; padding: 10px 14px;
  border: 1px solid var(--sep); border-radius: 12px; background: var(--section); text-align: left;
}
.variant b { font-weight: 500; }
.variant.on { border-color: var(--gold); box-shadow: inset 0 0 0 1px var(--gold); }
.variant .price { font-size: 21px; white-space: nowrap; }
.note { font-size: 13px; margin: 12px 0 0; }
.qty-row { display: flex; align-items: center; justify-content: space-between; margin-top: 18px; }
.qty { display: flex; align-items: center; border: 1px solid var(--sep); border-radius: 12px; }
.qty button { width: 44px; height: 42px; border: 0; background: none; font-size: 20px; }
.qty output { min-width: 28px; text-align: center; font-variant-numeric: tabular-nums; }
.toast {
  position: fixed; left: 50%; transform: translateX(-50%); bottom: calc(16px + env(safe-area-inset-bottom));
  max-width: calc(100% - 32px); width: max-content; padding: 12px 16px; border-radius: 12px;
  background: var(--text); color: var(--bg); font-size: 14px; z-index: 20;
}
.toast a { color: inherit; text-decoration: underline; font-weight: 600; }
.with-dock .toast { bottom: calc(84px + env(safe-area-inset-bottom)); }
</style>
