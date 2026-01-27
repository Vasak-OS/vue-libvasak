<script lang="ts" setup>
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
    <img :src="image" :alt="title" class="img-fluid" />
  </a>
</template>
