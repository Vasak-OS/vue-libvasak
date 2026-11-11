/**
 * Elegir una opción con el ratón en el desplegable con búsqueda
 * (vasak-installer#91).
 *
 * El `mousedown` sobre una opción le sacaba el foco al campo de búsqueda; el
 * `focusout` cerraba el panel antes del `click` y la opción nunca se aplicaba.
 * El arreglo cancela el `mousedown` sólo sobre una fila de opción. `happy-dom`
 * no replica el traspaso de foco del navegador, así que lo que se comprueba es
 * el efecto real y determinista: `defaultPrevented`.
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mount, type VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import SearchSelect from '../src/search/SearchSelect.vue';
import { olvidarTodo } from './dobles';

const OPCIONES = [
	{ valor: 'a', etiqueta: 'Argentina' },
	{ valor: 'b', etiqueta: 'Bolivia' },
];

const vistas: VueWrapper[] = [];
async function abierto() {
	const vista = mount(SearchSelect, {
		props: { modelValue: '', options: OPCIONES, label: 'País', searchable: true },
		attachTo: document.body,
	});
	vistas.push(vista);
	await vista.get('button').trigger('click');
	await nextTick();
	return vista;
}

/** Despacha un `mousedown` cancelable y dice si alguien lo canceló. */
function mousedownCancelado(el: Element) {
	const evento = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
	el.dispatchEvent(evento);
	return evento.defaultPrevented;
}

beforeEach(() => olvidarTodo());
afterEach(() => {
	for (const vista of vistas.splice(0)) vista.unmount();
	document.body.innerHTML = '';
});

describe('elegir con el ratón', () => {
	test('apretar sobre una opción no le saca el foco al campo', async () => {
		const vista = await abierto();
		expect(mousedownCancelado(vista.findAll('[role="option"]')[1].element)).toBe(true);
	});

	test('apretar sobre el texto de una opción tampoco', async () => {
		const vista = await abierto();
		expect(mousedownCancelado(vista.findAll('[role="option"] span')[0].element)).toBe(true);
	});

	test('apretar sobre el campo de búsqueda sigue su curso normal', async () => {
		const vista = await abierto();
		expect(mousedownCancelado(vista.get('input').element)).toBe(false);
	});

	test('apretar fuera de las opciones, en el panel, no se cancela', async () => {
		const vista = await abierto();
		expect(mousedownCancelado(vista.get('[role="listbox"]').element)).toBe(false);
	});

	test('el clic sobre una opción emite el valor elegido', async () => {
		const vista = await abierto();
		await vista.findAll('[role="option"]')[1].trigger('click');
		expect(vista.emitted('update:modelValue')?.[0]).toEqual(['b']);
	});
});
