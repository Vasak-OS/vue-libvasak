/**
 * El interruptor.
 *
 * Lo que publicaba la librería era un `<button>` pelado con un círculo adentro:
 * se anunciaba como «botón» y **no decía si estaba encendido o apagado**, que
 * es la única información que este control transmite. No tenía ninguna prueba,
 * que es parte de cómo llegó hasta acá así.
 *
 * El escritorio y la configuración le habían agregado `role="switch"`,
 * `aria-checked` y una etiqueta, cada uno por su lado. Lo que se comprueba acá
 * es eso —lo que no se ve y se pierde callado— y el contraste del pulgar, que
 * es lo que hace que **se vea** en qué estado está.
 */

import { describe, expect, test } from 'bun:test';
import { mount } from '@vue/test-utils';
import SwitchToggle from '../src/forms/SwitchToggle.vue';
import SwitchTrack from '../src/forms/SwitchTrack.vue';

const armar = (props: Record<string, unknown> = {}) =>
	mount(SwitchToggle, { props: { modelValue: false, label: 'Wi-Fi', ...props } });

describe('el interruptor', () => {
	test('se anuncia como interruptor y dice en qué estado está', () => {
		// Un `<button>` a secas se anuncia «botón» y nada más: quien no ve la
		// pantalla no tiene forma de saber si está encendido.
		const apagado = armar();
		const encendido = armar({ modelValue: true });

		expect(apagado.attributes('role')).toBe('switch');
		expect(apagado.attributes('aria-checked')).toBe('false');
		expect(encendido.attributes('aria-checked')).toBe('true');
	});

	test('y tiene nombre, que es lo que un círculo no puede dar', () => {
		const vista = armar({ label: 'Wi-Fi' });

		expect(vista.attributes('aria-label')).toBe('Wi-Fi');
	});

	test('el clic avisa del valor contrario', async () => {
		const vista = armar({ modelValue: false });

		await vista.trigger('click');

		expect(vista.emitted('update:modelValue')?.[0]).toEqual([true]);
	});

	test('y desde encendido avisa apagado', async () => {
		const vista = armar({ modelValue: true });

		await vista.trigger('click');

		expect(vista.emitted('update:modelValue')?.[0]).toEqual([false]);
	});

	test('apagado no se puede tocar', async () => {
		const vista = armar({ disabled: true });

		expect(vista.attributes('disabled')).toBeDefined();
		await vista.trigger('click');

		expect(vista.emitted('update:modelValue')).toBeUndefined();
	});

	test('es un botón de verdad, así que el teclado lo alcanza solo', () => {
		// Con un `div` y un `@click` haría falta `tabindex` y un manejador de
		// teclas a mano, y lo segundo se olvida.
		const vista = armar();

		expect(vista.element.tagName).toBe('BUTTON');
		expect(vista.attributes('type')).toBe('button');
	});
});

describe('la pista, que es lo que se ve', () => {
	test('el pulgar cambia de color con el estado', () => {
		// Con `bg-white` fijo el pulgar daba 1,54 de contraste sobre la vía
		// apagada en modo claro —contra el mínimo de 3,0 de WCAG 1.4.11—, así
		// que no se percibía si estaba encendido. Lo encontró el escritorio.
		const apagado = mount(SwitchTrack, { props: { on: false } });
		const encendido = mount(SwitchTrack, { props: { on: true } });

		const pulgar = (v: typeof apagado) => v.find('span span').attributes('class') ?? '';
		expect(pulgar(apagado)).toContain('bg-tx-main');
		expect(pulgar(encendido)).toContain('bg-tx-on-primary');
		expect(pulgar(encendido)).not.toContain('bg-white');
	});

	test('y la vía también', () => {
		const apagado = mount(SwitchTrack, { props: { on: false } });
		const encendido = mount(SwitchTrack, { props: { on: true } });

		expect(apagado.attributes('class')).toContain('bg-ui-surface');
		expect(encendido.attributes('class')).toContain('bg-primary');
	});

	test('no se lee: lo que se anuncia es el botón que la contiene', () => {
		// Sin esto un lector de pantalla diría dos veces la misma cosa.
		const vista = mount(SwitchTrack, { props: { on: true } });

		expect(vista.attributes('aria-hidden')).toBe('true');
	});

	test('el tamaño cambia la vía y el pulgar, no sólo uno', () => {
		// Un pulgar que no acompaña se sale de su vía o le deja un hueco.
		const chico = mount(SwitchTrack, { props: { on: false, size: 'small' } });
		const grande = mount(SwitchTrack, { props: { on: false, size: 'medium' } });

		expect(chico.attributes('class')).toContain('h-6');
		expect(grande.attributes('class')).toContain('h-7');
		expect(chico.find('span span').attributes('class')).toContain('h-4');
		expect(grande.find('span span').attributes('class')).toContain('h-5');
	});

	test('y sigue al tamaño si cambia después de montado', () => {
		// Estaba calculado una sola vez en el montaje, así que no reaccionaba.
		const vista = mount(SwitchTrack, { props: { on: false, size: 'small' } });

		vista.setProps({ size: 'medium' });

		return vista.vm.$nextTick().then(() => {
			expect(vista.attributes('class')).toContain('h-7');
		});
	});
});
