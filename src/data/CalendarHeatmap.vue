<script setup lang="ts">
/**
 * El mapa de calor de un mes: un cuadrito por día, más lleno cuanto más
 * valor (2.8.0).
 *
 * Lo pidió el tablero de tiempo de pantalla del escritorio (vasak-desktop#150):
 * al lado de la semana, el mes con los días de uso en el acento según cuánto.
 * Sirve igual para la actividad de una cuenta o los respaldos de un disco.
 *
 * # Cómo se arma
 *
 * Siete columnas, la semana empezando el día que diga `weekStart` (lunes por
 * omisión, como en el idioma del taller), con huecos antes del 1 para que
 * cada día caiga bajo su nombre. Los nombres de los días y del mes salen de
 * `Intl` con el idioma que se pase (`locale`) o el del sistema. Es una grilla
 * de cajas, sin SVG: el radio es `rounded-corner-xs`, el color de los tokens.
 *
 * # El color dice cuánto, y no sólo el color
 *
 * Cinco niveles: sin valor, la vía (`ui-line-weak`); con valor, `ui-data` al
 * 35, 60, 80 y 100 % según la parte del máximo. Sólo el nivel más alto llega a
 * 3:1 contra la superficie —es el acento topado de `tokens.css`—; los otros
 * son una gradación, y por eso **cada día dice su valor** en texto: en su
 * nombre accesible («15 de marzo: 1 h 20 min», con `formatValue`) y en el
 * globo nativo. Hoy lleva `aria-current="date"`; el elegido (`selected`), un
 * contorno del texto principal, que se ve sobre cualquier nivel. Los cuadros
 * no llevan el número del día, como en la referencia: un número encima del
 * acento pleno tendría que llegar a 4,5:1 contra cinco fondos distintos.
 *
 * # Responsive
 *
 * Los cuadritos son cuadrados y llenan la columna (`aspect-square`): la grilla
 * se achica con el contenedor sin salirse, y los nombres de los días se
 * cortan antes que empujar la grilla.
 */
import { computed } from 'vue';

const props = withDefaults(
	defineProps<{
		year: number;
		/** El mes, de 1 a 12. */
		month: number;
		/** El valor de cada día del mes, por número de día (1–31). */
		values: Partial<Record<number, number>>;
		/** El valor que llena el cuadro. Sin esto, el más alto del mes. */
		max?: number;
		/** El día de hoy, si cae en este mes. */
		today?: number;
		/** El día elegido, si hay uno. */
		selected?: number;
		/** 0 domingo, 1 lunes. */
		weekStart?: 0 | 1;
		/** El idioma, como `es-AR`. Sin esto, el del sistema. */
		locale?: string;
		/** El título de arriba. Sin esto, el nombre del mes; vacío, sin título. */
		title?: string;
		/** Cómo se escribe un valor en el nombre de cada día. */
		formatValue?: (value: number) => string;
	}>(),
	{
		max: undefined,
		today: undefined,
		selected: undefined,
		weekStart: 1,
		locale: undefined,
		title: undefined,
		formatValue: undefined,
	}
);

const LEVELS = ['bg-ui-line-weak', 'bg-ui-data/35', 'bg-ui-data/60', 'bg-ui-data/80', 'bg-ui-data'] as const;

/** En qué nivel cae un valor, de 0 (nada) a 4 (el máximo). */
function levelOf(value: number, top: number): number {
	if (!Number.isFinite(value) || value <= 0 || top <= 0) return 0;
	return Math.min(4, Math.max(1, Math.ceil((value / top) * 4)));
}

const daysInMonth = computed(() => new Date(props.year, props.month, 0).getDate());

const top = computed(() => {
	if (props.max !== undefined && props.max > 0) return props.max;
	let highest = 0;
	for (let day = 1; day <= daysInMonth.value; day++) {
		const value = props.values[day] ?? 0;
		if (Number.isFinite(value) && value > highest) highest = value;
	}
	return highest;
});

const monthName = computed(() =>
	new Intl.DateTimeFormat(props.locale, { month: 'long' }).format(new Date(props.year, props.month - 1, 1))
);

const heading = computed(() => {
	if (props.title !== undefined) return props.title;
	const name = monthName.value;
	return name.charAt(0).toLocaleUpperCase(props.locale) + name.slice(1);
});

/** Los nombres de los días, en el orden de la semana: «L», «M»… */
const weekdays = computed(() => {
	const narrow = new Intl.DateTimeFormat(props.locale, { weekday: 'narrow' });
	const long = new Intl.DateTimeFormat(props.locale, { weekday: 'long' });
	// El 4 de enero de 1970 fue domingo.
	return Array.from({ length: 7 }, (_, index) => {
		const date = new Date(1970, 0, 4 + ((index + props.weekStart) % 7));
		return { key: index, narrow: narrow.format(date), long: long.format(date) };
	});
});

/** Cuántos huecos van antes del día 1. */
const leading = computed(() => {
	const first = new Date(props.year, props.month - 1, 1).getDay();
	return (first - props.weekStart + 7) % 7;
});

const dateFormat = computed(() => new Intl.DateTimeFormat(props.locale, { day: 'numeric', month: 'long' }));

const days = computed(() =>
	Array.from({ length: daysInMonth.value }, (_, index) => {
		const day = index + 1;
		const value = props.values[day] ?? 0;
		const level = levelOf(value, top.value);
		const said = props.formatValue ? props.formatValue(value) : String(value);
		const name = dateFormat.value.format(new Date(props.year, props.month - 1, day));
		return {
			day,
			level,
			fill: LEVELS[level],
			today: props.today === day,
			selected: props.selected === day,
			description: `${name}: ${said}`,
		};
	})
);
</script>

<template>
  <figure class="@container m-0 flex w-full min-w-0 flex-col gap-2" :aria-label="heading || monthName" data-calendar-heatmap>
    <figcaption v-if="heading" class="truncate text-label-s font-medium text-tx-main">{{ heading }}</figcaption>
    <div class="grid grid-cols-7 gap-1" aria-hidden="true">
      <span
        v-for="weekday in weekdays"
        :key="weekday.key"
        class="truncate text-center text-label-xs text-tx-muted"
        :title="weekday.long">{{ weekday.narrow }}</span>
    </div>
    <ol class="m-0 grid list-none grid-cols-7 gap-1 p-0">
      <li v-for="gap in leading" :key="`gap-${gap}`" aria-hidden="true" data-gap />
      <li
        v-for="cell in days"
        :key="cell.day"
        class="aspect-square min-w-0 rounded-corner-xs"
        :class="[cell.fill, cell.selected ? 'outline-2 outline-offset-1 outline-tx-main' : '']"
        :aria-label="cell.description"
        :aria-current="cell.today ? 'date' : undefined"
        :title="cell.description"
        :data-level="cell.level" />
    </ol>
  </figure>
</template>
