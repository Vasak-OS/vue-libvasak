<script setup lang="ts">
/**
 * El deslizamiento direccional entre dos secciones que ocupan el mismo lugar:
 * del centro de notificaciones a los ajustes rápidos y de vuelta
 * (docs/once-ui.md §5.5).
 *
 * `direction` es el lado del que **entra** la sección nueva; la que se va sale
 * hacia el lado contrario, así que ir y volver se lee como dos pasos de un mismo
 * camino. Entra en 200 ms con `ease-ui-out` y sale en 150 ms con `ease-in`,
 * 16 px y opacidad: lo suficiente para que se note de dónde viene sin que el
 * contenido cruce la ventana. Sólo se mueven `opacity` y `translate`, que se
 * componen sin rehacer el maquetado.
 *
 * Con `prefers-reduced-motion` queda sólo la opacidad (`motion-reduce:`), como
 * en `AppletPopover`.
 *
 * Las duraciones son las clases `duration-150` y `duration-200` y no un token:
 * la guardia de diseño sólo acepta 100/150/200/300 (§2.8). Lo demás (`appear`,
 * los eventos…) va directo al `<Transition>`.
 */
import type { TransitionSide } from './types';

withDefaults(
	defineProps<{
		/** El lado del que entra la sección nueva; la anterior se va al contrario. */
		direction?: TransitionSide;
		/** `out-in` para que no convivan las dos secciones en la pantalla. */
		mode?: 'out-in' | 'in-out';
	}>(),
	{ direction: 'right', mode: undefined }
);

// Clases completas, no armadas por pedazos: Tailwind sólo emite las que lee
// escritas. Entrar desde `left` es partir a la izquierda y salir hacia la derecha.
const ENTER_FROM: Record<TransitionSide, string> = {
	left: '-translate-x-4 motion-reduce:translate-x-0',
	right: 'translate-x-4 motion-reduce:translate-x-0',
	up: '-translate-y-4 motion-reduce:translate-y-0',
	down: 'translate-y-4 motion-reduce:translate-y-0',
};
const LEAVE_TO: Record<TransitionSide, string> = {
	left: 'translate-x-4 motion-reduce:translate-x-0',
	right: '-translate-x-4 motion-reduce:translate-x-0',
	up: 'translate-y-4 motion-reduce:translate-y-0',
	down: '-translate-y-4 motion-reduce:translate-y-0',
};
</script>

<template>
  <Transition
    :mode="mode"
    enter-active-class="transition-[opacity,translate] duration-200 ease-ui-out"
    leave-active-class="transition-[opacity,translate] duration-150 ease-in"
    :enter-from-class="`opacity-0 ${ENTER_FROM[direction]}`"
    :leave-to-class="`opacity-0 ${LEAVE_TO[direction]}`">
    <slot />
  </Transition>
</template>
