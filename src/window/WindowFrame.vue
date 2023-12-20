<script lang="ts">
import { defineComponent } from 'vue';
import TopBar from './TopBar.vue';

export default defineComponent({
  name: 'WindowFrame',
  props: {
    title: {
      type: String,
      default: 'Vasak'
    }
  },
  methods: {
    rezise(dir: string) {
      (this as any).$vsk.startResize(dir);
    }
  },
  components: {
    TopBar
  },
  mounted() {
    (this.$refs.top as any).addEventListener('mousedown', (e: any) => {
      this.rezise('top');
    });
    (this.$refs.bottom as any).addEventListener('mousedown', (e: any) => {
      this.rezise('bottom');
    });
    (this.$refs.left as any).addEventListener('mousedown', (e: any) => {
      this.rezise('left');
    });
    (this.$refs.right as any).addEventListener('mousedown', (e: any) => {
      this.rezise('right');
    });
    (this.$refs.topleft as any).addEventListener('mousedown', (e: any) => {
      this.rezise('topleft');
    });
    (this.$refs.bottomleft as any).addEventListener('mousedown', (e: any) => {
      this.rezise('bottomleft');
    });
    (this.$refs.topright as any).addEventListener('mousedown', (e: any) => {
      this.rezise('topright');
    });
    (this.$refs.bottomright as any).addEventListener('mousedown', (e: any) => {
      this.rezise('bottomright');
    });
  },
});
</script>

<template>
  <div ref="top" class="win-edge win-edge-top"></div>
  <div ref="left" class="win-edge win-edge-left"></div>
  <div ref="right" class="win-edge win-edge-right"></div>
  <div ref="bottom" class="win-edge win-edge-bottom"></div>
  <div ref="topleft" class="win-edge win-edge-topleft"></div>
  <div ref="bottomleft" class="win-edge win-edge-bottomleft"></div>
  <div ref="topright" class="win-edge win-edge-topright"></div>
  <div ref="bottomright" class="win-edge win-edge-bottomright"></div>
  <TopBar :title="title" />
  <div class="window">
    <slot />
  </div>
</template>

<style>
.window {
  width: 100vw;
  height: calc(100vh - 30px);
  background: var(--system-background);
  border-radius: 0 0 var(--system-border) var(--system-border);
}

.win-edge {
  position: absolute;
  z-index: 100;
  background: transparent;
}

.win-edge-top {
  top: 0;
  left: 10px;
  width: calc(100vw - 20px);
  height: 3px;
  cursor: ns-resize;
  font-size: 0;
}

.win-edge-bottom {
  bottom: 0;
  left: 10px;
  width: calc(100vw - 20px);
  height: 3px;
  cursor: ns-resize;
}

.win-edge-left {
  top: 10px;
  left: 0;
  width: 3px;
  height: calc(100vh - 20px);
  cursor: ew-resize;
}

.win-edge-right {
  top: 10px;
  right: 0;
  width: 3px;
  height: calc(100vh - 20px);
  cursor: ew-resize;
}


.win-edge-topleft {
  top: 0;
  left: 0;
  width: 10px;
  height: 10px;
  cursor: nwse-resize;
}

.win-edge-topleft:hover {
  content: '↖';
}

.win-edge-bottomleft {
  bottom: 0;
  left: 0;
  width: 10px;
  height: 10px;
  cursor: nesw-resize;
}

.win-edge-bottomleft:hover {
  content: '↙';
}

.win-edge-topright {
  top: 0;
  right: 0;
  width: 10px;
  height: 10px;
  cursor: nesw-resize;
}

.win-edge-topright:hover {
  content: '↗';
}

.win-edge-bottomright {
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  cursor: nwse-resize;
}

.win-edge-bottomright:hover {
  content: '↘';
}

</style>
