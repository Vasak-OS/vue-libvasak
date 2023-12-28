<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "SideButton",
  props: {
    title: {
      type: String,
      default: "Link",
    },
    image: {
      type: String,
      default: "",
    }
  },
});
</script>

<template>
  <li class="nav-item py-2 py-sm-0">
    <a href="#" class="nav-link">
      <span class="fs-5"><img :src="image" class="img-fluid" /></span>
      <span class="fs-4 ms-4 d-none d-sm-inline">{{ title }}</span>
    </a>
  </li>
</template>
