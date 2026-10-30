import { computed, onBeforeUnmount, onMounted, watch, type Ref } from 'vue'
import { useTelegram } from './useTelegram'

const GOLD = '#8C6A30'

/**
 * Главная кнопка внизу экрана Telegram (MainButton).
 * text = null — кнопка скрыта. Вне Telegram страница показывает свою кнопку (AppBottomButton),
 * для этого возвращается флаг showFallback.
 */
export function useMainButton(text: Ref<string | null>, handler: () => void) {
  const tg = useTelegram()
  const mb = tg.inTelegram ? tg.wa?.MainButton : null
  const onClick = () => handler()

  function apply() {
    if (!mb) return
    if (text.value) {
      mb.setParams({ text: text.value, color: GOLD, text_color: '#FFFFFF', is_active: true, is_visible: true })
    } else {
      mb.hide()
    }
  }

  onMounted(() => {
    if (!mb) return
    mb.onClick(onClick)
    apply()
  })
  watch(text, apply)
  onBeforeUnmount(() => {
    if (!mb) return
    mb.offClick(onClick)
    mb.hide()
  })

  return { showFallback: computed(() => !mb && !!text.value) }
}
