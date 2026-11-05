<script setup lang="ts">
import { computed, ref } from 'vue'

// Экран после заказа, когда Mini App открыт не с кнопки клавиатуры бота:
// либо открыт чат с ботом по ссылке с кодом корзины (обычный случай),
// либо чат менеджера с готовым текстом (если позиций больше, чем помещается в ссылку).
const { lastOrderText, lastOrderLink } = useCart()
const tg = useTelegram()
const config = useRuntimeConfig()
const copied = ref(false)

async function copy() {
  try {
    await navigator.clipboard.writeText(lastOrderText.value)
    copied.value = true
    tg.haptic('success')
  } catch {
    copied.value = false
  }
}
function reopenBot() {
  tg.openLink(lastOrderLink.value)
}
function reopen() {
  const url = config.public.managerTg
  tg.openLink(url + (url.includes('?') ? '&' : '?') + 'text=' + encodeURIComponent(lastOrderText.value))
}

// в Telegram после заказа через бота каталог можно закрыть — дальше разговор в чате
const closeInstead = computed(() => !!lastOrderLink.value && tg.inTelegram)
const mainText = computed(() => (closeInstead.value ? 'Закрыть каталог' : 'Вернуться в каталог'))
const goHome = () => (closeInstead.value ? tg.close() : navigateTo('/'))
const { showFallback } = useMainButton(mainText, goHome)
</script>

<template>
  <main class="page" :class="{ 'with-dock': showFallback }">
    <h1 class="display title">Почти готово</h1>
    <template v-if="lastOrderLink">
      <p>Мы открыли чат с ботом Divine Scents. Если внизу чата видна кнопка <b>«Запустить»</b> (Start) — нажмите её: бот передаст заказ менеджеру и попросит телефон и город доставки.</p>
      <p class="muted small">Бот ответит «Спасибо! Заказ передан менеджеру». Если ответа нет — откройте чат ещё раз.</p>
      <div class="actions">
        <button type="button" class="btn-line" @click="reopenBot">Открыть чат с ботом ещё раз</button>
        <NuxtLink v-if="closeInstead" to="/" class="btn-line">Вернуться в каталог</NuxtLink>
      </div>
    </template>
    <template v-else>
    <p>Мы открыли чат с менеджером и подставили текст заказа. Нажмите там <b>«Отправить»</b> — менеджер подтвердит наличие и пришлёт ссылку на оплату.</p>
    <template v-if="lastOrderText">
      <p class="muted small">Если чат не открылся или поле пустое, скопируйте текст и отправьте его вручную.</p>
      <pre class="order">{{ lastOrderText }}</pre>
      <div class="actions">
        <button type="button" class="btn-line" @click="reopen">Открыть чат ещё раз</button>
        <button type="button" class="btn-line" @click="copy">{{ copied ? 'Скопировано' : 'Скопировать текст' }}</button>
      </div>
    </template>
    </template>
    <AppBottomButton v-if="showFallback" :text="mainText" @click="goHome" />
  </main>
</template>

<style scoped>
.with-dock { padding-bottom: 96px; }
.title { font-size: 34px; margin: 6px 0 12px; }
.small { font-size: 13.5px; }
.order {
  white-space: pre-wrap; font: 13px/1.5 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  padding: 14px; border-radius: 12px; background: var(--section); border: 1px solid var(--sep); overflow-x: auto;
}
.actions { display: flex; flex-wrap: wrap; gap: 8px; }
</style>
