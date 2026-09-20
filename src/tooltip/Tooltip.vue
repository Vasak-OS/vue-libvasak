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
import { CLAVE_DEL_TOOLTIP } from './tipos';

const props = withDefaults(
	defineProps<{
		/** Un botón apagado no explica nada: no hay tooltip que mostrar. */
		disabled?: boolean;
		/** Cuánto espera antes de aparecer, en milisegundos. */
		delayDuration?: number;
	}>(),
	{ disabled: false, delayDuration: 200 }
);

const abierto = ref(false);
const disparador = ref<HTMLElement | null>(null);
let temporizador: ReturnType<typeof setTimeout> | null = null;

function abrir() {
	if (props.disabled) return;
	temporizador = setTimeout(() => {
		abierto.value = true;
	}, props.delayDuration);
}

function cerrar() {
	// El temporizador se limpia siempre, también cuando no llegó a abrir: si no,
	// salir antes de tiempo deja el tooltip apareciendo sobre lo que sea que el
	// puntero esté mirando después.
	if (temporizador) clearTimeout(temporizador);
	abierto.value = false;
}

provide(CLAVE_DEL_TOOLTIP, {
	abierto: computed(() => abierto.value && !props.disabled) as typeof abierto,
	disparador,
	ponerElDisparador: (elemento: HTMLElement | null) => {
		disparador.value = elemento;
	},
	abrir,
	cerrar,
});
</script>

<template>
  <div class="inline-block">
    <slot />
  </div>
</template>
