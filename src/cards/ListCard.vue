<script setup lang="ts">
/**
 * Una fila de lista, con lo que le pongan adentro.
 *
 * Cuando es `clickable` se abre entera: con el mouse y **también con el
 * teclado**. Lleva `role="button"` y no un `<button>` de verdad porque lo que
 * entra por la ranura lo decide quien la usa, y ya hay quien mete botones
 * adentro — un botón dentro de otro no es HTML válido: el navegador desanida el
 * marcado y el de adentro deja de funcionar. El nombre accesible sale de ese
 * mismo contenido.
 *
 * El papel y el foco van **atados a `clickable`**: una fila que dice ser un
 * botón y no hace nada es el mismo problema al revés.
 *
 * Y las teclas llevan `.self` **antes** de `.prevent`, que no es un detalle: la
 * tecla que alguien apreta sobre un botón de adentro **burbujea** hasta acá.
 * Sin `.self`, apretar Enter en ese botón dispararía además la acción de la
 * fila entera, y el `.prevent` le cancelaría al botón su propia activación —o a
 * un campo de texto su salto de línea—. Con `.self` sólo responden las teclas
 * que llegan a la fila misma, que es cuando la fila tiene el foco.
 *
 * # La forma (vue-libvasak#74)
 *
 * La tarjeta de Once UI: `rounded-corner-l`, canto `ui-line` y la superficie
 * `bg-ui-surface/70` de todo lo que se apoya en la ventana. Hasta la 1.x iba con
 * `.background`, una clase que definía cada aplicación como `bg-ui-bg/80`: el
 * fondo de la ventana puesto sobre la ventana, y en una aplicación sin esa
 * clase, ningún fondo. Clicable, pasar por encima suma el velo `ui-hover`
 * **encima** de la superficie —como imagen de fondo, que se pinta sobre el
 * color: reemplazar el color dejaría la fila más clara al pasar— sin tocar el
 * borde, y el foco es el anillo de siempre. `min-w-0` para que lo de
 * adentro pueda cortarse con `truncate` en vez de ensanchar la lista.
 */
interface Props {
	clickable?: boolean;
	customClass?: string | Record<string, boolean>;
}

const props = withDefaults(defineProps<Props>(), {
	clickable: false,
	customClass: () => ({}),
});

const emit = defineEmits<{
	click: [];
}>();

const handleClick = () => {
	if (props.clickable) {
		emit('click');
	}
};
</script>

<template>
  <div
    :class="[
      'flex min-w-0 items-center justify-between gap-3 rounded-corner-l border border-ui-line bg-ui-surface/70 p-3 text-tx-main transition-colors duration-200 ease-ui',
      {
        'cursor-pointer hover:bg-linear-to-r hover:from-ui-hover hover:to-ui-hover active:from-ui-pressed active:to-ui-pressed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-focus':
          props.clickable,
      },
      customClass,
    ]"
    :role="props.clickable ? 'button' : undefined"
    :tabindex="props.clickable ? 0 : undefined"
    @click="handleClick"
    @keydown.enter.self.prevent="handleClick"
    @keydown.space.self.prevent="handleClick"
  >
    <slot />
  </div>
</template>
