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
 * la guardia de diseño sólo acepta 100/150/200/300 (§2.8).
 *
 * Se declaran y se reenvían al `<Transition>` `appear` y los hooks de entrada y
 * salida (`@before-enter`, `@enter`, `@after-enter`, `@enter-cancelled` y los de
 * `leave`), para que `vue-tsc` los acepte. Los hooks de `appear` no se declaran:
 * siguen cayendo al `<Transition>` por `$attrs`.
 */
import type { TransitionSide } from './types';

const props = withDefaults(
	defineProps<{
		/** El lado del que entra la sección nueva; la anterior se va al contrario. */
		direction?: TransitionSide;
		/** `out-in` para que no convivan las dos secciones en la pantalla. */
		mode?: 'out-in' | 'in-out';
		/** Pone la transición en marcha también en el primer montaje. */
		appear?: boolean;
		/** Hook de entrada; si recibe `done` tiene que llamarlo. */
		onEnter?: (el: Element, done: () => void) => void;
		/** Hook de salida; si recibe `done` tiene que llamarlo. */
		onLeave?: (el: Element, done: () => void) => void;
	}>(),
	{ direction: 'right', mode: undefined, appear: undefined, onEnter: undefined, onLeave: undefined }
);

/**
 * Los hooks de JS de `<Transition>`. `enter` y `leave` son props `onEnter` y
 * `onLeave`, no emits: el `<Transition>` mira cuántos parámetros declara la
 * función (`length > 1` = «avisaré con `done`») y un reenvío propio de dos
 * parámetros lo dejaría esperando para siempre aunque nadie lo escuche. Pasada
 * tal cual, la función de quien usa el componente conserva su aridad.
 */
const emit = defineEmits<{
	beforeEnter: [el: Element];
	afterEnter: [el: Element];
	enterCancelled: [el: Element];
	beforeLeave: [el: Element];
	afterLeave: [el: Element];
	leaveCancelled: [el: Element];
}>();

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
    :appear="props.appear"
    @before-enter="(el: Element) => emit('beforeEnter', el)"
    @enter="props.onEnter"
    @after-enter="(el: Element) => emit('afterEnter', el)"
    @enter-cancelled="(el: Element) => emit('enterCancelled', el)"
    @before-leave="(el: Element) => emit('beforeLeave', el)"
    @leave="props.onLeave"
    @after-leave="(el: Element) => emit('afterLeave', el)"
    @leave-cancelled="(el: Element) => emit('leaveCancelled', el)"
    enter-active-class="transition-[opacity,translate] duration-200 ease-ui-out"
    leave-active-class="transition-[opacity,translate] duration-150 ease-in"
    :enter-from-class="`opacity-0 ${ENTER_FROM[direction]}`"
    :leave-to-class="`opacity-0 ${LEAVE_TO[direction]}`">
    <slot />
  </Transition>
</template>
