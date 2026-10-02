/**
 * El menú del clic derecho sobre los campos de texto, que sube a la librería
 * en la 2.4.0 desde Configuración y el gestor de archivos.
 *
 * Las pruebas de las dos copias venían a mirar una sola cosa —qué le queda
 * escrito a quien usó el menú cuando el portapapeles no colabora— y siguen
 * acá, con lo que la copia del gestor sabía de más (cortar borra el tramo que
 * se copió). Se suma lo del componente: qué ofrece según el campo, y que no
 * dependa del complemento del menú.
 */

import { afterEach, describe, expect, test } from 'bun:test';
import { mount, type VueWrapper } from '@vue/test-utils';
import TextContextMenu from '../src/text/TextContextMenu.vue';
import {
	isTextAction,
	readTextMenuState,
	runTextAction,
	TEXT_INPUT_TYPES,
	type TextClipboard,
	type TextField,
	type TextMenuEntry,
	textMenuEntries,
	getTextField,
} from '../src/text/text-context-menu';
import { traducir, vaciarElCatalogo } from './dobles';

/** Un campo de texto de mentira, con lo justo que usa el menú. */
function fakeField(value: string, start: number, end: number, extra: Partial<HTMLInputElement> = {}): TextField {
	return {
		value,
		selectionStart: start,
		selectionEnd: end,
		readOnly: false,
		disabled: false,
		maxLength: -1,
		type: 'text',
		focus() {},
		select() {},
		setRangeText(text: string, from: number, to: number) {
			this.value = this.value.slice(0, from) + text + this.value.slice(to);
		},
		dispatchEvent() {
			return true;
		},
		...extra,
	} as unknown as TextField;
}

function fakeClipboard(options: { content?: string | null; writeFails?: boolean; readFails?: boolean }): TextClipboard & {
	written: string[];
} {
	const written: string[] = [];
	return {
		written,
		read: async () => {
			if (options.readFails) throw new Error('el portapapeles no contesta');
			return options.content ?? null;
		},
		write: async (text: string) => {
			if (options.writeFails) throw new Error('el portapapeles no contesta');
			written.push(text);
		},
	};
}

describe('cortar', () => {
	test('no borra la selección si el texto no llegó al portapapeles', async () => {
		const field = fakeField('hola mundo', 0, 4);
		const clipboard = fakeClipboard({ writeFails: true });

		await runTextAction('cut', field, 'hola', clipboard);

		expect(field.value).toBe('hola mundo');
		expect(clipboard.written).toEqual([]);
	});

	test('borra la selección cuando la copia funcionó', async () => {
		const field = fakeField('hola mundo', 0, 5);
		const clipboard = fakeClipboard({});

		await runTextAction('cut', field, 'hola ', clipboard);

		expect(field.value).toBe('mundo');
		expect(clipboard.written).toEqual(['hola ']);
	});

	test('borra lo que se copió, aunque la selección haya cambiado mientras el menú estaba abierto', async () => {
		const field = fakeField('hola mundo', 0, 4);
		const range = { start: 0, end: 4 };
		field.selectionStart = 5;
		field.selectionEnd = 10;

		await runTextAction('cut', field, 'hola', fakeClipboard({}), range);

		expect(field.value).toBe(' mundo');
	});
});

describe('lo que cambió mientras se esperaba al portapapeles', () => {
	test('pegar respeta maxLength', async () => {
		const field = fakeField('abc', 3, 3, { maxLength: 4 });

		await runTextAction('paste', field, '', fakeClipboard({ content: 'def' }));

		expect(field.value).toBe('abcd');
	});

	test('pegar reemplazando lo seleccionado cuenta lo que se va', async () => {
		const field = fakeField('abcd', 0, 2, { maxLength: 4 });

		await runTextAction('paste', field, 'ab', fakeClipboard({ content: 'xyz' }));

		expect(field.value).toBe('xycd');
	});

	test('si el campo se apagó o se fue, ni cortar ni pegar lo tocan', async () => {
		const off = fakeField('hola', 0, 4, { disabled: true });
		await runTextAction('paste', off, 'hola', fakeClipboard({ content: 'chau' }));
		expect(off.value).toBe('hola');

		const gone = fakeField('hola', 0, 4, { isConnected: false } as Partial<HTMLInputElement>);
		const clipboard = fakeClipboard({});
		await runTextAction('cut', gone, 'hola', clipboard);
		expect(gone.value).toBe('hola');
		// Lo copiado sí llegó: copiar no toca el campo.
		expect(clipboard.written).toEqual(['hola']);
	});
});

describe('copiar', () => {
	test('deja el campo intacto aunque el portapapeles falle', async () => {
		const field = fakeField('hola mundo', 0, 4);

		await runTextAction('copy', field, 'hola', fakeClipboard({ writeFails: true }));

		expect(field.value).toBe('hola mundo');
	});
});

describe('pegar', () => {
	test('con el portapapeles vacío no borra lo seleccionado', async () => {
		const field = fakeField('hola mundo', 0, 4);

		await runTextAction('paste', field, 'hola', fakeClipboard({ content: null }));

		expect(field.value).toBe('hola mundo');
	});

	test('con el portapapeles ilegible no borra lo seleccionado', async () => {
		const field = fakeField('hola mundo', 0, 4);

		await runTextAction('paste', field, 'hola', fakeClipboard({ readFails: true }));

		expect(field.value).toBe('hola mundo');
	});

	test('reemplaza la selección cuando hay texto', async () => {
		const field = fakeField('hola mundo', 0, 4);

		await runTextAction('paste', field, 'hola', fakeClipboard({ content: 'chau' }));

		expect(field.value).toBe('chau mundo');
	});
});

describe('los campos que aceptan el menú', () => {
	test('deja afuera los tipos donde la selección tira InvalidStateError', () => {
		expect(TEXT_INPUT_TYPES).not.toContain('number');
		expect(TEXT_INPUT_TYPES).not.toContain('email');
		expect(TEXT_INPUT_TYPES).toEqual(expect.arrayContaining(['text', 'search', 'password', 'url', 'tel']));
	});

	test('reconoce un input de texto y un textarea, y nada más', () => {
		const text = document.createElement('input');
		const number = document.createElement('input');
		number.type = 'number';

		expect(getTextField(text)).toBe(text);
		expect(getTextField(document.createElement('textarea'))).not.toBeNull();
		expect(getTextField(number)).toBeNull();
		expect(getTextField(document.createElement('div'))).toBeNull();
		expect(getTextField(null)).toBeNull();
	});

	test('sólo reconoce las acciones que sabe hacer', () => {
		expect(isTextAction('paste')).toBe(true);
		expect(isTextAction('select-all')).toBe(true);
		expect(isTextAction('format-disk')).toBe(false);
	});
});

describe('qué ofrece', () => {
	const label = (action: string) => action;

	test('con selección en un campo editable, las cuatro', () => {
		const state = readTextMenuState(fakeField('hola mundo', 0, 4));

		expect(textMenuEntries(state, label).map((entry) => entry.id)).toEqual(['copy', 'cut', 'paste', 'select-all']);
	});

	test('sin selección no hay qué copiar ni cortar', () => {
		const state = readTextMenuState(fakeField('hola', 2, 2));

		expect(textMenuEntries(state, label).map((entry) => entry.id)).toEqual(['paste', 'select-all']);
	});

	test('de sólo lectura se copia pero no se corta ni se pega', () => {
		const state = readTextMenuState(fakeField('hola', 0, 4, { readOnly: true }));

		expect(textMenuEntries(state, label).map((entry) => entry.id)).toEqual(['copy', 'select-all']);
	});

	test('una contraseña no sale al portapapeles con dos clics', () => {
		const state = readTextMenuState(fakeField('secreto', 0, 7, { type: 'password' }));

		expect(textMenuEntries(state, label).map((entry) => entry.id)).toEqual(['paste', 'select-all']);
	});

	test('cada opción lleva el icono del tema y su atajo', () => {
		const entries = textMenuEntries(readTextMenuState(fakeField('hola', 0, 4)), label);

		expect(entries.find((entry) => entry.id === 'copy')).toEqual({ id: 'copy', label: 'copy', icon: 'edit-copy', accelerator: 'Ctrl+C' });
		expect(entries.find((entry) => entry.id === 'select-all')?.icon).toBe('edit-select-all');
	});
});

describe('el componente', () => {
	let view: VueWrapper | null = null;
	afterEach(() => {
		view?.unmount();
		view = null;
		vaciarElCatalogo();
		document.body.innerHTML = '';
	});

	function setup(choice: string | null, clipboard: TextClipboard = fakeClipboard({ content: 'pegado' })) {
		const shown: TextMenuEntry[][] = [];
		view = mount(TextContextMenu, {
			props: {
				show: async (entries: TextMenuEntry[]) => {
					shown.push(entries);
					return choice ? { id: choice } : null;
				},
				clipboard,
			},
			attachTo: document.body,
		});
		return shown;
	}

	const settle = () => new Promise((done) => setTimeout(done, 0));

	test('no dibuja nada', () => {
		setup(null);

		expect(view?.html() ?? '').toBe('');
	});

	test('sobre un campo ofrece el menú con los nombres del catálogo o en inglés', async () => {
		traducir('textMenu.paste', 'Pegar');
		const shown = setup(null);
		const input = document.createElement('input');
		document.body.append(input);
		input.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true }));
		await settle();

		expect(shown[0]?.map((entry) => entry.label)).toEqual(['Pegar', 'Select all']);
	});

	test('fuera de un campo no ofrece nada', async () => {
		const shown = setup(null);
		document.body.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true }));
		await settle();

		expect(shown).toEqual([]);
	});

	test('lo elegido se hace en el campo y Vue se entera', async () => {
		setup('paste');
		const input = document.createElement('input');
		input.value = 'hola';
		document.body.append(input);
		input.setSelectionRange(4, 4);
		let heard = 0;
		input.addEventListener('input', () => {
			heard += 1;
		});
		input.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true }));
		await settle();
		await settle();

		expect(input.value).toBe('holapegado');
		expect(heard).toBe(1);
	});

	test('al desmontarse deja de escuchar', async () => {
		const shown = setup(null);
		view?.unmount();
		view = null;
		const input = document.createElement('input');
		document.body.append(input);
		input.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true }));
		await settle();

		expect(shown).toEqual([]);
	});
});
