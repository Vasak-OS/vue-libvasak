/**
 * Lo que la copia de `vasak-desktop` sabía y esta no.
 *
 * `DeviceCard` estaba exportada y **no la usaba nadie**: el escritorio tenía la
 * suya y `vasak-settings` dibuja su tarjeta de Bluetooth a mano. Mientras
 * tanto, la copia del escritorio le fue sacando ventaja — y esta versión se
 * quedó con cosas que ninguna aplicación puede dibujar bien:
 *
 * - `text-gray-400`, `border-green-500` y `bg-green-500`, que son colores
 *   crudos de Tailwind y no siguen el tema de la persona;
 * - `actionLabel: 'Conectar'`, un literal en **español** adentro de una
 *   librería que usan seis aplicaciones;
 * - ningún teclado: la fila se abría sólo con el mouse;
 * - `clickable` declarada y sin usar, así que emitía siempre.
 *
 * Como no la importaba nadie, cambiar la forma de `extraInfo` no rompe a nadie:
 * se aprovechó para aceptar las dos.
 */

import { describe, expect, test } from 'bun:test';
import { mount } from '@vue/test-utils';
import DeviceCard from '../src/cards/DeviceCard.vue';

const base = { title: 'Auriculares', name: 'audio-headphones' };

describe('la fila del dispositivo', () => {
	test('se enfoca y se abre con el teclado cuando hace algo', async () => {
		const vista = mount(DeviceCard, { props: { ...base, clickable: true } });

		expect(vista.attributes('role')).toBe('button');
		expect(vista.attributes('tabindex')).toBe('0');
		// El nombre accesible: sin él se anuncia «botón» y nada más.
		expect(vista.attributes('aria-label')).toBe('Auriculares');

		await vista.trigger('keydown.enter');
		await vista.trigger('keydown.space');
		expect(vista.emitted('click')).toHaveLength(2);
	});

	test('y no cuando la tecla viene del botón de la acción', async () => {
		// La tecla apretada sobre el botón de adentro burbujea hasta la fila.
		const vista = mount(DeviceCard, {
			props: { ...base, clickable: true, actionLabel: 'Conectar' },
		});

		await vista.find('button').trigger('keydown.enter');

		expect(vista.emitted('click')).toBeUndefined();
	});

	test('la que no es clickeable no finge que sí, ni emite', async () => {
		const vista = mount(DeviceCard, { props: base });

		expect(vista.attributes('role')).toBeUndefined();
		expect(vista.attributes('tabindex')).toBeUndefined();

		await vista.trigger('click');
		expect(vista.emitted('click')).toBeUndefined();
	});
});

describe('el botón de la acción', () => {
	test('dice lo que le pasan, y nada si no le pasan nada', () => {
		// Un literal en español metido acá adentro es un texto que ninguna de
		// las seis aplicaciones puede traducir.
		const vista = mount(DeviceCard, { props: { ...base, actionLabel: 'Connect' } });

		expect(vista.find('button').text()).toBe('Connect');
	});

	test('se deshabilita y cambia de texto mientras la acción corre', () => {
		const vista = mount(DeviceCard, {
			props: { ...base, actionLabel: 'Conectar', connectingLabel: 'Conectando…', isConnecting: true },
		});

		expect(vista.find('button').text()).toBe('Conectando…');
		expect(vista.find('button').attributes('disabled')).toBeDefined();
	});
});

describe('los datos extra', () => {
	test('aceptan una cadena suelta, que es lo que recibían antes', () => {
		const vista = mount(DeviceCard, { props: { ...base, extraInfo: ['48 %', 'A2DP'] } });

		expect(vista.text()).toContain('48 %');
		expect(vista.text()).toContain('A2DP');
	});

	test('y una cadena con su icono', () => {
		const vista = mount(DeviceCard, {
			props: { ...base, extraInfo: [{ icon: 'battery-good', text: '48 %' }] },
		});

		expect(vista.text()).toContain('48 %');
		// El icono del dato, además del de la tarjeta.
		expect(vista.findAll('img, span[class*="shrink-0"]').length).toBeGreaterThan(1);
	});
});

describe('los colores siguen al tema', () => {
	test('ni gris ni verde crudos de Tailwind', () => {
		// Un color crudo no sigue el tema de la persona: en oscuro queda igual.
		const vista = mount(DeviceCard, {
			props: { ...base, isConnected: true, showStatusIndicator: true, subtitle: 'algo' },
		});
		const html = vista.html();

		expect(html).not.toContain('text-gray-400');
		expect(html).not.toContain('green-500');
		expect(html).toContain('text-tx-muted');
		expect(html).toContain('status-success');
	});
});
