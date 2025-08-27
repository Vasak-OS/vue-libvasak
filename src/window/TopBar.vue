<script lang="ts" setup>
import { defineProps, ref, computed } from "vue";
import { getCurrentWindow } from "@tauri-apps/api/window";

const bar = ref(null);
const appWindow = getCurrentWindow();

const props = defineProps({
  title: String,
  image: String,
  customColor: String,
});

const isCustom = computed(() => {
  console.log("customColor", props.customColor);
  return props.customColor ? `custom` : "bg-vsk-primary";
});
</script>

<template>
  <div data-tauri-drag-region class="window-topbar" :class="isCustom" ref="bar">
    <div><img :src="image" class="img-fluid win-icon" /></div>
    <div>{{ title }}</div>
    <div>
      <a class="win-button" href="#" @click="appWindow.minimize()">_</a>
      <a class="win-button" href="#" @click="appWindow.toggleMaximize()">[]</a>
      <a class="win-button" href="#" @click="appWindow.close()">X</a>
    </div>
  </div>
</template>

