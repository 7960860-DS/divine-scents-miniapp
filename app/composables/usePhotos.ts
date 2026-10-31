import { shallowRef } from 'vue'
import { useRuntimeConfig } from '#imports'

// Фото ароматов: public/photos.json — { "Бренд|Название": "photos/файл.webp" }.
// Нет файла или нет фото у аромата — показываем рисунок флакона.
const photos = shallowRef<Record<string, string>>({})
let started = false

export function usePhotos() {
  const base = useRuntimeConfig().app.baseURL || '/'
  if (!started) {
    started = true
    fetch(`${base}photos.json`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((j) => { photos.value = j && typeof j === 'object' ? j : {} })
      .catch(() => {})
  }
  return {
    photoOf(brand: string, name: string) {
      const s = photos.value[brand + '|' + name]
      return s ? base + s : ''
    },
  }
}
