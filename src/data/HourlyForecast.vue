<script setup lang="ts">
/**
 * El pronóstico por hora: hora, icono y temperatura de cada una (2.9.0).
 *
 * Lo dibuja el tablero de fecha del escritorio (vasak-desktop#130) alrededor
 * del reloj grande, como en el video de referencia, y sirve igual para un
 * widget de clima. No sabe de dónde sale el clima: recibe las horas ya
 * armadas, con el **nombre del icono del tema** de cada una.
 *
 * # En arco o en tira
 *
 * `arc` reparte las horas sobre medio óvalo, de izquierda a derecha por arriba,
 * y deja el centro para lo que se ponga en la ranura —el reloj—. Las posiciones
 * son porcentajes del contenedor, así que el arco se estira con el lugar que le
 * den. Cuando el lugar no alcanza para un arco legible (menos de 20 rem), las
 * mismas horas pasan a una tira que baja de renglón, con la ranura debajo: nada
 * se pisa ni se corta. `strip` es la tira siempre.
 *
 * # La hora de ahora
 *
 * `current` es el índice de la hora actual, y va como una píldora vertical
 * rellena en el acento: es lo de ahora, que es para lo que está el acento. Las
 * demás, en `tx-muted` con la temperatura en `tx-main`.
 *
 * Cada hora es un elemento de lista con su nombre entero («22:00, Despejado,
 * 5°»), para que un lector de pantalla no lea tres datos sueltos.
 */
import { computed } from 'vue';
import ThemeIcon from '../icons/ThemeIcon.vue';
import { useLabels } from '../shared/labels';

export interface ForecastHour {
	time: Date | string;
	/** El nombre del icono del tema: `weather-clear-night`, `weather-showers`. */
	icon: string;
	/** En la unidad que ya eligió quien llama; se dibuja redondeada, con «°». */
	temperature: number;
	/** La condición, para el nombre accesible: «Despejado». */
	description?: string;
}

const props = withDefaults(
	defineProps<{
		hours: readonly ForecastHour[];
		/** Cuál es la de ahora. Sin esto, ninguna. */
		current?: number | null;
		layout?: 'arc' | 'strip';
		locale?: string;
		/** Forzar 12 o 24 horas, como en `ClockDisplay`. Sin esto, lo que diga el idioma. */
		hour12?: boolean;
		/** El nombre de la lista. */
		label?: string;
	}>(),
	{ current: null, layout: 'arc', locale: undefined, hour12: undefined, label: undefined }
);

defineSlots<{
	/** El centro del arco: el reloj grande, en el tablero de fecha. */
	default?: () => unknown;
}>();

const labels = useLabels();
const listLabel = computed(() => props.label ?? labels('weather.hourly', 'Pronóstico por hora'));

/**
 * Dónde va cada hora en el arco, en porcentajes del contenedor.
 *
 * De 175° a 5° y no de 180° a 0°: con los extremos sobre la horizontal del
 * centro, la primera y la última hora quedaban a la altura del reloj y lo
 * tocaban. El óvalo tiene el centro a 80 % del alto, así que la hora del medio
 * queda en lo más alto y el reloj abajo, adentro de la curva. La caja es de
 * 4:3 y no más apaisada: a los costados las horas se apilan, y con menos alto
 * una se metía debajo de la otra.
 */
function arcPosition(index: number, count: number): Record<string, string> {
	const from = (175 * Math.PI) / 180;
	const to = (5 * Math.PI) / 180;
	const angle = count > 1 ? from - ((from - to) * index) / (count - 1) : Math.PI / 2;
	const x = 50 + 46 * Math.cos(angle);
	const y = 80 - 62 * Math.sin(angle);
	return { '--arc-x': `${x.toFixed(2)}%`, '--arc-y': `${y.toFixed(2)}%` };
}

function toDate(value: Date | string): Date | null {
	const date = value instanceof Date ? value : new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
}

const items = computed(() => {
	// Con 24 horas, «22:00»; con 12, «10 p. m.»: «10:00 p. m.» no entra en la
	// columna de 48 px y los minutos de una hora en punto no dicen nada.
	const cycle = new Intl.DateTimeFormat(props.locale, { hour: 'numeric' }).resolvedOptions().hourCycle;
	const twelve = props.hour12 ?? (cycle === 'h11' || cycle === 'h12');
	const time = new Intl.DateTimeFormat(props.locale, twelve ? { hour: 'numeric', hour12: true } : { hour: '2-digit', minute: '2-digit', hour12: false });
	const degrees = new Intl.NumberFormat(props.locale, { maximumFractionDigits: 0 });
	return props.hours.map((hour, index) => {
		const date = toDate(hour.time);
		const clock = date ? time.format(date) : '';
		const temperature = `${degrees.format(hour.temperature)}°`;
		return {
			key: `${index}-${clock}`,
			clock,
			icon: hour.icon,
			temperature,
			name: [clock, hour.description, temperature].filter(Boolean).join(', '),
			current: index === props.current,
			style: props.layout === 'arc' ? arcPosition(index, props.hours.length) : undefined,
		};
	});
});

const arc = computed(() => props.layout === 'arc');
</script>

<template>
  <div
    class="@container w-full min-w-0"
    :data-layout="layout"
    data-hourly-forecast>
    <div
      class="flex min-w-0 flex-col items-center gap-3"
      :class="arc ? '@xs:relative @xs:block @xs:aspect-[4/3] @xs:min-h-48' : ''">
      <ol
        :aria-label="listLabel"
        class="m-0 flex w-full min-w-0 list-none flex-wrap justify-center gap-1 p-0"
        :class="arc ? '@xs:absolute @xs:inset-0 @xs:block' : ''">
        <li
          v-for="item in items"
          :key="item.key"
          :aria-label="item.name"
          :aria-current="item.current ? 'time' : undefined"
          :data-current="item.current || undefined"
          class="flex w-12 flex-col items-center gap-1 rounded-corner-full px-1 py-2 text-label-xs tabular-nums"
          :class="[
            item.current ? 'bg-primary text-tx-on-primary shadow-surface-s' : 'text-tx-muted',
            arc ? '@xs:absolute @xs:left-[var(--arc-x)] @xs:top-[var(--arc-y)] @xs:-translate-x-1/2 @xs:-translate-y-1/2' : '',
          ]"
          :style="item.style">
          <span aria-hidden="true">{{ item.clock }}</span>
          <ThemeIcon :name="item.icon" type="icon" :size="20" />
          <span aria-hidden="true" class="font-semibold" :class="item.current ? '' : 'text-tx-main'">{{ item.temperature }}</span>
        </li>
      </ol>
      <div
        v-if="$slots.default"
        class="flex w-full min-w-0 justify-center"
        :class="arc ? '@xs:absolute @xs:inset-x-0 @xs:bottom-0 @xs:top-[55%] @xs:items-center' : ''">
        <slot />
      </div>
    </div>
  </div>
</template>
