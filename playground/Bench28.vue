<script setup lang="ts">
/**
 * La 2.8.0: los gráficos del tablero de tiempo de pantalla (vasak-desktop#150).
 *
 * Se dibujan sobre un panel (`ui-surface/70`) encima de `ui-shell`, que es
 * donde los pone el tablero, y el `ui-shell` sobre un fondo de colores del
 * esquema: así se ve lo translúcido y se mide lo que se ve de verdad.
 */
import { BarChart, CalendarHeatmap, ListRow } from '../src';

defineProps<{ section: string; width: number; first: boolean }>();

const minutes = (value: number) => {
	const h = Math.floor(value / 3600);
	const m = Math.round((value % 3600) / 60);
	return h > 0 ? `${h} h ${m} min` : `${m} min`;
};

const week = [
	['Lun', 'L', 3.1],
	['Mar', 'M', 4.6],
	['Mié', 'X', 2.2],
	['Jue', 'J', 5.4],
	['Vie', 'V', 4.33],
	['Sáb', 'S', 0],
	['Dom', 'D', 0],
].map(([label, shortLabel, hours], index) => ({
	label: label as string,
	shortLabel: shortLabel as string,
	value: (hours as number) * 3600,
	valueLabel: minutes((hours as number) * 3600),
	current: index === 4,
}));

const month: Record<number, number> = {};
for (let day = 1; day <= 22; day++) month[day] = ((day * 7919) % 13) * 1500;

const apps = [
	['Firefox', 'firefox', 6540],
	['Balatro', 'applications-games', 2400],
	['LibreOffice', 'libreoffice-startcenter', 2220],
	['Telegram', 'telegram', 2220],
	['kitty', 'utilities-terminal', 1560],
] as const;
</script>

<template>
  <div v-if="section === 'charts-28'" class="bench-wallpaper rounded-corner-l p-3">
    <div class="flex flex-col gap-3 rounded-corner-xl border border-ui-line bg-ui-shell p-3">
      <div class="@container"><div class="flex flex-col gap-3 @[32rem]:flex-row">
        <div class="flex h-44 min-w-0 flex-col @[32rem]:flex-1 rounded-corner-l border border-ui-line bg-ui-surface/70 p-3">
          <BarChart :bars="week" label="Esta semana" />
        </div>
        <div class="min-w-0 rounded-corner-l border border-ui-line bg-ui-surface/70 p-3 @[32rem]:w-56">
          <CalendarHeatmap :year="2026" :month="3" :values="month" :today="20" :selected="20" locale="es-AR" :format-value="minutes" />
        </div>
      </div></div>
      <div class="flex flex-col gap-1 rounded-corner-l border border-ui-line bg-ui-surface/70 p-1">
        <ListRow
          v-for="([name, icon, seconds], index) in apps"
          :key="name"
          :title="name"
          :icon="icon"
          :meta="minutes(seconds)"
          :bar="seconds / apps[0][2]"
          hoverable
          :class="index === 1 ? 'is-hover' : ''" />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Sólo del banco: algo de color detrás del escritorio translúcido. */
.bench-wallpaper {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary), var(--color-status-success));
}
</style>
