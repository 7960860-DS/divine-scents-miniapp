// Инициализация Telegram WebApp до монтирования приложения:
// запоминаем, откуда открыт Mini App (кнопка клавиатуры или меню), пока адрес не изменился.
import { defineNuxtPlugin } from '#imports'
import { initTelegram } from '~/composables/useTelegram'

export default defineNuxtPlugin(() => {
  initTelegram()
})
