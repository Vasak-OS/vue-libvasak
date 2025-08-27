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
  customColor: {
    type: String,
    default: null,
  },
});
</script>

<template>
  <TopBar :title :image :customColor />
</template>
