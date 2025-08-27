<script lang="ts" setup>
import TopBar from "./TopBar.vue";
import { defineProps } from "vue";

const props = defineProps({
  title: {
    type: String,
    default: "Vasak",
  },
  image: {
    type: String,
    default: "",
  },
});
</script>

<template>
  <TopBar :title="props.title" :image="props.image" />
  <slot />
</template>
