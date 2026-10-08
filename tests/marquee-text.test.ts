/**
 * La 2.14.0: `MarqueeText`, el texto de una línea que se desliza si no entra
 * (vue-libvasak#95). Lo usa el mosaico del centro de control para que el título
 * y el estado no bajen a dos líneas y las pastillas queden parejas.
 *
 * Lo que se fija: en una línea, con el texto entero en el DOM y en el globo;
 * cuando el contenido sobra se enciende la marquesina con la distancia justa; y
 * con `prefers-reduced-motion` no se mueve —cae a la elipsis—. happy-dom no
 * maqueta, así que el sobrante se simula fijando `scrollWidth`/`clientWidth`; la
 * medida de verdad está en el banco.
 */
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mount, type VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import MarqueeText from '../src/forms/MarqueeText.vue';

const views: VueWrapper[] = [];
function render(props: Record<string, unknown>) {
	// biome-ignore lint/suspicious/noExplicitAny: las props las arma cada prueba.
	const view = mount(MarqueeText as any, { props, attachTo: document.body });
	views.push(view);
	return view;
}

/** Finge que el contenido mide `content` en una caja de `box`. */
function sizes(view: VueWrapper, box: number, content: number): void {
	const root = view.element as HTMLElement;
	const inner = root.firstElementChild as HTMLElement;
	Object.defineProperty(root, 'clientWidth', { configurable: true, value: box });
	Object.defineProperty(inner, 'scrollWidth', { configurable: true, value: content });
}

/** Deja correr el `queueMicrotask(measure)` del watch y el re-render. */
async function settle(view: VueWrapper): Promise<void> {
	await Promise.resolve();
	await nextTick();
	await view.vm.$nextTick();
}

const original = globalThis.matchMedia;
beforeEach(() => {
	// Por omisión, con movimiento (lo que da happy-dom): matches en falso.
	globalThis.matchMedia = ((query: string) =>
		({ matches: false, media: query, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList) as typeof matchMedia;
});
afterEach(() => {
	for (const view of views.splice(0)) view.unmount();
	globalThis.matchMedia = original;
	document.body.innerHTML = '';
});

describe('una línea con el texto entero', () => {
	test('muestra el texto y lo deja entero en el globo', () => {
		const view = render({ text: 'Tiempo de pantalla' });
		expect(view.text()).toBe('Tiempo de pantalla');
		expect((view.element as HTMLElement).className).toContain('overflow-hidden');
		expect(view.attributes('title')).toBe('Tiempo de pantalla');
	});

	test('cuando entra, no se desliza: una línea con elipsis de reserva', () => {
		// happy-dom no maqueta: sin sobrante medido, no hay marquesina.
		const view = render({ text: 'Red' });
		const inner = (view.element as HTMLElement).firstElementChild as HTMLElement;
		expect(inner.className).toContain('truncate');
		expect(inner.className).not.toContain('marquee');
	});
});

describe('se desliza si sobra texto', () => {
	test('enciende la marquesina con la distancia que sobra', async () => {
		const view = render({ text: 'corto' });
		sizes(view, 120, 200);
		await view.setProps({ text: 'un nombre bastante más largo que la caja' });
		await settle(view);

		const inner = (view.element as HTMLElement).firstElementChild as HTMLElement;
		expect(inner.className).toContain('marquee');
		expect(inner.className).not.toContain('truncate');
		// 200 de contenido en 120 de caja → sobran 80.
		expect(inner.getAttribute('style')).toContain('--marquee-shift: -80px');
		expect(inner.getAttribute('style')).toContain('--marquee-duration');
	});

	test('con prefers-reduced-motion no se mueve aunque sobre: cae a la elipsis', async () => {
		globalThis.matchMedia = ((query: string) =>
			({ matches: true, media: query, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList) as typeof matchMedia;
		const view = render({ text: 'corto' });
		sizes(view, 120, 200);
		await view.setProps({ text: 'un nombre bastante más largo que la caja' });
		await settle(view);

		const inner = (view.element as HTMLElement).firstElementChild as HTMLElement;
		expect(inner.className).not.toContain('marquee');
		expect(inner.className).toContain('truncate');
	});
});
