<script lang="ts" setup>
import TopBar from "./TopBar.vue";
import { defineProps, ref, inject, onMounted } from "vue";

const $vsk: any = inject("vsk");

const top = ref(null);
const left = ref(null);
const right = ref(null);
const bottom = ref(null);
const topleft = ref(null);
const bottomleft = ref(null);
const topright = ref(null);
const bottomright = ref(null);

defineProps({
  title: {
    type: String,
    default: "Vasak",
  },
  image: {
    type: String,
    default: "",
  },
});

const resize = (dir: string) => {
  $vsk.startResize(dir);
};

onMounted(() => {
  if (top.value) {
    (top.value as HTMLElement).addEventListener("mousedown", (e: any) => {
      resize("top");
    });
  }
  if (bottom.value) {
    (bottom.value as HTMLElement).addEventListener("mousedown", (e: any) => {
      resize("bottom");
    });
  }
  if (left.value) {
    (left.value as HTMLElement).addEventListener("mousedown", (e: any) => {
      resize("left");
    });
  }
  if (right.value) {
    (right.value as HTMLElement).addEventListener("mousedown", (e: any) => {
      resize("right");
    });
  }
  if (topleft.value) {
    (topleft.value as HTMLElement).addEventListener("mousedown", (e: any) => {
      resize("topleft");
    });
  }
  if (bottomleft.value) {
    (bottomleft.value as HTMLElement).addEventListener("mousedown", (e: any) => {
      resize("bottomleft");
    });
  }
  if (topright.value) {
    (topright.value as HTMLElement).addEventListener("mousedown", (e: any) => {
      resize("topright");
    });
  }
  if (bottomright.value) {
    (bottomright.value as HTMLElement).addEventListener("mousedown", (e: any) => {
      resize("bottomright");
    });
  }
});
</script>

<template>
  <TopBar :title="title" :image="image" />
  <div class="window">
    <slot />
    <div ref="top" class="win-edge win-edge-top"></div>
    <div ref="left" class="win-edge win-edge-left"></div>
    <div ref="right" class="win-edge win-edge-right"></div>
    <div ref="bottom" class="win-edge win-edge-bottom"></div>
    <div ref="topleft" class="win-edge win-edge-topleft"></div>
    <div ref="bottomleft" class="win-edge win-edge-bottomleft"></div>
    <div ref="topright" class="win-edge win-edge-topright"></div>
    <div ref="bottomright" class="win-edge win-edge-bottomright"></div>
  </div>
</template>
