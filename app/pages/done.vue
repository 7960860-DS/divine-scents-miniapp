<script setup lang="ts">
import { computed, ref } from 'vue'

// Экран после заказа, когда Mini App открыт не с кнопки бота:
// заказ ушёл в чат менеджера, покупателю осталось нажать «Отправить».
const { lastOrderText } = useCart()
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
function reopen() {
  const url = config.public.managerTg
  tg.openLink(url + (url.includes('?') ? '&' : '?') + 'text=' + encodeURIComponent(lastOrderText.value))
}

const mainText = computed(() => 'Вернуться в каталог')
const goHome = () => navigateTo('/')
const { showFallback } = useMainButton(mainText, goHome)
</script>

<template>
  <main class="page" :class="{ 'with-dock': showFallback }">
    <h1 class="display title">Почти готово</h1>
    <p>Мы открыли чат с менеджером и подставили текст заказа. Нажмите там <b>«Отправить»</b> — менеджер подтвердит наличие и пришлёт ссылку на оплату.</p>
    <template v-if="lastOrderText">
      <p class="muted small">Если чат не открылся или поле пустое, скопируйте текст и отправьте его вручную.</p>
      <pre class="order">{{ lastOrderText }}</pre>
      <div class="actions">
        <button type="button" class="btn-line" @click="reopen">Открыть чат ещё раз</button>
        <button type="button" class="btn-line" @click="copy">{{ copied ? 'Скопировано' : 'Скопировать текст' }}</button>
      </div>
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
