<script setup lang="ts">
import { computed } from 'vue'
import { GENDER_LABEL, mlText, rub, type Product } from '~/utils/catalog'

const props = defineProps<{ p: Product; tester?: boolean }>()
const price = computed(() => (props.tester && props.p.minT ? props.p.minT : props.p.min))
const meta = computed(() =>
  [props.p.concs.filter(Boolean).join(' · '), GENDER_LABEL[props.p.g]].filter(Boolean).join(' · '),
)
</script>

<template>
  <NuxtLink :to="`/p/${p.i}`" class="card">
    <span class="img">
      <span v-if="p.minT" class="badge">тестер</span>
      <BottleArt :seed="p.brand + p.name" />
    </span>
    <span class="brand eyebrow">{{ p.brand }}</span>
    <span class="name display">{{ p.name }}</span>
    <span v-if="meta" class="meta muted">{{ meta }}</span>
    <span class="from">от <b class="price">{{ rub(price.price) }}</b> <small class="muted">· {{ mlText(price.ml) }}</small></span>
  </NuxtLink>
</template>

<style scoped>
.card { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.img {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 168px;
  padding: 20px;
  margin-bottom: 8px;
  border-radius: 14px;
  background: radial-gradient(circle at 50% 58%, var(--halo), transparent 68%), var(--section);
}
.badge {
  position: absolute;
  top: 8px;
  left: 8px;
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--gold);
  border: 1px solid var(--gold);
  border-radius: 6px;
  padding: 2px 6px;
}
.brand { overflow-wrap: anywhere; }
.name { font-size: 20px; overflow-wrap: anywhere; }
.meta { font-size: 12.5px; }
.from { margin-top: auto; padding-top: 4px; font-size: 14px; }
.from b { font-weight: 600; }
</style>
