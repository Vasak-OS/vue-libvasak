/**
 * El filtro de `SelectField` aparece sólo con listas largas (vue-libvasak#115).
 * Umbral: 8 opciones. Debajo, el desplegable sigue sin campo de búsqueda.
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mount, type VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import SelectField from '../src/forms/SelectField.vue';
import { olvidarTodo } from './dobles';

const vistas: VueWrapper[] = [];
const NOMBRES = ['Argentina', 'Bolivia', 'Chile', 'Dinamarca', 'Ecuador', 'Francia', 'Grecia', 'Hungría', 'Italia'];

async function abierto(cantidad: number) {
	const vista = mount(SelectField, {
		props: { modelValue: '', options: NOMBRES.slice(0, cantidad), label: 'País' },
		attachTo: document.body,
	});
	vistas.push(vista);
	await vista.get('button').trigger('click');
	await nextTick();
	return vista;
}

beforeEach(() => olvidarTodo());
afterEach(() => {
	for (const vista of vistas.splice(0)) vista.unmount();
	document.body.innerHTML = '';
});

describe('filtro automático de SelectField', () => {
	test('con 7 opciones no hay campo de búsqueda', async () => {
		const vista = await abierto(7);
		expect(vista.findAll('[role="option"]')).toHaveLength(7);
		expect(vista.find('input').exists()).toBe(false);
	});

	test('con 8 opciones aparece el campo y filtra al escribir', async () => {
		const vista = await abierto(8);
		const campo = vista.find('input');
		expect(campo.exists()).toBe(true);
		expect(vista.findAll('[role="option"]')).toHaveLength(8);
		await campo.setValue('boli');
		await nextTick();
		const visibles = vista.findAll('[role="option"]').map((o) => o.text());
		expect(visibles.length).toBeLessThan(8);
		expect(visibles.join(' ')).toContain('Bolivia');
	});

	test('elegir con el clic actualiza el v-model', async () => {
		const vista = await abierto(8);
		await vista.findAll('[role="option"]')[2].trigger('click');
		expect(vista.emitted('update:modelValue')?.[0]).toEqual(['Chile']);
	});
});
