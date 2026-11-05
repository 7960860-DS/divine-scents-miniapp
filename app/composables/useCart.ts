import { computed, effectScope, ref, watch } from 'vue'
import type { Product, Variant } from '~/utils/catalog'
import { useCatalog } from './useCatalog'
import { addToCart, cartItemFrom, resolveCart, MAX_QTY, type CartItem, type CartLine, type OrderForm } from '~/utils/order'

const CART_KEY = 'ds-cart-v1'
const FORM_KEY = 'ds-form-v1'

function read<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    return v ? (JSON.parse(v) as T) : fallback
  } catch {
    return fallback
  }
}
function write(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* хранилище недоступно */ }
}

const items = ref<CartItem[]>([])
const form = ref<OrderForm>({ name: '', phone: '', city: '', point: '', comment: '' })
const lastOrderText = ref('')
const lastOrderLink = ref('')
let started = false

function start() {
  if (started || typeof window === 'undefined') return
  started = true
  items.value = read<CartItem[]>(CART_KEY, [])
  form.value = { ...form.value, ...read<Partial<OrderForm>>(FORM_KEY, {}) }
  // сохраняем изменения независимо от того, какая страница открыта
  effectScope(true).run(() => {
    watch(items, (v) => write(CART_KEY, v), { deep: true })
    watch(form, (v) => write(FORM_KEY, v), { deep: true })
  })
}

export function useCart() {
  start()
  const { catalog } = useCatalog()
  const lines = computed<CartLine[]>(() => (catalog.value ? resolveCart(catalog.value, items.value) : []))
  const count = computed(() => lines.value.reduce((s, l) => s + l.item.qty, 0))
  const total = computed(() => lines.value.reduce((s, l) => s + l.sum, 0))

  return {
    items, form, lines, count, total, lastOrderText, lastOrderLink,
    add(p: Product, x: Variant, qty: number) {
      items.value = addToCart(items.value, cartItemFrom(p, x, qty))
    },
    setQty(line: CartLine, qty: number) {
      items.value = qty <= 0
        ? items.value.filter((i) => i !== line.item)
        : items.value.map((i) => (i === line.item ? { ...i, qty: Math.min(MAX_QTY, qty) } : i))
    },
    clear() {
      items.value = []
    },
  }
}
