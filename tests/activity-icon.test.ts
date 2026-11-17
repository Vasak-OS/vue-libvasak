/**
 * `ActivityIcon`: el icono de una actividad del panel con su aro de avance.
 *
 * Lo que se mira: que siempre sea un botón con nombre que avisa al tocarlo, que
 * el aro exista sólo con avance y se calle (el avance va en el nombre del botón,
 * como en `SpinningCover`), que el avance se recorte, y que el icono salga del
 * tema por nombre.
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mount, type VueWrapper } from '@vue/test-utils';
import ActivityIcon from '../src/media/ActivityIcon.vue';
import { olvidarTodo, traducir, vaciarElCatalogo } from './dobles';

const views: VueWrapper[] = [];
function render(props: Record<string, unknown>) {
	// biome-ignore lint/suspicious/noExplicitAny: el tipo de las props lo decide quien llama.
	const view = mount(ActivityIcon as any, { props: { icon: 'folder', label: 'Descarga', ...props } });
	views.push(view);
	return view;
}

beforeEach(() => olvidarTodo());
afterEach(() => {
	for (const view of views.splice(0)) view.unmount();
	vaciarElCatalogo();
});

describe('el icono de una actividad', () => {
	test('siempre es un botón de tipo button y avisa al tocarlo', async () => {
		const view = render({});

		expect(view.element.tagName).toBe('BUTTON');
		expect(view.attributes('type')).toBe('button');
		await view.trigger('click');
		expect(view.emitted('click')).toHaveLength(1);
	});

	test('con avance dibuja el aro: primario hasta el porcentaje y callado para el lector', () => {
		const ring = render({ progress: 42 }).get('[data-progress-ring]');

		expect(ring.attributes('style')).toContain('conic-gradient(var(--color-primary) 42%');
		expect(ring.attributes('aria-hidden')).toBe('true');
		expect(ring.attributes('role')).toBeUndefined();
	});

	test('sin avance, o con null, no hay aro', () => {
		expect(render({}).find('[data-progress-ring]').exists()).toBe(false);
		expect(render({ progress: null }).find('[data-progress-ring]').exists()).toBe(false);
	});

	test('el avance fuera de rango se recorta a 0–100', () => {
		expect(render({ progress: 140 }).get('[data-progress-ring]').attributes('style')).toContain(
			'var(--color-primary) 100%'
		);
		expect(render({ progress: -5 }).get('[data-progress-ring]').attributes('style')).toContain(
			'var(--color-primary) 0%'
		);
	});
});

describe('el nombre del botón', () => {
	test('sin aro es el label tal cual', () => {
		expect(render({ label: 'Música' }).attributes('aria-label')).toBe('Música');
	});

	test('con aro suma la etiqueta por omisión y el porcentaje redondeado', () => {
		expect(render({ label: 'Descarga', progress: 42.6 }).attributes('aria-label')).toBe('Descarga, Progress, 43 %');
	});

	test('la etiqueta del aro sale del catálogo de etiquetas', () => {
		traducir('media.progress', 'Avance');

		expect(render({ label: 'Descarga', progress: 30 }).attributes('aria-label')).toBe('Descarga, Avance, 30 %');
	});

	test('progressLabel le gana al catálogo', () => {
		traducir('media.progress', 'Avance');

		expect(render({ label: 'Copia', progress: 10, progressLabel: 'Copiado' }).attributes('aria-label')).toBe(
			'Copia, Copiado, 10 %'
		);
	});
});

describe('el icono y el tamaño', () => {
	test('el icono va por nombre del tema, con sus respaldos', () => {
		const view = render({ icon: 'transmission', iconFallbacks: ['folder-download'], iconFallbackSrc: 'app.png' });
		const icon = view.findComponent({ name: 'ThemeIcon' });

		expect(icon.props('name')).toBe('transmission');
		expect(icon.props('fallbacks')).toEqual(['folder-download']);
		expect(icon.props('fallbackSrc')).toBe('app.png');
	});

	test('sm y md cambian la caja del botón', () => {
		expect(render({}).classes()).toContain('size-8');
		expect(render({ size: 'md' }).classes()).toContain('size-8');
		const small = render({ size: 'sm' }).classes();
		expect(small).toContain('size-7');
		expect(small).not.toContain('size-8');
	});
});
