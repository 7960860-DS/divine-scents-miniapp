/**
 * Корзина и заказ: чистые функции без Vue, чтобы их можно было проверить отдельно.
 */
import type { Catalog, Product, Variant } from './catalog'
import { productKey, rub, mlText, FORMAT } from './catalog'

/** Позиция корзины хранится по названию и варианту, а не по номеру: так она переживает обновление каталога. */
export interface CartItem { b: string; n: string; c: string; f: 0 | 1; ml: number; cond: string; qty: number }
export interface CartLine { item: CartItem; p: Product; x: Variant; sum: number }
export interface OrderForm { name: string; phone: string; city: string; point: string; comment: string }

export const MAX_QTY = 10
export const SEND_DATA_LIMIT = 4096 // байт, ограничение Telegram для sendData

export function resolveCart(cat: Catalog, items: CartItem[]): CartLine[] {
  const lines: CartLine[] = []
  for (const item of items) {
    const p = cat.byName.get(productKey(item.b, item.n))
    const x = p?.v.find((v) => v.c === item.c && v.f === item.f && v.ml === item.ml && v.cond === item.cond)
    if (p && x) lines.push({ item, p, x, sum: x.price * item.qty })
  }
  return lines
}

export function cartItemFrom(p: Product, x: Variant, qty: number): CartItem {
  return { b: p.brand, n: p.name, c: x.c, f: x.f, ml: x.ml, cond: x.cond, qty }
}

export function addToCart(items: CartItem[], add: CartItem): CartItem[] {
  const same = (a: CartItem) => a.b === add.b && a.n === add.n && a.c === add.c && a.f === add.f && a.ml === add.ml && a.cond === add.cond
  const found = items.find(same)
  if (found) return items.map((a) => (same(a) ? { ...a, qty: Math.min(MAX_QTY, a.qty + add.qty) } : a))
  return [...items, { ...add, qty: Math.min(MAX_QTY, add.qty) }]
}

export function validateForm(form: OrderForm, hasItems: boolean): Partial<Record<keyof OrderForm, string>> {
  const err: Partial<Record<keyof OrderForm, string>> = {}
  if (!form.name.trim()) err.name = 'Укажите имя и фамилию — они нужны для получения посылки'
  if (form.phone.replace(/\D/g, '').length < 10) err.phone = 'Укажите номер телефона полностью'
  if (hasItems && !form.city.trim()) err.city = 'Укажите город доставки'
  if (!hasItems && !form.comment.trim()) err.comment = 'Добавьте ароматы в корзину или напишите вопрос'
  return err
}

/** Данные для Telegram.WebApp.sendData: бот сам пересчитает цены по своему каталогу. */
export function orderPayload(lines: CartLine[], form: OrderForm): string {
  const trim = (s: string, n: number) => s.trim().slice(0, n)
  const body = {
    t: 'order', v: 1,
    i: lines.map((l) => [l.p.brand, l.p.name, l.x.c, l.x.f, l.x.ml, l.x.cond, l.item.qty]),
    n: trim(form.name, 80), ph: trim(form.phone, 30), c: trim(form.city, 80), pt: trim(form.point, 160),
    cm: trim(form.comment, 500),
  }
  let s = JSON.stringify(body)
  // если заказ огромный — сокращаем комментарий, чтобы уложиться в лимит Telegram
  while (new TextEncoder().encode(s).length > SEND_DATA_LIMIT && body.cm.length > 0) {
    body.cm = body.cm.slice(0, Math.max(0, body.cm.length - 100))
    s = JSON.stringify(body)
  }
  return s
}

export function payloadFits(payload: string) {
  return new TextEncoder().encode(payload).length <= SEND_DATA_LIMIT
}

/**
 * Заказ ссылкой на бота: t.me/<бот>?start=o<код>. Так оформляется заказ, когда Mini App открыт
 * из кнопки меню «Каталог» или в браузере — там Telegram не даёт отправить данные боту напрямую.
 * Telegram пропускает в ссылке до 64 символов [A-Za-z0-9_-], поэтому код компактный (base64url):
 * байт версии (1), затем по 4 байта на позицию — номер товара в catalog.json (16 бит), номер варианта (5 бит),
 * количество − 1 (4 бита) и проверка (7 бит). Бот раскодирует так же (bot.py, decode_cart) и пересчитает цены.
 */
export const LINK_MAX_ITEMS = 11

function fnv1a(s: string): number {
  let h = 0x811c9dc5
  for (const b of new TextEncoder().encode(s)) h = Math.imul(h ^ b, 0x01000193) >>> 0
  return h >>> 0
}

export function itemCheck(p: Product, x: Variant): number {
  return fnv1a(`${p.brand}|${p.name}|${x.f}|${x.ml}|${x.c}|${x.cond}`) & 0x7f
}

/** Код корзины для ссылки на бота или null, если корзина пустая или не помещается в ссылку. */
export function cartCode(lines: CartLine[]): string | null {
  if (!lines.length || lines.length > LINK_MAX_ITEMS) return null
  const bytes = [1]
  for (const l of lines) {
    const vi = l.p.v.indexOf(l.x)
    const q = Math.max(1, Math.min(MAX_QTY, l.item.qty)) - 1
    if (l.p.i > 0xffff || vi < 0 || vi > 31) return null
    bytes.push(l.p.i >> 8, l.p.i & 0xff, (vi << 3) | (q >> 1), ((q & 1) << 7) | itemCheck(l.p, l.x))
  }
  const b64 = btoa(String.fromCharCode(...bytes))
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function botOrderLink(bot: string, lines: CartLine[]): string | null {
  const code = cartCode(lines)
  return code ? `https://t.me/${bot}?start=o${code}` : null
}

/** Текст заказа для чата с менеджером (когда Mini App открыт не с кнопки клавиатуры). */
export function orderText(lines: CartLine[], form: OrderForm): string {
  const L: string[] = []
  if (lines.length) {
    L.push('Здравствуйте! Заказ из каталога Divine Scents:')
    lines.forEach((l, i) => {
      const v = `${FORMAT[l.x.f]!.toLowerCase()} ${mlText(l.x.ml)}${l.x.c ? ', ' + l.x.c : ''}${l.x.cond ? ' (' + l.x.cond + ')' : ''}`
      L.push(`${i + 1}. ${l.p.brand} ${l.p.name} — ${v} × ${l.item.qty} = ${rub(l.sum)}`)
    })
    L.push(`Итого без доставки: ${rub(lines.reduce((s, l) => s + l.sum, 0))}`)
  } else {
    L.push('Здравствуйте! Вопрос из каталога Divine Scents.')
  }
  L.push('')
  L.push(`Получатель: ${form.name.trim()}`)
  L.push(`Телефон: ${form.phone.trim()}`)
  if (form.city.trim() || lines.length) {
    L.push(`Доставка СДЭК: ${form.city.trim() || 'город не указан'}`)
    if (form.point.trim()) L.push(`Пункт / адрес: ${form.point.trim()}`)
  }
  if (form.comment.trim()) L.push(`Комментарий: ${form.comment.trim()}`)
  return L.join('\n')
}
