<script setup lang="ts">
/**
 * Un deslizador desnudo: la vía, el pulgar y nada más.
 *
 * `SliderControl` es la tarjeta con su icono y su porcentaje (el volumen y el
 * brillo del centro de control); esto es lo que va adentro, y lo que hace
 * falta en una fila de ajustes o en el visor de fotos, donde la tarjeta sobra.
 * `SliderControl` lo usa por dentro desde la 2.1.0, sin cambiar su API.
 *
 * Había unos dieciséis en cinco aplicaciones: el `RangeSlider` de
 * vasak-settings (nueve usos, más tres `type="range"` sueltos), uno en el
 * correo, dos en resonance y uno en la galería. El de Configuración crecía al
 * pasar por encima (`hover:scale-110`) y tenía una sombra del color primario;
 * lo de Once UI es un pulgar quieto con la sombra `surface-xs`.
 *
 * # Por qué un `input type="range"`
 *
 * El teclado (flechas, Inicio, Fin, AvPág/RePág), el rol `slider` y sus
 * `aria-value*` los pone el navegador. Lo que se dibuja a mano es sólo la
 * forma, por los seudoelementos de la vía y el pulgar, y el tramo recorrido
 * con un degradado de dos colores del esquema que corta donde está el valor.
 *
 * # El nombre y el valor
 *
 * `label` es obligatorio: un deslizador sin nombre se anuncia «control
 * deslizante, 47» sin decir de qué. `valueText` es lo que se oye en lugar del
 * número —«47 %», «30 segundos», «Sin espera»—, que es lo que el correo
 * escribía al lado del suyo y ningún lector de pantalla oía.
 *
 * Las ranuras `start` y `end` son las etiquetas de los extremos: «Más lento» y
 * «Más rápido», o el icono del volumen bajo y alto.
 */
import { computed } from 'vue';

const props = withDefaults(
	defineProps<{
		modelValue: number;
		/** Qué regula, ya traducido. Es su nombre accesible. */
		label: string;
		min?: number;
		max?: number;
		step?: number;
		/** Lo que se oye en lugar del número, o cómo armarlo a partir de él. */
		valueText?: string | ((value: number) => string);
		disabled?: boolean;
		id?: string;
		/** El `id` del texto que lo explica. */
		describedBy?: string;
		/**
		 * Avisa al soltar y no en cada paso.
		 *
		 * Para lo que cuesta caro aplicar: el correo guardaba la preferencia en
		 * cada movimiento del pulgar.
		 */
		lazy?: boolean;
	}>(),
	{ min: 0, max: 100, step: 1, disabled: false, lazy: false }
);

const emit = defineEmits<{
	'update:modelValue': [value: number];
	/** Al soltar el pulgar o al terminar con el teclado, con el valor final. */
	change: [value: number];
}>();

/** Cuánto del recorrido está hecho, de 0 a 100, para pintar el tramo. */
const fill = computed(() => {
	if (props.max <= props.min) return 0;
	const clamped = Math.min(props.max, Math.max(props.min, props.modelValue));
	return ((clamped - props.min) / (props.max - props.min)) * 100;
});

const spokenValue = computed(() => {
	if (typeof props.valueText === 'function') return props.valueText(props.modelValue);
	return props.valueText || undefined;
});

function read(event: Event): number {
	return Number((event.target as HTMLInputElement).value);
}

function onInput(event: Event) {
	if (!props.lazy) emit('update:modelValue', read(event));
}

function onChange(event: Event) {
	const value = read(event);
	if (props.lazy) emit('update:modelValue', value);
	emit('change', value);
}
</script>

<template>
  <div class="flex min-w-0 items-center gap-3" :class="disabled ? 'opacity-50' : ''">
    <span v-if="$slots.start" class="shrink-0 text-body-xs text-tx-muted"><slot name="start" /></span>
    <input
      :id="id"
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :value="modelValue"
      :disabled="disabled"
      :aria-label="label"
      :aria-valuetext="spokenValue"
      :aria-describedby="describedBy"
      :style="{ '--slider-fill': `${fill}%` }"
      class="h-8 min-w-0 flex-1 cursor-pointer appearance-none rounded-corner-m bg-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-focus disabled:cursor-not-allowed [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-corner-full [&::-webkit-slider-runnable-track]:bg-[linear-gradient(to_right,var(--color-primary)_var(--slider-fill),var(--color-ui-line)_var(--slider-fill))] [&::-webkit-slider-thumb]:-mt-[6px] [&::-webkit-slider-thumb]:box-border [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-corner-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-ui-float [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-surface-xs [&::-moz-range-track]:h-1 [&::-moz-range-track]:rounded-corner-full [&::-moz-range-track]:bg-ui-line [&::-moz-range-progress]:h-1 [&::-moz-range-progress]:rounded-corner-full [&::-moz-range-progress]:bg-primary [&::-moz-range-thumb]:box-border [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-corner-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-ui-float [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:shadow-surface-xs"
      @input="onInput"
      @change="onChange" />
    <span v-if="$slots.end" class="shrink-0 text-body-xs text-tx-muted"><slot name="end" /></span>
  </div>
</template>
