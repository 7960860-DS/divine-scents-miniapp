<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { FORMAT, mlText, rub } from '~/utils/catalog'
import { orderPayload, orderText, payloadFits, validateForm, type OrderForm } from '~/utils/order'

const { catalog } = useCatalog()
const cart = useCart()
const { lines, total, count, form } = cart
const tg = useTelegram()
const config = useRuntimeConfig()
const errors = ref<Partial<Record<keyof OrderForm, string>>>({})
const sending = ref(false)

// имя подставляем из профиля Telegram, если поле ещё пустое
onMounted(() => {
  if (!form.value.name && tg.user) {
    form.value.name = [tg.user.first_name, tg.user.last_name].filter(Boolean).join(' ')
  }
})

const canAskPhone = computed(() => tg.supports('6.9'))
function askPhone() {
  tg.wa.requestContact((shared: boolean, res?: { responseUnsafe?: { contact?: { phone_number?: string } } }) => {
    const phone = res?.responseUnsafe?.contact?.phone_number
    if (shared && phone) {
      form.value.phone = phone.startsWith('+') ? phone : '+' + phone
      errors.value.phone = undefined
    }
  })
}

function fieldInput(k: keyof OrderForm) {
  if (errors.value[k]) errors.value = { ...errors.value, [k]: undefined }
}

function withText(url: string, text: string) {
  return url + (url.includes('?') ? '&' : '?') + 'text=' + encodeURIComponent(text)
}

async function submit() {
  if (sending.value || !lines.value.length) return
  errors.value = validateForm(form.value, true)
  const first = (Object.keys(errors.value) as (keyof OrderForm)[]).find((k) => errors.value[k])
  if (first) {
    tg.haptic('error')
    await nextTick()
    document.getElementById('f-' + first)?.focus()
    return
  }
  sending.value = true
  const payload = orderPayload(lines.value, form.value)
  if (tg.canSendData && payloadFits(payload)) {
    // Mini App открыт с кнопки бота: заказ уходит боту, окно закроется само
    try {
      tg.haptic('success')
      tg.sendData(payload)
      cart.clear()
      return
    } catch {
      // не получилось отправить боту — отправим ссылкой менеджеру
    }
  }
  // иначе — открываем чат менеджера с готовым текстом заказа
  const text = orderText(lines.value, form.value)
  cart.lastOrderText.value = text
  cart.clear()
  tg.haptic('success')
  tg.openLink(withText(config.public.managerTg, text))
  sending.value = false
  navigateTo('/done')
}

const mainText = computed(() => (lines.value.length ? `Отправить заказ · ${rub(total.value)}` : null))
const { showFallback } = useMainButton(mainText, submit)
</script>

<template>
  <main class="page" :class="{ 'with-dock': showFallback }">
    <h1 class="display title">Корзина</h1>

    <div v-if="!catalog" class="state"><p>Загружаем каталог…</p></div>
    <div v-else-if="!lines.length" class="state">
      <p>Корзина пока пуста.</p>
      <NuxtLink to="/" class="btn-line">Перейти в каталог</NuxtLink>
    </div>
    <template v-else>
      <ul class="lines">
        <li v-for="l in lines" :key="l.p.i + l.x.key" class="line">
          <NuxtLink :to="`/p/${l.p.i}`" class="pic"><BottleArt :seed="l.p.brand + l.p.name" /></NuxtLink>
          <div class="info">
            <p class="eyebrow">{{ l.p.brand }}</p>
            <p class="display nm">{{ l.p.name }}</p>
            <p class="muted v">
              {{ FORMAT[l.x.f] }} {{ mlText(l.x.ml) }}{{ l.x.c ? ', ' + l.x.c : '' }}{{ l.x.cond ? ' · ' + l.x.cond : '' }}
            </p>
            <div class="row">
              <div class="qty">
                <button type="button" :aria-label="l.item.qty === 1 ? 'Убрать' : 'Меньше'" @click="cart.setQty(l, l.item.qty - 1)">
                  {{ l.item.qty === 1 ? '×' : '−' }}
                </button>
                <output>{{ l.item.qty }}</output>
                <button type="button" aria-label="Больше" @click="cart.setQty(l, l.item.qty + 1)">+</button>
              </div>
              <b class="price">{{ rub(l.sum) }}</b>
            </div>
          </div>
        </li>
      </ul>
      <div class="total">
        <span class="muted">Итого без доставки · {{ count }} шт</span>
        <b class="display price">{{ rub(total) }}</b>
      </div>

      <h2 class="display sub">Доставка СДЭК</h2>
      <form class="form" novalidate @submit.prevent="submit">
        <label class="field" :class="{ err: errors.name }">
          <span>Имя и фамилия</span>
          <input id="f-name" v-model="form.name" autocomplete="name" placeholder="Для получения в СДЭК" @input="fieldInput('name')">
          <small v-if="errors.name">{{ errors.name }}</small>
        </label>
        <label class="field" :class="{ err: errors.phone }">
          <span>Телефон</span>
          <input id="f-phone" v-model="form.phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+7 900 123-45-67" @input="fieldInput('phone')">
          <small v-if="errors.phone">{{ errors.phone }}</small>
          <button v-if="canAskPhone" type="button" class="link" @click="askPhone">Взять номер из Telegram</button>
        </label>
        <label class="field" :class="{ err: errors.city }">
          <span>Город</span>
          <input id="f-city" v-model="form.city" autocomplete="address-level2" placeholder="Например, Казань" @input="fieldInput('city')">
          <small v-if="errors.city">{{ errors.city }}</small>
        </label>
        <label class="field">
          <span>Пункт СДЭК или адрес для курьера</span>
          <input id="f-point" v-model="form.point" placeholder="Можно уточнить с менеджером">
        </label>
        <label class="field">
          <span>Комментарий</span>
          <textarea id="f-comment" v-model="form.comment" rows="3" placeholder="Удобное время для связи, пожелания" />
        </label>
      </form>
      <p class="pay muted">
        Менеджер подтвердит наличие, рассчитает доставку СДЭК и пришлёт ссылку на оплату картой или через СБП.
        <template v-if="!tg.canSendData"> После нажатия откроется чат с менеджером — останется нажать «Отправить».</template>
      </p>
    </template>

    <AppBottomButton v-if="showFallback && mainText" :text="mainText" @click="submit" />
  </main>
</template>

<style scoped>
.with-dock { padding-bottom: 96px; }
.title { font-size: 34px; margin: 6px 0 12px; }
.sub { font-size: 26px; margin: 28px 0 12px; }
.lines { list-style: none; margin: 0; padding: 0; border-top: 1px solid var(--sep); }
.line { display: grid; grid-template-columns: 64px minmax(0, 1fr); gap: 12px; padding: 14px 0; border-bottom: 1px solid var(--sep); }
.pic { height: 84px; display: flex; align-items: center; justify-content: center; padding: 8px; border-radius: 12px; background: var(--section); }
.info p { margin: 0; }
.nm { font-size: 19px; overflow-wrap: anywhere; }
.v { font-size: 13px; margin-top: 2px !important; }
.row { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; gap: 8px; }
.qty { display: flex; align-items: center; border: 1px solid var(--sep); border-radius: 10px; }
.qty button { width: 34px; height: 32px; border: 0; background: none; font-size: 17px; }
.qty output { min-width: 22px; text-align: center; font-variant-numeric: tabular-nums; }
.row .price { font-weight: 600; white-space: nowrap; }
.total { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; padding-top: 14px; }
.total .price { font-size: 28px; }
.form { display: grid; gap: 14px; }
.field { display: grid; gap: 6px; }
.field > span { font-size: 13px; color: var(--hint); }
.field input, .field textarea {
  width: 100%; min-height: 46px; padding: 11px 14px; border: 1px solid var(--sep); border-radius: 12px;
  background: var(--section); font-size: 16px; outline: none; resize: vertical;
}
.field input:focus, .field textarea:focus { border-color: var(--gold); }
.field.err input { border-color: var(--danger); }
.field small { color: var(--danger); font-size: 13px; }
.link { justify-self: start; border: 0; padding: 0; background: none; color: var(--gold); font-size: 14px; text-decoration: underline; text-underline-offset: 3px; }
.pay { font-size: 13.5px; margin-top: 18px; }
</style>
