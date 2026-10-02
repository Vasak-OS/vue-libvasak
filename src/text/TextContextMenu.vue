<script setup lang="ts">
/**
 * El menú del clic derecho sobre los campos de texto (2.4.0).
 *
 * Copiar, cortar, pegar y seleccionar todo, dibujado por el menú del sistema
 * como el resto del escritorio. Con el menú del motor apagado —lo apaga el
 * complemento del menú contextual al arrancar— no quedaría forma de pegar con
 * el ratón una contraseña de wifi, una dirección de servidor o el nombre nuevo
 * de un archivo. Había dos copias, en Configuración y en el gestor de
 * archivos; ésta junta las dos y se queda con lo que sabía de más la del
 * gestor (cortar borra el tramo que se copió, no el que esté seleccionado al
 * elegir).
 *
 * Se monta **una sola vez** por ventana, en la raíz, y escucha en el
 * documento: las pantallas y los diálogos aparecen y desaparecen, y ninguno
 * tiene que acordarse de nada. No dibuja nada.
 *
 * # Lo que pone la aplicación
 *
 * - `show`: la función que abre el menú del sistema, la de `useContextMenu()`
 *   del complemento del menú contextual. Va por propiedad para que la
 *   librería no dependa del complemento: la mitad de las aplicaciones no lo
 *   usan, y un `import` suyo acá las obligaría a todas a tenerlo.
 * - `clipboard`, si no tiene los dos comandos de siempre. Por omisión el
 *   portapapeles va por Rust, con `clipboard_read_text` y
 *   `clipboard_write_text { text }`, que son los que ya tienen las dos
 *   aplicaciones: WebKitGTK no implementa el permiso «clipboard-read», así que
 *   `navigator.clipboard.readText()` no devuelve nada y «Pegar» no haría nada,
 *   sin avisar. Y copiar va por el mismo lado, para que lo copiado sobreviva al
 *   cierre de la ventana.
 *
 * Los textos salen de las propiedades, del catálogo (`textMenu.copy`,
 * `textMenu.cut`, `textMenu.paste`, `textMenu.selectAll`, que son las claves
 * que ya tenían las dos copias) y, sin nada, en inglés.
 */
import { invoke } from '@tauri-apps/api/core';
import { onBeforeUnmount, onMounted } from 'vue';
import { useLabels } from '../shared/labels';
import {
	getTextField,
	isTextAction,
	readTextMenuState,
	runTextAction,
	type TextAction,
	type TextClipboard,
	type TextMenuEntry,
	textMenuEntries,
} from './text-context-menu';

const props = withDefaults(
	defineProps<{
		/** Abre el menú del sistema y devuelve lo elegido (`useContextMenu().show` del complemento). */
		show: (entries: TextMenuEntry[], event: MouseEvent) => Promise<{ id: string } | null | undefined>;
		/** El portapapeles. Sin esto, los comandos `clipboard_read_text` y `clipboard_write_text`. */
		clipboard?: TextClipboard;
		copyLabel?: string;
		cutLabel?: string;
		pasteLabel?: string;
		selectAllLabel?: string;
	}>(),
	{
		clipboard: undefined,
		copyLabel: undefined,
		cutLabel: undefined,
		pasteLabel: undefined,
		selectAllLabel: undefined,
	}
);

const translate = useLabels();

const systemClipboard: TextClipboard = {
	read: () => invoke<string | null>('clipboard_read_text'),
	write: async (text: string) => {
		await invoke('clipboard_write_text', { text });
	},
};

function label(action: TextAction): string {
	switch (action) {
		case 'copy':
			return props.copyLabel ?? translate('textMenu.copy', 'Copy');
		case 'cut':
			return props.cutLabel ?? translate('textMenu.cut', 'Cut');
		case 'paste':
			return props.pasteLabel ?? translate('textMenu.paste', 'Paste');
		case 'select-all':
			return props.selectAllLabel ?? translate('textMenu.selectAll', 'Select all');
	}
}

async function open(event: MouseEvent) {
	const field = getTextField(event.target);

	// Sin campo no hay nada que ofrecer, y un menú con todo deshabilitado es
	// peor que ningún menú. El del motor ya está apagado en toda la ventana.
	if (!field) return;

	const state = readTextMenuState(field);
	const chosen = await props.show(textMenuEntries(state, label), event);
	if (!chosen || !isTextAction(chosen.id)) return;

	await runTextAction(chosen.id, field, state.selection, props.clipboard ?? systemClipboard, state.range);
}

onMounted(() => {
	// En captura, igual que la supresión del menú del motor, y antes que
	// cualquier elemento de la página.
	document.addEventListener('contextmenu', open, { capture: true });
});

onBeforeUnmount(() => {
	document.removeEventListener('contextmenu', open, { capture: true });
});

defineExpose({ open });
</script>

<template />
