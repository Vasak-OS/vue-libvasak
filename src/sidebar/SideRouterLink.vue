<script lang="ts">
import { defineComponent } from "vue";
import { RouterLink } from "vue-router";

export default defineComponent({
  name: "SideBar",
  props: {
    title: {
      type: String,
      default: "Link",
    },
    image: {
      type: String,
      default: "",
    },
    url: {
      type: String,
      default: "",
    },
  },
  components: {
    RouterLink,
  },
});
</script>

<template>
  <li class="nav-item py-2 py-sm-0">
    <RouterLink :to="url" class="nav-link">
      <span class="fs-5"><img :src="image" class="img-fluid" /></span>
      <span class="fs-4 ms-4 d-none d-sm-inline">{{ title }}</span>
    </RouterLink>
  </li>
</template>
