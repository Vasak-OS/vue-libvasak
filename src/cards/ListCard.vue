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
      'flex items-center justify-between background p-3 rounded-corner border border-ui-border transition-colors duration-200',
      {
        'hover:bg-ui-surface/60 cursor-pointer': props.clickable,
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
