/**
 * Carátulas, datos, plegables y zonas de soltar de la 2.2.0, y lo que sumó
 * `SpinningCover`.
 *
 * Lo que se mira: que siempre haya algo en lugar de una imagen rota, que una
 * lista de datos sea una lista de definiciones, que el registro siga el final
 * **salvo** que la persona haya subido a leer, que el tono de una línea no
 * pinte el texto, que el plegable diga si está abierto y qué abre.
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mount, type VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import CodeBlock from '../src/data/CodeBlock.vue';
import PropertyList from '../src/data/PropertyList.vue';
import StatTile from '../src/data/StatTile.vue';
import Disclosure from '../src/disclosure/Disclosure.vue';
import DropZone from '../src/feedback/DropZone.vue';
import CoverArt from '../src/media/CoverArt.vue';
import SpinningCover from '../src/media/SpinningCover.vue';
import { olvidarTodo, traducir, vaciarElCatalogo } from './dobles';

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
});

describe('la carátula', () => {
	test('una imagen que no carga cae al respaldo, avisa, y la siguiente se intenta', async () => {
		const view = render(CoverArt, { props: { src: 'rota.jpg', alt: 'Kind of Blue' } });
		await view.get('img').trigger('error');

		expect(view.emitted('error')).toHaveLength(1);
		expect(view.get('[data-fallback]').attributes('aria-label')).toBe('Kind of Blue');

		await view.setProps({ src: 'otra.jpg' });
		expect(view.get('img').attributes('src')).toBe('otra.jpg');
	});

	test('el texto de respaldo le gana al icono y no se lee dos veces', () => {
		const view = render(CoverArt, { props: { fallbackText: 'R2', alt: 'Radio 2' } });

		expect(view.text()).toBe('R2');
		expect(view.get('[data-fallback] span').attributes('aria-hidden')).toBe('true');
		expect(view.findComponent({ name: 'ThemeIcon' }).exists()).toBe(false);
	});

	test('sin texto, el icono del tema; cuadrada siempre, redonda si se pide', () => {
		const view = render(CoverArt, { props: { size: 'lg' } });

		expect(view.findComponent({ name: 'ThemeIcon' }).props('name')).toBe('audio-x-generic');
		expect(view.classes()).toEqual(expect.arrayContaining(['aspect-square', 'size-24', 'rounded-corner-m']));
		expect(render(CoverArt, { props: { shape: 'round' } }).classes()).toContain('rounded-corner-full');
	});
});

describe('el disco, con lo de la 2.2.0', () => {
	test('sin progreso no hay aro y el disco ocupa lo de siempre', () => {
		const view = render(SpinningCover, { props: { src: 'tapa.png' } });

		expect(view.find('[data-progress-ring]').exists()).toBe(false);
		expect(view.classes()).not.toContain('p-1');
		expect(view.element.tagName).toBe('DIV');
	});

	test('con progreso, un aro que es una barra de progreso con nombre, sin SVG', () => {
		traducir('media.progress', 'Avance');
		const view = render(SpinningCover, { props: { src: 'tapa.png', progress: 42.4 } });
		const ring = view.get('[data-progress-ring]');

		expect(ring.attributes('role')).toBe('progressbar');
		expect(ring.attributes('aria-valuenow')).toBe('42');
		expect(ring.attributes('aria-label')).toBe('Avance');
		expect(ring.attributes('style')).toContain('conic-gradient(var(--color-primary) 42.4%');
		expect(view.find('svg').exists()).toBe(false);
	});

	test('el progreso se recorta a 0–100', () => {
		const view = render(SpinningCover, { props: { progress: 140 } });

		expect(view.get('[data-progress-ring]').attributes('aria-valuenow')).toBe('100');
	});

	test('interactive lo vuelve un botón con nombre que avisa', async () => {
		const view = render(SpinningCover, { props: { interactive: true, label: 'Abrir el reproductor' } });
		const button = view.get('button');

		expect(button.attributes('aria-label')).toBe('Abrir el reproductor');
		await button.trigger('click');
		expect(view.emitted('click')).toHaveLength(1);
	});

	test('la carátula de adentro es CoverArt', () => {
		const view = render(SpinningCover, { props: { src: 'tapa.png' } });

		expect(view.find('[data-spinning-cover]').attributes('data-cover-art')).toBeDefined();
	});
});

describe('el número con su nombre', () => {
	test('el valor entero queda en el title aunque se corte', () => {
		const view = render(StatTile, { props: { label: 'Memoria', value: '6,2 GB', hint: 'de 16 GB' } });
		const value = view.findAll('p')[1];

		expect(value?.text()).toBe('6,2 GB');
		expect(value?.attributes('title')).toBe('6,2 GB');
		expect(value?.classes()).toEqual(expect.arrayContaining(['truncate', 'tabular-nums']));
		expect(view.classes()).toContain('@container');
	});
});

describe('la lista de propiedades', () => {
	const items = [
		{ label: 'Disco', value: '/dev/nvme0n1', mono: true },
		{ label: 'Idioma', value: 'Español' },
	];

	test('es una lista de definiciones: cada valor es de su nombre', () => {
		const view = render(PropertyList, { props: { items } });

		expect(view.findAll('dt').map((dt) => dt.text())).toEqual(['Disco', 'Idioma']);
		expect(view.findAll('dd').map((dd) => dd.text())).toEqual(['/dev/nvme0n1', 'Español']);
		expect(view.get('dd').classes()).toContain('font-mono');
	});

	test('la grilla se acomoda por su propio ancho, no por la pantalla', () => {
		const view = render(PropertyList, { props: { items } });

		expect(view.classes()).toContain('@container');
		expect(view.html()).toContain('@xs:grid-cols-');
		expect(view.html()).not.toMatch(/\s(sm|md):/);
	});

	test('la ranura dibuja el valor que no es texto', () => {
		const view = render(PropertyList, {
			props: { items, layout: 'rows' },
			slots: { value: ({ item }: { item: { label: string } }) => `[${item.label}]` },
		});

		expect(view.get('dl').attributes('data-layout')).toBe('rows');
		expect(view.findAll('dd').map((dd) => dd.text())).toEqual(['[Disco]', '[Idioma]']);
	});
});

describe('el plegable', () => {
	test('la cabecera es un botón que dice si está abierto y qué abre', async () => {
		const view = render(Disclosure, { props: { title: 'Avanzado' }, slots: { default: '<p class="dentro">x</p>' } });
		const button = view.get('button');
		const region = view.get(`#${button.attributes('aria-controls')}`);

		expect(button.attributes('aria-expanded')).toBe('false');
		expect((region.element as HTMLElement).style.display).toBe('none');

		await button.trigger('click');
		expect(button.attributes('aria-expanded')).toBe('true');
		expect((region.element as HTMLElement).style.display).toBe('');
		expect(view.emitted('update:open')).toEqual([[true]]);
	});

	test('controlado: manda la propiedad', async () => {
		const view = render(Disclosure, { props: { title: 'x', open: true } });
		await view.get('button').trigger('click');

		expect(view.get('button').attributes('aria-expanded')).toBe('true');
		expect(view.emitted('update:open')).toEqual([[false]]);
	});

	test('defaultOpen arranca abierto; apagado no se abre', async () => {
		expect(render(Disclosure, { props: { title: 'x', defaultOpen: true } }).get('button').attributes('aria-expanded')).toBe('true');
		const off = render(Disclosure, { props: { title: 'x', disabled: true } });
		await off.get('button').trigger('click');
		expect(off.get('button').attributes('aria-expanded')).toBe('false');
	});
});

describe('el bloque de código', () => {
	test('el tono marca el canto y no pinta el texto, salvo muted', () => {
		const view = render(CodeBlock, {
			props: { lines: [{ text: 'ok', tone: 'success' }, { text: 'mal', tone: 'error' }, { text: 'gris', tone: 'muted' }] },
		});
		const [ok, bad, gray] = view.findAll('span');

		expect(ok?.classes()).toEqual(expect.arrayContaining(['border-status-success', 'text-tx-main']));
		expect(bad?.classes()).toEqual(expect.arrayContaining(['border-status-error', 'text-tx-main']));
		expect(gray?.classes()).toContain('text-tx-muted');
	});

	test('parte por omisión; sin wrap desplaza adentro', () => {
		expect(render(CodeBlock, { props: { text: 'a' } }).classes()).toContain('whitespace-pre-wrap');
		expect(render(CodeBlock, { props: { text: 'a', wrap: false } }).classes()).toContain('overflow-x-auto');
	});

	test('con alto tope es tabulable; el registro es un role=log', () => {
		const view = render(CodeBlock, { props: { text: 'a', maxHeight: 120, variant: 'log', label: 'Registro' } });

		expect(view.attributes('tabindex')).toBe('0');
		expect(view.attributes('style')).toContain('max-height: 120px');
		expect(view.attributes('role')).toBe('log');
		expect(view.attributes('aria-label')).toBe('Registro');
	});

	test('sigue el final mientras llegan líneas, y deja de seguirlo si la persona sube', async () => {
		const view = render(CodeBlock, { props: { lines: [{ text: '1' }], maxHeight: 50, follow: true }, attachTo: document.body });
		const element = view.element as HTMLElement;
		Object.defineProperty(element, 'scrollHeight', { value: 500, configurable: true });
		Object.defineProperty(element, 'clientHeight', { value: 50, configurable: true });

		await view.setProps({ lines: [{ text: '1' }, { text: '2' }] });
		await nextTick();
		expect(element.scrollTop).toBe(500);

		// Sube a leer: la próxima línea no lo arrastra.
		element.scrollTop = 100;
		await view.trigger('scroll');
		await view.setProps({ lines: [{ text: '1' }, { text: '2' }, { text: '3' }] });
		await nextTick();
		expect(element.scrollTop).toBe(100);
	});
});

describe('la zona de soltar', () => {
	test('los textos salen del catálogo o del respaldo', () => {
		traducir('dropZone.label', 'Soltá los archivos acá');
		expect(render(DropZone).text()).toBe('Soltá los archivos acá');
		vaciarElCatalogo();
		expect(render(DropZone, { props: { locked: true } }).text()).toBe("Can't drop here");
	});

	test('activa, el velo de acento; trabada, el canto de advertencia y se anuncia', () => {
		expect(render(DropZone, { props: { active: true } }).classes()).toContain('bg-ui-selected-accent');
		const locked = render(DropZone, { props: { locked: true } });
		expect(locked.classes()).toContain('border-status-warning');
		expect(locked.get('p').attributes('role')).toBe('status');
	});

	test('encima: sólo mientras se arrastra, y sin atrapar el puntero', async () => {
		const view = render(DropZone, { props: { overlay: true } });

		expect((view.element as HTMLElement).style.display).toBe('none');
		expect(view.classes()).toContain('pointer-events-none');
		await view.setProps({ active: true });
		expect((view.element as HTMLElement).style.display).toBe('');
		expect(view.find('[role="status"]').exists()).toBe(true);
	});
});
