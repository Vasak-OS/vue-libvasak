<script setup lang="ts">
/**
 * La superficie de una columna: la lista de cuentas del calendario, la ficha
 * de un contacto, la lista de carpetas del correo.
 *
 * `rounded-corner-l`, canto `ui-line` y la superficie al 70 % sobre la ventana
 * (ver la memoria `tokens-de-fondo`: el fondo de la ventana es sólo de la
 * ventana). Unos quince lugares en cinco aplicaciones la escribían a mano, con
 * `bg-ui-surface/45` en uno, `/50` en otro y `/70` en el tercero.
 *
 * No es `ListCard`: ésa es una fila (`flex justify-between p-3`). El menú del
 * escritorio la usó para sus zonas porque no había otra cosa; con esto se
 * vuelven a separar.
 *
 * Con `scroll`, desplaza adentro: el panel se queda del alto que le dé quien lo
 * pone y el contenido pasa por debajo del canto.
 */
withDefaults(
	defineProps<{
		as?: 'div' | 'section' | 'aside' | 'article' | 'nav';
		padding?: 'none' | 'sm' | 'md';
		scroll?: boolean;
	}>(),
	{ as: 'div', padding: 'md', scroll: false }
);

const PADDING = { none: '', sm: 'p-2', md: 'p-4' } as const;
</script>

<template>
  <component
    :is="as"
    class="flex min-w-0 flex-col rounded-corner-l border border-ui-line bg-ui-surface/70 text-tx-main"
    :class="[PADDING[padding], scroll ? 'min-h-0 overflow-y-auto' : '']">
    <slot />
  </component>
</template>
