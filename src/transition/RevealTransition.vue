<script setup lang="ts">
/**
 * La aparición y el cierre de lo que se muestra o se esconde: un cambio de
 * sección, el resultado de una búsqueda, un velo, o un panel o menú que sale de
 * su disparador (docs/once-ui.md §5.5).
 *
 * Es un `<Transition>` con el criterio de `AppletPopover`, para que las
 * aplicaciones dejen de armar el suyo a mano. Lo que cambia es la opacidad:
 * entra en 200 ms con `ease-ui-out` (arranca rápido y frena) y sale en 150 ms con
 * `ease-in`. La salida es más corta que la entrada a propósito: lo que se va no
 * tiene que hacer esperar a lo que viene.
 *
 * Con `scale`, además crece de 0,96 a 1 al entrar y se achica a 0,98 al salir
 * (el «pop» desde el disparador). Con `from`, entra desplazado 6 px desde ese
 * lado; salir no se desplaza (salir hacia el panel se lee como «se guardó», y
 * con la escala alcanza). Sólo se mueven `opacity`, `scale` y `translate`, que
 * se componen sin rehacer el maquetado. Para que crezca desde el botón, el que
 * use el componente pone `transform-origin` en el elemento.
 *
 * Con `prefers-reduced-motion` queda sólo la opacidad. Lo resuelve el CSS al
 * dibujar (`motion-reduce:`): `matchMedia` no avisa de cambios en el WebView,
 * pero la regla se aplica igual.
 *
 * Las duraciones son las clases `duration-150` y `duration-200` y no un token:
 * la guardia de diseño sólo acepta 100/150/200/300 (§2.8).
 *
 * `mode="out-in"` es para lo que se reemplaza en el mismo lugar —una búsqueda,
 * un cambio de sección—: sale lo viejo y recién después entra lo nuevo.
 *
 * Se declaran y se reenvían al `<Transition>` `appear` y los hooks de entrada y
 * salida (`@before-enter`, `@enter`, `@after-enter`, `@enter-cancelled` y los de
 * `leave`), para que `vue-tsc` los acepte. Los hooks de `appear` no se declaran:
 * siguen cayendo al `<Transition>` por `$attrs`.
 */
import type { TransitionSide } from './types';

const props = withDefaults(
	defineProps<{
		/** Crecer de 0,96 a 1 al entrar y a 0,98 al salir. */
		scale?: boolean;
		/** Entrar desplazado 6 px desde este lado. */
		from?: TransitionSide;
		/** `out-in` para lo que se reemplaza en el mismo lugar. */
		mode?: 'out-in' | 'in-out';
		/** Pone la transición en marcha también en el primer montaje. */
		appear?: boolean;
		/** Hook de entrada; si recibe `done` tiene que llamarlo. */
		onEnter?: (el: Element, done: () => void) => void;
		/** Hook de salida; si recibe `done` tiene que llamarlo. */
		onLeave?: (el: Element, done: () => void) => void;
	}>(),
	{ scale: false, from: undefined, mode: undefined, appear: undefined, onEnter: undefined, onLeave: undefined }
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
// escritas. `motion-reduce:` las deja sin movimiento.
const OFFSET: Record<TransitionSide, string> = {
	left: '-translate-x-1.5 motion-reduce:translate-x-0',
	right: 'translate-x-1.5 motion-reduce:translate-x-0',
	up: '-translate-y-1.5 motion-reduce:translate-y-0',
	down: 'translate-y-1.5 motion-reduce:translate-y-0',
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
    enter-active-class="transition-[opacity,scale,translate] duration-200 ease-ui-out"
    leave-active-class="transition-[opacity,scale,translate] duration-150 ease-in"
    :enter-from-class="['opacity-0', scale ? 'scale-96 motion-reduce:scale-100' : '', from ? OFFSET[from] : ''].join(' ')"
    :leave-to-class="['opacity-0', scale ? 'scale-98 motion-reduce:scale-100' : ''].join(' ')">
    <slot />
  </Transition>
</template>
