<script lang="ts" setup>
import { defineProps, ref, Ref, onMounted } from "vue";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { getIconSource } from "@vasakgroup/plugin-vicons";

const bar = ref(null);
const appWindow = getCurrentWindow();
const closeIcon: Ref<string> = ref("");
const minimizeIcon: Ref<string> = ref("");
const maximizeIcon: Ref<string> = ref("");

const props = defineProps({
  title: String,
  image: String,
});

onMounted(async () => {
  closeIcon.value = await getIconSource("window-close");
  minimizeIcon.value = await getIconSource("window-minimize");
  maximizeIcon.value = await getIconSource("window-maximize");
});
</script>

<template>
  <div
    data-tauri-drag-region
    class="flex h-8 px-4 py-1 bg-vsk-primary rounded-t-window justify-between align-center"
    ref="bar"
  >
    <div data-tauri-drag-region>
      <img :src="props.image" data-tauri-drag-region class="h-6 w-auto" />
    </div>
    <div data-tauri-drag-region>{{ props.title }}</div>
    <div data-tauri-drag-region>
      <span class="win-button" @click="appWindow.minimize()">
        <img :src="minimizeIcon" class="h-6 w-6 inline-block" alt="Minimize">
      </span>
      <span class="win-button" @click="appWindow.toggleMaximize()">
        <img :src="maximizeIcon" class="h-6 w-6 inline-block" alt="Maximize">
      </span>
      <span class="win-button" @click="appWindow.close()">
        <img :src="closeIcon" class="h-6 w-6 inline-block" alt="Close">
      </span>
    </div>
  </div>
</template>
