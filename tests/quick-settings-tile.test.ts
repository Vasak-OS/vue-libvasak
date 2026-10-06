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

	test('el título y el estado, con el texto entero en el globo', () => {
		const view = render({ ...BASE, active: false });
		expect(view.get('[data-tile-title]').text()).toBe('No molestar');
		expect(view.get('[data-tile-status]').text()).toBe('Apagado');
		expect(view.get('[data-tile-title]').classes()).toContain('truncate');
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

	test('se acomoda por contenedor: el círculo se va en lo angosto, y se toca con el dedo', () => {
		const view = render({ ...BASE, detail: true });
		expect((view.element as HTMLElement).className).toContain('@container');
		expect((view.element as HTMLElement).className).toContain('min-h-14');
		expect(view.get('[data-tile-icon]').classes()).toEqual(expect.arrayContaining(['hidden', '@[9rem]:flex']));
		expect(view.get('[data-tile-detail]').classes()).toContain('w-8');
		expect(TEMPLATE).not.toMatch(/\b(?:sm|md|lg|xl):/);
	});
});
