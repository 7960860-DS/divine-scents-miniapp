import { ref } from 'vue'

/**
 * Обёртка над Telegram.WebApp.
 * Режимы запуска:
 *  - kb      — открыт с кнопки клавиатуры бота (адрес с ?mode=kb): можно отправить заказ боту через sendData;
 *  - menu    — открыт из меню бота или по ссылке: заказ уходит ссылкой t.me/<бот>?start=o<код>,
 *              бот раскодирует корзину и передаст заказ в группу для заявок;
 *  - browser — открыт в обычном браузере: заказ уходит той же ссылкой на бота, кнопки Telegram заменяются своими.
 */
type LaunchMode = 'kb' | 'menu' | 'browser'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let wa: any = null
let launchMode: LaunchMode = 'browser'
const scheme = ref<'light' | 'dark'>('dark')

function applyScheme() {
  document.documentElement.dataset.scheme = scheme.value
  document.documentElement.dataset.tg = launchMode === 'browser' ? '0' : '1'
}

function safe(fn: () => void) {
  try { fn() } catch { /* метод не поддерживается этой версией Telegram */ }
}

export function initTelegram() {
  if (typeof window === 'undefined') return
  wa = (window as unknown as { Telegram?: { WebApp?: unknown } }).Telegram?.WebApp ?? null
  // initData пустой, если Mini App открыт кнопкой клавиатуры («Открыть каталог») — так устроен Telegram.
  // Поэтому Telegram узнаём ещё и по платформе: вне Telegram скрипт ставит platform = 'unknown'.
  const inTelegram = !!wa && (
    (typeof wa.initData === 'string' && wa.initData.length > 0)
    || (typeof wa.platform === 'string' && wa.platform !== '' && wa.platform !== 'unknown'))
  // режим берём из адреса (?mode=kb / ?mode=menu); после перехода по страницам и «Обновить страницу»
  // адрес уже без него — тогда берём запомненный в этой сессии
  let mode = new URLSearchParams(window.location.search).get('mode')
  try {
    if (mode) sessionStorage.setItem('ds-launch-mode', mode)
    else mode = sessionStorage.getItem('ds-launch-mode')
  } catch { /* хранилище недоступно */ }
  launchMode = inTelegram ? (mode === 'kb' ? 'kb' : 'menu') : 'browser'

  if (inTelegram) {
    safe(() => wa.ready())
    safe(() => wa.expand())
    if (wa.isVersionAtLeast?.('7.7')) safe(() => wa.disableVerticalSwipes())
    if (wa.isVersionAtLeast?.('6.1')) {
      safe(() => wa.setHeaderColor('bg_color'))
      safe(() => wa.setBackgroundColor('bg_color'))
    }
    scheme.value = wa.colorScheme === 'light' ? 'light' : 'dark'
    safe(() => wa.onEvent('themeChanged', () => {
      scheme.value = wa.colorScheme === 'light' ? 'light' : 'dark'
      applyScheme()
    }))
  } else {
    scheme.value = window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  }
  applyScheme()
}

export function useTelegram() {
  const inTelegram = launchMode !== 'browser'
  return {
    wa,
    inTelegram,
    canSendData: launchMode === 'kb',
    scheme,
    user: (inTelegram ? wa?.initDataUnsafe?.user : null) as { first_name?: string; last_name?: string; username?: string } | null,
    supports(version: string): boolean {
      return inTelegram && !!wa?.isVersionAtLeast?.(version)
    },
    haptic(kind: 'light' | 'select' | 'success' | 'error') {
      if (!inTelegram || !wa?.isVersionAtLeast?.('6.1')) return
      safe(() => {
        if (kind === 'light') wa.HapticFeedback.impactOccurred('light')
        else if (kind === 'select') wa.HapticFeedback.selectionChanged()
        else wa.HapticFeedback.notificationOccurred(kind)
      })
    },
    openLink(url: string) {
      if (!inTelegram) { window.open(url, '_blank', 'noopener'); return }
      if (url.startsWith('https://t.me/')) safe(() => wa.openTelegramLink(url))
      else safe(() => wa.openLink(url))
    },
    sendData(data: string) {
      wa.sendData(data)
    },
    close() {
      if (inTelegram) safe(() => wa.close())
    },
  }
}
