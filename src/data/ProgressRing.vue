<script setup lang="ts">
/**
 * Un medidor circular chico: el valor adentro y el nombre debajo (2.9.0).
 *
 * Los cuatro del clima del tablero de fecha (vasak-desktop#130) —viento,
 * humedad, lluvia, sensación térmica— y lo que necesite un anillo en vez de una
 * barra: la batería de un auricular, el uso de un disco.
 *
 * # Cómo se dibuja
 *
 * Con CSS y no con SVG: la librería no dibuja nada propio en SVG (la guardia lo
 * prohíbe), y un anillo es un degradado cónico —el acento hasta el valor, la
 * pista `ui-line` el resto— recortado por una máscara radial. Los dos colores
 * salen del esquema: `--use-primary` y el mismo velo del texto principal al
 * 16 % que es `ui-line`.
 *
 * # Qué es para un lector de pantalla
 *
 * Un `meter` de 0 a 100 con su nombre y el texto que se ve como valor
 * (`aria-valuetext`): «Viento, 6 km/h», no «Viento, 20». El valor que se le da
 * es lo lleno que está el anillo; lo que significa lo dice `display`.
 *
 * Mide lo que le den hasta 64 px (`md`) o 56 (`sm`), cuadrado, y el nombre se
 * corta con `title` si no entra.
 */
import { computed } from 'vue';

const props = withDefaults(
	defineProps<{
		/** Cuánto del anillo va lleno, de 0 a 100. `null` deja la pista sola. */
		value: number | null;
		/** El nombre, debajo: «Humedad». */
		label: string;
		/** Lo que va adentro: «71 %», «6». Sin esto, el valor con «%». */
		display?: string;
		/**
		 * La unidad, en un renglón propio debajo de `display`: en un anillo de
		 * 52 px «12 km/h» no entra en uno, y cortado no se lee.
		 */
		unit?: string;
		size?: 'sm' | 'md';
	}>(),
	{ display: undefined, unit: undefined, size: 'md' }
);

const clamped = computed(() =>
	props.value === null || Number.isNaN(props.value) ? null : Math.min(100, Math.max(0, props.value))
);
const shown = computed(() => props.display ?? (clamped.value === null ? '–' : `${Math.round(clamped.value)}%`));
const spoken = computed(() => (props.unit && clamped.value !== null ? `${shown.value} ${props.unit}` : shown.value));
</script>

<template>
  <div class="flex w-full min-w-0 flex-col items-center gap-1" data-progress-ring>
    <div
      role="meter"
      :aria-label="label"
      :aria-valuenow="clamped ?? undefined"
      :aria-valuemin="0"
      :aria-valuemax="100"
      :aria-valuetext="spoken"
      class="relative grid aspect-square w-full place-items-center"
      :class="size === 'sm' ? 'max-w-14' : 'max-w-16'">
      <!-- La pista y el valor en un solo degradado, y la máscara deja sólo el
           aro de 4 px. Van como utilidades y no en un <style>: las
           aplicaciones no cargan la hoja de la librería, sólo sus clases (el
           `@source` del dist). La máscara mira la opacidad, no el color:
           `currentColor` es sólo algo opaco que no es un color escrito a mano. -->
      <span
        aria-hidden="true"
        data-ring
        class="absolute inset-0 rounded-corner-full bg-[conic-gradient(var(--use-primary)_var(--ring-value),color-mix(in_srgb,var(--use-text-main)_16%,transparent)_0)] [-webkit-mask:radial-gradient(farthest-side,transparent_calc(100%_-_4px),currentColor_calc(100%_-_3.5px))] [mask:radial-gradient(farthest-side,transparent_calc(100%_-_4px),currentColor_calc(100%_-_3.5px))]"
        :style="{ '--ring-value': `${clamped ?? 0}%` }"></span>
      <span class="relative flex max-w-[78%] flex-col items-center" :title="spoken">
        <span class="max-w-full truncate text-label-xs font-semibold text-tx-main tabular-nums">{{ shown }}</span>
        <span v-if="unit" class="max-w-full truncate text-label-xs text-tx-muted" data-ring-unit>{{ unit }}</span>
      </span>
    </div>
    <span class="max-w-full truncate text-label-xs text-tx-muted" :title="label">{{ label }}</span>
  </div>
</template>
