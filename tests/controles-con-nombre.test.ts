/**
 * Los tres controles del centro de control dicen qué son.
 *
 * El botón que alterna el Wi-Fi, el deslizador del volumen y el interruptor
 * tenían el mismo hueco: el primero y el segundo son un `<button>` o un
 * `<input>` cuyo único contenido es un icono, y el icono iba con un `alt` que
 * por omisión era la cadena vacía. O sea que por omisión **no tenían nombre**:
 * un lector de pantalla decía «botón» y «control deslizante, 47».
 *
 * Las copias de vasak-desktop ya lo habían tapado, cada una por su cuenta. Lo
 * que se comprueba acá es eso —lo que no se ve y se pierde callado— más el
 * anillo de foco, que quien usaba el interruptor se agregaba por fuera.
 */

import { describe, expect, test } from 'bun:test';
import { mount } from '@vue/test-utils';
import SliderControl from '../src/forms/SliderControl.vue';
import SwitchRow from '../src/forms/SwitchRow.vue';
import SwitchToggle from '../src/forms/SwitchToggle.vue';
import ToggleControl from '../src/controls/ToggleControl.vue';

describe('el botón que alterna', () => {
	test('tiene nombre, que un icono no puede dar', () => {
		const vista = mount(ToggleControl, { props: { icon: 'x.svg', label: 'Wi-Fi' } });

		expect(vista.attributes('aria-label')).toBe('Wi-Fi');
		expect(vista.attributes('title')).toBe('Wi-Fi');
	});

	test('y su icono no se lee, para no decir lo mismo dos veces', () => {
		const vista = mount(ToggleControl, { props: { icon: 'x.svg', label: 'Wi-Fi' } });

		expect(vista.find('img').attributes('alt')).toBe('');
	});

	test('dice si está encendido cuando de verdad alterna algo', () => {
		const encendido = mount(ToggleControl, { props: { icon: 'x.svg', label: 'Wi-Fi', pressed: true } });
		const apagado = mount(ToggleControl, { props: { icon: 'x.svg', label: 'Wi-Fi', pressed: false } });

		expect(encendido.attributes('aria-pressed')).toBe('true');
		expect(apagado.attributes('aria-pressed')).toBe('false');
	});

	test('y no lo dice cuando abre un panel en vez de alternar', () => {
		// Ahí `aria-pressed` mentiría: diría «no presionado» sobre algo que no
		// tiene dos estados. Es criterio, y por eso `pressed` es opcional.
		const vista = mount(ToggleControl, { props: { icon: 'x.svg', label: 'Red' } });

		expect(vista.attributes('aria-pressed')).toBeUndefined();
	});

	test('mientras carga lo dice, y no se puede apretar', () => {
		const vista = mount(ToggleControl, { props: { icon: 'x.svg', label: 'Wi-Fi', isLoading: true } });

		expect(vista.attributes('aria-busy')).toBe('true');
		expect(vista.attributes('disabled')).toBeDefined();
	});
});

describe('el deslizador', () => {
	const armar = (props: Record<string, unknown> = {}) =>
		mount(SliderControl, { props: { icon: 'x.svg', label: 'Volumen', modelValue: 47, ...props } });

	test('dice qué regula', () => {
		// Sin esto se anuncia «control deslizante, 47» y nada más.
		expect(armar().find('input[type="range"]').attributes('aria-label')).toBe('Volumen');
	});

	test('y el número lleva su unidad', () => {
		// 47 no dice nada; «47%» sí.
		expect(armar().find('input[type="range"]').attributes('aria-valuetext')).toBe('47%');
	});

	test('su botón también tiene nombre', () => {
		const vista = armar({ showButton: true });

		expect(vista.find('button').attributes('aria-label')).toBe('Volumen');
	});

	test('y puede tener uno propio, porque silenciar no es regular', () => {
		const vista = armar({ showButton: true, buttonLabel: 'Silenciar' });

		expect(vista.find('button').attributes('aria-label')).toBe('Silenciar');
	});

	test('el icono no se lee: el control ya tiene nombre', () => {
		expect(armar({ showButton: true }).find('img').attributes('alt')).toBe('');
	});
});

describe('el foco se ve', () => {
	test('en el interruptor', () => {
		// Sin anillo, recorrer con Tab es a ciegas. Quien lo usaba en el
		// escritorio se lo agregaba por fuera con una clase suelta.
		const vista = mount(SwitchToggle, { props: { modelValue: false, label: 'Wi-Fi' } });

		expect(vista.attributes('class')).toContain('focus-visible:ring');
	});

	test('en la fila entera', () => {
		const vista = mount(SwitchRow, { props: { modelValue: false, label: 'Wi-Fi' } });

		expect(vista.attributes('class')).toContain('focus-visible:ring');
	});

	test('y en el botón que alterna', () => {
		const vista = mount(ToggleControl, { props: { icon: 'x.svg', label: 'Wi-Fi' } });

		expect(vista.attributes('class')).toContain('focus-visible:ring');
	});
});
