/**
 * El ecualizador (2.11.0): las diez bandas con su curva, el encabezado y los
 * perfiles, para el pie del reproductor desplegable del escritorio
 * (vasak-desktop#131) sobre `org.vasak.Equalizer1`.
 *
 * Lo que se fija es lo que se rompe sin que nada falle: una banda que se mueve
 * con el mouse y no con el teclado, una ganancia fuera del rango que saca el
 * tirador de la caja, una curva que cambia de cantidad de puntos (y entonces
 * salta en vez de animarse), un perfil propio que deja el grupo sin Tab, o un
 * ecualizador ausente que se dibuja como si anduviera.
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mount, type VueWrapper } from '@vue/test-utils';
import Equalizer from '../src/media/Equalizer.vue';
import { olvidarTodo, vaciarElCatalogo } from './dobles';

const FREQUENCIES = [31, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
const FLAT = FREQUENCIES.map(() => 0);
const PRESETS = [
	{ value: 'flat', label: 'Plano' },
	{ value: 'bass', label: 'Graves' },
	{ value: 'treble', label: 'Agudos' },
	{ value: 'vocal', label: 'Voz' },
	{ value: 'pop', label: 'Pop' },
	{ value: 'rock', label: 'Rock' },
	{ value: 'jazz', label: 'Jazz' },
	{ value: 'classic', label: 'Clásica' },
];

const views: VueWrapper[] = [];
function render(props: Record<string, unknown> = {}) {
	const view = mount(Equalizer, {
		attachTo: document.body,
		props: { frequencies: FREQUENCIES, gains: FLAT, presets: PRESETS, preset: 'flat', ...props },
	});
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

const key = (view: VueWrapper, band: number, name: string) => {
	const event = new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true });
	view.find(`[data-thumb="${band}"]`).element.dispatchEvent(event);
	return event;
};

describe('las bandas', () => {
	test('una por frecuencia, con su nombre corto y lo que se oye', () => {
		const view = render({ gains: [3, 0, 0, 0, 0, -2.5, 0, 0, 0, 0] });
		expect(view.findAll('[data-frequency]').map((label) => label.text())).toEqual([
			'31', '63', '125', '250', '500', '1k', '2k', '4k', '8k', '16k',
		]);
		const thumb = view.find('[data-thumb="0"]');
		expect(thumb.attributes('role')).toBe('slider');
		expect(thumb.attributes('aria-orientation')).toBe('vertical');
		expect(thumb.attributes('aria-valuenow')).toBe('3');
		expect(thumb.attributes('aria-valuetext')).toBe('31 Hz: +3 dB');
		expect(view.find('[data-thumb="5"]').attributes('aria-valuetext')).toBe('1 kHz: -2.5 dB');
	});

	test('el tirador queda donde dice la ganancia, y una fuera de rango no sale de la caja', () => {
		const view = render({ gains: [12, -12, 0, 24, -99, Number.NaN, 0, 0, 0, 0] });
		const top = (band: number) => view.find(`[data-thumb="${band}"]`).attributes('style');
		expect(top(0)).toContain('top: 0%');
		expect(top(1)).toContain('top: 100%');
		expect(top(2)).toContain('top: 50%');
		expect(top(3)).toContain('top: 0%');
		expect(top(4)).toContain('top: 100%');
		expect(top(5)).toContain('top: 50%');
	});

	test('las flechas, Re Pág / Av Pág e Inicio / Fin mueven la banda y avisan en dB', () => {
		const view = render();
		expect(key(view, 2, 'ArrowUp').defaultPrevented).toBe(true);
		key(view, 2, 'ArrowDown');
		key(view, 2, 'PageUp');
		key(view, 2, 'Home');
		key(view, 2, 'End');
		expect(view.emitted('gain')).toEqual([
			[2, 0.5],
			[2, -0.5],
			[2, 1.5],
			[2, 12],
			[2, -12],
		]);
	});

	test('en el tope no avisa nada, y una tecla ajena no se come', () => {
		const view = render({ gains: FREQUENCIES.map(() => 12) });
		key(view, 0, 'ArrowUp');
		expect(view.emitted('gain')).toBeUndefined();
		expect(key(view, 0, 'a').defaultPrevented).toBe(false);
	});

	test('arrastrar avisa la ganancia del punto, redondeada al paso', async () => {
		const view = render();
		const column = view.find('[data-band="3"]');
		const element = column.element as HTMLElement;
		element.getBoundingClientRect = () =>
			({ top: 100, height: 100, left: 0, width: 20, bottom: 200, right: 20, x: 0, y: 100, toJSON: () => ({}) }) as DOMRect;

		await column.trigger('pointerdown', { clientY: 125, pointerId: 1 });
		await column.trigger('pointermove', { clientY: 190, pointerId: 1 });
		await column.trigger('pointerup', { clientY: 190, pointerId: 1 });
		await column.trigger('pointermove', { clientY: 100, pointerId: 1 });

		// 25 % desde arriba de ±12 son +6; 90 %, −9.6 → −9.5. Soltado, no avisa más.
		expect(view.emitted('gain')).toEqual([
			[3, 6],
			[3, -9.5],
		]);
	});
});

describe('la curva', () => {
	test('pasa por los tiradores y tiene siempre los mismos puntos, para animarse', () => {
		const flat = render();
		const rock = render({ gains: [4, 3, -1, -2, -1, 1, 3, 4, 4.5, 4.5] });
		const points = (view: VueWrapper) =>
			(view.find('[data-curve]').attributes('style') ?? '').split(',').length;

		expect(points(flat)).toBe(points(rock));
		// La curva plana va por la mitad, y el primer punto es el del primer tirador.
		expect(flat.find('[data-curve]').attributes('style')).toContain('5% calc(50% - 1px)');
		expect(rock.find('[data-curve]').attributes('style')).toContain('5% calc(33.33% - 1px)');
		expect(flat.find('[data-curve]').classes()).toEqual(
			expect.arrayContaining(['bg-primary', 'transition-[clip-path]', 'motion-reduce:transition-none'])
		);
	});

	test('no es SVG: son cajas recortadas, que no reciben el puntero', () => {
		const view = render();
		expect(view.find('svg').exists()).toBe(false);
		expect(view.find('[data-curve]').classes()).toContain('pointer-events-none');
		expect(view.find('[data-curve-area]').attributes('aria-hidden')).toBe('true');
	});
});

describe('el encabezado y los perfiles', () => {
	test('dice el perfil y si está guardado', () => {
		expect(render({ preset: 'rock', saved: true, savedLabel: 'Guardado' }).find('[data-status]').text()).toBe(
			'Guardado · Rock'
		);
		expect(
			render({ preset: 'custom', saved: false, unsavedLabel: 'Sin guardar', customLabel: 'Personalizado' })
				.find('[data-status]')
				.text()
		).toBe('Sin guardar · Personalizado');
	});

	test('la grilla de perfiles: el elegido en el primario y marcado', () => {
		const view = render({ preset: 'rock' });
		const rock = view.find('[data-preset="rock"]');
		expect(view.findAll('[data-preset]')).toHaveLength(8);
		expect(rock.attributes('aria-checked')).toBe('true');
		expect(rock.classes()).toEqual(expect.arrayContaining(['bg-primary', 'text-tx-on-primary']));
		expect(view.find('[data-preset="flat"]').classes()).toContain('bg-ui-surface/70');
		expect(view.find('[data-presets]').classes()).toEqual(expect.arrayContaining(['grid-cols-2', '@xs:grid-cols-4']));
	});

	test('tocar otro perfil lo pide; el elegido no avisa', async () => {
		const view = render({ preset: 'rock' });
		await view.find('[data-preset="rock"]').trigger('click');
		await view.find('[data-preset="jazz"]').trigger('click');
		expect(view.emitted('preset')).toEqual([['jazz']]);
	});

	test('con el propio elegido el Tab entra por el primero, y las flechas recorren', async () => {
		const view = render({ preset: 'custom' });
		const tabbable = view.findAll('[data-preset]').filter((button) => button.attributes('tabindex') === '0');
		expect(tabbable.map((button) => button.attributes('data-preset'))).toEqual(['flat']);

		await view.find('[data-preset="flat"]').trigger('keydown', { key: 'ArrowLeft' });
		expect(view.emitted('preset')?.[0]).toEqual(['classic']);
		expect(document.activeElement).toBe(view.find('[data-preset="classic"]').element);
	});
});

describe('lo que no se puede usar', () => {
	test('sin el servicio dice que no está y no dibuja bandas ni perfiles', () => {
		const view = render({ available: false, unavailableLabel: 'El ecualizador no está disponible' });
		expect(view.find('[data-unavailable]').text()).toBe('El ecualizador no está disponible');
		expect(view.find('[data-bands]').exists()).toBe(false);
		expect(view.find('[data-presets]').exists()).toBe(false);
	});

	test('apagado atenúa las bandas y deja elegir perfil', async () => {
		const view = render({ enabled: false });
		expect(view.find('[data-bands]').element.parentElement?.className).toContain('opacity-50');
		await view.find('[data-preset="pop"]').trigger('click');
		expect(view.emitted('preset')).toEqual([['pop']]);
	});

	test('sin textos, los del catálogo o el respaldo en inglés', () => {
		const view = render({ preset: 'custom', saved: true });
		expect(view.find('h3').text()).toBe('Equalizer');
		expect(view.find('[data-status]').text()).toBe('Saved · Custom');
	});
});

describe('dentro de la tarjeta', () => {
	test('no trae línea propia: la del pie de NowPlayingCard alcanza', () => {
		const view = render();
		expect(view.find('[data-equalizer]').classes()).not.toContain('border-t');
	});
});
