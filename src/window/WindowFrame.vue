<script lang="ts">
import { defineComponent } from "vue";
import TopBar from "./TopBar.vue";

export default defineComponent({
  name: "WindowFrame",
  props: {
    title: {
      type: String,
      default: "Vasak",
    },
  },
  methods: {
    rezise(dir: string) {
      (this as any).$vsk.startResize(dir);
    },
  },
  components: {
    TopBar,
  },
  mounted() {
    (this.$refs.top as any).addEventListener("mousedown", (e: any) => {
      this.rezise("top");
    });
    (this.$refs.bottom as any).addEventListener("mousedown", (e: any) => {
      this.rezise("bottom");
    });
    (this.$refs.left as any).addEventListener("mousedown", (e: any) => {
      this.rezise("left");
    });
    (this.$refs.right as any).addEventListener("mousedown", (e: any) => {
      this.rezise("right");
    });
    (this.$refs.topleft as any).addEventListener("mousedown", (e: any) => {
      this.rezise("topleft");
    });
    (this.$refs.bottomleft as any).addEventListener("mousedown", (e: any) => {
      this.rezise("bottomleft");
    });
    (this.$refs.topright as any).addEventListener("mousedown", (e: any) => {
      this.rezise("topright");
    });
    (this.$refs.bottomright as any).addEventListener("mousedown", (e: any) => {
      this.rezise("bottomright");
    });
  },
});
</script>

<template>
  <TopBar :title="title" />
  <div class="window">
    <div ref="top" class="win-edge win-edge-top"></div>
    <div ref="left" class="win-edge win-edge-left"></div>
    <div ref="right" class="win-edge win-edge-right"></div>
    <div ref="bottom" class="win-edge win-edge-bottom"></div>
    <div ref="topleft" class="win-edge win-edge-topleft"></div>
    <div ref="bottomleft" class="win-edge win-edge-bottomleft"></div>
    <div ref="topright" class="win-edge win-edge-topright"></div>
    <div ref="bottomright" class="win-edge win-edge-bottomright"></div>
    <slot />
  </div>
</template>
