<script setup lang="ts">
/**
 * La barra de `ProgressBar`, sin la fila de arriba.
 *
 * Es interna: no se exporta. Existe para que `ProgressBar` pueda dibujarse con
 * o sin la fila de la etiqueta sin escribir la barra dos veces.
 */
defineProps<{
	/** Ya recortado a 0–100, o `null` para indeterminado. */
	value: number | null;
	label: string;
	/** La clase del alto. */
	height: string;
	/** La clase del relleno. */
	fill: string;
}>();
</script>

<template>
  <div
    role="progressbar"
    :aria-label="label"
    :aria-valuenow="value ?? undefined"
    aria-valuemin="0"
    aria-valuemax="100"
    class="w-full overflow-hidden rounded-corner-full bg-ui-line"
    :class="height">
    <div
      v-if="value !== null"
      class="h-full rounded-corner-full transition-[width] duration-300 ease-ui"
      :class="fill"
      :style="{ width: `${value}%` }"></div>
    <!-- Indeterminado: el ancho completo, latiendo. No dice cuánto falta porque
         no se sabe, pero sí que algo sigue pasando. Con menos movimiento pedido
         deja de latir y queda atenuada, que tampoco se lee como una fracción. -->
    <div
      v-else
      class="h-full w-full animate-pulse rounded-corner-full bg-primary motion-reduce:animate-none motion-reduce:bg-primary/40"></div>
  </div>
</template>
