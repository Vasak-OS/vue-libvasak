/**
 * El selector que respeta el tema.
 *
 * El `select` nativo de WebKit se dibuja solo —pinta su propio fondo blanco y
 * su propio texto— y las clases de color no lo tocan: en una ventana oscura eso
 * deja texto claro sobre blanco, ilegible. Estaba copiado en vasak-monitor y en
 * vasak-settings con dos nombres distintos.
 */

import { beforeEach, describe, expect, test } from 'bun:test';
import { mount } from '@vue/test-utils';
import SelectField from '../src/forms/SelectField.vue';
import { olvidarTodo } from './dobles';

beforeEach(() => {
	olvidarTodo();
});

describe('el dibujo nativo', () => {
	test('está apagado, y por eso hay flecha propia', async () => {
		// Apagar `appearance` se lleva también la flecha del sistema: sin una
		// puesta a mano, el control deja de parecer un desplegable.
		const campo = mount(SelectField, {
			props: { modelValue: 'a' },
			slots: { default: '<option value="a">A</option>' },
		});

		expect(campo.get('select').classes()).toContain('appearance-none');
		expect(campo.find('img, span').exists()).toBe(true);
	});

	test('usa los colores del tema y no los del sistema', async () => {
		const campo = mount(SelectField, { props: { modelValue: 'a' } });

		const clases = campo.get('select').classes().join(' ');
		expect(clases).toContain('bg-ui-surface');
		expect(clases).toContain('text-tx-main');
		expect(clases).toContain('border-ui-border');
	});
});

describe('lo que se elige', () => {
	test('sale como el valor elegido', async () => {
		const campo = mount(SelectField, {
			props: { modelValue: 'a' },
			slots: { default: '<option value="a">A</option><option value="b">B</option>' },
		});

		await campo.get('select').setValue('b');

		expect(campo.emitted('update:modelValue')).toEqual([['b']]);
	});

	test('y con `.number` sale como número', async () => {
		// El contrato: quien escribe `v-model.number` recibe un número. Lo que
		// esta prueba **no** aísla es de dónde sale la conversión: el `set` del
		// componente recibe la cadena `'5000'` con los modificadores puestos,
		// pero Vue aplica el modificador por su cuenta en el camino de salida,
		// así que el resultado es el mismo con la conversión manual y sin ella
		// —se comprobó quitándola—. La conversión queda porque el comentario que
		// venía con el componente dice que hizo falta, y sacarla para ver si hoy
		// duele es un experimento para otro momento.
		const campo = mount(SelectField, {
			props: { modelValue: 1000, modelModifiers: { number: true } },
			slots: { default: '<option value="1000">1 s</option><option value="5000">5 s</option>' },
		});

		await campo.get('select').setValue('5000');

		expect(campo.emitted('update:modelValue')).toEqual([[5000]]);
	});
});

describe('los atributos', () => {
	test('van al `select` y no al contenedor', async () => {
		// Colgados de un `div`, un `@change` o un `aria-label` no hacen nada.
		const campo = mount(SelectField, {
			props: { modelValue: 'a' },
			attrs: { 'aria-label': 'Cada cuánto medir', name: 'intervalo' },
		});

		const select = campo.get('select');
		expect(select.attributes('aria-label')).toBe('Cada cuánto medir');
		expect(select.attributes('name')).toBe('intervalo');
		expect(campo.get('div').attributes('aria-label')).toBeUndefined();
	});
});
