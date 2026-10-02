/**
 * Las extensiones de la 2.4.0 a componentes que ya estaban: lo que pidieron
 * las aplicaciones al adoptar la 2.2 y la 2.3 (vue-libvasak#74).
 *
 * Es una minor: lo primero que se comprueba de cada una es que **sin pedirla**
 * el componente dibuja lo mismo que antes. Después, lo nuevo.
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mount, type VueWrapper } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import Dialog from '../src/dialog/Dialog.vue';
import DialogContent from '../src/dialog/DialogContent.vue';
import DropdownMenuItem from '../src/dropdown/DropdownMenuItem.vue';
import EmptyState from '../src/feedback/EmptyState.vue';
import ToastArea from '../src/feedback/ToastArea.vue';
import OptionGroup from '../src/forms/OptionGroup.vue';
import SelectField from '../src/forms/SelectField.vue';
import TextInput from '../src/forms/TextInput.vue';
import Avatar from '../src/identity/Avatar.vue';
import IdentityBlock from '../src/identity/IdentityBlock.vue';
import Badge from '../src/indicators/Badge.vue';
import IconTile from '../src/indicators/IconTile.vue';
import ConfigSection from '../src/layout/ConfigSection.vue';
import SearchField from '../src/search/SearchField.vue';
import SearchSelect from '../src/search/SearchSelect.vue';
import SideBar from '../src/sidebar/SideBar.vue';
import AppBar from '../src/window/AppBar.vue';
import { olvidarTodo, vaciarElCatalogo } from './dobles';

const views: VueWrapper[] = [];
function render<T>(component: T, options: Record<string, unknown> = {}) {
	// biome-ignore lint/suspicious/noExplicitAny: el tipo del componente lo decide quien llama.
	const view = mount(component as any, options);
	views.push(view);
	return view;
}

beforeEach(() => olvidarTodo());
afterEach(() => {
	for (const view of views.splice(0)) view.unmount();
	vaciarElCatalogo();
	document.body.innerHTML = '';
});

describe('la insignia', () => {
	test('sin pedir nada, sigue topada a su contenedor y partiendo el texto', () => {
		const view = render(Badge, { props: { label: 'Predeterminado' } });

		expect(view.classes()).toEqual(expect.arrayContaining(['max-w-full', 'break-words']));
		expect(view.classes()).not.toContain('whitespace-nowrap');
		expect(view.attributes('data-counter')).toBeUndefined();
	});

	test('como contador no se parte ni se topa: «99+» queda en una línea sobre el icono', () => {
		// Puesta en absoluto sobre un icono de 28 px, con `max-w-full` y
		// `break-words` salía en tres renglones (desktop#146, #147).
		const view = render(Badge, { props: { label: '99+', counter: true, tone: 'accent', variant: 'solid' } });

		expect(view.classes()).toEqual(expect.arrayContaining(['whitespace-nowrap', 'tabular-nums', 'min-w-5', 'justify-center']));
		expect(view.classes()).not.toContain('max-w-full');
		expect(view.classes()).not.toContain('break-words');
		expect(view.attributes('data-counter')).toBe('true');
	});

	test('max corta el número y deja el resto como estaba', () => {
		expect(render(Badge, { props: { label: 120, max: 99, counter: true } }).text()).toBe('99+');
		expect(render(Badge, { props: { label: '120', max: 99 } }).text()).toBe('99+');
		expect(render(Badge, { props: { label: 7, max: 99 } }).text()).toBe('7');
		// Lo que no es un número no se toca.
		expect(render(Badge, { props: { label: 'Nuevo', max: 9 } }).text()).toBe('Nuevo');
	});

	test('acepta title y data-* en la raíz, sin un span alrededor', () => {
		const view = render(Badge, { props: { label: 3, title: 'foto-de-las-vacaciones.jpg' }, attrs: { 'data-count': '3' } });

		expect(view.attributes('title')).toBe('foto-de-las-vacaciones.jpg');
		expect(view.attributes('data-count')).toBe('3');
	});
});

describe('la barra: el centro en ventana angosta', () => {
	/**
	 * Un rectángulo fijo para cada elemento: happy-dom no maqueta, así que la
	 * barra se mediría en cero y no decidiría nada (que es lo correcto antes de
	 * maquetar).
	 */
	function layout(bar: number, sides: number, center: number, used = 0) {
		const original = HTMLElement.prototype.getBoundingClientRect;
		const width = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');
		HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
			if (this.hasAttribute('data-tauri-drag-region') && this.className.includes('relative')) {
				return { left: 0, right: bar, width: bar, top: 0, bottom: 40, height: 40, x: 0, y: 0, toJSON() {} } as DOMRect;
			}
			if (this.className.includes('flex-1') && this.hasAttribute('data-tauri-drag-region')) {
				return { left: sides, right: bar - sides, width: bar - 2 * sides, top: 0, bottom: 40, height: 40, x: sides, y: 0, toJSON() {} } as DOMRect;
			}
			return original.call(this);
		};
		Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
			configurable: true,
			get(this: HTMLElement) {
				if (this.style.width === 'max-content') return center;
				// Lo de la ranura por omisión, dentro de la zona del contenido.
				return this.classList.contains('pestanas') ? used : 0;
			},
		});
		return () => {
			HTMLElement.prototype.getBoundingClientRect = original;
			if (width) Object.defineProperty(HTMLElement.prototype, 'offsetWidth', width);
		};
	}

	const mountBar = (withTabs = false) =>
		render(AppBar, {
			props: { position: 'top', controls: [] },
			slots: {
				centro: () => h('span', { class: 'medio' }, 'Bandeja de entrada'),
				...(withTabs ? { default: () => h('div', { class: 'pestanas' }, 'Pestañas') } : {}),
			},
			attachTo: document.body,
		});

	test('sin maquetar no decide nada: queda centrado, como hasta la 2.3', async () => {
		const view = mountBar();
		await nextTick();
		await nextTick();

		expect(view.find('[data-app-bar-center="overlay"]').exists()).toBe(true);
		expect(view.find('[data-app-bar-center="inline"]').exists()).toBe(false);
	});

	test('si entra, centrado y con un tope que no llega a los costados', async () => {
		// Barra de 900, costados de 100: quedan 900 − 2 × (100 + 8) = 684.
		const restore = layout(900, 100, 200);
		try {
			const view = mountBar();
			await nextTick();
			await nextTick();

			const box = view.find('[data-app-bar-center="overlay"] > div');
			expect(box.exists()).toBe(true);
			expect((box.element as HTMLElement).style.maxWidth).toBe('684px');
		} finally {
			restore();
		}
	});

	test('si centrado pisa los botones, pasa a la zona libre', async () => {
		// Barra de 360 con costados de 120: quedan 104, y el centro quiere 200.
		const restore = layout(360, 120, 200);
		try {
			const view = mountBar();
			await nextTick();
			await nextTick();
			await nextTick();

			expect(view.find('[data-app-bar-center="overlay"]').exists()).toBe(false);
			const inline = view.find('[data-app-bar-center="inline"]');
			expect(inline.exists()).toBe(true);
			// Dentro de la zona del contenido, que es la que crece y se recorta.
			expect(inline.element.parentElement?.className).toContain('flex-1');
			expect(inline.find('.medio').exists()).toBe(true);
		} finally {
			restore();
		}
	});

	test('si ni en la zona libre queda lugar, va a un renglón propio debajo', async () => {
		// Barra de 240 con costados de 100: la zona libre es de 40, y lo que la
		// ranura ocupa (30) la deja en nada. Hasta ahora el centro desaparecía.
		const restore = layout(240, 100, 200, 30);
		try {
			const view = mountBar(true);
			await nextTick();
			await nextTick();
			await nextTick();

			const below = view.find('[data-app-bar-center="below"]');
			expect(below.exists()).toBe(true);
			expect(below.classes()).toContain('basis-full');
			expect(view.classes()).toContain('flex-wrap');
			expect(below.find('.medio').exists()).toBe(true);
			expect(view.find('[data-app-bar-center="inline"]').exists()).toBe(false);
		} finally {
			restore();
		}
	});
});

describe('el bloque de identidad', () => {
	test('sin pedir nada, la fila de siempre: un p cortado con «…» y sin contenedor', () => {
		const view = render(IdentityBlock, { props: { title: 'Ana', subtitle: 'ana@example.org' } });

		expect(view.attributes('data-identity-block')).toBeDefined();
		expect(view.classes()).toContain('items-center');
		expect(view.classes()).not.toContain('@container');
		expect(view.find('p.font-semibold').classes()).toContain('truncate');
	});

	test('la ranura details va debajo del subtítulo', () => {
		const view = render(IdentityBlock, {
			props: { title: 'Ana', subtitle: 'Gerente' },
			slots: { details: '<span class="empresa">ACME</span>' },
		});
		const details = view.get('[data-identity-details]');

		expect(details.find('.empresa').exists()).toBe(true);
		expect(details.element.previousElementSibling?.textContent).toContain('Gerente');
	});

	test('as="h1" es el título de la pantalla, y más grande', () => {
		const view = render(IdentityBlock, { props: { title: 'Ana Pérez', as: 'h1' } });

		expect(view.find('h1').text()).toBe('Ana Pérez');
		expect(view.find('h1').classes()).toContain('text-heading-m');
	});

	test('wrap parte el texto en vez de cortarlo', () => {
		const view = render(IdentityBlock, { props: { title: 'Un nombre muy largo', subtitle: 'x', wrap: true } });

		expect(view.find('p.font-semibold').classes()).toContain('break-words');
		expect(view.html()).not.toContain('truncate');
	});

	test('apilada siempre, o por el ancho del contenedor', () => {
		const always = render(IdentityBlock, { props: { title: 'Ana', stack: 'always' } });
		expect(always.classes()).toEqual(expect.arrayContaining(['flex-col', 'items-center', 'text-center']));

		const narrow = render(IdentityBlock, { props: { title: 'Ana', stack: 'narrow' } });
		expect(narrow.classes()).toContain('@container');
		const row = narrow.get('[data-identity-block] > div');
		expect(row.classes()).toEqual(expect.arrayContaining(['flex-col', '@xs:flex-row']));
		expect(narrow.html()).not.toMatch(/\s(sm|md):/);
	});
});

describe('el avatar y el recuadro de icono', () => {
	test('el avatar tiene 40 (ml) y 96 (2xl)', () => {
		expect(render(Avatar, { props: { name: 'Ana', size: 'ml' } }).classes()).toContain('size-10');
		expect(render(Avatar, { props: { name: 'Ana', size: '2xl' } }).classes()).toContain('size-24');
		// Lo de antes no cambió.
		expect(render(Avatar, { props: { name: 'Ana' } }).classes()).toContain('size-8');
	});

	test('el recuadro llega a 64 y 80, con la esquina del anidado', () => {
		const xl = render(IconTile, { props: { name: 'system-shutdown', size: 'xl' } });
		const huge = render(IconTile, { props: { name: 'system-shutdown', size: '2xl', shape: 'circle' } });

		expect(xl.classes()).toEqual(expect.arrayContaining(['size-16', 'rounded-corner-xl']));
		expect(huge.classes()).toEqual(expect.arrayContaining(['size-20', 'rounded-corner-full']));
		expect(render(IconTile, { props: { name: 'x', size: 'lg' } }).classes()).toContain('rounded-corner-l');
	});
});

describe('la barra lateral sin plegado automático', () => {
	function narrowParent() {
		const parent = document.createElement('div');
		Object.defineProperty(parent, 'clientWidth', { value: 300 });
		document.body.append(parent);
		return parent;
	}

	test('por omisión se pliega sola en un lugar angosto, como siempre', async () => {
		const view = render(SideBar, { props: { title: 'x' }, attachTo: narrowParent() });
		await nextTick();

		expect(view.classes()).toContain('w-[84px]');
	});

	test('con autoCollapse en false no se pliega, y con fill ocupa el ancho', async () => {
		const view = render(SideBar, { props: { title: 'x', autoCollapse: false, fill: true }, attachTo: narrowParent() });
		await nextTick();

		expect(view.classes()).not.toContain('w-[84px]');
		expect(view.classes()).toContain('w-full');
		expect(view.classes()).not.toContain('w-72');
		// Y el botón de plegar sigue ahí: a mano se puede.
		expect(view.find('button[aria-expanded="true"]').exists()).toBe(true);
	});
});

describe('el campo de búsqueda', () => {
	test('autocomplete y spellcheck llegan al input', () => {
		const view = render(SearchField, { props: { modelValue: '', autocomplete: 'off', spellcheck: false } });
		const input = view.get('input');

		expect(input.attributes('autocomplete')).toBe('off');
		expect(input.attributes('spellcheck')).toBe('false');
	});

	test('sin pedirlos, el input no lleva ninguno de los dos', () => {
		const input = render(SearchField, { props: { modelValue: '' } }).get('input');

		expect(input.attributes('autocomplete')).toBeUndefined();
		expect(input.attributes('spellcheck')).toBeUndefined();
	});

	test('la cruz vacía, avisa clear y también busca la cadena vacía', async () => {
		const view = render(SearchField, { props: { modelValue: 'gimp', label: 'Buscar' } });
		await view.get('button').trigger('click');

		expect(view.emitted('update:modelValue')).toEqual([['']]);
		expect(view.emitted('clear')).toHaveLength(1);
		expect(view.emitted('search')).toEqual([['']]);
	});
});

describe('el campo de texto', () => {
	test('spellcheck y autocapitalize llegan al input, y sin pedirlos no aparecen', () => {
		const off = render(TextInput, { props: { modelValue: '', spellcheck: false, autocapitalize: 'none' } });
		expect(off.attributes('spellcheck')).toBe('false');
		expect(off.attributes('autocapitalize')).toBe('none');

		const plain = render(TextInput, { props: { modelValue: '' } });
		expect(plain.attributes('spellcheck')).toBeUndefined();
		expect(plain.attributes('autocapitalize')).toBeUndefined();
	});
});

describe('la sección de configuración sin título', () => {
	test('con título, la cabecera de siempre', () => {
		const view = render(ConfigSection, { props: { title: 'Red' } });

		expect(view.find('h3').text()).toBe('Red');
		expect(view.find('[data-config-section-header]').exists()).toBe(true);
	});

	test('sin título ni nada arriba, no hay h3 vacío ni hueco', () => {
		const view = render(ConfigSection, { slots: { default: '<p class="cuerpo">x</p>' } });

		expect(view.find('h3').exists()).toBe(false);
		expect(view.find('[data-config-section-header]').exists()).toBe(false);
		expect(view.find('.cuerpo').exists()).toBe(true);
	});

	test('sin título pero con aside, la cabecera está y el h3 no', () => {
		const view = render(ConfigSection, { slots: { aside: '<span class="metrica">34 %</span>' } });

		expect(view.find('[data-config-section-header]').exists()).toBe(true);
		expect(view.find('h3').exists()).toBe(false);
		expect(view.find('.metrica').exists()).toBe(true);
	});
});

describe('el select', () => {
	test('id y disabled declarados llegan al select, y la etiqueta lo nombra', () => {
		const view = render(SelectField, { props: { modelValue: 'a', options: ['a', 'b'], label: 'Idioma', id: 'idioma', disabled: true } });
		const select = view.get('select');

		expect(select.attributes('id')).toBe('idioma');
		expect(select.attributes('disabled')).toBeDefined();
		expect(view.get('label').attributes('for')).toBe('idioma');
		expect(view.get('label').classes()).toContain('opacity-50');
	});

	test('sin disabled no queda apagado', () => {
		const select = render(SelectField, { props: { modelValue: 'a', options: ['a'] } }).get('select');

		expect(select.attributes('disabled')).toBeUndefined();
	});
});

describe('el vacío de una línea', () => {
	test('sin pedirlo, el título de siempre', () => {
		const title = render(EmptyState, { props: { title: 'Nada' } }).findAll('p')[0];

		expect(title?.classes()).toEqual(expect.arrayContaining(['font-semibold', 'text-tx-main']));
	});

	test('muted es la nota atenuada, sin peso', () => {
		const view = render(EmptyState, { props: { title: 'No hay impresoras', muted: true, icon: '', size: 'sm', bordered: true } });
		const title = view.findAll('p')[0];

		expect(title?.classes()).toEqual(expect.arrayContaining(['text-tx-muted', 'text-body-s']));
		expect(title?.classes()).not.toContain('font-semibold');
	});
});

describe('el diálogo', () => {
	function openDialog(size: string) {
		render(Dialog, {
			props: { open: true },
			slots: { default: () => h(DialogContent, { size }, () => 'Hola') },
			attachTo: document.body,
		});
	}

	test('wide es el ancho intermedio, 576 px', async () => {
		openDialog('wide');
		await nextTick();

		expect(document.body.querySelector('[role="dialog"]')?.className).toContain('max-w-xl');
	});

	test('lg dibuja el velo detrás, como md y sm', async () => {
		// Hasta la 2.3 no lo dibujaba (store#36).
		openDialog('lg');
		await nextTick();

		expect(document.body.querySelector('[data-dialog-scrim]')).not.toBeNull();
	});

	test('full sigue sin velo: el panel lo tapa entero', async () => {
		openDialog('full');
		await nextTick();

		expect(document.body.querySelector('[data-dialog-scrim]')).toBeNull();
	});
});

describe('los avisos arriba', () => {
	const TOASTS = [
		{ id: 1, message: 'Primero' },
		{ id: 2, message: 'Segundo' },
	];

	test('abajo a la derecha por omisión, en el orden en que llegaron', async () => {
		render(ToastArea, { props: { toasts: TOASTS }, attachTo: document.body });
		await nextTick();
		const stack = document.body.querySelector('[data-position]');

		expect(stack?.className).toContain('bottom-4');
		expect(stack?.textContent?.indexOf('Primero')).toBeLessThan(stack?.textContent?.indexOf('Segundo') ?? 0);
	});

	test('arriba, pegados al borde de arriba y el más nuevo primero', async () => {
		render(ToastArea, { props: { toasts: TOASTS, position: 'top-center' }, attachTo: document.body });
		await nextTick();
		const stack = document.body.querySelector('[data-position="top-center"]');

		expect(stack?.className).toContain('top-4');
		expect(stack?.className).not.toContain('bottom-4');
		expect(stack?.textContent?.indexOf('Segundo')).toBeLessThan(stack?.textContent?.indexOf('Primero') ?? 0);
	});
});

describe('el ítem de menú indeterminado', () => {
	test('mixed se anuncia a medias y dibuja la raya', () => {
		const view = render(DropdownMenuItem, { props: { checked: 'mixed' }, slots: { default: 'Mostrar todo' } });

		expect(view.attributes('role')).toBe('menuitemcheckbox');
		expect(view.attributes('aria-checked')).toBe('mixed');
		expect(view.find('[data-mixed]').exists()).toBe(true);
	});

	test('al elegirlo queda marcado', async () => {
		const view = render(DropdownMenuItem, { props: { checked: 'mixed' }, slots: { default: 'x' } });
		await view.trigger('click');

		expect(view.emitted('update:checked')).toEqual([[true]]);
	});

	test('en una radio, mixed no existe: se anuncia como no marcada', () => {
		const view = render(DropdownMenuItem, { props: { checked: 'mixed', toggle: 'radio' }, slots: { default: 'x' } });

		expect(view.attributes('aria-checked')).toBe('false');
		expect(view.find('[data-mixed]').exists()).toBe(false);
	});
});

describe('el desplegable sin búsqueda', () => {
	const OPTIONS = [
		{ valor: 'wayfire', etiqueta: 'VasakOS (Wayfire)' },
		{ valor: 'shell', etiqueta: 'Consola' },
	];

	test('con búsqueda, el campo de siempre', async () => {
		const view = render(SearchSelect, { props: { modelValue: 'wayfire', options: OPTIONS, label: 'Sesión' }, attachTo: document.body });
		await view.get('button').trigger('click');

		expect(view.find('input[type="search"]').exists()).toBe(true);
	});

	test('sin búsqueda, la lista sola, enfocable y con la opción recorrida', async () => {
		const view = render(SearchSelect, {
			props: { modelValue: 'shell', options: OPTIONS, label: 'Sesión', searchable: false },
			attachTo: document.body,
		});
		await view.get('button').trigger('click');
		await nextTick();
		const list = view.get('[role="listbox"]');

		expect(view.find('input').exists()).toBe(false);
		expect(list.attributes('tabindex')).toBe('-1');
		expect(list.attributes('aria-label')).toBe('Sesión');
		expect(list.attributes('aria-activedescendant')).toEndWith('-1');
		expect(document.activeElement).toBe(list.element);

		await list.trigger('keydown', { key: 'ArrowDown' });
		await list.trigger('keydown', { key: 'Enter' });
		expect(view.emitted('update:modelValue')).toEqual([['wayfire']]);
	});
});

describe('elegir una cuenta', () => {
	test('una opción con avatar lleva la cara de la persona, o sus iniciales', () => {
		const view = render(OptionGroup, {
			props: {
				label: 'Usuarios',
				variant: 'card',
				modelValue: 'ana',
				options: [
					{ value: 'ana', label: 'Ana Pérez', description: '@ana', avatar: null },
					{ value: 'otro', label: 'Otro usuario', icon: 'avatar-default' },
				],
			},
		});
		const radios = view.findAll('[role="radio"]');

		expect(radios[0]?.find('[data-avatar]').exists()).toBe(true);
		expect(radios[0]?.text()).toContain('AP');
		// La otra va con su icono, como siempre.
		expect(radios[1]?.find('[data-avatar]').exists()).toBe(false);
	});
});

describe('el menú alineado al final, a 240 px', () => {
	// Lo reportó file-manager#107 sin confirmar: a 240 salía cortado por la
	// derecha y a 360 no. En el banco, con la ventana de verdad en 240 (CDP,
	// no `--window-size`, que Chrome sin pantalla maqueta a ~500 y recorta),
	// el panel queda adentro: era la captura recortada. Esto lo deja atado.
	const viewport = { width: 240, height: 560 };
	const trigger = { top: 8, bottom: 40, left: 200, right: 232, width: 32 };

	test('un panel más ancho que el disparador, pegado al borde derecho, queda adentro', async () => {
		const { computePlacement, MARGIN } = await import('../src/shared/placement');
		const placed = computePlacement(trigger, { width: 215, height: 120 }, { side: 'bottom', align: 'end', sideOffset: 4 }, viewport);

		expect(placed.left).toBeGreaterThanOrEqual(MARGIN);
		expect(placed.left + 215).toBeLessThanOrEqual(viewport.width - MARGIN);
	});

	test('y uno tan ancho como la ventana arranca en el margen', async () => {
		const { computePlacement, MARGIN } = await import('../src/shared/placement');
		const placed = computePlacement(trigger, { width: 224, height: 120 }, { side: 'bottom', align: 'end', sideOffset: 4 }, viewport);

		expect(placed.left).toBe(MARGIN);
	});
});

describe('la lista del desplegable a 240 px', () => {
	test('su mínimo se topa a la ventana menos 16 px', async () => {
		const view = mount(SearchSelect, { props: { modelValue: '', options: [{ valor: 'a', etiqueta: 'A' }], label: 'x' }, attachTo: document.body });
		views.push(view);
		await view.get('button').trigger('click');
		const panel = view.get('[role="listbox"]').element.parentElement as HTMLElement;

		expect(panel.className).toContain('min-w-[min(16rem,calc(100vw-16px))]');
		expect(panel.className).not.toContain('min-w-64');
	});
});
