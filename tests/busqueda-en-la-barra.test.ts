/**
 * La búsqueda de la barra, que se despliega.
 *
 * Con la barra a un costado hay cuarenta y ocho píxeles de ancho: un campo de
 * texto ahí no se puede ni leer ni escribir. Plegado queda la lupa, y el campo
 * sale al lado de la barra cuando se lo pide.
 */

import { beforeEach, describe, expect, test } from 'bun:test';
import { mount } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import BarSearch from '../src/bar/BarSearch.vue';
import WindowFrame from '../src/window/WindowFrame.vue';
import { olvidarTodo } from './dobles';

function enLaVentana(position: 'top' | 'bottom' | 'left' | 'right', props = {}) {
	return mount(WindowFrame, {
		props: { position },
		slots: { barra: () => h(BarSearch, { label: 'Buscar', ...props }) },
	});
}

beforeEach(() => {
	olvidarTodo();
});

describe('con la barra arriba', () => {
	test('el campo está a la vista', () => {
		const vista = enLaVentana('top');

		expect(vista.find('input[type="search"]').exists()).toBe(true);
		// Y sin lupa que apretar: ya se puede escribir.
		expect(vista.find('button[aria-label="Buscar"]').exists()).toBe(false);
	});

	test('salvo que la aplicación pida plegarlo', () => {
		// Una barra con pestañas, acciones y un campo de doscientos píxeles se
		// queda sin lugar para las pestañas antes de lo que parece.
		const vista = enLaVentana('top', { collapsed: true });

		expect(vista.find('input[type="search"]').exists()).toBe(false);
		expect(vista.find('button[aria-label="Buscar"]').exists()).toBe(true);
	});
});

describe('con la barra a un costado', () => {
	test('queda la lupa, sin campo', async () => {
		const vista = enLaVentana('left');
		await nextTick();

		expect(vista.find('input[type="search"]').exists()).toBe(false);
		const lupa = vista.find('button[aria-label="Buscar"]');
		expect(lupa.exists()).toBe(true);
		expect(lupa.attributes('aria-expanded')).toBe('false');
	});

	test('y al apretarla el campo se abre', async () => {
		const vista = enLaVentana('left');
		await nextTick();

		await vista.find('button[aria-label="Buscar"]').trigger('click');

		expect(vista.find('input[type="search"]').exists()).toBe(true);
		expect(vista.find('button[aria-label="Buscar"]').attributes('aria-expanded')).toBe('true');
		expect(vista.findComponent(BarSearch).emitted('open')).toHaveLength(1);
	});

	test('el campo sale del lado que tiene lugar', async () => {
		// Con la barra a la izquierda el campo va a su derecha, y al revés. Del
		// otro lado estaría fuera de la ventana.
		for (const [posicion, clase] of [
			['left', 'left-full'],
			['right', 'right-full'],
		] as const) {
			const vista = enLaVentana(posicion);
			await nextTick();
			await vista.find('button[aria-label="Buscar"]').trigger('click');

			// Se busca el panel por su clase y no por el padre inmediato: el campo
			// vive dentro de `SearchField`, así que entre el `input` y el panel hay
			// un nivel más.
			const panel = vista.find('input[type="search"]').element.closest('.z-40');
			expect(panel?.className).toContain(clase);
			vista.unmount();
		}
	});

	test('la lupa también lo cierra, con el foco adentro', async () => {
		// La carrera: al apretar la lupa con el campo enfocado, el navegador
		// mueve el foco en el `mousedown` —lo que dispara el `blur`, que
		// cierra— y recién después llega el `click`, que volvía a abrir. El
		// botón no podía plegar nunca.
		//
		// Se reproduce a mano porque el foco no se mueve solo en las pruebas:
		// si el `mousedown` no viene cancelado, el navegador lo movería, así
		// que se dispara el `blur`.
		const vista = enLaVentana('left');
		await nextTick();
		const lupa = vista.find('button[aria-label="Buscar"]');
		await lupa.trigger('click');
		expect(vista.find('input[type="search"]').exists()).toBe(true);

		const apretar = new MouseEvent('mousedown', { cancelable: true, bubbles: true });
		lupa.element.dispatchEvent(apretar);
		if (!apretar.defaultPrevented) {
			await vista.find('input[type="search"]').trigger('blur');
		}
		await lupa.trigger('click');

		expect(vista.find('input[type="search"]').exists()).toBe(false);
	});

	test('Escape lo cierra', async () => {
		// Un campo abierto encima del contenido tapa justo lo que se busca.
		const vista = enLaVentana('left');
		await nextTick();
		await vista.find('button[aria-label="Buscar"]').trigger('click');

		await vista.find('input[type="search"]').trigger('keydown.esc');

		expect(vista.find('input[type="search"]').exists()).toBe(false);
		expect(vista.findComponent(BarSearch).emitted('close')).toHaveLength(1);
	});
});
