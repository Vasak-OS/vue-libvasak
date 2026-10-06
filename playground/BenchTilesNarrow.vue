<script setup lang="ts">
/**
 * La 2.13.1: los mosaicos de ajuste rápido en lo angosto (vue-libvasak#91).
 *
 * En el centro de control, a 350 px de ventana, la grilla de dos columnas deja
 * unos 155 px por mosaico, y ahí la 2.13.0 cortaba «Bluet…», «Encen…» y
 * «Tiempo de …». Este banco pone los textos reales del centro en tres lugares:
 *
 * - la grilla del centro (dos columnas por contenedor, una en lo angosto),
 *   dentro de la caja de cada ancho (`tiles-2131`) o sola contra la ventana
 *   (`tiles-window`, para medirla dentro de un `<iframe>` del ancho pedido);
 * - una tira de mosaicos de 150 px clavados, con y sin detalle.
 *
 * Todos los textos llevan `data-tile-title`/`data-tile-status`: el script del
 * banco comprueba que ninguno tenga `scrollWidth > clientWidth`.
 */
import { QuickSettingsTile } from '../src';

defineProps<{ section: string; width: number; first: boolean }>();

const TILES = [
	{ icon: 'bluetooth', title: 'Bluetooth', status: 'Encendido', active: true, detail: true },
	{ icon: 'network-wireless', title: 'Wi-Fi', status: 'Conectado', active: true, detail: true },
	{ icon: 'weather-clear-night', title: 'Luz nocturna', status: 'Al atardecer', active: false, detail: true },
	{ icon: 'notifications-disabled', title: 'No molestar', status: 'Apagado', active: false, detail: false },
	{ icon: 'preferences-system-time', title: 'Tiempo de pantalla', detail: false },
	{ icon: 'preferences-system-time', title: 'Tiempo de pantalla', detail: true },
	{ icon: 'system-suspend', title: 'Mantener despierto', status: 'Apagado', active: false, detail: false },
	{ icon: 'notifications-disabled', title: 'No molestar', status: 'Apagado', active: false, detail: true },
] as const;
</script>

<template>
  <div class="bench-wallpaper flex flex-col gap-3 p-3" :class="section === 'tiles-window' ? 'min-h-screen' : 'rounded-corner-l'">
    <div class="@container rounded-corner-xl border border-ui-line bg-ui-shell p-3" data-bench-grid>
      <div class="grid grid-cols-1 gap-2 @[17rem]:grid-cols-2">
        <QuickSettingsTile
          v-for="(tile, index) in TILES"
          :key="index"
          :icon="tile.icon"
          :title="tile.title"
          :status="'status' in tile ? tile.status : undefined"
          :active="'active' in tile ? tile.active : null"
          :detail="tile.detail" />
      </div>
    </div>
    <div v-if="section === 'tiles-2131' && first" class="flex flex-wrap gap-2" data-bench-fixed>
      <QuickSettingsTile
        v-for="(tile, index) in TILES"
        :key="index"
        class="w-[150px]"
        :icon="tile.icon"
        :title="tile.title"
        :status="'status' in tile ? tile.status : undefined"
        :active="'active' in tile ? tile.active : null"
        :detail="tile.detail" />
    </div>
  </div>
</template>

<style scoped>
/* Sólo del banco: algo de color detrás del escritorio translúcido. */
.bench-wallpaper {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary), var(--color-status-success));
}
</style>
