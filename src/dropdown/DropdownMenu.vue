<script lang="ts" setup>
/**
 * La raíz de un menú desplegable.
 *
 * No dibuja nada propio: provee el estado que comparten el disparador, el
 * contenido y los ítems. Se puede usar sin controlar —`<DropdownMenu>` y
 * listo— o atado con `v-model:open`, que es lo que necesita un menú
 * contextual, donde quien decide abrirlo es la aplicación y no un clic sobre
 * el disparador.
 */
import { computed, provide, ref, watch } from 'vue';
import { type FocusOnOpen, MENU_KEY, nextMenuId } from './types';

const props = withDefaults(
	defineProps<{
		/** Atado desde afuera. Sin esto el menú se abre y se cierra solo. */
		open?: boolean;
	}>(),
	{
		// Sin esto, nunca. Una propiedad declarada `boolean` que no se pasa vale
		// `false` y no `undefined` —Vue trata los booleanos como los atributos
		// del HTML, donde estar ausente es estar apagado—, así que el `??` de
		// abajo jamás caía del lado del estado interno y un menú sin `v-model`
		// no se abría nunca. No se notaba porque las dos aplicaciones que lo
		// usan lo atan.
		open: undefined,
	}
);

const emit = defineEmits<{
	'update:open': [value: boolean];
}>();

const internal = ref(false);
const trigger = ref<HTMLElement | null>(null);
const labelId = ref<string | null>(null);
const focusOnOpen = ref<FocusOnOpen>('none');
const menuId = nextMenuId();

/**
 * Quién tenía el foco cuando el menú se abrió.
 *
 * Es a quien vuelve el foco al cerrar, y no el disparador: en un menú
 * contextual el disparador es un ancla de cero por cero puesta donde se apretó
 * el botón derecho, y devolverle el foco a eso es tirarlo al vacío. Se anota al
 * abrir y no al cerrar, que es cuando el foco ya está adentro del menú.
 */
let openedBy: HTMLElement | null = null;

const open = computed({
	get: () => props.open ?? internal.value,
	set: (value: boolean) => {
		if (props.open === undefined) {
			internal.value = value;
		}
		emit('update:open', value);
	},
});

// También cuando lo abre la aplicación por la propiedad: el menú contextual de
// una pestaña nunca pasa por `show()`, y sin esto se cerraría sin devolverle
// el foco a nadie.
watch(open, (isOpen) => {
	if (isOpen) {
		const active = document.activeElement;
		openedBy = active instanceof HTMLElement ? active : null;
	} else {
		focusOnOpen.value = 'none';
	}
});

function show(focus: FocusOnOpen = 'none') {
	focusOnOpen.value = focus;
	open.value = true;
}

function close(options: { returnFocus?: boolean } = {}) {
	open.value = false;

	if (!options.returnFocus) return;
	const target = openedBy ?? trigger.value;
	// `isConnected` porque la acción que se acaba de elegir bien puede haber
	// sacado del documento a quien abrió el menú —«cerrar las demás pestañas»
	// se lleva puesta la pestaña que tenía el foco—, y enfocar un elemento
	// huérfano deja el foco en el `body`, sin decirlo.
	if (target?.isConnected) {
		target.focus();
	}
}

function toggle(focus: FocusOnOpen = 'none') {
	if (open.value) {
		close({ returnFocus: true });
		return;
	}
	show(focus);
}

provide(MENU_KEY, {
	open,
	menuId,
	labelId,
	setLabel: (id: string | null) => {
		labelId.value = id;
	},
	trigger,
	setTrigger: (element: HTMLElement | null) => {
		trigger.value = element;
	},
	focusOnOpen,
	show,
	close,
	toggle,
});
</script>

<template>
  <div class="relative inline-block">
    <slot />
  </div>
</template>
