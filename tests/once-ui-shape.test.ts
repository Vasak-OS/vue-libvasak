/**
 * La forma de la primera tanda de vue-libvasak#74, componente por componente.
 *
 * Lo que la guardia de tokens no puede decir mirando el texto: qué clase lleva
 * cada estado, desde dónde crece un menú, de dónde sale un texto que nadie
 * pasó. Las clases se comprueban porque **son** la forma: si cambian, cambian
 * en las dieciséis aplicaciones a la vez.
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mount, type VueWrapper } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import ListCard from '../src/cards/ListCard.vue';
import DialogFooter from '../src/dialog/DialogFooter.vue';
import DropdownMenu from '../src/dropdown/DropdownMenu.vue';
import DropdownMenuContent from '../src/dropdown/DropdownMenuContent.vue';
import DropdownMenuItem from '../src/dropdown/DropdownMenuItem.vue';
import DropdownMenuLabel from '../src/dropdown/DropdownMenuLabel.vue';
import DropdownMenuSeparator from '../src/dropdown/DropdownMenuSeparator.vue';
import DropdownMenuTrigger from '../src/dropdown/DropdownMenuTrigger.vue';
import TextInput from '../src/forms/TextInput.vue';
import SearchField from '../src/search/SearchField.vue';
import SideBar from '../src/sidebar/SideBar.vue';
import TabBar from '../src/tabs/TabBar.vue';
import TabItem from '../src/tabs/TabItem.vue';
import { nextTitleId, useDialog } from '../src/dialog/types';
import { useMenu } from '../src/dropdown/types';
import { useTooltip } from '../src/tooltip/types';
import { defineComponent } from 'vue';
import { olvidarTodo, pedidosDeIcono, traducir, vaciarElCatalogo } from './dobles';

let mounted: VueWrapper | null = null;

beforeEach(() => {
	olvidarTodo();
	vaciarElCatalogo();
});

afterEach(() => {
	mounted?.unmount();
	mounted = null;
	document.body.innerHTML = '';
});

describe('el ítem de menú', () => {
	test('pasar por encima no pinta el acento: es el velo neutro', () => {
		// Era `hover:bg-primary hover:text-tx-on-primary`: una fila rosa con el
		// texto oscuro en cada movimiento del puntero.
		const classes = mount(DropdownMenuItem, { slots: { default: 'Copiar' } }).classes();

		expect(classes).toContain('hover:bg-ui-hover');
		expect(classes).toContain('active:bg-ui-pressed');
		expect(classes.join(' ')).not.toMatch(/(hover|focus-visible):(bg|text)-(primary|tx-on-primary)/);
	});

	test('el foco del teclado va por dentro, para que el desplazamiento no lo corte', () => {
		const classes = mount(DropdownMenuItem, { slots: { default: 'Copiar' } }).classes();

		expect(classes).toContain('focus-visible:-outline-offset-2');
		expect(classes).toContain('focus-visible:outline-ui-focus');
	});

	test('apagado no tiene hover, pero sigue siendo un ítem', () => {
		const vista = mount(DropdownMenuItem, { props: { disabled: true }, slots: { default: 'Pegar' } });

		expect(vista.classes()).toContain('opacity-50');
		expect(vista.classes().join(' ')).not.toContain('hover:');
		expect(vista.attributes('tabindex')).toBe('0');
	});

	test('el título del menú se distingue de una opción', () => {
		const classes = mount(DropdownMenuLabel, { slots: { default: 'Archivo' } }).classes();

		expect(classes).toContain('text-label-xs');
		expect(classes).toContain('text-tx-muted');
	});

	test('el separador es un píxel fino que llega al canto del panel', () => {
		const classes = mount(DropdownMenuSeparator).classes();

		expect(classes).toEqual(expect.arrayContaining(['h-px', 'bg-ui-line-weak', '-mx-1']));
	});
});

describe('el panel del menú', () => {
	function openMenu(side: 'top' | 'bottom' | 'left' | 'right', align: 'start' | 'center' | 'end' = 'start') {
		mounted = mount(DropdownMenu, {
			attachTo: document.body,
			slots: {
				default: () => [
					h(DropdownMenuTrigger, { asChild: true }, () => h('button', { type: 'button' }, 'Abrir')),
					h(DropdownMenuContent, { side, align }, () => [h(DropdownMenuItem, null, () => 'Uno')]),
				],
			},
		});
		return mounted;
	}

	async function settle() {
		await nextTick();
		await new Promise((listo) => requestAnimationFrame(() => listo(null)));
		await nextTick();
	}

	test('es una superficie flotante opaca, con canto fino y sin desenfoque', async () => {
		openMenu('bottom');
		const panel = document.body.querySelector<HTMLElement>('[role="menu"]');

		expect(panel?.className).toContain('bg-ui-float');
		expect(panel?.className).toContain('border-ui-line');
		expect(panel?.className).toContain('rounded-corner-l');
		expect(panel?.className).toContain('shadow-surface-m');
		expect(panel?.className).not.toMatch(/backdrop-blur|bg-ui-bg|border-primary/);
	});

	test('crece desde la esquina que toca al disparador', async () => {
		const vista = openMenu('bottom', 'start');
		await vista.get('button').trigger('click');
		await settle();

		const panel = document.body.querySelector<HTMLElement>('[role="menu"]');
		expect(panel?.style.transformOrigin).toBe('top left');
	});

	test('nunca más ancho que la ventana', async () => {
		openMenu('bottom');
		const panel = document.body.querySelector<HTMLElement>('[role="menu"]');

		expect(panel?.style.maxWidth).toBe('calc(100vw - 16px)');
	});
});

describe('el campo de texto', () => {
	test('mantiene el borde de 3:1 y el anillo de foco de 2 px', () => {
		// Decisión 5 del 30/09/2026: un campo es un control, y su contorno
		// tiene que percibirse.
		const classes = mount(TextInput, { props: { modelValue: '' } }).classes();

		expect(classes).toContain('border-ui-border-strong');
		expect(classes).toContain('h-8');
		expect(classes).toContain('focus-visible:outline-2');
		expect(classes).toContain('focus-visible:outline-offset-2');
		expect(classes.join(' ')).not.toMatch(/ring-1|py-1\.5/);
	});

	test('inválido, el borde de error', () => {
		const classes = mount(TextInput, { props: { modelValue: '', invalid: true } }).classes();

		expect(classes).toContain('border-status-error');
		expect(classes).not.toContain('border-ui-border-strong');
	});

	test('focus() es el nombre nuevo y enfocar() sigue andando', () => {
		const vista = mount(TextInput, { props: { modelValue: '' }, attachTo: document.body });
		mounted = vista;
		const expuesto = vista.vm as unknown as { focus: () => boolean; enfocar: () => boolean };

		expect(expuesto.focus()).toBe(true);
		(document.activeElement as HTMLElement).blur();
		expect(expuesto.enfocar()).toBe(true);
	});
});

describe('el campo de búsqueda', () => {
	test('mientras busca dibuja el icono de trabajo del estándar', async () => {
		// `process-working` es el nombre del estándar de freedesktop y lo traen
		// los dos temas de VasakOS; `content-loading` no es del estándar.
		// Y es la misma rueda que la del botón.
		mount(SearchField, { props: { modelValue: 'x', busy: true, label: 'Buscar' } });
		await new Promise((listo) => setTimeout(listo, 0));

		const names = pedidosDeIcono.map((pedido) => pedido.nombre);
		expect(names).toContain('process-working-symbolic');
		expect(names).not.toContain('content-loading');
	});

	test('la cruz se nombra con la propiedad, con el catálogo o con el respaldo', async () => {
		const conPropiedad = mount(SearchField, { props: { modelValue: 'x', label: 'Buscar', clearLabel: 'Borrar' } });
		expect(conPropiedad.get('button').attributes('aria-label')).toBe('Buscar: Borrar');

		traducir('search.clear', 'Limpiar');
		const conCatalogo = mount(SearchField, { props: { modelValue: 'x', label: 'Buscar' } });
		expect(conCatalogo.get('button').attributes('aria-label')).toBe('Buscar: Limpiar');

		vaciarElCatalogo();
		const sinNada = mount(SearchField, { props: { modelValue: 'x' } });
		expect(sinNada.get('button').attributes('aria-label')).toBe('Vaciar');
	});
});

describe('la fila de lista', () => {
	test('es una tarjeta con canto fino sobre la superficie', () => {
		const classes = mount(ListCard).classes();

		expect(classes).toEqual(expect.arrayContaining(['rounded-corner-l', 'border-ui-line', 'bg-ui-surface/70', 'min-w-0']));
	});
});

describe('las pestañas', () => {
	const TABS = [
		{ id: 'a', label: 'Uno' },
		{ id: 'b', label: 'Dos', dirty: true },
	];

	test('la activa lleva el velo de acento, no el relleno pleno del primario', () => {
		// Decisión 4: lo elegido se marca con el acento, en velo.
		const activa = mount(TabItem, { props: { tab: TABS[0], active: true } });
		const otra = mount(TabItem, { props: { tab: TABS[0], active: false } });

		expect(activa.classes()).toContain('bg-ui-selected-accent');
		expect(activa.classes()).toContain('font-semibold');
		expect(activa.classes().join(' ')).not.toMatch(/bg-primary|text-tx-on-primary|font-bold/);
		expect(otra.classes()).toContain('hover:bg-ui-hover');
	});

	test('sin borde en ningún estado', () => {
		const classes = mount(TabItem, { props: { tab: TABS[0] } }).classes();

		expect(classes.join(' ')).not.toMatch(/(^|\s)border(-|\s|$)/);
	});

	test('el botón de cerrar se nombra con el catálogo si nadie lo pasa', () => {
		traducir('tabs.close', 'Cerrar');
		traducir('tabs.unsaved', 'Sin guardar');
		const conCambios = mount(TabItem, { props: { tab: TABS[1] } });
		const activa = mount(TabItem, { props: { tab: TABS[0], active: true } });

		expect(conCambios.attributes('aria-label')).toBe('Dos · Sin guardar');
		expect(activa.get('button').attributes('aria-label')).toBe('Cerrar: Uno');
	});

	test('y sin catálogo, el respaldo de siempre', () => {
		const vista = mount(TabItem, { props: { tab: TABS[0], active: true } });

		expect(vista.get('button').attributes('aria-label')).toBe('Close: Uno');
	});

	test('arrastrando, una barra marca el borde por donde cae', async () => {
		const vista = mount(TabBar, { props: { tabs: [...TABS, { id: 'c', label: 'Tres' }] } });
		const envoltorios = vista.findAll('[draggable="true"]');

		await envoltorios[0]?.trigger('dragstart', { dataTransfer: { setData() {}, effectAllowed: '' } });
		await envoltorios[2]?.trigger('dragover', { dataTransfer: { dropEffect: '' } });

		// Viene de antes, así que cae después: la barra va a la derecha.
		const classes = envoltorios[2]?.classes().join(' ') ?? '';
		expect(classes).toContain('after:-right-0.5');
		expect(classes).toContain('after:bg-ui-focus');
		expect(classes).not.toContain('ring-');
	});
});

describe('la barra lateral', () => {
	test('el botón de plegar se nombra con el catálogo si nadie lo pasa', () => {
		traducir('sidebar.collapse', 'Plegar');
		const vista = mount(SideBar, { props: { title: 'Configuración' } });

		expect(vista.get('aside button').attributes('aria-label')).toBe('Plegar');
	});

	test('y la propiedad le gana al catálogo', () => {
		traducir('sidebar.collapse', 'Plegar');
		const vista = mount(SideBar, { props: { title: 'Configuración', collapseLabel: 'Achicar' } });

		expect(vista.get('aside button').attributes('aria-label')).toBe('Achicar');
	});
});

describe('el pie del diálogo', () => {
	test('se acomoda por el ancho del diálogo, no por el de la pantalla', () => {
		const vista = mount(DialogFooter, { attrs: { class: 'mt-4' }, slots: { default: 'x' } });

		expect(vista.classes()).toContain('@container');
		const inner = vista.element.firstElementChild as HTMLElement;
		expect(inner.classList.contains('@sm:flex-row')).toBe(true);
		// Lo que pasa quien lo usa va al elemento que se dibuja.
		expect(inner.classList.contains('mt-4')).toBe(true);
		expect(vista.classes()).not.toContain('mt-4');
	});
});

describe('los contextos sueltos', () => {
	/** Monta algo que pide el contexto sin que nadie lo provea, y lo devuelve. */
	function loose<T>(use: () => T): T {
		let context: T | undefined;
		mount(
			defineComponent({
				setup() {
					context = use();
					return () => h('i');
				},
			})
		);
		return context as T;
	}

	test('un ítem de menú sin menú se abre y se cierra igual', () => {
		// En una prueba o una vista previa se monta solo: tiene que andar.
		const menu = loose(useMenu);
		menu.show();
		expect(menu.open.value).toBe(true);
		menu.toggle();
		expect(menu.open.value).toBe(false);
		menu.toggle();
		menu.close();
		expect(menu.open.value).toBe(false);
		menu.setLabel('x');
		menu.setTrigger(null);
	});

	test('un tooltip sin raíz, también', () => {
		const tooltip = loose(useTooltip);
		tooltip.show();
		expect(tooltip.open.value).toBe(true);
		tooltip.hide();
		expect(tooltip.open.value).toBe(false);
		tooltip.setTrigger(null);
	});

	test('y un título de diálogo sin diálogo', () => {
		const dialog = loose(useDialog);
		expect(dialog.open.value).toBe(false);
		dialog.close();
		dialog.setTitle('x');
		expect(dialog.titleId.value).toBeNull();
	});

	test('cada título lleva un id propio', () => {
		expect(nextTitleId()).not.toBe(nextTitleId());
	});
});
