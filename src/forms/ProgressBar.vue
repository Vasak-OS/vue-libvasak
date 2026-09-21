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
 *
 * ── La trampa de la banda corta ─────────────────────────────────────────────
 *
 * Una banda indeterminada que ocupa un tercio del ancho **se lee como «33%
 * completado»**, y más todavía cuando se queda quieta. Y se queda quieta: la
 * animación es infinita, así que `prefers-reduced-motion` la detiene —una barra
 * que se mueve sin parar durante media hora es justo lo que marea a alguien con
 * trastorno vestibular—. O sea que quien pidió menos movimiento terminaba
 * viendo un progreso inventado.
 *
 * Por eso lo indeterminado va al **ancho completo**: ni animado ni quieto se
 * confunde con una fracción. Lo encontró vasak-installer, que era el único que
 * se lo había planteado; acá vale para los tres que tenían una barra.
 */
import { computed } from 'vue';

const props = withDefaults(
	defineProps<{
		/** De 0 a 100. `null` para indeterminado. */
		value: number | null;
		/** Qué está progresando. Lo lee un lector de pantalla. */
		label: string;
		/**
		 * El color de la franja, para las barras que miden un **nivel**.
		 *
		 * Una copia de un archivo al 95 % va bien; un disco al 95 % no. La
		 * diferencia no la puede adivinar la barra, así que la dice quien la
		 * pone: el monitor pinta en ámbar desde el 75 % y en rojo desde el 90 %,
		 * y era lo único que su copia tenía y ésta no.
		 *
		 * El color no informa solo: `aria-valuenow` ya dice el número, que es lo
		 * que oye quien no lo ve. Sirve para reconocerlo de un vistazo entre
		 * cinco barras, que es justo lo que hace un monitor.
		 */
		tone?: 'normal' | 'warning' | 'critical';
	}>(),
	{ tone: 'normal' }
);

const COLOR: Record<'normal' | 'warning' | 'critical', string> = {
	normal: 'bg-primary',
	warning: 'bg-status-warning',
	critical: 'bg-status-error',
};

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
      class="h-full rounded-corner transition-[width] duration-300 ease-out"
      :class="COLOR[tone]"
      :style="{ width: `${acotado}%` }"></div>
    <!-- Indeterminado: el ancho completo, latiendo. No dice cuánto falta porque
         no se sabe, pero sí que algo sigue pasando. Con menos movimiento pedido
         deja de latir y queda atenuada, que tampoco se lee como una fracción. -->
    <div
      v-else
      class="h-full w-full animate-pulse rounded-corner bg-primary motion-reduce:animate-none motion-reduce:bg-primary/40"></div>
  </div>
</template>
