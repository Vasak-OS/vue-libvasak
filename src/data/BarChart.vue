<script setup lang="ts">
/**
 * Un gráfico de barras chico: una barra por día de la semana, por hora, por
 * mes (2.8.0).
 *
 * Lo pidió el tablero de tiempo de pantalla del escritorio (vasak-desktop#150)
 * —la semana de lunes a domingo con hoy en el acento—, y la misma forma sirve
 * para el uso de un disco por mes o los envíos por día.
 *
 * # Sin SVG
 *
 * Las barras son cajas con el alto en porcentaje, no un dibujo: así el radio
 * sale de `rounded-corner-*`, el color de los tokens y el tamaño del
 * contenedor, y la guardia de «ningún icono propio» no necesita una excepción.
 * Un gráfico de datos sí podría ser SVG —lo es el del monitor—, pero para
 * barras no hace falta.
 *
 * # El color
 *
 * La barra `current` (lo de ahora: hoy, esta hora) va en `ui-data`, que es el
 * acento topado para que llegue a 3:1 sobre cualquier superficie
 * (`tokens.css`); las demás, en `tx-muted`, que también llega. El acento no es
 * lo único que la distingue: su nombre va en el texto principal y en peso 600,
 * y lleva `aria-current`. Una barra sin valor no se dibuja; una con poco, se
 * dibuja con un alto mínimo para que se vea que hubo algo.
 *
 * # Accesible
 *
 * Es un `figure` con nombre (`label`) y una lista: cada barra se anuncia como
 * «nombre: valor», con el valor escrito (`valueLabel`) o el número. El mismo
 * texto va en el globo nativo, para quien apunta con el puntero.
 *
 * # Responsive
 *
 * Ocupa el ancho y el alto que le den (`h-full` por omisión; el alto lo pone
 * quien lo usa), con un piso de 80 px: un contenedor que no le dé alto —un
 * `flex-1` en una columna— no lo deja en cero. Por debajo de 16 rem de ancho cada barra muestra su nombre
 * corto (`shortLabel`, «L» en lugar de «Lun»), por consulta de contenedor.
 */
import { computed } from 'vue';

export interface BarChartItem {
	/** El nombre debajo de la barra: «Lun». */
	label: string;
	/** El nombre cuando no entra el otro: «L». Sin esto, el mismo `label`. */
	shortLabel?: string;
	value: number;
	/** El valor escrito, para el globo y el lector de pantalla: «4 h 13 min». */
	valueLabel?: string;
	/** Lo de ahora: va en el acento y con `aria-current`. */
	current?: boolean;
	/** Para la clave de Vue; sin esto, el `label`. */
	key?: string;
}

const props = withDefaults(
	defineProps<{
		bars: BarChartItem[];
		/** El nombre del gráfico, para el lector de pantalla. */
		label: string;
		/** El valor que llena la barra. Sin esto, el más alto de `bars`. */
		max?: number;
	}>(),
	{ max: undefined }
);

/** El alto mínimo de una barra con algo, en porcentaje del alto disponible. */
const MIN_VISIBLE = 4;

const top = computed(() => {
	const highest = Math.max(0, ...props.bars.map((bar) => (Number.isFinite(bar.value) ? bar.value : 0)));
	return props.max !== undefined && props.max > 0 ? props.max : highest;
});

function heightOf(value: number): number {
	if (!Number.isFinite(value) || value <= 0 || top.value <= 0) return 0;
	return Math.min(100, Math.max(MIN_VISIBLE, (value / top.value) * 100));
}

const rows = computed(() =>
	props.bars.map((bar) => {
		const said = bar.valueLabel ?? String(bar.value);
		return {
			key: bar.key ?? bar.label,
			label: bar.label,
			shortLabel: bar.shortLabel ?? bar.label,
			current: bar.current === true,
			height: heightOf(bar.value),
			description: `${bar.label}: ${said}`,
		};
	})
);
</script>

<template>
  <figure class="@container m-0 flex h-full min-h-20 w-full min-w-0 flex-col" :aria-label="label" data-bar-chart>
    <ul class="m-0 flex min-h-0 flex-1 list-none items-stretch gap-1 p-0 @[16rem]:gap-2">
      <li
        v-for="row in rows"
        :key="row.key"
        class="flex min-w-0 flex-1 flex-col items-center gap-1"
        :aria-label="row.description"
        :aria-current="row.current ? 'true' : undefined"
        :title="row.description"
        :data-current="row.current ? '' : undefined">
        <span class="flex min-h-0 w-full flex-1 items-end justify-center" aria-hidden="true">
          <span
            v-if="row.height > 0"
            class="block w-full max-w-8 rounded-corner-s transition-[height] duration-200 ease-ui"
            :class="row.current ? 'bg-ui-data' : 'bg-tx-muted'"
            :style="{ height: `${row.height}%` }"
            data-bar />
        </span>
        <span
          class="block w-full min-w-0 truncate text-center text-label-xs tabular-nums"
          :class="row.current ? 'font-semibold text-tx-main' : 'text-tx-muted'"
          aria-hidden="true">
          <span class="@[16rem]:hidden">{{ row.shortLabel }}</span>
          <span class="hidden @[16rem]:inline">{{ row.label }}</span>
        </span>
      </li>
    </ul>
  </figure>
</template>
