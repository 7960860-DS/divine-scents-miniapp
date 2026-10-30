import type { RouterConfig } from '@nuxt/schema'

// Telegram добавляет к адресу #tgWebAppData=…, поэтому якоря не используем:
// при «Назад» возвращаем прежнюю прокрутку, иначе — наверх.
export default {
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition || { top: 0 }
  },
} satisfies RouterConfig
