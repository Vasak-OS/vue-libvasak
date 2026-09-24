/**
 * El de la bandeja que hace algo, y el que sólo informa.
 *
 * Este componente era siempre un `<div>` mudo: el que abre el panel del sonido
 * y el que sólo dice cuánta batería queda se dibujaban igual y se anunciaban
 * igual — es decir, **no se anunciaban**. Un `<div>` con `@click` no recibe
 * foco, no se activa con Enter, y un lector de pantalla no lo nombra; y el
 * dibujo es todo el contenido, así que aunque fuera un botón se anunciaría
 * vacío.
 *
 * La copia de `vasak-desktop` ya lo tenía resuelto y acá se sube, que es lo que
 * el Vasak-OS/vue-libvasak#22 pide hacer antes de borrar una copia.
 *
 * Ojo con la forma del arreglo: **no** es `role="button"` sobre el `<div>`. Un
 * `role` vuelve presentacionales a sus descendientes, y acá adentro hay una
 * ranura donde quien lo usa puede meter cualquier cosa. Un `<button>` nativo no
 * tiene ese problema.
 */

import { describe, expect, test } from 'bun:test';
import { mount } from '@vue/test-utils';
import TrayIconButton from '../src/tray/TrayIconButton.vue';

describe('el que hace algo', () => {
	test('es un botón de verdad, no un div con clic', () => {
		const vista = mount(TrayIconButton, { props: { name: 'audio-volume-high', alt: 'Sonido' } });

		expect(vista.element.tagName).toBe('BUTTON');
		expect(vista.attributes('type')).toBe('button');
	});

	test('y se llama como su `alt`', () => {
		// El dibujo es todo el contenido: sin nombre se anuncia «botón», a secas.
		const vista = mount(TrayIconButton, { props: { name: 'audio-volume-high', alt: 'Sonido' } });

		expect(vista.attributes('aria-label')).toBe('Sonido');
	});

	test('y si no tiene `alt`, como su tooltip', () => {
		const vista = mount(TrayIconButton, {
			props: { name: 'network-wireless', tooltip: 'Wi-Fi conectado' },
		});

		expect(vista.attributes('aria-label')).toBe('Wi-Fi conectado');
	});
});

describe('el que sólo informa', () => {
	test('no finge ser un botón', () => {
		// La batería, Bloq Mayús y el micrófono silenciado no hacen nada al
		// tocarlos: anunciarlos como botones promete un clic que no existe.
		const vista = mount(TrayIconButton, {
			props: { name: 'battery-good', alt: 'Batería', interactive: false },
		});

		expect(vista.element.tagName).toBe('DIV');
		expect(vista.attributes('aria-label')).toBeUndefined();
		expect(vista.attributes('type')).toBeUndefined();
	});

	test('ni se pinta al pasar el mouse', () => {
		const vista = mount(TrayIconButton, {
			props: { name: 'battery-good', interactive: false },
		});

		expect(vista.classes()).not.toContain('hover:bg-primary');
		expect(vista.classes()).not.toContain('cursor-pointer');
	});
});

describe('el contador', () => {
	test('usa el color del tema y no uno crudo', () => {
		// `text-white` no sigue al tema: sobre un primario claro queda ilegible.
		const vista = mount(TrayIconButton, { props: { name: 'mail-unread', badge: 3 } });
		const html = vista.html();

		expect(html).toContain('3');
		expect(html).not.toContain('text-white');
		expect(html).toContain('text-tx-on-primary');
	});
});
