/**
 * La 2.13.0: el mosaico de ajuste rápido del centro de control del escritorio
 * (`QuickSettingsTile`, vasak-desktop#174/#175).
 *
 * Lo que se fija: el encendido se pinta con los colores del esquema y se dice
 * con `aria-pressed`; el cuerpo y el detalle son dos botones separados; «no
 * disponible» no se puede tocar y lo dice; y la forma es la de Once UI, sin
 * nada escrito a mano.
 */
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { mount, type VueWrapper } from '@vue/test-utils';
import QuickSettingsTile from '../src/controls/QuickSettingsTile.vue';
import { olvidarTodo, vaciarElCatalogo } from './dobles';

const views: VueWrapper[] = [];
function render(props: Record<string, unknown>) {
	// biome-ignore lint/suspicious/noExplicitAny: las props las arma cada prueba.
	const view = mount(QuickSettingsTile as any, { props, attachTo: document.body });
	views.push(view);
	return view;
}

beforeEach(() => olvidarTodo());
afterEach(() => {
	for (const view of views.splice(0)) view.unmount();
	vaciarElCatalogo();
	document.body.innerHTML = '';
});

const BASE = { icon: 'notifications-disabled', title: 'No molestar', status: 'Apagado' };

describe('el encendido se ve y se dice', () => {
	test('apagado: la superficie de siempre, aria-pressed en falso', () => {
		const view = render({ ...BASE, active: false });
		const root = view.element as HTMLElement;
		expect(root.className).toContain('bg-ui-surface/70');
		expect(root.className).toContain('border-ui-line');
		expect(root.dataset.active).toBe('false');
		expect(view.get('[data-tile-main]').attributes('aria-pressed')).toBe('false');
		expect(view.get('[data-tile-icon]').classes()).toContain('bg-ui-line-weak');
	});

	test('encendido: el velo de acento, el canto y el círculo del primario', () => {
		const view = render({ ...BASE, active: true, status: 'Hasta las 8:00' });
		const root = view.element as HTMLElement;
		expect(root.className).toContain('bg-ui-selected-accent');
		expect(root.className).toContain('border-primary');
		expect(root.dataset.active).toBe('true');
		expect(view.get('[data-tile-main]').attributes('aria-pressed')).toBe('true');
		const icon = view.get('[data-tile-icon]');
		expect(icon.classes()).toContain('bg-primary');
		expect(icon.classes()).toContain('text-tx-on-primary');
	});

	test('un mosaico que abre algo no lleva aria-pressed', () => {
		const view = render({ icon: 'system-search', title: 'Buscar' });
		expect(view.get('[data-tile-main]').attributes('aria-pressed')).toBeUndefined();
		expect(view.find('[data-tile-status]').exists()).toBe(false);
	});

	test('el título y el estado, en una línea con el texto entero en el globo', () => {
		const view = render({ ...BASE, active: false });
		expect(view.get('[data-tile-title]').text()).toBe('No molestar');
		expect(view.get('[data-tile-status]').text()).toBe('Apagado');
		// Una sola línea (`MarqueeText`): la caja recorta y, si sobra, se desliza.
		expect(view.get('[data-tile-title]').classes()).toContain('overflow-hidden');
		expect(view.get('[data-tile-title]').classes()).not.toContain('line-clamp-2');
		expect(view.get('[data-tile-main]').attributes('title')).toBe('No molestar — Apagado');
	});
});

describe('dos toques separados', () => {
	test('el cuerpo emite activate y el detalle, detail', async () => {
		const view = render({ ...BASE, active: false, detail: true });
		await view.get('[data-tile-main]').trigger('click');
		expect(view.emitted('activate')).toHaveLength(1);
		expect(view.emitted('detail')).toBeUndefined();

		await view.get('[data-tile-detail]').trigger('click');
		expect(view.emitted('detail')).toHaveLength(1);
		expect(view.emitted('activate')).toHaveLength(1);
	});

	test('la zona del detalle es otro botón, con nombre, y no está adentro del cuerpo', () => {
		const view = render({ ...BASE, detail: true });
		const detail = view.get('[data-tile-detail]');
		expect(detail.element.tagName).toBe('BUTTON');
		expect(view.get('[data-tile-main]').element.contains(detail.element)).toBe(false);
		expect(detail.attributes('aria-label')).toBe('Details: No molestar');
		const named = render({ ...BASE, detail: true, detailLabel: 'Opciones de No molestar' });
		expect(named.get('[data-tile-detail]').attributes('aria-label')).toBe('Opciones de No molestar');
	});

	test('sin detail no hay flecha', () => {
		expect(render(BASE).find('[data-tile-detail]').exists()).toBe(false);
	});

	test('mientras carga no vuelve a alternar', async () => {
		const view = render({ ...BASE, active: false, loading: true });
		expect(view.get('[data-tile-main]').attributes('aria-busy')).toBe('true');
		await view.get('[data-tile-main]').trigger('click');
		expect(view.emitted('activate')).toBeUndefined();
	});
});

describe('apagado y no disponible', () => {
	test('disabled: no se toca, el estado queda', async () => {
		const view = render({ ...BASE, active: true, disabled: true, detail: true });
		expect(view.get('[data-tile-main]').attributes('disabled')).toBeDefined();
		expect(view.get('[data-tile-detail]').attributes('disabled')).toBeDefined();
		expect((view.element as HTMLElement).className).toContain('opacity-50');
		expect(view.get('[data-tile-main]').attributes('aria-pressed')).toBe('true');
		await view.get('[data-tile-main]').trigger('click');
		expect(view.emitted('activate')).toBeUndefined();
	});

	test('unavailable: apagado, lo dice, y nada se puede tocar', async () => {
		const view = render({ ...BASE, active: true, unavailable: true, detail: true });
		const root = view.element as HTMLElement;
		expect(root.dataset.unavailable).toBe('true');
		expect(root.dataset.active).toBe('false');
		expect(view.get('[data-tile-status]').text()).toBe('Not available');
		expect(view.get('[data-tile-main]').attributes('aria-pressed')).toBeUndefined();
		await view.get('[data-tile-main]').trigger('click');
		await view.get('[data-tile-detail]').trigger('click');
		expect(view.emitted('activate')).toBeUndefined();
		expect(view.emitted('detail')).toBeUndefined();
		const translated = render({ ...BASE, unavailable: true, unavailableLabel: 'No disponible' });
		expect(translated.get('[data-tile-status]').text()).toBe('No disponible');
	});
});

describe('la forma', () => {
	const SOURCE = readFileSync(new URL('../src/controls/QuickSettingsTile.vue', import.meta.url), 'utf8');
	const TEMPLATE = SOURCE.slice(SOURCE.indexOf('<template>'));

	test('radios de la variable, estados del esquema y foco visible', () => {
		const view = render({ ...BASE, detail: true });
		expect((view.element as HTMLElement).className).toContain('rounded-corner-l');
		for (const button of view.findAll('button')) {
			expect(button.classes()).toContain('hover:bg-ui-hover');
			expect(button.classes()).toContain('active:bg-ui-pressed');
			expect(button.classes()).toContain('focus-visible:outline-ui-focus');
		}
	});

	/** El ancho en px de una clase `min-w-N` / `w-N` de la escala (N × 4). */
	function widthOf(classes: string[], prefix: 'min-w-' | 'w-'): number {
		const found = classes.find((name) => name.startsWith(prefix) && /^\d+$/.test(name.slice(prefix.length)));
		return found ? Number(found.slice(prefix.length)) * 4 : 0;
	}

	test('nunca deja un objetivo de menos de 32 px, tenga detalle o no', () => {
		for (const detail of [false, true]) {
			const view = render({ ...BASE, detail });
			const root = (view.element as HTMLElement).className.split(/\s+/);
			const main = view.get('[data-tile-main]').classes();
			const mainMin = widthOf(main, 'min-w-');
			expect(mainMin).toBeGreaterThanOrEqual(32);
			// El piso del mosaico alcanza para el cuerpo, la flecha, el divisor
			// (1 px) y los dos cantos (1 px cada uno): si el mosaico se encoge
			// hasta su mínimo, ningún botón queda debajo de 32.
			const arrow = detail ? widthOf(view.get('[data-tile-detail]').classes(), 'w-') + 1 : 0;
			if (detail) expect(arrow - 1).toBeGreaterThanOrEqual(32);
			expect(widthOf(root, 'min-w-')).toBeGreaterThanOrEqual(mainMin + arrow + 2);
		}
	});

	test('ni colores, ni radios fijos, ni iconos dibujados', () => {
		expect(TEMPLATE).not.toMatch(/#[0-9a-f]{3,6}\b|rgb\(|rounded-(?:md|lg|xl|\[)|<svg|backdrop-blur/);
	});

	test('se acomoda por contenedor: en lo angosto el círculo deja lugar al icono chico, y se toca con el dedo', () => {
		const view = render({ ...BASE, detail: true });
		expect((view.element as HTMLElement).className).toContain('@container');
		expect((view.element as HTMLElement).className).toContain('min-h-14');
		expect(view.get('[data-tile-icon]').classes()).toEqual(expect.arrayContaining(['hidden', '@[11.5rem]:flex']));
		expect(view.get('[data-tile-detail]').classes()).toContain('w-8');
		expect(TEMPLATE).not.toMatch(/\b(?:sm|md|lg|xl):/);
	});

	/*
	 * vue-libvasak#95: el título y el estado van en una sola línea para que todas
	 * las pastillas midan lo mismo, y si un nombre no entra —«Tiempo de pantalla»
	 * a 350 px— se desliza (`MarqueeText`) en vez de cortarse. Reemplaza al
	 * ajuste de dos líneas de la 2.13.0 (vue-libvasak#91), que las dejaba
	 * disparejas. happy-dom no maqueta, así que acá se fija la forma por las
	 * clases; que el deslizamiento arranque al sobrar texto se mide en el banco
	 * (`playground/tiles-frames.html`, que compara `scrollWidth`).
	 */
	describe('una línea que se desliza si no entra (vue-libvasak#95)', () => {
		test('el título y el estado son MarqueeText de una línea, no dos ni elipsis dura', () => {
			const view = render({ ...BASE, active: false });
			for (const selector of ['[data-tile-title]', '[data-tile-status]']) {
				const cell = view.get(selector);
				// La raíz del MarqueeText recorta a una línea; el texto entero
				// sigue en el DOM (lo lee un lector de pantalla) y en el globo.
				expect(cell.classes()).toContain('overflow-hidden');
				expect(cell.classes()).not.toContain('line-clamp-2');
				expect(cell.attributes('title')).toBe(cell.text());
				expect(cell.findComponent({ name: 'MarqueeText' }).exists()).toBe(true);
			}
		});

		test('la fila del icono y el título no se parte: el título crece y recorta', () => {
			const view = render({ ...BASE, active: false, detail: true });
			const small = view.get('[data-tile-small-icon]');
			const row = (small.element.parentElement as HTMLElement).className.split(/\s+/);
			// Antes se partía (`flex-wrap`) para bajar el título a su línea; ahora
			// se queda al lado del icono y lo que sobra lo resuelve la marquesina.
			expect(row).toContain('flex-nowrap');
			expect(row).not.toContain('flex-wrap');
			const title = view.get('[data-tile-title]').classes();
			expect(title).toEqual(expect.arrayContaining(['min-w-0', 'flex-1']));
			expect(title.some((name) => name.startsWith('basis-'))).toBe(false);
		});
	});
});

/*
 * La 2.13.2: en lo angosto el mosaico no queda sin icono. Debajo del umbral
 * del círculo va el icono chico del tema (16 px, sin círculo) delante del
 * título; encima, el círculo como antes. happy-dom no evalúa las consultas de
 * contenedor, así que se fija con las clases: el chico se esconde en el mismo
 * umbral en que el círculo aparece. La medida real está en el banco.
 */
describe('el icono chico en lo angosto (2.13.2)', () => {
	const SOURCE = readFileSync(new URL('../src/controls/QuickSettingsTile.vue', import.meta.url), 'utf8');

	/** El umbral (`@[N rem]:`) de una clase con ese sufijo. */
	function threshold(classes: string[], suffix: string): string | undefined {
		return classes.find((name) => name.startsWith('@[') && name.endsWith(`]:${suffix}`))?.slice(0, -suffix.length);
	}

	test('debajo del umbral, el icono de 16 px del tema; encima, el círculo; en el mismo umbral', () => {
		const view = render({ ...BASE, active: false, detail: true });
		const small = view.get('[data-tile-small-icon]');
		const circle = view.get('[data-tile-icon]');
		// Se ve por omisión (lo angosto) y se va encima del umbral.
		expect(small.classes()).not.toContain('hidden');
		expect(circle.classes()).toContain('hidden');
		const smallUntil = threshold(small.classes(), 'hidden');
		const circleFrom = threshold(circle.classes(), 'flex');
		expect(smallUntil).toBeDefined();
		expect(smallUntil).toBe(circleFrom);

		const icon = small.findComponent({ name: 'ThemeIcon' });
		expect(icon.props('size')).toBe(16);
		expect(icon.props('name')).toBe('notifications-disabled');
		expect(icon.props('type')).toBe('symbol');
		expect(icon.props('tint')).toBe(true);
		// Sin círculo: ni relleno ni radio.
		expect(small.classes().some((name) => name.startsWith('bg-') || name.startsWith('rounded'))).toBe(false);
		// Y el del círculo sigue en 20.
		expect(circle.findComponent({ name: 'ThemeIcon' }).props('size')).toBe(20);
	});

	test('va delante del título, en su fila, y el estado queda debajo con todo el ancho', () => {
		const view = render({ ...BASE, active: false });
		const small = view.get('[data-tile-small-icon]').element;
		const title = view.get('[data-tile-title]').element;
		const status = view.get('[data-tile-status]').element;
		expect(small.parentElement).toBe(title.parentElement);
		expect(small.nextElementSibling).toBe(title);
		expect((small.parentElement as HTMLElement).contains(status)).toBe(false);
	});

	test('encendido, en el primario del esquema (ui-data); apagado, en el texto atenuado', () => {
		const on = render({ ...BASE, active: true }).get('[data-tile-small-icon]');
		expect(on.attributes('data-tile-small-icon')).toBe('on');
		expect(on.classes()).toContain('text-ui-data');
		expect(on.classes()).not.toContain('text-tx-muted');

		const off = render({ ...BASE, active: false }).get('[data-tile-small-icon]');
		expect(off.attributes('data-tile-small-icon')).toBe('off');
		expect(off.classes()).toContain('text-tx-muted');

		// No disponible se ve apagado aunque venga encendido.
		const gone = render({ ...BASE, active: true, unavailable: true }).get('[data-tile-small-icon]');
		expect(gone.classes()).toContain('text-tx-muted');
	});

	test('el icono no empuja al título: es él quien se encoge y recorta', () => {
		const view = render({ ...BASE, active: false, detail: true });
		const small = view.get('[data-tile-small-icon]').classes();
		const title = view.get('[data-tile-title]').classes();
		// El icono chico no se encoge; el título toma el resto en una línea y, si
		// no entra, lo resuelve la marquesina (no la elipsis dura de `truncate`).
		expect(small).toContain('shrink-0');
		expect(title).toEqual(expect.arrayContaining(['min-w-0', 'flex-1', 'overflow-hidden']));
		expect(title).not.toContain('line-clamp-2');
		expect(title).not.toContain('truncate');
	});

	test('mientras carga, el icono chico también late', () => {
		const view = render({ ...BASE, active: false, loading: true });
		expect(view.get('[data-tile-small-icon]').findComponent({ name: 'ThemeIcon' }).classes()).toContain('animate-pulse');
	});

	test('sin colores ni tamaños escritos a mano en el icono chico', () => {
		const block = SOURCE.slice(SOURCE.indexOf('data-tile-small-icon') - 300, SOURCE.indexOf('data-tile-title'));
		expect(block).not.toMatch(/#[0-9a-f]{3,6}\b|rgb\(|\[[\d.]+px\]|text-primary\b/);
	});
});
