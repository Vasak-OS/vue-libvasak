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
 * un cambio de sección—: sale lo viejo y recién después entra lo nuevo. Lo demás
 * (`appear`, los eventos `@after-leave`…) va directo al `<Transition>`.
 */
import type { TransitionSide } from './types';

withDefaults(
	defineProps<{
		/** Crecer de 0,96 a 1 al entrar y a 0,98 al salir. */
		scale?: boolean;
		/** Entrar desplazado 6 px desde este lado. */
		from?: TransitionSide;
		/** `out-in` para lo que se reemplaza en el mismo lugar. */
		mode?: 'out-in' | 'in-out';
	}>(),
	{ scale: false, from: undefined, mode: undefined }
);

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
    enter-active-class="transition-[opacity,scale,translate] duration-200 ease-ui-out"
    leave-active-class="transition-[opacity,scale,translate] duration-150 ease-in"
    :enter-from-class="['opacity-0', scale ? 'scale-96 motion-reduce:scale-100' : '', from ? OFFSET[from] : ''].join(' ')"
    :leave-to-class="['opacity-0', scale ? 'scale-98 motion-reduce:scale-100' : ''].join(' ')">
    <slot />
  </Transition>
</template>
