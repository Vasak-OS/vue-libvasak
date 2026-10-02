/**
 * El carrusel de fondos y la miniatura de un fondo (vasak-desktop#133).
 *
 * Lo que pide el issue: la navegación en los bordes, con una lista de uno y con
 * una vacía, y que nunca se reproduzca más de un video a la vez. Lo segundo se
 * mira en el DOM —cuántos `<video>` hay— y no en una variable: un video que
 * existe en la página es un decodificador abierto, aunque esté pausado.
 */

import { afterEach, describe, expect, test } from 'bun:test';
import { mount, type VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import {
	clampIndex,
	initialIndex,
	placeCard,
	previewId,
	stepIndex,
	VISIBLE_SIDE,
	type WallpaperItem,
	WHEEL_STEP,
	wheelSteps,
} from '../src/media/carousel';
import WallpaperCarousel from '../src/media/WallpaperCarousel.vue';
import WallpaperThumbnail from '../src/media/WallpaperThumbnail.vue';

const image = (id: string): WallpaperItem => ({ id, label: id, thumbnail: `asset://${id}.jpg` });
const video = (id: string): WallpaperItem => ({ ...image(id), video: true, videoSrc: `blob:${id}` });

const ROW: WallpaperItem[] = [image('a'), video('b'), image('c'), video('d'), image('e')];

const views: VueWrapper[] = [];
function render(props: Record<string, unknown>) {
	// biome-ignore lint/suspicious/noExplicitAny: las propiedades las arma cada prueba.
	const view = mount(WallpaperCarousel as any, { props, attachTo: document.body });
	views.push(view);
	return view;
}

afterEach(() => {
	for (const view of views.splice(0)) view.unmount();
	document.body.innerHTML = '';
});

const centerLabel = (view: VueWrapper) => view.find('[data-center="true"]').attributes('aria-label');
const press = async (view: VueWrapper, key: string) => {
	await view.trigger('keydown', { key });
	await nextTick();
};

describe('las cuentas del carrusel', () => {
	test('no da la vuelta en las puntas', () => {
		expect(stepIndex(0, -1, 5)).toBe(0);
		expect(stepIndex(4, 1, 5)).toBe(4);
		expect(stepIndex(2, 1, 5)).toBe(3);
		expect(stepIndex(1, -10, 5)).toBe(0);
		expect(stepIndex(1, 10, 5)).toBe(4);
	});

	test('con uno solo, moverse no lo saca de ahí', () => {
		expect(stepIndex(0, 1, 1)).toBe(0);
		expect(stepIndex(0, -1, 1)).toBe(0);
	});

	test('sin ninguno no hay índice', () => {
		expect(clampIndex(0, 0)).toBe(-1);
		expect(stepIndex(0, 1, 0)).toBe(-1);
		expect(initialIndex([], 'a')).toBe(-1);
	});

	test('abre centrado en el aplicado, o en el primero si no está en la lista', () => {
		expect(initialIndex(ROW, 'c')).toBe(2);
		expect(initialIndex(ROW, '/otro/fondo.jpg')).toBe(0);
		expect(initialIndex(ROW, null)).toBe(0);
	});

	test('la rueda da un paso por muesca y guarda lo que sobra', () => {
		expect(wheelSteps(0, 0, 100)).toEqual({ steps: 1, rest: 100 - WHEEL_STEP });
		expect(wheelSteps(0, 0, -100)).toEqual({ steps: -1, rest: -100 + WHEEL_STEP });
		// Un panel táctil manda de a poco: recién al juntar un paso se mueve.
		const first = wheelSteps(0, 0, 20);
		expect(first.steps).toBe(0);
		expect(wheelSteps(first.rest, 0, 45).steps).toBe(1);
		// El eje que más se movió manda.
		expect(wheelSteps(0, 120, 10).steps).toBe(2);
	});

	test('previsualiza uno o ninguno: el del puntero si es video, si no el enfocado', () => {
		expect(previewId(ROW, 1, null)).toBe('b');
		expect(previewId(ROW, 0, null)).toBeNull();
		expect(previewId(ROW, 1, 'd')).toBe('d');
		// El puntero sobre una imagen no apaga el video del centro.
		expect(previewId(ROW, 1, 'a')).toBe('b');
		expect(previewId([], -1, null)).toBeNull();
	});

	test('la del centro va al frente y más grande; las de los costados, atenuadas', () => {
		const center = placeCard(0);
		const side = placeCard(1);
		expect(center.scale).toBeGreaterThan(side.scale);
		expect(center.layer).toBeGreaterThan(side.layer);
		expect(center.dimmed).toBe(false);
		expect(side.dimmed).toBe(true);
		expect(placeCard(-1).shift).toBe(-side.shift);
		expect(placeCard(VISIBLE_SIDE).visible).toBe(true);
		expect(placeCard(VISIBLE_SIDE + 1).visible).toBe(false);
	});
});

describe('el carrusel', () => {
	test('abre centrado en el fondo aplicado, que lleva la marca', () => {
		const view = render({ items: ROW, current: 'c' });

		expect(centerLabel(view)).toBe('c');
		expect(view.find('[data-center="true"]').attributes('aria-current')).toBe('true');
		expect(view.findAll('[data-selected-badge]')).toHaveLength(1);
		expect(view.attributes('aria-activedescendant')).toBe(view.find('[data-center="true"]').attributes('id'));
	});

	test('las flechas recorren la fila y se detienen en las puntas', async () => {
		const view = render({ items: ROW, current: 'a' });

		await press(view, 'ArrowLeft');
		expect(centerLabel(view)).toBe('a');
		await press(view, 'ArrowRight');
		expect(centerLabel(view)).toBe('b');
		await press(view, 'End');
		expect(centerLabel(view)).toBe('e');
		await press(view, 'ArrowRight');
		expect(centerLabel(view)).toBe('e');
		await press(view, 'Home');
		expect(centerLabel(view)).toBe('a');
	});

	test('con un solo fondo, moverse no hace nada y Enter lo aplica', async () => {
		const view = render({ items: [image('solo')] });

		await press(view, 'ArrowRight');
		await press(view, 'ArrowLeft');
		expect(centerLabel(view)).toBe('solo');
		await press(view, 'Enter');
		expect(view.emitted('apply')?.[0]).toEqual([image('solo')]);
	});

	test('sin fondos lo dice, y ni las flechas ni Enter hacen nada', async () => {
		const view = render({ items: [], emptyLabel: 'No hay fondos' });

		expect(view.find('[data-empty]').text()).toBe('No hay fondos');
		expect(view.findAll('[role="option"]')).toHaveLength(0);
		await press(view, 'ArrowRight');
		await press(view, 'Enter');
		expect(view.emitted('apply')).toBeUndefined();
		expect(view.attributes('aria-activedescendant')).toBeUndefined();
	});

	test('Enter aplica el del centro y un clic aplica el tocado', async () => {
		const view = render({ items: ROW, current: 'a' });

		await press(view, 'ArrowRight');
		await press(view, 'Enter');
		expect(view.emitted('apply')?.[0]).toEqual([ROW[1]]);

		await view.find('[data-offset="1"]').trigger('click');
		expect(view.emitted('apply')?.[1]).toEqual([ROW[2]]);
		expect(centerLabel(view)).toBe('c');
	});

	test('Escape pide cerrar', async () => {
		const view = render({ items: ROW });

		await press(view, 'Escape');
		expect(view.emitted('close')).toHaveLength(1);
	});

	test('la rueda mueve de a un paso por muesca', async () => {
		const view = render({ items: ROW, current: 'a' });

		await view.trigger('wheel', { deltaY: 100 });
		expect(centerLabel(view)).toBe('b');
		await view.trigger('wheel', { deltaY: -100 });
		await view.trigger('wheel', { deltaY: -100 });
		expect(centerLabel(view)).toBe('a');
	});

	test('arrastrar mueve la fila, y soltar después de arrastrar no aplica', async () => {
		const view = render({ items: ROW, current: 'c' });

		await view.trigger('pointerdown', { button: 0, clientX: 500 });
		// Sin medidas en el DOM de prueba el paso vale 120 px.
		await view.trigger('pointermove', { clientX: 250 });
		expect(centerLabel(view)).toBe('e');
		await view.trigger('pointerup');
		await view.find('[data-center="true"]').trigger('click');
		expect(view.emitted('apply')).toBeUndefined();

		// El clic siguiente, sin arrastre, sí aplica.
		await view.find('[data-center="true"]').trigger('click');
		expect(view.emitted('apply')).toHaveLength(1);
	});

	test('la tarjeta del final emite more y no aplica nada', async () => {
		const view = render({ items: ROW, current: 'e', moreLabel: 'Más fondos…' });

		await press(view, 'ArrowRight');
		expect(centerLabel(view)).toBe('Más fondos…');
		await press(view, 'Enter');
		expect(view.emitted('more')).toHaveLength(1);
		expect(view.emitted('apply')).toBeUndefined();
	});

	test('sin moreLabel no hay tarjeta del final', () => {
		const view = render({ items: ROW });
		expect(view.find('[data-more]').exists()).toBe(false);
	});

	test('los videos llevan ▶ y las imágenes no', () => {
		const view = render({ items: ROW });
		expect(view.findAll('[data-video-badge]')).toHaveLength(2);
	});
});

describe('un solo video a la vez', () => {
	const videos = (view: VueWrapper) => view.findAll('video');

	test('el enfocado se reproduce; al pasar a una imagen no queda ninguno', async () => {
		const view = render({ items: ROW, current: 'b' });

		expect(videos(view)).toHaveLength(1);
		expect(videos(view)[0]?.attributes('src')).toBe('blob:b');
		expect(view.emitted('preview')?.at(-1)).toEqual(['b']);

		await press(view, 'ArrowRight');
		expect(videos(view)).toHaveLength(0);
		expect(view.emitted('preview')?.at(-1)).toEqual([null]);
	});

	test('el puntero sobre otro video lo cambia: nunca suenan dos', async () => {
		const view = render({ items: ROW, current: 'b' });

		await view.find('[aria-label="d"]').trigger('mouseenter');
		expect(videos(view)).toHaveLength(1);
		expect(videos(view)[0]?.attributes('src')).toBe('blob:d');

		await view.find('[aria-label="d"]').trigger('mouseleave');
		expect(videos(view)).toHaveLength(1);
		expect(videos(view)[0]?.attributes('src')).toBe('blob:b');
	});

	test('recorriendo la fila entera nunca hay más de uno', async () => {
		const view = render({ items: [video('1'), video('2'), video('3'), video('4')] });

		for (let step = 0; step < 4; step++) {
			expect(videos(view).length).toBeLessThanOrEqual(1);
			await press(view, 'ArrowRight');
		}
	});

	test('los videos van mudos y en bucle', () => {
		const view = render({ items: [video('x')] });
		const element = videos(view)[0]?.element as HTMLVideoElement;
		expect(element.muted).toBe(true);
		expect(element.loop).toBe(true);
	});
});

describe('la miniatura', () => {
	test('quieta no tiene video, aunque sea un video', () => {
		const view = mount(WallpaperThumbnail, { props: { src: 'a.jpg', video: true, videoSrc: 'blob:a' } });
		expect(view.find('video').exists()).toBe(false);
		expect(view.find('[data-video-badge]').exists()).toBe(true);
		view.unmount();
	});

	test('al dejar de reproducir saca el video del DOM, no lo pausa', async () => {
		const view = mount(WallpaperThumbnail, { props: { src: 'a.jpg', video: true, videoSrc: 'blob:a', playing: true } });
		expect(view.find('video').exists()).toBe(true);
		await view.setProps({ playing: false });
		expect(view.find('video').exists()).toBe(false);
		view.unmount();
	});

	test('una imagen nunca reproduce nada', () => {
		const view = mount(WallpaperThumbnail, { props: { src: 'a.jpg', playing: true, videoSrc: 'blob:a' } });
		expect(view.find('video').exists()).toBe(false);
		expect(view.find('[data-video-badge]').exists()).toBe(false);
		view.unmount();
	});

	test('las marcas tienen nombre, de la propiedad o del respaldo', () => {
		const view = mount(WallpaperThumbnail, {
			props: { src: 'a.jpg', video: true, selected: true, selectedLabel: 'Fondo actual' },
		});
		expect(view.find('[data-selected-badge]').text()).toBe('Fondo actual');
		expect(view.find('[data-video-badge]').text()).toBe('Video wallpaper');
		view.unmount();
	});

	test('sin miniatura, o si no carga, el icono del tema en su lugar', async () => {
		const view = mount(WallpaperThumbnail, { props: { src: 'roto.jpg', alt: 'Bosque' } });
		await view.find('img').trigger('error');
		expect(view.find('[data-fallback]').attributes('aria-label')).toBe('Bosque');
		expect(view.emitted('error')).toHaveLength(1);
		view.unmount();
	});
});
