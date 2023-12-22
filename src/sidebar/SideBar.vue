<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "SideBar",
  props: {
    title: {
      type: String,
      default: "Vasak",
    },
  },
});
</script>

<template>
  <div
    class="sidebar col-auto p-2 col-md-4 col-xl-3 col-xxl-2 d-flex flex-column justify-content-between"
  >
    <a
      href="#"
      class="d-flex text-decoration-none align-items-center text-center"
    >
      <span class="fs-4 d-none d-sm-inline">{{ title }}</span>
    </a>
    <slot />
  </div>
</template>
