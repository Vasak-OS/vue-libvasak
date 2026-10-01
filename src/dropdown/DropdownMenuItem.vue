<script lang="ts" setup>
/**
 * Una opción del menú.
 *
 * Era un `div` con un `@click` y nada más: sin `role`, no era un ítem de menú
 * para nadie que no viera la pantalla, y sin estar en el orden de tabulación no
 * había manera de llegar hasta él con el teclado.
 *
 * # Apagado, pero no escondido
 *
 * Un ítem apagado sigue enfocable y las flechas lo recorren, con
 * `aria-disabled` en vez de sacarlo de la lista: es la misma decisión que en
 * las pestañas del escritorio. Una opción que desaparece del recorrido no se
 * puede descubrir, y «pegar» que no está es indistinguible de «pegar» que no
 * existe en este menú.
 *
 * # `select` y `click`
 *
 * Los dos se emiten al elegir, porque las dos formas estaban en uso. `click`
 * pasa a ser un evento del componente y no el nativo del `div`: así también
 * llega cuando se elige con el teclado, y —lo que antes no pasaba— deja de
 * llegar cuando el ítem está apagado.
 *
 * # La forma (vue-libvasak#74)
 *
 * La opción de Once UI: `rounded-corner-m` dentro del `rounded-corner-l` del
 * panel, 32 de alto como mínimo, `px-3` y un borde de un píxel transparente que
 * la deja del mismo tamaño en todos los estados. **Pasar por encima ya no pinta
 * el acento**: era `hover:bg-primary hover:text-tx-on-primary`, una fila rosa
 * con el texto oscuro en cada movimiento del puntero; ahora es el velo neutro
 * `ui-hover` con el texto de siempre, y `ui-pressed` al apretar. El foco del
 * teclado suma el anillo **por dentro** (`outline-offset: -2px`): el menú
 * desplaza, y un anillo de afuera lo recortaría en el primer y el último ítem.
 *
 * Un nombre largo se parte en dos líneas en vez de cortarse: en un menú, lo
 * que no se lee no se puede elegir.
 */
import { useMenu } from './types';

const props = withDefaults(
	defineProps<{
		disabled?: boolean;
	}>(),
	{
		disabled: false,
	}
);

const emit = defineEmits<{
	select: [];
	click: [event: Event];
}>();

const menu = useMenu();

function choose(event: Event) {
	if (props.disabled) return;
	emit('select');
	emit('click', event);
	menu.close({ returnFocus: true });
}
</script>

<template>
  <div
    role="menuitem"
    tabindex="0"
    :aria-disabled="disabled || undefined"
    :class="[
      'flex min-h-8 min-w-0 items-center gap-3 rounded-corner-m border border-transparent px-3 py-1 text-label-m text-tx-main',
      'transition-colors duration-200 ease-ui',
      'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ui-focus',
      disabled
        ? 'cursor-not-allowed opacity-50'
        : 'cursor-pointer hover:bg-ui-hover focus-visible:bg-ui-hover active:bg-ui-pressed active:duration-100',
    ]"
    @click="choose"
    @keydown.enter.prevent="choose"
    @keydown.space.prevent="choose">
    <slot />
  </div>
</template>
