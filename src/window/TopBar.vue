<script lang="ts" setup>
import { defineProps, inject, onMounted, ref, computed } from "vue";

const $vsk: any = inject("vsk");
const bar = ref(null);

const props = defineProps({
  title: String,
  image: String,
  customColor: String,
});

const move = () => {
  $vsk.startMove();
};

const close = () => {
  $vsk.exit();
};

const minimize = () => {
  $vsk.minimize();
};

const toggleMaximize = () => {
  $vsk.toggleMaximize();
};

const isCustom = computed(() => {
  console.log('customColor', props.customColor);
  return props.customColor ? `custom`: '';
});

onMounted(() => {
  if (bar.value) {
    (bar.value as HTMLElement).addEventListener("mousedown", (e: any) => {
      move();
    });
  }
});
</script>

<template>
  <div class="window-topbar" :class="isCustom" ref="bar" @click="move()">
    <div><img :src="image" class="img-fluid win-icon" /></div>
    <div>{{ title }}</div>
    <div>
      <a class="win-button" href="#" @click="minimize()">_</a>
      <a class="win-button" href="#" @click="toggleMaximize()">[]</a>
      <a class="win-button" href="#" @click="close()">X</a>
    </div>
  </div>
</template>

<style scoped>
.custom{
  background-color: v-bind(props.customColor);
}
</style>