<script setup lang="ts">
import { computed } from 'vue'

// Фото аромата, а если его нет — нарисованный флакон.
const props = defineProps<{ brand: string; name: string }>()
const { photoOf } = usePhotos()
const src = computed(() => photoOf(props.brand, props.name))
</script>

<template>
  <img v-if="src" :src="src" :alt="brand + ' ' + name" class="photo" loading="lazy" decoding="async">
  <BottleArt v-else :seed="brand + name" />
</template>

<style scoped>
.photo { display: block; width: 100%; height: 100%; object-fit: contain; }
</style>
