<script setup lang="ts">
/**
 * Cuánto falta.
 *
 * Con el ARIA completo, que es lo que una de las tres copias tenía y las otras
 * no: sin `role="progressbar"` y sus `aria-value*`, una barra que avanza es una
 * caja de colores que no le dice nada a quien no la ve.
 *
 * `value` en `null` es **indeterminado**: se sabe que algo está pasando y no
 * cuánto falta. Ahí no va `aria-valuenow` —poner 0 diría «no empezó», que es
 * distinto— y la barra se anima sola.
 */
import { computed } from 'vue';

const props = withDefaults(
	defineProps<{
		/** De 0 a 100. `null` para indeterminado. */
		value: number | null;
		/** Qué está progresando. Lo lee un lector de pantalla. */
		label: string;
	}>(),
	{}
);

const acotado = computed(() =>
	props.value === null ? null : Math.max(0, Math.min(100, props.value))
);
</script>

<template>
  <div
    role="progressbar"
    :aria-label="label"
    :aria-valuenow="acotado ?? undefined"
    aria-valuemin="0"
    aria-valuemax="100"
    class="h-2 w-full overflow-hidden rounded-corner bg-ui-surface/70">
    <div
      v-if="acotado !== null"
      class="h-full rounded-corner bg-primary transition-[width] duration-300 ease-out"
      :style="{ width: `${acotado}%` }"></div>
    <!-- Indeterminado: una franja que va y viene. No dice cuánto falta porque
         no se sabe, pero sí que algo sigue pasando. -->
    <div v-else class="h-full w-1/3 animate-pulse rounded-corner bg-primary"></div>
  </div>
</template>
