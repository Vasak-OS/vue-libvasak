/**
 * Las dos piezas de la 2.5.0, que pidió el reproductor desplegable del
 * escritorio (vasak-desktop#131): la pastilla de la salida de audio y de la
 * aplicación de origen, y los puntos para pasar de un reproductor a otro.
 *
 * Lo que se fija es lo que se rompe sin que nada falle: una pastilla que
 * informa y se anuncia como botón, un nombre largo que la parte en dos
 * renglones, un punto suelto cuando no hay nada que elegir, o unos puntos que
 * se eligen con el mouse y no con el teclado.
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mount, type VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import PageDots from '../src/controls/PageDots.vue';
import Chip from '../src/indicators/Chip.vue';
import { olvidarTodo, vaciarElCatalogo } from './dobles';

const views: VueWrapper[] = [];
function render<T>(component: T, options: Record<string, unknown> = {}) {
	// biome-ignore lint/suspicious/noExplicitAny: el tipo del componente lo decide quien llama.
	const view = mount(component as any, { attachTo: document.body, ...options });
	views.push(view);
	return view;
}

beforeEach(() => {
	olvidarTodo();
	vaciarElCatalogo();
});
afterEach(() => {
	for (const view of views.splice(0)) view.unmount();
});

describe('la pastilla', () => {
	test('sin interactive informa: es un span, no un botón, y no se pinta al pasar', () => {
		const view = render(Chip, { props: { label: 'Firefox', caption: 'vía' } });
		const root = view.find('[data-chip]');

		expect(root.element.tagName).toBe('SPAN');
		expect(root.attributes('type')).toBeUndefined();
		expect(root.classes()).not.toContain('hover:bg-ui-hover');
		expect(view.find('[data-caption]').text()).toBe('vía');
		expect(view.find('[data-label]').text()).toBe('Firefox');
	});

	test('con interactive es un botón que emite click', async () => {
		const view = render(Chip, { props: { label: 'Auriculares', icon: 'audio-headphones', interactive: true } });
		const root = view.find('[data-chip]');

		expect(root.element.tagName).toBe('BUTTON');
		expect(root.attributes('type')).toBe('button');
		expect(root.classes()).toContain('focus-visible:outline-ui-focus');
		await root.trigger('click');
		expect(view.emitted('click')).toHaveLength(1);
	});

	test('quieta no emite aunque la toquen', async () => {
		const view = render(Chip, { props: { label: 'Firefox' } });
		await view.find('[data-chip]').trigger('click');
		expect(view.emitted('click')).toBeUndefined();
	});

	test('un nombre largo se corta en un renglón y queda entero en el globo', () => {
		const name = 'Auriculares Bluetooth WH-1000XM4';
		const view = render(Chip, { props: { label: name, caption: 'por' } });
		const root = view.find('[data-chip]');

		expect(root.classes()).toEqual(expect.arrayContaining(['min-w-0', 'max-w-full', 'h-8']));
		expect(view.find('[data-label]').classes()).toEqual(expect.arrayContaining(['truncate', 'min-w-0']));
		expect(root.attributes('title')).toBe(`por ${name}`);
	});

	test('el globo se puede dar', () => {
		const view = render(Chip, { props: { label: 'A', title: 'Otro texto' } });
		expect(view.find('[data-chip]').attributes('title')).toBe('Otro texto');
	});

	test('la forma sale del esquema: superficie de bloque interno y radio del sistema', () => {
		const view = render(Chip, { props: { label: 'A' } });
		expect(view.find('[data-chip]').classes()).toEqual(
			expect.arrayContaining(['bg-ui-surface/70', 'border-ui-line-weak', 'rounded-corner-full'])
		);
	});

	test('sin icono no dibuja un icono vacío', () => {
		const view = render(Chip, { props: { label: 'A' } });
		expect(view.find('img').exists()).toBe(false);
	});
});

describe('los puntos de página', () => {
	test('con una página o ninguna no se dibuja nada', () => {
		for (const count of [0, 1]) {
			const view = render(PageDots, { props: { count } });
			expect(view.find('[data-page-dots]').exists()).toBe(false);
		}
	});

	test('un punto por página, el activo en el primario y con aria-current', () => {
		const view = render(PageDots, { props: { count: 3, modelValue: 1, label: 'Reproductores' } });
		const dots = view.findAll('[data-dot]');

		expect(view.find('[data-page-dots]').attributes('aria-label')).toBe('Reproductores');
		expect(dots).toHaveLength(3);
		expect(dots[1]?.attributes('aria-current')).toBe('true');
		expect(dots[0]?.attributes('aria-current')).toBeUndefined();
		expect(dots[1]?.find('span').classes()).toContain('bg-primary');
		expect(dots[0]?.find('span').classes()).toContain('bg-ui-border-strong');
	});

	test('se apunta en 32 px aunque el punto se vea de 8', () => {
		const view = render(PageDots, { props: { count: 2 } });
		expect(view.find('[data-dot]').classes()).toContain('size-8');
	});

	test('cada punto se llama como diga labels, o «N de M»', () => {
		const named = render(PageDots, { props: { count: 2, labels: ['VLC', 'Firefox'] } });
		expect(named.findAll('[data-dot]').map((dot) => dot.attributes('aria-label'))).toEqual(['VLC', 'Firefox']);

		const plain = render(PageDots, { props: { count: 3 } });
		expect(plain.findAll('[data-dot]')[2]?.attributes('aria-label')).toBe('3 of 3');
	});

	test('tocar otro punto lo elige; tocar el activo no avisa nada', async () => {
		const view = render(PageDots, { props: { count: 3, modelValue: 0 } });

		await view.findAll('[data-dot]')[0]?.trigger('click');
		expect(view.emitted('change')).toBeUndefined();

		await view.findAll('[data-dot]')[2]?.trigger('click');
		expect(view.emitted('update:modelValue')?.[0]).toEqual([2]);
		expect(view.emitted('change')?.[0]).toEqual([2]);
	});

	test('un solo Tab entra, en el activo, y las flechas eligen y mueven el foco', async () => {
		const view = render(PageDots, { props: { count: 3, modelValue: 0 } });
		const dots = () => view.findAll('[data-dot]');

		expect(dots().map((dot) => dot.attributes('tabindex'))).toEqual(['0', '-1', '-1']);

		const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
		dots()[0]?.element.dispatchEvent(event);
		expect(event.defaultPrevented).toBe(true);
		expect(view.emitted('change')?.[0]).toEqual([1]);

		await view.setProps({ modelValue: 1 });
		await nextTick();
		await nextTick();
		expect(document.activeElement).toBe(dots()[1]?.element);
		expect(dots()[1]?.attributes('tabindex')).toBe('0');

		await dots()[1]?.trigger('keydown', { key: 'End' });
		expect(view.emitted('change')?.[1]).toEqual([2]);
		await dots()[1]?.trigger('keydown', { key: 'Home' });
		expect(view.emitted('change')?.[2]).toEqual([0]);
	});

	test('una tecla que no es de navegar no se come', () => {
		const view = render(PageDots, { props: { count: 3 } });
		const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true });
		view.find('[data-dot]').element.dispatchEvent(event);
		expect(event.defaultPrevented).toBe(false);
		expect(view.emitted('change')).toBeUndefined();
	});

	test('apagados no eligen', async () => {
		const view = render(PageDots, { props: { count: 3, disabled: true } });
		await view.findAll('[data-dot]')[2]?.trigger('click');
		expect(view.emitted('change')).toBeUndefined();
		expect(view.find('[data-dot]').attributes('disabled')).toBeDefined();
	});

	test('un activo fuera de rango se lleva al último, no deja todo apagado', () => {
		const view = render(PageDots, { props: { count: 2, modelValue: 7 } });
		expect(view.findAll('[data-dot]')[1]?.attributes('aria-current')).toBe('true');
	});

	test('con menos movimiento el cambio de ancho no se anima', () => {
		const view = render(PageDots, { props: { count: 2 } });
		expect(view.find('[data-dot] span').classes()).toContain('motion-reduce:transition-none');
	});
});
