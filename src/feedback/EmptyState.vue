<script setup lang="ts">
/**
 * Lo que se ve cuando no hay nada que ver.
 *
 * Una carpeta vacía, una búsqueda sin resultados, una lista que todavía no
 * empezó. Venía de tres formas —34, 24 y 19 líneas— y cada una decía lo mismo
 * distinto.
 *
 * El icono va con `alt` vacío a propósito: acompaña al título, que ya dice lo
 * mismo, y un lector de pantalla no tiene que leerlo dos veces.
 */
import ThemeIcon from '../icons/ThemeIcon.vue';

withDefaults(
	defineProps<{
		title: string;
		/** La segunda línea: qué hacer, o por qué está vacío. */
		note?: string;
		icon?: string;
		/** Con borde punteado para una caja dentro de una sección. */
		bordered?: boolean;
	}>(),
	{ icon: 'dialog-information', bordered: false }
);
</script>

<template>
  <div
    class="flex flex-col items-center justify-center gap-3 px-8 py-12 text-center"
    :class="bordered ? 'rounded-corner border border-ui-border border-dashed bg-ui-surface/20' : ''">
    <ThemeIcon :name="icon" :size="48" class="opacity-60" />
    <p class="font-medium text-sm text-tx-main">{{ title }}</p>
    <p v-if="note" class="text-sm text-tx-muted">{{ note }}</p>
    <!-- Para el botón que saca del vacío: «Crear carpeta», «Limpiar filtros». -->
    <slot />
  </div>
</template>
