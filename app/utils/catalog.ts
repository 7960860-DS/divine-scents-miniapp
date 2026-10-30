/**
 * Каталог Divine Scents: разбор catalog.json, поиск и форматирование.
 * Логика поиска совпадает с ботом (catalog.py), чтобы результаты были одинаковыми.
 *
 * Формат catalog.json:
 *   brands[], conc[], cond[], p[] = [индекс бренда, название, пол 0–3, варианты]
 *   вариант = [индекс концентрации, формат 0 флакон / 1 тестер, мл, цена ₽, индекс состояния]
 * Товары лежат в порядке популярности у поставщиков.
 */

export interface Variant { c: string; f: 0 | 1; ml: number; price: number; cond: string; key: string }
export interface Product {
  i: number; brand: string; name: string; g: number; v: Variant[]
  min: Variant; minT: Variant | null; concs: string[]
  sB: string; sN: string; hay: string; tok: string[]
}
export interface Catalog {
  products: Product[]; brands: string[]; brandCount: Map<string, number>
  byName: Map<string, Product>; freq: Map<string, number>; vocab: string[]
}
export interface SearchResult { items: Product[]; fixed: string | null }
export interface RawCatalog { brands: string[]; conc: string[]; cond: string[]; p: [number, string, number, number[][]][] }

export const CONC_LABEL: Record<string, string> = {
  EDP: 'Парфюмерная вода', EDT: 'Туалетная вода', Parfum: 'Духи', Extrait: 'Экстракт духов',
  EDC: 'Одеколон', 'Eau Fraiche': 'Eau Fraîche', Mist: 'Мист', 'Масло': 'Масляные духи', '': 'Концентрация не указана',
}
export const GENDER_LABEL = ['', 'женский', 'мужской', 'унисекс']
export const FORMAT = ['Флакон', 'Тестер']

const RU_BRAND: Record<string, string> = {
  'Christian Dior': 'диор кристиан', Chanel: 'шанель', 'Tom Ford': 'том форд', Creed: 'крид',
  'Maison Francis Kurkdjian': 'мейсон франсис куркджан mfk', Kilian: 'килиан', Byredo: 'байредо',
  Guerlain: 'герлен', 'Giorgio Armani': 'армани джорджио', 'Yves Saint Laurent': 'ив сен лоран ysl',
  Lancome: 'ланком', Versace: 'версаче', Montale: 'монталь', Mancera: 'мансера', Amouage: 'амуаж',
  Xerjoff: 'ксерджофф', 'Parfums de Marly': 'парфюм де марли', 'Initio Parfums Prives': 'инитио',
  'Ex Nihilo': 'экс нихило', 'Escentric Molecules': 'эсцентрик молекула', 'Jo Malone London': 'джо малон',
  Hermes: 'гермес эрмес', Prada: 'прада', Gucci: 'гуччи', Givenchy: 'живанши',
  'Dolce & Gabbana': 'дольче габбана d&g dg', Bvlgari: 'булгари', Cartier: 'картье', Burberry: 'барберри',
  'Hugo Boss': 'хуго босс boss', Lacoste: 'лакост', Kenzo: 'кензо', 'Carolina Herrera': 'каролина эррера ch',
  'Paco Rabanne': 'пако рабан', 'Jean Paul Gaultier': 'жан поль готье jpg', 'Narciso Rodriguez': 'нарцисо родригес',
  'Estee Lauder': 'эсте лаудер', Valentino: 'валентино', Chloe: 'хлоя', Lalique: 'лалик',
  Nishane: 'нишане', 'Tiziana Terenzi': 'тизиана терензи', 'Frederic Malle': 'фредерик маль',
  'Le Labo': 'ле лабо', 'Clive Christian': 'клайв кристиан', 'Roja Parfums': 'роха роджа',
  'Louis Vuitton': 'луи виттон', 'Memo Paris': 'мемо', 'Zielinski & Rozen': 'зелински', Kajal: 'каджал',
  Lattafa: 'латтафа', Mugler: 'мюглер', Moschino: 'москино', 'Calvin Klein': 'кельвин кляйн ck',
  'Ralph Lauren': 'ральф лорен', 'Issey Miyake': 'иссей мияке', Montblanc: 'монблан', Azzaro: 'аззаро',
  Davidoff: 'давидофф', Diptyque: 'диптик', "Penhaligon's": 'пенхалигон', 'Juliette Has A Gun': 'джульетта',
  'Viktor & Rolf': 'виктор рольф', 'Michael Kors': 'майкл корс', Lanvin: 'ланвин', 'Nina Ricci': 'нина риччи',
  Cacharel: 'кашарель', Escada: 'эскада', 'Marc Jacobs': 'марк джейкобс', 'Bond No. 9': 'бонд',
  'Maison Margiela': 'маржела', 'Al Haramain': 'аль харамейн', Ajmal: 'аджмал', Afnan: 'афнан',
  Armaf: 'армаф', 'Vilhelm Parfumerie': 'вильгельм', 'Orto Parisi': 'орто париси',
  'Matiere Premiere': 'матьер премьер', 'Essential Parfums': 'эссеншиал',
}

const RU_PHRASES: Record<string, string> = {
  'блю де шанель': 'bleu de chanel', 'коко мадмуазель': 'coco mademoiselle', 'мадмуазель': 'mademoiselle',
  'баккара руж': 'baccarat rouge', 'баккара': 'baccarat', 'бакара': 'baccarat', 'саваж': 'sauvage',
  'соваж': 'sauvage', 'мисс диор': 'miss dior', 'джадор': "j'adore", 'жадор': "j'adore", 'авентус': 'aventus',
  'блэк опиум': 'black opium', 'блек опиум': 'black opium', 'опиум': 'opium', 'лост черри': 'lost cherry',
  'черри': 'cherry', 'тобакко': 'tobacco', 'табако': 'tobacco', 'ванилла': 'vanill', 'ваниль': 'vanill',
  'уд вуд': 'oud wood', 'молекула': 'molecule', 'лайт блю': 'light blue', 'эрос': 'eros',
  'аква ди джио': 'acqua di gio', 'аква ди жио': 'acqua di gio', 'джио': 'gio', 'либр': 'libre',
  'идол': 'idole', 'ла ви эбель': 'la vie est belle', 'ла ви эст бель': 'la vie est belle',
  'гуд герл': 'good girl', 'миллион': 'million', 'инвиктус': 'invictus', 'фантом': 'phantom',
  'фаренгейт': 'fahrenheit', 'делина': 'delina', 'дилина': 'delina', 'пегас': 'pegasus', 'лейтон': 'layton',
  'лэйтон': 'layton', 'ангелс шер': "angels' share", 'энджелс шер': "angels' share", 'хедонист': 'hedonist',
  'блю талисман': 'blue talisman', 'флер наркотик': 'fleur narcotique', 'наркотик': 'narcotique',
  'сантал': 'santal', 'санталь': 'santal', 'гипси': 'gypsy', 'бланш': 'blanche', 'мохаве': 'mojave',
  'шанс': 'chance', 'шалимар': 'shalimar', 'алиен': 'alien', 'ангел': 'angel', 'кирке': 'kirke',
  'лайтон': 'layton', 'аллюр': 'allure', 'омбре': 'ombre', 'лезер': 'leather', 'лэзер': 'leather', 'уд': 'oud',
  'роуз': 'rose', 'роза': 'rose', 'блэк': 'black', 'блек': 'black', 'голд': 'gold', 'интенс': 'intense',
  'эликсир': 'elixir', 'экстрим': 'extreme', 'хоум': 'homme', 'ом': 'homme', 'фам': 'femme', 'пур': 'pour',
  'спорт': 'sport', 'нуар': 'noir', 'орхид': 'orchid', 'орхидея': 'orchid', 'гуилти': 'guilty', 'гилти': 'guilty',
  'бамбу': 'bamboo', 'блум': 'bloom', 'флора': 'flora', 'версаче эрос': 'versace eros', 'ди': 'di', 'де': 'de',
  'ван': 'one', 'зе ван': 'the one', 'код': 'code', 'май вей': 'my way', 'си': 'si',
  'сикрет': 'secret', 'кристал': 'crystal', 'нойр': 'noir', 'лаванда': 'lavand',
}
const PHRASES = Object.entries(RU_PHRASES).sort((a, b) => b[0].length - a[0].length)

const STOP = new Set(['духи', 'духов', 'парфюм', 'парфюмерия', 'аромат', 'ароматы', 'туалетная', 'парфюмерная', 'вода',
  'цена', 'сколько', 'стоит', 'есть', 'ли', 'у', 'вас', 'в', 'наличии', 'хочу', 'купить', 'мне', 'нужен', 'нужна',
  'пожалуйста', 'please', 'price', 'покажи', 'найди', 'и', 'от', 'для', 'мл', 'ml'])
const GENDER_WORDS: Record<string, number> = { 'мужской': 2, 'мужские': 2, 'мужчин': 2, 'мужчины': 2, 'мужа': 2,
  'женский': 1, 'женские': 1, 'женщин': 1, 'женщины': 1, 'жены': 1, 'девушки': 1, 'унисекс': 3 }
const FORMAT_WORDS: Record<string, 0 | 1> = { 'тестер': 1, 'тестеры': 1, 'тестера': 1, 'флакон': 0 }
const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n',
  о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '',
  ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
}
const CYR = /[а-я]/

export function norm(s: string): string {
  let out = ''
  for (const ch of s || '') {
    out += ch === 'й' || ch === 'Й' ? ch : ch.normalize('NFKD').replace(/[̀-ͯ]/g, '')
  }
  return out.toLowerCase().replace(/ё/g, 'е').replace(/[’`´]/g, "'")
    .replace(/[^\p{L}\p{N}_'&+.\- ]+/gu, ' ').replace(/\s+/g, ' ').trim()
}

const nf = new Intl.NumberFormat('ru-RU')
export const rub = (n: number) => nf.format(n).replace(/\s/g, ' ') + ' ₽'
export const mlText = (ml: number) => String(ml).replace('.', ',') + ' мл'
export const variantKey = (x: { c: string; f: number; ml: number; cond: string }) => [x.c, x.f, x.ml, x.cond].join('|')
export const productKey = (brand: string, name: string) => brand + '|' + name

export function decodeCatalog(raw: RawCatalog): Catalog {
  const freq = new Map<string, number>()
  const brandCount = new Map<string, number>()
  const byName = new Map<string, Product>()
  const products = raw.p.map((r, i): Product => {
    const brand = raw.brands[r[0]]!
    const name = r[1]
    const v: Variant[] = r[3].map((x) => {
      const vv = { c: raw.conc[x[0]!]!, f: x[1] as 0 | 1, ml: x[2]!, price: x[3]!, cond: raw.cond[x[4]!]!, key: '' }
      vv.key = variantKey(vv)
      return vv
    })
    const min = v.reduce((a, b) => (b.price < a.price ? b : a))
    const testers = v.filter((x) => x.f === 1)
    const minT = testers.length ? testers.reduce((a, b) => (b.price < a.price ? b : a)) : null
    const concs = [...new Set(v.map((x) => x.c))]
    const sB = norm(brand + ' ' + (RU_BRAND[brand] || ''))
    const sN = norm(name)
    const sNc = norm([...new Set(v.map((x) => x.c))].sort().join(' '))
    const hay = sB + ' ' + sN + ' ' + sNc
    const p: Product = { i, brand, name, g: r[2], v, min, minT, concs, sB, sN, hay, tok: hay.split(' ') }
    for (const w of (sB + ' ' + sN).split(' ')) freq.set(w, (freq.get(w) || 0) + 1)
    brandCount.set(brand, (brandCount.get(brand) || 0) + 1)
    byName.set(productKey(brand, name), p)
    return p
  })
  const vocab = [...freq.keys()].filter((w) => w.length >= 3 && !CYR.test(w)).sort()
  return { products, brands: raw.brands, brandCount, byName, freq, vocab }
}

function prepare(query: string) {
  let q = ' ' + norm(query) + ' '
  for (const [ru, lat] of PHRASES) q = q.split(' ' + ru + ' ').join(' ' + lat + ' ')
  let gender: number | null = null
  let fmt: 0 | 1 | null = null
  const words: string[] = []
  for (const w of q.split(' ').filter(Boolean)) {
    if (w in GENDER_WORDS) gender = GENDER_WORDS[w]!
    else if (w in FORMAT_WORDS) fmt = FORMAT_WORDS[w]!
    else if (!STOP.has(w)) words.push(w)
  }
  return { words, gender, fmt }
}

function match(cat: Catalog, words: string[], gender: number | null, fmt: 0 | 1 | null): Product[] {
  const out: Product[] = []
  for (const p of cat.products) {
    if (gender && p.g && p.g !== gender && p.g !== 3) continue
    if (fmt !== null && !p.v.some((x) => x.f === fmt)) continue
    // короткие слова (k, ck, 01) — только с начала слова, иначе «ck» находит «black»
    if (words.every((w) => (w.length <= 3 ? p.tok.some((t) => t.startsWith(w)) : p.hay.includes(w)))) out.push(p)
  }
  const joined = words.join(' ')
  const wordSet = new Set(words)
  const score = (p: Product): [number, number, number, number] => {
    const exact = p.sN === joined || p.sN.split(' ').every((t) => wordSet.has(t)) ? 1 : 0
    const brandHits = words.filter((w) => p.sB.includes(w)).length
    const starts = words.some((w) => p.sN.startsWith(w)) ? 1 : 0
    return [-exact, -brandHits, -starts, p.i]
  }
  const scored = out.map((p) => ({ p, s: score(p) }))
  scored.sort((a, b) => a.s[0] - b.s[0] || a.s[1] - b.s[1] || a.s[2] - b.s[2] || a.s[3] - b.s[3])
  return scored.map((x) => x.p)
}

function similarity(a: string, b: string): number {
  if (a === b) return 1
  const m = a.length, n = b.length
  if (!m || !n) return 0
  let prev = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i++) {
    const cur = [i]
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    prev = cur
  }
  return 1 - prev[n]! / Math.max(m, n)
}

function correct(cat: Catalog, word: string): string {
  if (word.length < 4 || /^\d+$/.test(word)) return word
  let own = cat.freq.get(word) || 0
  if (CYR.test(word)) {
    if (own) return word // русское название бренда из словаря
    word = [...word].map((c) => TRANSLIT[c] ?? c).join('')
    own = cat.freq.get(word) || 0
  }
  if (own >= 3) return word // слово и так есть в каталоге
  let best = word
  let bestFreq = 0
  for (const v of cat.vocab) {
    if (Math.abs(v.length - word.length) > 2) continue
    if (similarity(word, v) < 0.75) continue
    const f = cat.freq.get(v) || 0
    if (f > bestFreq) { best = v; bestFreq = f }
  }
  return bestFreq > Math.max(own * 5, 2) ? best : word
}

/** Поиск по запросу покупателя: бренд, название, русские написания, «тестер», «мужской». */
export function searchCatalog(cat: Catalog, query: string): SearchResult {
  const { words, gender, fmt } = prepare(query)
  if (!words.length && gender === null && fmt === null) return { items: [], fixed: null }
  const res = match(cat, words, gender, fmt)
  const fixed = words.map((w) => correct(cat, w))
  if (fixed.join(' ') !== words.join(' ')) {
    const res2 = match(cat, fixed, gender, fmt)
    if (res2.length > res.length) return { items: res2, fixed: fixed.join(' ') }
  }
  return { items: res, fixed: null }
}

export function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10, m100 = n % 100
  const w = m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many
  return nf.format(n).replace(/\s/g, ' ') + ' ' + w
}

export function variantLabel(x: Variant) {
  return `${FORMAT[x.f]!.toLowerCase()} ${mlText(x.ml)}${x.c ? ', ' + x.c : ''}${x.cond ? ' (' + x.cond + ')' : ''}`
}
