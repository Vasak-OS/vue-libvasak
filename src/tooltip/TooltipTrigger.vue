<script setup lang="ts">
/**
 * Lo que hay que sobrevolar para que aparezca.
 *
 * Mide contra el **hijo** y no contra su propio envoltorio: el `div` que
 * envuelve se estira a lo que le den, y un tooltip centrado sobre eso no queda
 * centrado sobre el botón.
 *
 * Abre también con el foco, que es lo que lo hace alcanzable con el teclado: un
 * tooltip que sólo responde al puntero no existe para quien no lo usa.
 */
import { onMounted, ref } from 'vue';
import { useTooltip } from './types';

const tooltip = useTooltip();
const wrapper = ref<HTMLElement | null>(null);

function realTrigger(): HTMLElement | null {
	if (!wrapper.value) return null;
	return (wrapper.value.firstElementChild as HTMLElement | null) ?? wrapper.value;
}

function enter() {
	tooltip.setTrigger(realTrigger());
	tooltip.show();
}

onMounted(() => {
	tooltip.setTrigger(realTrigger());
});
</script>

<template>
  <div
    ref="wrapper"
    class="inline-block"
    @mouseenter="enter"
    @mouseleave="tooltip.hide()"
    @focusin="enter"
    @focusout="tooltip.hide()">
    <slot />
  </div>
</template>
