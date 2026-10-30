import { reactive, ref, shallowRef } from 'vue'
import { useRuntimeConfig } from '#imports'
import { decodeCatalog, type Catalog, type RawCatalog } from '~/utils/catalog'

const catalog = shallowRef<Catalog | null>(null)
const failed = ref(false)
let loading: Promise<void> | null = null

async function load(base: string) {
  failed.value = false
  try {
    const res = await fetch(`${base}catalog.json`)
    if (!res.ok) throw new Error(String(res.status))
    catalog.value = decodeCatalog((await res.json()) as RawCatalog)
  } catch {
    failed.value = true
    loading = null
  }
}

/** Каталог грузится один раз на всё приложение. */
export function useCatalog() {
  const base = useRuntimeConfig().app.baseURL || '/'
  if (!loading && !catalog.value) loading = load(base)
  return {
    catalog,
    failed,
    retry: () => { if (!loading) loading = load(base) },
  }
}

/** Фильтры каталога живут между переходами по страницам. */
const filters = reactive({ q: '', gender: 0, tester: false, brand: '', shown: 24 })
export function useFilters() {
  return filters
}
