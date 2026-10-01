/**
 * Las extensiones de la 2.2.0 a componentes que ya estaban: el menú, la
 * bandeja, la barra lateral y el icono del tema.
 *
 * Es una minor: lo primero que se comprueba de cada una es que **sin pedirla**
 * el componente dibuja lo mismo que antes. Después, lo nuevo.
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mount, type VueWrapper } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import ToggleControl from '../src/controls/ToggleControl.vue';
import DropdownMenu from '../src/dropdown/DropdownMenu.vue';
import DropdownMenuContent from '../src/dropdown/DropdownMenuContent.vue';
import DropdownMenuItem from '../src/dropdown/DropdownMenuItem.vue';
import DropdownMenuTrigger from '../src/dropdown/DropdownMenuTrigger.vue';
import ThemeIcon from '../src/icons/ThemeIcon.vue';
import * as library from '../src/index';
import SideBar from '../src/sidebar/SideBar.vue';
import SideButton from '../src/sidebar/SideButton.vue';
import TrayIconButton from '../src/tray/TrayIconButton.vue';
import { olvidarTodo, pedidosDeIcono, ponerEnElTema, traducir, vaciarElCatalogo } from './dobles';

const views: VueWrapper[] = [];
function render<T>(component: T, options: Record<string, unknown> = {}) {
	// biome-ignore lint/suspicious/noExplicitAny: el tipo del componente lo decide quien llama.
	const view = mount(component as any, options);
	views.push(view);
	return view;
}

const waitForIcons = () => new Promise((done) => setTimeout(done, 0));

beforeEach(() => olvidarTodo());
afterEach(() => {
	for (const view of views.splice(0)) view.unmount();
	vaciarElCatalogo();
	document.body.innerHTML = '';
});

describe('el ítem de menú', () => {
	test('sin pedir nada, sigue siendo un menuitem sin aria-checked', () => {
		const view = render(DropdownMenuItem, { slots: { default: 'Copiar' } });

		expect(view.attributes('role')).toBe('menuitem');
		expect(view.attributes('aria-checked')).toBeUndefined();
		expect(view.find('[data-check]').exists()).toBe(false);
	});

	test('con checked es una casilla de menú, y al elegirla se invierte', async () => {
		const view = render(DropdownMenuItem, { props: { checked: false }, slots: { default: 'Mostrar ocultos' } });

		expect(view.attributes('role')).toBe('menuitemcheckbox');
		expect(view.attributes('aria-checked')).toBe('false');
		await view.trigger('click');
		expect(view.emitted('update:checked')).toEqual([[true]]);
		expect(view.emitted('select')).toHaveLength(1);
	});

	test('la marca: la tilde del tema en la casilla, el punto en la radio, la columna vacía si no está', () => {
		const box = render(DropdownMenuItem, { props: { checked: true } });
		expect(box.get('[data-check]').findComponent(ThemeIcon).props('name')).toBe('object-select');

		const radio = render(DropdownMenuItem, { props: { checked: true, toggle: 'radio' } });
		expect(radio.attributes('role')).toBe('menuitemradio');
		expect(radio.get('[data-check] span').classes()).toContain('rounded-corner-full');

		const off = render(DropdownMenuItem, { props: { checked: false } });
		expect(off.get('[data-check]').element.children).toHaveLength(0);
	});

	test('la radio elegida queda marcada, no se invierte', async () => {
		const view = render(DropdownMenuItem, { props: { checked: true, toggle: 'radio' } });
		await view.trigger('click');

		expect(view.emitted('update:checked')).toEqual([[true]]);
	});

	test('apagado no se marca', async () => {
		const view = render(DropdownMenuItem, { props: { checked: false, disabled: true } });
		await view.trigger('click');

		expect(view.emitted('update:checked')).toBeUndefined();
	});

	test('el atajo son teclas de Kbd al extremo derecho; el icono y la descripción', () => {
		const view = render(DropdownMenuItem, {
			props: { shortcut: ['Ctrl', 'C'], icon: 'edit-copy' },
			slots: { default: 'Copiar', description: 'Al portapapeles' },
		});

		expect(view.findAll('kbd kbd').map((key) => key.text())).toEqual(['Ctrl', 'C']);
		expect(view.findAllComponents(ThemeIcon).some((icon) => icon.props('name') === 'edit-copy')).toBe(true);
		expect(view.text()).toContain('Al portapapeles');
	});

	test('inset corre el texto columnas de icono', () => {
		const view = render(DropdownMenuItem, { props: { inset: 2 } });

		expect(view.attributes('style')).toContain('padding-inline-start: calc(0.75rem + 3.5rem)');
	});

	test('danger tiñe el velo y no el texto', () => {
		const view = render(DropdownMenuItem, { props: { danger: true } });

		expect(view.classes()).toContain('text-tx-main');
		expect(view.classes()).toContain('hover:bg-status-error/10');
		expect(view.classes()).not.toContain('text-status-error');
	});

	test('las flechas del menú recorren también las casillas y las radios', async () => {
		render(DropdownMenu, {
			attachTo: document.body,
			slots: {
				default: () => [
					h(DropdownMenuTrigger, { asChild: true }, () => h('button', { type: 'button' }, 'Abrir')),
					h(DropdownMenuContent, null, () => [
						h(DropdownMenuItem, null, () => 'Uno'),
						h(DropdownMenuItem, { checked: true }, () => 'Dos'),
						h(DropdownMenuItem, { checked: false, toggle: 'radio' }, () => 'Tres'),
					]),
				],
			},
		});
		const button = document.querySelector('button') as HTMLButtonElement;
		button.focus();
		button.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
		await nextTick();
		await nextTick();
		const menu = document.querySelector('[role="menu"]') as HTMLElement;

		menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }));
		expect(document.activeElement?.getAttribute('role')).toBe('menuitemradio');
		menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }));
		expect(document.activeElement?.getAttribute('role')).toBe('menuitemcheckbox');
	});
});

describe('el botón que alterna', () => {
	test('sin pedir nada, ni punto ni número ni capa', () => {
		const view = render(ToggleControl, { props: { label: 'Wi-Fi', name: 'network-wireless' } });

		expect(view.find('[data-indicator]').exists()).toBe(false);
		expect(view.find('[data-badge]').exists()).toBe(false);
		expect(view.attributes('aria-label')).toBe('Wi-Fi');
	});

	test('el punto y el número se suman al nombre, porque solos no se oyen', () => {
		const view = render(ToggleControl, {
			props: { label: 'Bluetooth', indicator: { tone: 'success', label: 'Conectado' }, badge: 2 },
		});

		expect(view.attributes('aria-label')).toBe('Bluetooth, Conectado, 2');
		expect(view.get('[data-badge]').text()).toBe('2');
		expect(view.get('[data-indicator]').exists()).toBe(true);
	});

	test('cero no dibuja el número; la capa no recibe el puntero', () => {
		const view = render(ToggleControl, {
			props: { label: 'Wi-Fi', badge: 0 },
			slots: { overlay: '<i class="barras" />' },
		});

		expect(view.find('[data-badge]').exists()).toBe(false);
		expect(view.get('.barras').element.parentElement?.className).toContain('pointer-events-none');
	});
});

describe('el botón de la bandeja', () => {
	test('sin progreso no hay línea', () => {
		const view = render(TrayIconButton, { props: { name: 'nm-applet', alt: 'Red' } });

		expect(view.find('[data-progress]').exists()).toBe(false);
	});

	test('con progreso, una barra con nombre del catálogo, recortada', () => {
		traducir('tray.progress', 'Avance');
		const view = render(TrayIconButton, { props: { name: 'firefox', alt: 'Firefox', progress: 130 } });
		const bar = view.get('[data-progress] [role="progressbar"]');

		expect(bar.attributes('aria-valuenow')).toBe('100');
		expect(bar.attributes('aria-label')).toBe('Avance');
	});

	test('el icono prueba los respaldos y, si no, el dibujo de la aplicación', async () => {
		const view = render(TrayIconButton, {
			props: { name: 'app-que-no-esta', fallbacks: ['otro'], fallbackSrc: 'data-de-la-app', alt: 'App' },
		});
		await waitForIcons();
		await waitForIcons();

		expect(pedidosDeIcono.map((asked) => asked.nombre)).toEqual(['app-que-no-esta', 'otro']);
		expect(view.get('img').attributes('src')).toBe('data-de-la-app');
	});
});

describe('el icono del tema, con respaldos', () => {
	test('se queda con el primero que el tema tenga, en orden', async () => {
		ponerEnElTema('org.gnome.Nautilus', 'nautilus.svg');
		const view = render(ThemeIcon, { props: { name: 'nautilus', fallbacks: ['org.gnome.Nautilus', 'system-file-manager'] } });
		await waitForIcons();
		await waitForIcons();

		expect(view.get('img').attributes('src')).toBe('nautilus.svg');
		// El tercero no se pidió: el segundo ya resolvió.
		expect(pedidosDeIcono.map((asked) => asked.nombre)).toEqual(['nautilus', 'org.gnome.Nautilus']);
	});

	test('el nombre pedido le gana a los respaldos', async () => {
		ponerEnElTema('firefox', 'firefox.svg');
		ponerEnElTema('web-browser', 'web.svg');
		const view = render(ThemeIcon, { props: { name: 'firefox', fallbacks: ['web-browser'] } });
		await waitForIcons();

		expect(view.get('img').attributes('src')).toBe('firefox.svg');
	});

	test('sin ninguno y sin dibujo de respaldo, el hueco', async () => {
		const view = render(ThemeIcon, { props: { name: 'nada', fallbacks: ['tampoco'] } });
		await waitForIcons();
		await waitForIcons();

		expect(view.find('img').exists()).toBe(false);
		expect(view.element.tagName).toBe('SPAN');
	});

	test('cambiar los respaldos vuelve a resolver', async () => {
		ponerEnElTema('b', 'b.svg');
		const view = render(ThemeIcon, { props: { name: 'nada', fallbacks: ['a'] } });
		await waitForIcons();
		await view.setProps({ fallbacks: ['b'] });
		await waitForIcons();
		await waitForIcons();

		expect(view.get('img').attributes('src')).toBe('b.svg');
	});
});

describe('la barra lateral', () => {
	test('sin pie, no hay pie', () => {
		const view = render(SideBar);

		expect(view.find('[data-sidebar-footer]').exists()).toBe(false);
	});

	test('el pie queda fuera de lo que desplaza y sabe si está plegada', () => {
		const view = render(SideBar, {
			props: { collapsed: true },
			slots: { footer: ({ collapsed }: { collapsed: boolean }) => h('p', { class: 'pie' }, String(collapsed)) },
		});
		const footer = view.get('[data-sidebar-footer]');

		expect(footer.text()).toBe('true');
		expect(footer.element.parentElement?.tagName).toBe('ASIDE');
		expect(footer.classes()).toContain('shrink-0');
	});

	test('el botón con descripción la ata y, plegado, la pasa al globo', async () => {
		const view = render(SideButton, { props: { label: 'Disco', description: 'Dónde se instala' } });
		const described = view.get(`#${view.attributes('aria-describedby')}`);

		expect(described.text()).toBe('Dónde se instala');
		await view.setProps({ collapsed: true });
		expect(view.attributes('title')).toBe('Disco — Dónde se instala');
		expect(view.get(`#${view.attributes('aria-describedby')}`).classes()).toContain('sr-only');
	});

	test('la ranura del icono reemplaza al icono del tema', () => {
		const view = render(SideButton, { props: { label: 'Paso', icon: 'x' }, slots: { icon: '<b class="numero">2</b>' } });

		expect(view.find('.numero').exists()).toBe(true);
		expect(view.findComponent(ThemeIcon).exists()).toBe(false);
	});

	test('la descripción de una categoría llega al botón', () => {
		const view = render(SideBar, {
			props: { categories: [{ id: 'a', title: 'A', items: [{ id: 'disk', label: 'Disco', description: 'Dónde' }] }] },
		});

		expect(view.findComponent(SideButton).props('description')).toBe('Dónde');
	});
});

describe('los nombres del icono del tema', () => {
	test('salen en inglés y los de la 2.1.0 siguen como alias', () => {
		expect(library.forgetThemeIcons).toBe(library.olvidarLosIconosDelTema);
		expect(library.useThemeVersion).toBe(library.usarLaVersionDelTema);
	});
});
