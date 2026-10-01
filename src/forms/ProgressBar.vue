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
 *
 * ── La forma (vue-libvasak#74) ──────────────────────────────────────────────
 *
 * Una vía fina de `rounded-corner-full` en `ui-line` —que se ve sobre la
 * ventana y sobre una tarjeta por igual; la superficie al 70 % desaparecía
 * dentro de una tarjeta de superficie— con el relleno del tono. Avanza en
 * 300 ms con `ease-ui`.
 *
 * ── `size` y `showValue` (2.1.0) ────────────────────────────────────────────
 *
 * `md` es la de 8 de siempre. `sm` (6) y `xs` (4) son las barras finas que se
 * dibujaban a mano: el medidor del OSD, la del centro de estado del gestor de
 * archivos, la de la tienda y el medidor de fuerza de la contraseña del
 * instalador.
 *
 * `showValue` es lo que la capa `ProgressBar` de Configuración ponía encima:
 * la fila con la etiqueta a la izquierda y el porcentaje a la derecha, con
 * `decimals` cifras (Configuración usa una, para el disco y la memoria). La
 * etiqueta visible es `label`, o la ranura `label` si hace falta algo más que
 * texto; el número es el mismo valor recortado que dibuja la barra, para que
 * no digan cosas distintas. Indeterminada no muestra número: no lo hay.
 *
 * Con la fila, la raíz es la columna y la barra va adentro; sin ella, la raíz
 * es la barra, como en la 2.0.0, para que una clase de quien la usa caiga donde
 * caía. La fila no se lee aparte (`aria-hidden`): la barra ya dice su nombre y
 * su valor. (Este comentario va acá y no en la plantilla: uno arriba de la raíz
 * la parte en un fragmento.)
 */
import { computed } from 'vue';
import ProgressTrack from './ProgressTrack.vue';

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
		size?: 'xs' | 'sm' | 'md';
		/** La fila de arriba con la etiqueta y el porcentaje. */
		showValue?: boolean;
		/** Las cifras decimales del porcentaje. */
		decimals?: number;
	}>(),
	{ tone: 'normal', size: 'md', showValue: false, decimals: 0 }
);

defineSlots<{
	/** La etiqueta visible de la fila de `showValue`, si no alcanza con el texto. */
	label?: () => unknown;
}>();

const HEIGHT = { xs: 'h-1', sm: 'h-1.5', md: 'h-2' } as const;

const TONE_COLOR: Record<'normal' | 'warning' | 'critical', string> = {
	normal: 'bg-primary',
	warning: 'bg-status-warning',
	critical: 'bg-status-error',
};

const clamped = computed(() =>
	props.value === null ? null : Math.max(0, Math.min(100, props.value))
);

const shownValue = computed(() => (clamped.value === null ? '' : `${clamped.value.toFixed(props.decimals)}%`));
</script>

<template>
  <div v-if="showValue" class="flex w-full min-w-0 flex-col gap-2">
    <div aria-hidden="true" class="flex min-w-0 items-center justify-between gap-3 text-label-xs text-tx-muted">
      <span class="min-w-0 break-words"><slot name="label">{{ label }}</slot></span>
      <span class="shrink-0 tabular-nums">{{ shownValue }}</span>
    </div>
    <ProgressTrack :value="clamped" :label="label" :height="HEIGHT[size]" :fill="TONE_COLOR[tone]" />
  </div>
  <ProgressTrack v-else :value="clamped" :label="label" :height="HEIGHT[size]" :fill="TONE_COLOR[tone]" />
</template>
