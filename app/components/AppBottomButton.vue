<script setup lang="ts">
// Замена кнопки Telegram MainButton при проверке в обычном браузере.
defineProps<{ text: string }>()
defineEmits<{ click: [] }>()
</script>

<template>
  <div class="dock">
    <button type="button" class="main" @click="$emit('click')">{{ text }}</button>
  </div>
</template>

<style scoped>
.dock {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 10px max(16px, env(safe-area-inset-right)) calc(10px + env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
  background: var(--bg);
  border-top: 1px solid var(--sep);
  z-index: 10;
}
.main {
  width: 100%;
  max-width: 608px;
  display: block;
  margin: 0 auto;
  height: 48px;
  border: 0;
  border-radius: 10px;
  background: var(--gold-strong);
  color: #fff;
  font-weight: 600;
}
</style>
