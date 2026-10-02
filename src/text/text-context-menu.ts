/**
 * Lo que decide el menú del clic derecho sobre un campo de texto (2.4.0).
 *
 * Sube a la librería desde las dos copias que había —Configuración y el gestor
 * de archivos, `components/ui/text-context-menu.ts`—, que eran la misma con
 * una diferencia: la del gestor guardaba el tramo seleccionado al abrir el
 * menú, y ésa es la que queda.
 *
 * Vive fuera del componente para poder probarse sin una ventana: copiar,
 * cortar y pegar tienen casos en los que la respuesta correcta es «no tocar
 * nada», y esos son justamente los que sólo se ven cuando el sistema falla —el
 * portapapeles vacío, la escritura que no llega—. Un descuido ahí no se ve en
 * pantalla: se ve cuando alguien perdió lo que había escrito.
 */

/**
 * Los tipos de `input` sobre los que se puede leer y reemplazar la selección.
 *
 * Los deslizadores, las casillas y los interruptores también son `input`, y no
 * tienen texto que copiar. `number` y `email` tampoco entran, aunque lo
 * parezcan: el estándar no les da selección, y `selectionStart`,
 * `setRangeText` y `select()` tiran `InvalidStateError` sobre ellos. El menú se
 * abriría para romperse al elegir cualquier cosa.
 */
export const TEXT_INPUT_TYPES: readonly string[] = ['text', 'search', 'url', 'tel', 'password'];

export type TextField = HTMLInputElement | HTMLTextAreaElement;

/** El portapapeles del sistema, visto desde acá: leer puede no traer nada. */
export interface TextClipboard {
	read: () => Promise<string | null>;
	write: (text: string) => Promise<void>;
}

/** Un tramo del campo, en posiciones de carácter. */
export interface TextRange {
	start: number;
	end: number;
}

export type TextAction = 'copy' | 'cut' | 'paste' | 'select-all';

const ACTIONS: readonly string[] = ['copy', 'cut', 'paste', 'select-all'];

export const isTextAction = (id: string): id is TextAction => ACTIONS.includes(id);

/** El campo de texto sobre el que se hizo el clic, o `null` si no es uno. */
export const getTextField = (target: EventTarget | null): TextField | null => {
	if (typeof HTMLTextAreaElement !== 'undefined' && target instanceof HTMLTextAreaElement) return target;
	if (typeof HTMLInputElement !== 'undefined' && target instanceof HTMLInputElement && TEXT_INPUT_TYPES.includes(target.type)) {
		return target;
	}
	return null;
};

/**
 * Una opción del menú, con la forma que espera el menú del sistema (el
 * `MenuEntry` del complemento del menú contextual).
 */
export interface TextMenuEntry {
	id: TextAction;
	label: string;
	icon: string;
	accelerator: string;
}

/** Lo que el menú necesita saber del campo en el momento de abrirse. */
export interface TextMenuState {
	selection: string;
	range: TextRange;
	editable: boolean;
	/** Una contraseña no ofrece copiar ni cortar. */
	secret: boolean;
}

export const readTextMenuState = (field: TextField): TextMenuState => {
	// El tramo se guarda además del texto: al cortar hay que borrar exactamente
	// esto y no lo que esté seleccionado cuando la persona elija, que puede haber
	// cambiado mientras el menú estaba abierto.
	const range = { start: field.selectionStart ?? 0, end: field.selectionEnd ?? 0 };
	return {
		selection: field.value.slice(range.start, range.end),
		range,
		editable: !field.readOnly && !field.disabled,
		secret: (field as HTMLInputElement).type === 'password',
	};
};

/**
 * Las opciones que tiene sentido ofrecer, en orden.
 *
 * Sin selección no hay qué copiar; apagado o de sólo lectura no se corta ni se
 * pega; y una contraseña no debería poder salir al portapapeles con dos clics:
 * quedan pegar y seleccionar todo, que es para lo que alguien abre el menú
 * sobre un campo así. Seleccionar todo va siempre.
 */
export const textMenuEntries = (state: TextMenuState, label: (action: TextAction) => string): TextMenuEntry[] => {
	const canCopy = state.selection.length > 0 && !state.secret;
	const entries: TextMenuEntry[] = [];
	if (canCopy) entries.push({ id: 'copy', label: label('copy'), icon: 'edit-copy', accelerator: 'Ctrl+C' });
	if (canCopy && state.editable) entries.push({ id: 'cut', label: label('cut'), icon: 'edit-cut', accelerator: 'Ctrl+X' });
	if (state.editable) entries.push({ id: 'paste', label: label('paste'), icon: 'edit-paste', accelerator: 'Ctrl+V' });
	entries.push({ id: 'select-all', label: label('select-all'), icon: 'edit-select-all', accelerator: 'Ctrl+A' });
	return entries;
};

/**
 * Reemplaza un tramo del campo respetando a Vue.
 *
 * `setRangeText` cambia el valor sin que `v-model` se entere, así que hay que
 * avisar con un evento `input`: sin eso lo escrito se ve en pantalla y se
 * pierde al guardar.
 *
 * El tramo se puede pasar. Importa para cortar: entre que se abre el menú y se
 * elige, el campo puede haber cambiado —lo cambia el programa, o el foco se fue
 * y volvió—, y borrar «lo que esté seleccionado ahora» significaría borrar algo
 * distinto de lo que se copió.
 */
export const insertText = (field: TextField, text: string, range?: TextRange) => {
	const start = range?.start ?? field.selectionStart ?? field.value.length;
	const end = range?.end ?? field.selectionEnd ?? field.value.length;

	// `setRangeText` no mira `maxLength` —el tope es para lo que se escribe, no
	// para lo que pone un programa—, así que se recorta acá: pegar en un campo
	// de cuatro letras no puede dejar diez.
	const limit = field.maxLength;
	const fitted = limit > 0 ? text.slice(0, Math.max(0, limit - (field.value.length - (end - start)))) : text;

	field.focus();
	field.setRangeText(fitted, start, end, 'end');
	field.dispatchEvent(new Event('input', { bubbles: true }));
};

/** Devuelve si el texto llegó de verdad al portapapeles. */
export const copyText = async (clipboard: TextClipboard, text: string): Promise<boolean> => {
	try {
		await clipboard.write(text);
		return true;
	} catch (error) {
		console.warn('No se pudo copiar al portapapeles:', error);
		return false;
	}
};

/**
 * Si el campo todavía se puede tocar.
 *
 * Cortar y pegar esperan al portapapeles, y mientras tanto el campo puede
 * haberse apagado, vuelto de sólo lectura o salido de la página (se cerró el
 * diálogo). Escribir ahí sería cambiar algo que la persona ya no puede editar.
 */
const stillEditable = (field: TextField): boolean =>
	!field.readOnly && !field.disabled && (field as { isConnected?: boolean }).isConnected !== false;

export const runTextAction = async (
	action: TextAction,
	field: TextField,
	selection: string,
	clipboard: TextClipboard,
	/** Dónde estaba lo seleccionado cuando se abrió el menú. */
	range?: TextRange
): Promise<void> => {
	if (action === 'copy') {
		await copyText(clipboard, selection);
		return;
	}

	if (action === 'cut') {
		// Cortar es copiar y después borrar. Si la copia no llegó al portapapeles
		// no hay «después»: borrar ahí sería perder el texto sin dejar copia en
		// ningún lado. Se queda como estaba, que siempre se puede volver a probar.
		if ((await copyText(clipboard, selection)) && stillEditable(field)) insertText(field, '', range);
		return;
	}

	if (action === 'paste') {
		try {
			const text = await clipboard.read();

			// Con el portapapeles vacío no hay nada que pegar. Insertar la cadena
			// vacía sería reemplazar lo seleccionado por nada, o sea borrarlo.
			if (text && stillEditable(field)) insertText(field, text);
		} catch (error) {
			console.warn('No se pudo leer el portapapeles:', error);
		}
		return;
	}

	field.focus();
	field.select();
};
