<script lang="ts" setup>
import { defineProps, inject, onMounted, ref } from "vue";

const $vsk: any = inject("vsk");
const bar = ref(null);

defineProps({
  title: String,
  image: String,
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

onMounted(() => {
  if (bar.value) {
    (bar.value as HTMLElement).addEventListener("mousedown", (e: any) => {
      move();
    });
  }
});
</script>

<template>
  <div class="window-topbar" ref="bar" @click="move()">
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
.win-icon{
  width: 32px;
  height: 32px;
  margin-right: 5px;
}
</style>
