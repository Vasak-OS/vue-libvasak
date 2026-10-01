<script setup lang="ts">
/** biome-ignore-all lint/style/useVueMultiWordComponentNames: la regla existe
 * para que el nombre de un componente no choque con un elemento HTML. Éste no
 * lo es, y renombrarlo obligaría a tocar cada uso sin ganar nada. */
/**
 * La raíz, que es la que sabe si el tooltip está abierto.
 *
 * El retardo vive acá y no en el contenido: es al **abrir** cuando importa, y
 * sin él un tooltip aparece y desaparece cada vez que el puntero cruza una
 * barra de botones camino a otra cosa. Al cerrar no hay retardo, que es lo que
 * hace que salir se sienta inmediato.
 */
import { computed, provide, ref } from 'vue';
import { TOOLTIP_KEY } from './types';

const props = withDefaults(
	defineProps<{
		/** Un botón apagado no explica nada: no hay tooltip que mostrar. */
		disabled?: boolean;
		/** Cuánto espera antes de aparecer, en milisegundos. */
		delayDuration?: number;
	}>(),
	{ disabled: false, delayDuration: 200 }
);

const open = ref(false);
const trigger = ref<HTMLElement | null>(null);
let timer: ReturnType<typeof setTimeout> | null = null;

function show() {
	if (props.disabled) return;
	timer = setTimeout(() => {
		open.value = true;
	}, props.delayDuration);
}

function hide() {
	// El temporizador se limpia siempre, también cuando no llegó a abrir: si no,
	// salir antes de tiempo deja el tooltip apareciendo sobre lo que sea que el
	// puntero esté mirando después.
	if (timer) clearTimeout(timer);
	open.value = false;
}

provide(TOOLTIP_KEY, {
	open: computed(() => open.value && !props.disabled) as typeof open,
	trigger,
	setTrigger: (element: HTMLElement | null) => {
		trigger.value = element;
	},
	show,
	hide,
});
</script>

<template>
  <div class="inline-block">
    <slot />
  </div>
</template>
