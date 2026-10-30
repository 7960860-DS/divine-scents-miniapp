// Telegram Mini App «Divine Scents»: статичное SPA, собирается командой `npm run generate`.
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'Divine Scents',
      htmlAttrs: { lang: 'ru' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover' },
        { name: 'format-detection', content: 'telephone=no' },
      ],
      // Скрипт Telegram должен загрузиться до приложения
      script: [{ src: 'https://telegram.org/js/telegram-web-app.js' }],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&display=swap' },
      ],
    },
  },
  runtimeConfig: {
    public: {
      // Можно переопределить переменными окружения при сборке: NUXT_PUBLIC_MANAGER_TG и т.д.
      managerTg: 'https://t.me/+79154103888',
      managerWa: '79154103888',
      shopPhone: '+7 915 410-38-88',
      channel: 'https://t.me/DivineScentsDS',
    },
  },
})
