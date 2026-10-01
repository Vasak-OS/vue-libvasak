/**
 * El globo con contenido (`Popover`) de la 2.2.0.
 *
 * Lo que se comprueba es lo que no se ve en una captura: que es un `dialog`
 * atado a su disparador, que el foco entra y vuelve, que el Escape y el clic
 * afuera cierran, que la trampa de foco da la vuelta de verdad (con
 * `defaultPrevented` y adónde fue el foco, no sólo que «no salió»), y que se
 * ubica contra el ancla y no contra el disparador cuando los dos existen.
 */

import { afterEach, describe, expect, test } from 'bun:test';
import { mount, type VueWrapper } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import Popover from '../src/popover/Popover.vue';
import PopoverAnchor from '../src/popover/PopoverAnchor.vue';
import PopoverContent from '../src/popover/PopoverContent.vue';
import PopoverTrigger from '../src/popover/PopoverTrigger.vue';
import { computePlacement, transformOriginFor } from '../src/shared/placement';

let mounted: VueWrapper | null = null;

function mountPopover(options: { trap?: boolean; anchor?: boolean; controlled?: { open: boolean } } = {}) {
	mounted = mount(Popover, {
		attachTo: document.body,
		props: options.controlled ? { open: options.controlled.open } : {},
		slots: {
			default: () => [
				h(PopoverTrigger, { asChild: true }, () => h('button', { type: 'button', id: 'trigger' }, 'Opciones')),
				options.anchor ? h(PopoverAnchor, { id: 'anchor' }, () => h('span', 'fila')) : null,
				h(PopoverContent, { trapFocus: options.trap, label: 'Opciones del editor' }, () => [
					h('input', { id: 'first' }),
					h('button', { type: 'button', id: 'last' }, 'Listo'),
				]),
			],
		},
	});
	return mounted;
}

const byId = (id: string) => document.getElementById(id) as HTMLElement;
const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]') as HTMLElement;

function press(element: Element, key: string, shiftKey = false) {
	const event = new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true });
	element.dispatchEvent(event);
	return event;
}

async function settle() {
	await nextTick();
	await nextTick();
}

afterEach(() => {
	mounted?.unmount();
	mounted = null;
	document.body.innerHTML = '';
});

describe('el globo con contenido', () => {
	test('el contenido es un diálogo no modal, con nombre, atado al disparador', async () => {
		mountPopover();
		const trigger = byId('trigger');

		expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
		expect(trigger.getAttribute('aria-expanded')).toBe('false');
		expect(dialog().hasAttribute('inert')).toBe(true);

		trigger.click();
		await settle();

		expect(trigger.getAttribute('aria-expanded')).toBe('true');
		expect(trigger.getAttribute('aria-controls')).toBe(dialog().id);
		expect(dialog().getAttribute('aria-modal')).toBe('false');
		expect(dialog().getAttribute('aria-label')).toBe('Opciones del editor');
		expect(dialog().hasAttribute('inert')).toBe(false);
	});

	test('al abrir, el foco va al primer control de adentro', async () => {
		mountPopover();
		byId('trigger').focus();
		byId('trigger').click();
		await settle();

		expect(document.activeElement).toBe(byId('first'));
	});

	test('Escape cierra, no sigue subiendo y devuelve el foco a quien lo abrió', async () => {
		mountPopover();
		byId('trigger').focus();
		byId('trigger').click();
		await settle();

		let reachedWindow = false;
		const listener = () => {
			reachedWindow = true;
		};
		window.addEventListener('keydown', listener);
		const event = press(byId('first'), 'Escape');
		window.removeEventListener('keydown', listener);
		await settle();

		expect(event.defaultPrevented).toBe(true);
		expect(reachedWindow).toBe(false);
		expect(byId('trigger').getAttribute('aria-expanded')).toBe('false');
		expect(document.activeElement).toBe(byId('trigger'));
	});

	test('un clic afuera cierra; uno adentro, no', async () => {
		mountPopover();
		byId('trigger').click();
		await settle();

		byId('last').dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await settle();
		expect(dialog().hasAttribute('inert')).toBe(false);

		document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await settle();
		expect(dialog().hasAttribute('inert')).toBe(true);
	});

	test('con trapFocus, el Tabulador da la vuelta adentro', async () => {
		mountPopover({ trap: true });
		byId('trigger').click();
		await settle();

		byId('last').focus();
		const forward = press(byId('last'), 'Tab');
		expect(forward.defaultPrevented).toBe(true);
		expect(document.activeElement).toBe(byId('first'));

		const back = press(byId('first'), 'Tab', true);
		expect(back.defaultPrevented).toBe(true);
		expect(document.activeElement).toBe(byId('last'));
	});

	test('sin trapFocus, salir por el último cierra y devuelve el foco al disparador', async () => {
		mountPopover();
		byId('trigger').focus();
		byId('trigger').click();
		await settle();

		byId('last').focus();
		const event = press(byId('last'), 'Tab');
		await settle();

		expect(event.defaultPrevented).toBe(true);
		expect(dialog().hasAttribute('inert')).toBe(true);
		expect(document.activeElement).toBe(byId('trigger'));
	});

	test('el Tabulador entre medio no se toca', async () => {
		mountPopover({ trap: true });
		byId('trigger').click();
		await settle();

		const event = press(byId('first'), 'Tab');
		expect(event.defaultPrevented).toBe(false);
	});

	test('controlado: lo abre la propiedad y avisa al cerrarse', async () => {
		const view = mountPopover({ controlled: { open: false } });
		await view.setProps({ open: true });
		await settle();
		expect(dialog().hasAttribute('inert')).toBe(false);

		press(byId('first'), 'Escape');
		expect(view.emitted('update:open')?.at(-1)).toEqual([false]);
	});

	test('con ancla, se ubica contra el ancla y no contra el disparador', async () => {
		mountPopover({ anchor: true });
		const anchor = byId('anchor');
		anchor.getBoundingClientRect = () =>
			({ top: 300, bottom: 320, left: 100, right: 200, width: 100, height: 20, x: 100, y: 300 }) as DOMRect;
		byId('trigger').click();
		await settle();

		expect(dialog().style.top).toBe('324px');
		expect(dialog().style.left).toBe('100px');
	});
});

describe('la forma', () => {
	test('la superficie flotante de Once UI: opaca, canto fino, radio l, sombra m, sin desenfoque', async () => {
		mountPopover();
		const classes = dialog().className;

		for (const name of ['bg-ui-float', 'border-ui-line', 'rounded-corner-l', 'shadow-surface-m', 'p-3']) {
			expect(classes).toContain(name);
		}
		expect(classes).not.toContain('backdrop-blur');
	});
});

describe('la cuenta de dónde va', () => {
	const viewport = { width: 800, height: 600 };
	const box = { top: 100, bottom: 120, left: 50, right: 150, width: 100 };

	test('abajo del ancla, alineado al principio', () => {
		const placed = computePlacement(box, { width: 200, height: 100 }, { side: 'bottom', align: 'start', sideOffset: 4 }, viewport);
		expect(placed).toEqual({ top: 124, left: 50, ceiling: 468, side: 'bottom' });
	});

	test('se da vuelta si arriba hay más lugar', () => {
		const low = { ...box, top: 560, bottom: 580 };
		const placed = computePlacement(low, { width: 200, height: 100 }, { side: 'bottom', align: 'start', sideOffset: 4 }, viewport);
		expect(placed.side).toBe('top');
		expect(placed.top).toBe(456);
	});

	test('no se va por el costado de la ventana', () => {
		const right = { ...box, left: 760, right: 790 };
		const placed = computePlacement(right, { width: 200, height: 100 }, { side: 'bottom', align: 'start', sideOffset: 4 }, viewport);
		expect(placed.left).toBe(592);
	});

	test('crece desde la esquina que toca al ancla', () => {
		expect(transformOriginFor('bottom', 'start')).toBe('top left');
		expect(transformOriginFor('top', 'end')).toBe('bottom right');
		expect(transformOriginFor('right', 'center')).toBe('top left');
	});
});
