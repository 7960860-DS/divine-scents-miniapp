<script setup lang="ts">
import { onMounted, watch } from 'vue'

// Кнопка «Назад» в шапке Telegram: видна везде, кроме каталога.
const tg = useTelegram()
const route = useRoute()
const router = useRouter()

function goBack() {
  if (window.history.state?.back) router.back()
  else navigateTo('/')
}
function syncBack() {
  const bb = tg.inTelegram ? tg.wa?.BackButton : null
  if (!bb) return
  if (route.path === '/') bb.hide()
  else bb.show()
}

onMounted(() => {
  if (tg.inTelegram) tg.wa?.BackButton?.onClick(goBack)
  syncBack()
})
watch(() => route.path, syncBack)
</script>

<template>
  <NuxtPage />
</template>
