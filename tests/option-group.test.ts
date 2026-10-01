/**
 * Elegir una de varias, con el teclado que pide WAI-ARIA.
 *
 * `OptionGroup` y `SegmentedControl` comparten `roving.ts`, que sale de
 * `utils/radio-group.ts` de vasak-settings. Lo que se comprueba es lo que las
 * otras tres copias del selector de audio no tenían: que el grupo sea **una**
 * parada de Tab y que las flechas elijan, salteando lo que no se puede elegir.
 *
 * El foco se mira en `document.activeElement` y no en un evento despachado a
 * mano: un Tab sintético no navega, así que comprobar «adónde fue el foco»
 * después de despacharlo pasaría siempre (memoria
 * `el-tab-despachado-a-mano-no-navega`).
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mount, type VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import OptionGroup from '../src/forms/OptionGroup.vue';
import { focusableValue, rovingStep } from '../src/forms/roving';
import SegmentedControl from '../src/forms/SegmentedControl.vue';
import { olvidarTodo } from './dobles';

const SALIDAS = [
	{ value: 'hdmi', label: 'HDMI', description: 'Monitor de la sala' },
	{ value: 'jack', label: 'Auriculares', badge: 'Predeterminado' },
	{ value: 'usb', label: 'USB', disabled: true },
	{ value: 'bt', label: 'Bluetooth' },
];

const vistas: VueWrapper[] = [];

beforeEach(() => olvidarTodo());

afterEach(() => {
	for (const vista of vistas.splice(0)) vista.unmount();
	document.body.innerHTML = '';
});

function grupo(props: Record<string, unknown> = {}) {
	const vista = mount(OptionGroup, {
		props: { options: SALIDAS, label: 'Salida de audio', modelValue: 'jack', ...props },
		attachTo: document.body,
	});
	vistas.push(vista);
	return vista;
}

describe('el teclado del grupo', () => {
	test('sólo la elegida es tabulable', () => {
		const tabindex = grupo()
			.findAll('[role="radio"]')
			.map((opcion) => opcion.attributes('tabindex'));

		expect(tabindex).toEqual(['-1', '0', '-1', '-1']);
	});

	test('sin nada elegido, la primera que se puede elegir', () => {
		expect(focusableValue(SALIDAS, null)).toBe('hdmi');
		expect(focusableValue([{ value: 'a', disabled: true }, { value: 'b' }], null)).toBe('b');
		// Y si lo elegido está apagado, tampoco se queda con el foco.
		expect(focusableValue([{ value: 'a', disabled: true }, { value: 'b' }], 'a')).toBe('b');
	});

	test('las flechas saltean lo apagado y dan la vuelta', () => {
		expect(rovingStep(SALIDAS, 1, 'ArrowDown')).toBe(3);
		expect(rovingStep(SALIDAS, 3, 'ArrowRight')).toBe(0);
		expect(rovingStep(SALIDAS, 0, 'ArrowUp')).toBe(3);
		expect(rovingStep(SALIDAS, 3, 'ArrowLeft')).toBe(1);
		expect(rovingStep(SALIDAS, 1, 'Home')).toBe(0);
		expect(rovingStep(SALIDAS, 0, 'End')).toBe(3);
		expect(rovingStep(SALIDAS, 0, 'a')).toBeNull();
	});

	test('sin nada elegido, la flecha de atrás va a la última', () => {
		expect(rovingStep(SALIDAS, -1, 'ArrowUp')).toBe(3);
		expect(rovingStep(SALIDAS, -1, 'ArrowDown')).toBe(0);
	});

	test('todo apagado: ninguna tecla mueve', () => {
		expect(rovingStep([{ value: 1, disabled: true }], 0, 'ArrowDown')).toBeNull();
		expect(rovingStep([], 0, 'Home')).toBeNull();
	});

	test('la flecha elige y se lleva el foco', async () => {
		const vista = grupo();
		const opciones = vista.findAll('[role="radio"]');
		(opciones[1]?.element as HTMLElement).focus();

		await opciones[1]?.trigger('keydown', { key: 'ArrowDown' });
		await nextTick();

		expect(vista.emitted('update:modelValue')?.[0]).toEqual(['bt']);
		expect(vista.emitted('change')?.[0]).toEqual(['bt']);
		expect(document.activeElement).toBe(opciones[3]?.element);
	});

	test('una tecla que no mueve no se come el evento', async () => {
		const vista = grupo();
		const evento = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true });
		vista.findAll('[role="radio"]')[1]?.element.dispatchEvent(evento);

		expect(evento.defaultPrevented).toBe(false);
		expect(vista.emitted('update:modelValue')).toBeUndefined();
	});
});

describe('lo que oye un lector de pantalla', () => {
	test('es un grupo de radios con nombre, y dice cuál está elegida', () => {
		const vista = grupo();

		expect(vista.attributes('role')).toBe('radiogroup');
		expect(vista.attributes('aria-label')).toBe('Salida de audio');
		const estados = vista.findAll('[role="radio"]').map((o) => o.attributes('aria-checked'));
		expect(estados).toEqual(['false', 'true', 'false', 'false']);
	});

	test('la apagada no se puede elegir ni con el ratón', async () => {
		const vista = grupo();
		const usb = vista.findAll('[role="radio"]')[2];

		expect(usb?.attributes('disabled')).toBeDefined();
		await usb?.trigger('click');
		expect(vista.emitted('update:modelValue')).toBeUndefined();
	});

	test('volver a tocar la elegida no avisa de un cambio que no hubo', async () => {
		const vista = grupo();
		await vista.findAll('[role="radio"]')[1]?.trigger('click');

		expect(vista.emitted('change')).toBeUndefined();
	});
});

describe('la forma', () => {
	test('lo elegido lleva el velo de acento, y el punto el primario', () => {
		const elegida = grupo().findAll('[role="radio"]')[1];

		expect(elegida?.classes()).toContain('bg-ui-selected-accent');
		expect(elegida?.find('span[aria-hidden="true"]').classes()).toEqual(
			expect.arrayContaining(['border-primary', 'bg-primary'])
		);
	});

	test('el punto sin elegir lleva el contorno de 3:1, no blanco', () => {
		const otra = grupo().findAll('[role="radio"]')[0];
		const punto = otra?.find('span[aria-hidden="true"]');

		expect(punto?.classes()).toContain('border-ui-border-strong');
		expect(otra?.html()).not.toMatch(/bg-white/);
	});

	test('la insignia del escritorio llega como Badge', () => {
		expect(grupo().findAll('[role="radio"]')[1]?.text()).toContain('Predeterminado');
	});

	test('la tarjeta lleva el icono en su recuadro, que cambia con la elección', () => {
		const vista = grupo({
			variant: 'card',
			options: [
				{ value: 'ext4', label: 'ext4', icon: 'drive-harddisk' },
				{ value: 'btrfs', label: 'Btrfs', icon: 'drive-harddisk', description: 'Con instantáneas' },
			],
			modelValue: 'btrfs',
		});
		const [ext4, btrfs] = vista.findAll('[role="radio"]');

		expect(btrfs?.classes()).toEqual(expect.arrayContaining(['border-primary', 'bg-ui-selected-accent', 'rounded-corner-l']));
		expect(ext4?.classes()).toContain('border-ui-line');
		expect(btrfs?.text()).toContain('Con instantáneas');
	});

	test('el anillo de foco va por dentro: las listas largas desplazan', () => {
		expect(grupo().findAll('[role="radio"]')[0]?.classes()).toContain('focus-visible:-outline-offset-2');
	});

	test('la ranura de la opción recibe la opción y si está elegida', () => {
		const vista = mount(OptionGroup, {
			props: { options: SALIDAS.slice(0, 2), label: 'Salida', modelValue: 'hdmi' },
			slots: { option: ({ option, checked }: { option: { label: string }; checked: boolean }) => `${option.label}:${checked}` },
		});
		vistas.push(vista);

		expect(vista.text()).toContain('HDMI:true');
		expect(vista.text()).toContain('Auriculares:false');
	});
});

describe('el control segmentado', () => {
	const VISTAS = [
		{ value: 'list', label: 'Lista', icon: 'view-list', iconOnly: true },
		{ value: 'grid', label: 'Cuadrícula', icon: 'view-grid', iconOnly: true },
	];

	test('es un grupo de radios con el mismo teclado', async () => {
		const vista = mount(SegmentedControl, {
			props: { options: VISTAS, label: 'Vista', modelValue: 'list' },
			attachTo: document.body,
		});
		vistas.push(vista);
		const [lista, cuadricula] = vista.findAll('[role="radio"]');

		expect(vista.attributes('role')).toBe('radiogroup');
		expect([lista?.attributes('tabindex'), cuadricula?.attributes('tabindex')]).toEqual(['0', '-1']);
		(lista?.element as HTMLElement).focus();
		await lista?.trigger('keydown', { key: 'ArrowRight' });
		await nextTick();

		expect(vista.emitted('update:modelValue')?.[0]).toEqual(['grid']);
		expect(document.activeElement).toBe(cuadricula?.element);
	});

	test('sólo icono: el texto queda como nombre y como globo', () => {
		const opcion = mount(SegmentedControl, { props: { options: VISTAS, label: 'Vista' } }).find('[role="radio"]');

		expect(opcion.attributes('aria-label')).toBe('Lista');
		expect(opcion.attributes('title')).toBe('Lista');
		expect(opcion.text()).toBe('');
	});

	test('la elegida lleva el velo de acento, no el relleno pleno', () => {
		const elegida = mount(SegmentedControl, {
			props: { options: VISTAS, label: 'Vista', modelValue: 'grid' },
		}).findAll('[role="radio"]')[1];

		expect(elegida?.classes()).toContain('bg-ui-selected-accent');
		expect(elegida?.classes().join(' ')).not.toMatch(/(^|\s)bg-primary(\s|$)|text-tx-on-primary/);
	});

	test('con enlaces es una navegación, con la página actual marcada', async () => {
		const secciones = [
			{ value: 'discover', label: 'Descubrir', href: '#/discover' },
			{ value: 'updates', label: 'Actualizaciones', href: '#/updates', badge: 3, badgeTone: 'warning' as const },
		];
		const vista = mount(SegmentedControl, { props: { options: secciones, label: 'Secciones', modelValue: 'discover' } });
		const [descubrir, actualizaciones] = vista.findAll('a');

		expect(vista.element.tagName).toBe('NAV');
		expect(vista.find('[role="radio"]').exists()).toBe(false);
		expect(descubrir?.attributes('aria-current')).toBe('page');
		expect(actualizaciones?.attributes('aria-current')).toBeUndefined();
		expect(actualizaciones?.text()).toContain('3');

		await actualizaciones?.trigger('click');
		expect(vista.emitted('navigate')?.[0]?.[0]).toBe('updates');
		expect(vista.emitted('update:modelValue')?.[0]).toEqual(['updates']);
	});

	test('las pastillas se parten en varias líneas antes de salirse', () => {
		const vista = mount(SegmentedControl, { props: { options: VISTAS, label: 'Vista', variant: 'chips' } });

		expect(vista.classes()).toContain('flex-wrap');
		expect(vista.find('[role="radio"]').classes()).toContain('rounded-corner-full');
	});

	test('cada opción mide 32 de alto como mínimo', () => {
		const opcion = mount(SegmentedControl, { props: { options: VISTAS, label: 'Vista' } }).find('[role="radio"]');

		expect(opcion.classes()).toContain('min-h-8');
	});
});
