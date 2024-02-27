<script lang="ts" setup>
import { defineComponent } from "vue";

const props = defineProps({
  title: {
    type: String,
    default: "Link",
  },
  image: {
    type: String,
    default: "",
  },
});
</script>

<template>
  <a href="#" class="sidebar-button">
    <img :src="image" class="img-fluid" />
  </a>
</template>
