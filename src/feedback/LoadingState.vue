<script setup lang="ts">
/**
 * Lo que se ve mientras se espera algo que llena la pantalla.
 *
 * Es el hermano de `EmptyState`: el mismo hueco, pero todavía no se sabe si va
 * a quedar vacío. No es el girito de un botón —eso lo tiene `ActionButton` con
 * `loading`— ni una barra con porcentaje —para eso está `ProgressBar`—: es la
 * espera sin medida, la que sólo puede decir que sigue.
 *
 * Venía de cuatro formas, y sólo una —la de la tienda— se anunciaba. Las otras
 * tres eran un `div` que gira: para quien no ve la pantalla, la vista quedaba
 * en blanco y sin explicación hasta que terminara.
 *
 * `label` no es opcional por eso mismo. Un girito sin texto no dice qué se está
 * esperando ni deja saber que se está esperando algo.
 *
 * `role="status"` y no `alert`: que algo esté cargando no interrumpe lo que se
 * esté leyendo, espera su turno. `aria-live` va implícito en el rol, y
 * `aria-atomic` hace que se lea entero cuando el texto cambia —de «Cargando
 * fotos…» a «Explorando 300 de 1200»— y no sólo el pedazo que cambió.
 *
 * # `size="sm"` (2.1.0)
 *
 * La fila: el aro de 16 px al lado del texto, en vez del aro grande arriba.
 * Es el `IndicadorDeCarga` de la tienda y los «Cargando…» sueltos de las
 * listas del correo y los contactos, donde el aro de 40 era más grande que la
 * lista que estaba por llegar.
 *
 * El comentario va acá y no arriba de la raíz de la plantilla: un comentario
 * antes del elemento raíz convierte la plantilla en un fragmento, y ahí se
 * pierde la raíz —los atributos dejan de caer y las pruebas ven otra cosa—.
 */
withDefaults(
	defineProps<{
		/** Qué se está esperando, ya traducido: «Cargando fotos…». */
		label: string;
		/** Con borde punteado, para una caja dentro de una sección. */
		bordered?: boolean;
		size?: 'sm' | 'md';
	}>(),
	{ bordered: false, size: 'md' }
);
</script>

<template>
  <div
    role="status"
    aria-atomic="true"
    class="flex min-w-0 items-center justify-center text-center"
    :class="[
      size === 'sm' ? 'flex-row gap-3 px-4 py-4' : 'flex-col gap-4 px-8 py-12',
      bordered ? 'rounded-corner-l border border-dashed border-ui-line' : '',
    ]">
    <!-- El anillo se queda quieto con el movimiento reducido. Ahí no informa de
         nada —el texto de abajo ya lo dice— y girar sin parar es justo lo que
         esa preferencia pide que no pase. -->
    <span
      class="shrink-0 animate-spin rounded-corner-full border-ui-line border-t-primary motion-reduce:animate-none"
      :class="size === 'sm' ? 'size-4 border-2' : 'size-10 border-4'" />
    <p class="text-body-s text-tx-muted">{{ label }}</p>
  </div>
</template>
