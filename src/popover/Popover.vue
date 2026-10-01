<script lang="ts" setup>
/**
 * La raíz de un globo con contenido: un formulario chico, un selector, unas
 * opciones que cuelgan de un botón.
 *
 * Unos once escritos a mano en cuatro aplicaciones —el gestor de archivos
 * (siete y el `TagSelector`), las opciones del editor de texto, el «programar
 * envío» del correo, el `MusicWidget` del escritorio—. Se usa como
 * `DropdownMenu`: sin controlar, o atado con `v-model:open`.
 *
 * No dibuja nada: no envuelve a sus hijos en ningún elemento, así que no
 * cambia el maquetado de donde se pone.
 */
import { computed, provide, ref, watch } from 'vue';
import { nextPopoverId, POPOVER_KEY } from './types';

const props = withDefaults(
	defineProps<{
		/** Atado desde afuera. Sin esto se abre y se cierra solo. */
		open?: boolean;
	}>(),
	// `undefined` y no `false`: ver `DropdownMenu`, que tuvo esa trampa.
	{ open: undefined }
);

const emit = defineEmits<{
	'update:open': [value: boolean];
}>();

const internal = ref(false);
const trigger = ref<HTMLElement | null>(null);
const anchor = ref<HTMLElement | null>(null);
const contentId = nextPopoverId();

/** Quién tenía el foco al abrir: a quien vuelve al cerrar. */
let openedBy: HTMLElement | null = null;

const open = computed({
	get: () => props.open ?? internal.value,
	set: (value: boolean) => {
		if (props.open === undefined) internal.value = value;
		emit('update:open', value);
	},
});

watch(open, (isOpen) => {
	if (!isOpen) return;
	const active = document.activeElement;
	openedBy = active instanceof HTMLElement && active !== document.body ? active : null;
});

function close(options: { returnFocus?: boolean } = {}) {
	open.value = false;
	if (!options.returnFocus) return;
	const target = openedBy ?? trigger.value;
	if (target?.isConnected) target.focus();
}

provide(POPOVER_KEY, {
	open,
	contentId,
	trigger,
	setTrigger: (element) => {
		trigger.value = element;
	},
	anchor,
	setAnchor: (element) => {
		anchor.value = element;
	},
	show: () => {
		open.value = true;
	},
	close,
	toggle: () => {
		if (open.value) close({ returnFocus: true });
		else open.value = true;
	},
});
</script>

<template>
  <slot />
</template>
