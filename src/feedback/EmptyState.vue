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
 *
 * # `size` e `icon=""` (2.1.0)
 *
 * El `EmptyStateBox` de vasak-settings (33 usos) es este mismo vacío en chico:
 * una línea de texto atenuado en una caja punteada, sin icono, del alto de una
 * fila. Con `size="sm"` el relleno baja a la caja de esa copia y el icono a
 * 32; con `icon=""` no hay icono —antes se pedía un nombre vacío al tema y
 * quedaba un hueco de 48 px—. Las notificaciones del escritorio y los vacíos
 * del correo y los contactos son el mismo caso.
 *
 * # `muted` (2.4.0)
 *
 * La línea atenuada de la copia de Configuración: el título en `tx-muted`,
 * `text-body-s` y sin el peso 600, porque ahí el vacío es una nota al pie de
 * una sección («No hay impresoras») y no el contenido de la pantalla. Al pasar
 * a la librería, sus 33 usos habían cambiado de peso y de color.
 *
 * Junto con `size="sm"`, `icon=""` y `bordered` es exactamente esa caja.
 */
import ThemeIcon from '../icons/ThemeIcon.vue';

withDefaults(
	defineProps<{
		title: string;
		/** La segunda línea: qué hacer, o por qué está vacío. */
		note?: string;
		icon?: string;
		/**
		 * La variante del icono del tema.
		 *
		 * Igual que en `AlertMessage`. Hace falta porque no todos los nombres
		 * existen en las dos: el gestor de archivos pide `search` en la
		 * monocroma y `folder-open` en la de color, y pedir la que no está deja
		 * un hueco del tamaño del icono en vez de un icono.
		 */
		iconType?: 'icon' | 'symbol';
		/** Con borde punteado para una caja dentro de una sección. */
		bordered?: boolean;
		/** `md` llena un hueco grande; `sm` va en una caja del alto de unas filas. */
		size?: 'sm' | 'md';
		/** El título como una línea atenuada, sin peso: una nota y no el contenido. */
		muted?: boolean;
	}>(),
	{ icon: 'dialog-information', iconType: 'icon', bordered: false, size: 'md', muted: false }
);
</script>

<template>
  <div
    class="flex min-w-0 flex-col items-center justify-center text-center"
    :class="[
      size === 'sm' ? 'gap-2 px-4 py-6' : 'gap-3 px-8 py-12',
      bordered ? 'rounded-corner-l border border-dashed border-ui-line' : '',
    ]">
    <ThemeIcon v-if="icon" :name="icon" :type="iconType" :size="size === 'sm' ? 32 : 48" class="opacity-60" />
    <p
      class="break-words"
      :class="muted ? 'text-body-s text-tx-muted' : 'font-semibold text-label-m text-tx-main'">
      {{ title }}
    </p>
    <p v-if="note" class="max-w-prose text-body-s text-tx-muted">{{ note }}</p>
    <!-- Para el botón que saca del vacío: «Crear carpeta», «Limpiar filtros». -->
    <slot />
  </div>
</template>
