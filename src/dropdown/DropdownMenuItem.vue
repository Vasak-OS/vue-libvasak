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
 */
import { usarElMenu } from './tipos';

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
	click: [evento: Event];
}>();

const menu = usarElMenu();

function elegir(evento: Event) {
	if (props.disabled) return;
	emit('select');
	emit('click', evento);
	menu.cerrar({ devolverElFoco: true });
}
</script>

<template>
  <div
    role="menuitem"
    tabindex="0"
    :aria-disabled="disabled || undefined"
    :class="[
      'px-3 py-2 text-sm transition-colors outline-none',
      {
        'opacity-50 cursor-not-allowed': disabled,
        'cursor-pointer hover:bg-primary hover:text-tx-on-primary focus-visible:bg-primary focus-visible:text-tx-on-primary': !disabled,
      },
    ]"
    @click="elegir"
    @keydown.enter.prevent="elegir"
    @keydown.space.prevent="elegir">
    <slot />
  </div>
</template>
