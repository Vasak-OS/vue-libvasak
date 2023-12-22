<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'TopBar',
  props: {
    title: {
      type: String,
      default: 'Vasak'
    }
  },
  methods: {
    move() {
      (this as any).$vsk.startMove();
    },
    close() {
      (this as any).$vsk.exit();
    },
    minimize() {
      (this as any).$vsk.minimize();
    },
    toggleMaximize() {
      (this as any).$vsk.toggleMaximize();
    }
  },
  mounted() {
    (this.$refs.bar as any).addEventListener('mousedown', (e: any) => {
      this.move();
    });
  }
});
</script>

<template>
  <div class="window-topbar" ref="bar" @click="move()">
    <div></div>
    <div>{{ title }}</div>
    <div>
      <a class="win-button" href="#" @click="minimize()">_</a>
      <a class="win-button" href="#" @click="toggleMaximize()">[]</a>
      <a class="win-button" href="#" @click="close()">X</a>
    </div>
  </div>
</template>

