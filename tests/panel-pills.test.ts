/**
 * Las dos piezas de la 2.11.0, que pidió el panel en píldoras flotantes del
 * escritorio (vasak-desktop#151): la píldora y los espacios de trabajo.
 *
 * Lo que se fija es lo que se rompe sin que nada falle: una píldora que se
 * vuelve opaca o gana un `backdrop-blur` (el desenfoque es de Wayfire), un
 * dato que informa y se anuncia como botón, un nombre de red largo que la
 * ensancha hasta sacar a las demás del panel, o un espacio de trabajo que
 * cambia con sólo pasar las flechas.
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mount, type VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import PanelPill from '../src/panel/PanelPill.vue';
import WorkspaceSwitcher from '../src/panel/WorkspaceSwitcher.vue';
import { olvidarTodo, traducir, vaciarElCatalogo } from './dobles';

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

describe('la píldora del panel', () => {
	test('es translúcida sobre el escritorio: ui-shell, canto fino y sin backdrop-blur', () => {
		const root = render(PanelPill, { props: { label: '50' } }).find('[data-panel-pill]');
		const classes = root.classes();

		expect(classes).toEqual(expect.arrayContaining(['bg-ui-shell', 'border-ui-line', 'rounded-corner-full']));
		expect(classes.join(' ')).not.toMatch(/backdrop-blur|bg-ui-float|bg-ui-bg(?!\/)/);
	});

	test('pasar el puntero no la vuelve opaca: el velo va en el ::before', () => {
		const classes = render(PanelPill, { props: { label: 'A' } }).find('[data-panel-pill]').classes();

		expect(classes).toContain('hover:before:bg-ui-hover');
		expect(classes).toContain('active:before:bg-ui-pressed');
		expect(classes.join(' ')).not.toMatch(/(^|\s)hover:bg-ui-/);
	});

	test('activa se rellena en el primario con el texto que se lee encima', () => {
		const view = render(PanelPill, { props: { label: 'Fibernet', caption: 'Wi-Fi', icon: 'network-wireless', active: true } });
		const root = view.find('[data-panel-pill]');

		expect(root.classes()).toEqual(expect.arrayContaining(['bg-primary', 'text-tx-on-primary']));
		expect(root.classes()).not.toContain('bg-ui-shell');
		expect(root.attributes('data-active')).toBe('true');
		expect(view.find('[data-pill-caption]').classes()).toContain('text-tx-on-primary');
	});

	test('con interactive es un botón con nombre, foco visible y emite click', async () => {
		const view = render(PanelPill, { props: { icon: 'system-search', accessibleLabel: 'Buscar' } });
		const root = view.find('[data-panel-pill]');

		expect(root.element.tagName).toBe('BUTTON');
		expect(root.attributes('type')).toBe('button');
		expect(root.attributes('aria-label')).toBe('Buscar');
		expect(root.classes()).toContain('focus-visible:outline-ui-focus');
		await root.trigger('click');
		expect(view.emitted('click')).toHaveLength(1);
	});

	test('sin interactive informa: un div quieto que no se pinta ni emite', async () => {
		const view = render(PanelPill, { props: { label: '100', interactive: false } });
		const root = view.find('[data-panel-pill]');

		expect(root.element.tagName).toBe('DIV');
		expect(root.attributes('type')).toBeUndefined();
		expect(root.classes().join(' ')).not.toMatch(/hover:/);
		await root.trigger('click');
		expect(view.emitted('click')).toBeUndefined();
	});

	test('expanded dice que lo que abre está abierto, con el velo de seleccionado', () => {
		const open = render(PanelPill, { props: { label: '10:41', expanded: true } }).find('[data-panel-pill]');
		expect(open.attributes('aria-expanded')).toBe('true');
		expect(open.classes()).toContain('before:bg-ui-selected-accent');

		const closed = render(PanelPill, { props: { label: '10:41', expanded: false } }).find('[data-panel-pill]');
		expect(closed.attributes('aria-expanded')).toBe('false');

		const unknown = render(PanelPill, { props: { label: '10:41' } }).find('[data-panel-pill]');
		expect(unknown.attributes('aria-expanded')).toBeUndefined();
	});

	test('un nombre largo se corta en un renglón y no la ensancha más que su lugar', () => {
		const name = 'Fibernet-IA-5G-Departamento-Tercer-Piso';
		const view = render(PanelPill, { props: { label: name, caption: '01:42 / 04:19' } });
		const root = view.find('[data-panel-pill]');

		expect(root.classes()).toEqual(expect.arrayContaining(['min-w-0', 'max-w-full', 'h-8', 'tabular-nums']));
		expect(view.find('[data-pill-label]').classes()).toEqual(expect.arrayContaining(['truncate', 'min-w-0']));
		expect(view.find('[data-pill-caption]').classes()).toEqual(expect.arrayContaining(['truncate', 'text-label-xs']));
		expect(root.attributes('title')).toBe(`${name} · 01:42 / 04:19`);
	});

	test('los dos renglones entran en los 32 px: sin interlineado propio', () => {
		const view = render(PanelPill, { props: { label: '10:41', caption: 'Domingo 22' } });
		expect(view.find('[data-pill-label]').classes()).toContain('leading-none');
		expect(view.find('[data-pill-caption]').classes()).toContain('leading-none');
	});

	test('el icono es del tema y no se anuncia aparte del texto', () => {
		const view = render(PanelPill, { props: { label: '50', icon: 'audio-volume-medium' } });
		const icon = view.findComponent({ name: 'ThemeIcon' });

		expect(icon.exists()).toBe(true);
		expect(icon.props('name')).toBe('audio-volume-medium');
		expect(icon.props('alt')).toBe('');
	});

	test('sin icono ni texto no dibuja huecos, y la ranura va adentro', () => {
		const view = render(PanelPill, { props: { interactive: false }, slots: { default: '<i data-inside />' } });

		expect(view.find('img').exists()).toBe(false);
		expect(view.find('[data-pill-text]').exists()).toBe(false);
		expect(view.find('[data-panel-pill] [data-inside]').exists()).toBe(true);
	});

	test('de costado se apila con el ancho de la barra', () => {
		const classes = render(PanelPill, { props: { icon: 'a', orientation: 'vertical' } }).find('[data-panel-pill]').classes();
		expect(classes).toEqual(expect.arrayContaining(['flex-col', 'w-8']));
	});

	test('flush le saca el relleno a un grupo', () => {
		const classes = render(PanelPill, { props: { flush: true, interactive: false } }).find('[data-panel-pill]').classes();
		expect(classes.join(' ')).not.toMatch(/(^|\s)p[xy]-/);
	});

	test('los atributos que recibe llegan a la raíz', () => {
		const root = render(PanelPill, { props: { label: 'A' }, attrs: { 'data-x': '1', class: 'extra' } }).find(
			'[data-panel-pill]'
		);
		expect(root.attributes('data-x')).toBe('1');
		expect(root.classes()).toEqual(expect.arrayContaining(['extra', 'bg-ui-shell']));
	});
});

describe('los espacios de trabajo', () => {
	test('un botón por espacio, el actual en el primario y con aria-current', () => {
		const view = render(WorkspaceSwitcher, { props: { count: 6, modelValue: 2 } });
		const buttons = view.findAll('[data-workspace]');

		expect(buttons).toHaveLength(6);
		expect(buttons.map((b) => b.text())).toEqual(['1', '2', '3', '4', '5', '6']);
		expect(buttons[2]?.attributes('aria-current')).toBe('true');
		expect(buttons[0]?.attributes('aria-current')).toBeUndefined();
		expect(buttons[2]?.find('[data-workspace-mark]').classes()).toContain('bg-primary');
		expect(buttons[0]?.find('[data-workspace-mark]').classes()).toContain('text-tx-muted');
	});

	test('va en una píldora quieta del panel, sin relleno y con nombre de grupo', () => {
		const view = render(WorkspaceSwitcher, { props: { count: 3 } });
		const root = view.find('[data-workspace-switcher] [data-panel-pill]');

		expect(root.element.tagName).toBe('DIV');
		expect(root.attributes('role')).toBe('group');
		expect(root.attributes('aria-label')).toBe('Workspaces');
		expect(root.classes()).toContain('bg-ui-shell');
		expect(root.classes().join(' ')).not.toMatch(/backdrop-blur/);
	});

	test('se apunta en 32 de ancho aunque el círculo sea de 24', () => {
		const view = render(WorkspaceSwitcher, { props: { count: 2 } });
		expect(view.find('[data-workspace]').classes()).toContain('w-8');
		expect(view.find('[data-workspace-mark]').classes()).toContain('size-6');
	});

	test('cada botón se llama como diga labels, o como el catálogo', () => {
		const named = render(WorkspaceSwitcher, { props: { count: 2, labels: ['Correo', 'Código'] } });
		expect(named.findAll('[data-workspace]').map((b) => b.attributes('aria-label'))).toEqual(['Correo', 'Código']);

		const plain = render(WorkspaceSwitcher, { props: { count: 3 } });
		expect(plain.findAll('[data-workspace]')[2]?.attributes('aria-label')).toBe('Workspace 3');

		traducir('workspaces.item', 'Escritorio {0}');
		traducir('workspaces.label', 'Escritorios');
		const translated = render(WorkspaceSwitcher, { props: { count: 1 } });
		expect(translated.find('[data-workspace]').attributes('aria-label')).toBe('Escritorio 1');
		expect(translated.find('[role="group"]').attributes('aria-label')).toBe('Escritorios');
	});

	test('tocar otro lo elige; tocar el actual no avisa nada', async () => {
		const view = render(WorkspaceSwitcher, { props: { count: 4, modelValue: 0 } });

		await view.findAll('[data-workspace]')[0]?.trigger('click');
		expect(view.emitted('change')).toBeUndefined();

		await view.findAll('[data-workspace]')[3]?.trigger('click');
		expect(view.emitted('update:modelValue')?.[0]).toEqual([3]);
		expect(view.emitted('change')?.[0]).toEqual([3]);
	});

	test('un solo Tab entra, en el actual, y las flechas mueven el foco sin cambiar de espacio', async () => {
		const view = render(WorkspaceSwitcher, { props: { count: 3, modelValue: 1 } });
		const buttons = () => view.findAll('[data-workspace]');

		expect(buttons().map((b) => b.attributes('tabindex'))).toEqual(['-1', '0', '-1']);

		const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
		buttons()[1]?.element.dispatchEvent(event);
		await nextTick();
		await nextTick();

		expect(event.defaultPrevented).toBe(true);
		expect(document.activeElement).toBe(buttons()[2]?.element as Element);
		expect(buttons().map((b) => b.attributes('tabindex'))).toEqual(['-1', '-1', '0']);
		expect(view.emitted('change')).toBeUndefined();

		const home = new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true });
		buttons()[2]?.element.dispatchEvent(home);
		await nextTick();
		await nextTick();
		expect(document.activeElement).toBe(buttons()[0]?.element as Element);
		expect(view.emitted('change')).toBeUndefined();
	});

	test('el actual fuera de rango se acota, y sin espacios no se dibuja nada', () => {
		const view = render(WorkspaceSwitcher, { props: { count: 2, modelValue: 9 } });
		expect(view.findAll('[data-workspace]')[1]?.attributes('aria-current')).toBe('true');

		const none = render(WorkspaceSwitcher, { props: { count: 0 } });
		expect(none.find('[data-workspace-switcher]').exists()).toBe(false);
	});

	test('de costado se apilan', () => {
		const view = render(WorkspaceSwitcher, { props: { count: 2, orientation: 'vertical' } });
		expect(view.find('[data-panel-pill]').classes()).toContain('flex-col');
		expect(view.find('[data-workspace]').classes()).toContain('w-full');
	});

	test('deshabilitado no elige', async () => {
		const view = render(WorkspaceSwitcher, { props: { count: 2, disabled: true } });
		await view.findAll('[data-workspace]')[1]?.trigger('click');
		expect(view.emitted('change')).toBeUndefined();
	});
});
