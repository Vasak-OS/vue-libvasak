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
import { usarElTooltip } from './tipos';

const tooltip = usarElTooltip();
const envoltorio = ref<HTMLElement | null>(null);

function elDisparadorDeVerdad(): HTMLElement | null {
	if (!envoltorio.value) return null;
	return (envoltorio.value.firstElementChild as HTMLElement | null) ?? envoltorio.value;
}

function entrar() {
	tooltip.ponerElDisparador(elDisparadorDeVerdad());
	tooltip.abrir();
}

onMounted(() => {
	tooltip.ponerElDisparador(elDisparadorDeVerdad());
});
</script>

<template>
  <div
    ref="envoltorio"
    class="inline-block"
    @mouseenter="entrar"
    @mouseleave="tooltip.cerrar()"
    @focus="entrar"
    @blur="tooltip.cerrar()">
    <slot />
  </div>
</template>
