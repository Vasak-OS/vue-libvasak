/**
 * El reproductor: la barra de progreso, el disco y la tarjeta que los junta.
 *
 * Lo que se fija acá es lo que se rompe sin que nada falle: una barra que
 * vuelve sola mientras se la arrastra, un disco que salta a cero al pausar, un
 * botón que dice «siguiente» con un reproductor que no tiene siguiente. Las tres
 * cosas se ven bien en una captura y están mal en la mano.
 */

import { beforeEach, describe, expect, test } from 'bun:test';
import { mount } from '@vue/test-utils';
import { h } from 'vue';
import NowPlayingCard from '../src/media/NowPlayingCard.vue';
import { formatPlaybackTime, playedRatio } from '../src/media/playback';
import SeekBar from '../src/media/SeekBar.vue';
import SpinningCover from '../src/media/SpinningCover.vue';
import { olvidarTodo, traducir, vaciarElCatalogo } from './dobles';

beforeEach(() => {
	olvidarTodo();
	vaciarElCatalogo();
});

describe('los tiempos', () => {
	test('se escriben como los lee alguien', () => {
		expect(formatPlaybackTime(0)).toBe('0:00');
		expect(formatPlaybackTime(187)).toBe('3:07');
		expect(formatPlaybackTime(3765)).toBe('1:02:45');
	});

	test('y lo que no es un tiempo es cero, no NaN:NaN', () => {
		expect(formatPlaybackTime(Number.NaN)).toBe('0:00');
		expect(formatPlaybackTime(-4)).toBe('0:00');
		expect(formatPlaybackTime(Number.POSITIVE_INFINITY)).toBe('0:00');
	});

	test('lo recorrido no se sale de la barra', () => {
		expect(playedRatio(50, 200)).toBe(0.25);
		expect(playedRatio(500, 200)).toBe(1);
		expect(playedRatio(-1, 200)).toBe(0);
		expect(playedRatio(10, 0)).toBe(0);
	});
});

describe('la barra de progreso', () => {
	test('sin duración no se dibuja: una radio en vivo no sabe cuánto dura', () => {
		const view = mount(SeekBar, { props: { position: 12, duration: 0 } });

		expect(view.find('[data-seek-bar]').exists()).toBe(false);
		expect(view.find('input').exists()).toBe(false);
	});

	test('con duración dice por dónde va y cuánto dura', () => {
		const view = mount(SeekBar, { props: { position: 60, duration: 240 } });

		expect(view.find('[data-elapsed]').text()).toBe('1:00');
		expect(view.find('[data-total]').text()).toBe('4:00');
		expect(view.find('[data-played]').attributes('style')).toContain('width: 25%');
	});

	test('sin saltos permitidos avanza igual pero no se mueve ni emite', async () => {
		const view = mount(SeekBar, { props: { position: 30, duration: 120, seekable: false } });
		const input = view.find('input');

		expect(input.attributes('disabled')).toBeDefined();
		expect(view.find('[data-thumb]').exists()).toBe(false);

		(input.element as HTMLInputElement).value = '90';
		await input.trigger('input');
		await input.trigger('change');

		expect(view.emitted('seek')).toBeUndefined();
		expect(view.find('[data-elapsed]').text()).toBe('0:30');
	});

	test('mientras se arrastra manda la mano, no la posición que llega', async () => {
		const view = mount(SeekBar, { props: { position: 30, duration: 120 } });
		const input = view.find('input');

		(input.element as HTMLInputElement).value = '90';
		await input.trigger('input');
		// El reproductor sigue mandando dónde va la música mientras tanto.
		await view.setProps({ position: 31 });

		expect(view.find('[data-elapsed]').text()).toBe('1:30');
		expect(view.find('[data-played]').attributes('style')).toContain('width: 75%');
		expect((input.element as HTMLInputElement).value).toBe('90');
		expect(view.emitted('seek')).toBeUndefined();
	});

	test('al soltar emite a dónde saltar y vuelve a seguir a la música', async () => {
		const view = mount(SeekBar, { props: { position: 30, duration: 120 } });
		const input = view.find('input');

		(input.element as HTMLInputElement).value = '90';
		await input.trigger('input');
		await input.trigger('change');

		expect(view.emitted('seek')).toEqual([[90]]);

		await view.setProps({ position: 91 });
		expect(view.find('[data-elapsed]').text()).toBe('1:31');
	});

	test('si deja de poder saltar a mitad del arrastre, suelta lo que tenía', async () => {
		const view = mount(SeekBar, { props: { position: 30, duration: 120 } });
		const input = view.find('input');

		(input.element as HTMLInputElement).value = '90';
		await input.trigger('input');
		await view.setProps({ seekable: false });

		expect(view.find('[data-elapsed]').text()).toBe('0:30');
	});

	test('la unidad la pone quien la usa', () => {
		// MPRIS cuenta en microsegundos.
		const micros = (value: number) => formatPlaybackTime(value / 1_000_000);
		const view = mount(SeekBar, {
			props: { position: 61_000_000, duration: 180_000_000, format: micros },
		});

		expect(view.find('[data-elapsed]').text()).toBe('1:01');
		expect(view.find('[data-total]').text()).toBe('3:00');
	});

	test('el nombre sale del catálogo, y la propiedad gana', () => {
		traducir('media.seek', 'Posición');
		const fromCatalog = mount(SeekBar, { props: { position: 0, duration: 10 } });
		const fromProp = mount(SeekBar, { props: { position: 0, duration: 10, label: 'Buscar' } });

		expect(fromCatalog.find('input').attributes('aria-label')).toBe('Posición');
		expect(fromProp.find('input').attributes('aria-label')).toBe('Buscar');
		expect(fromCatalog.find('input').attributes('aria-valuetext')).toBe('0:00 / 0:10');
	});
});

describe('el disco', () => {
	const disc = (view: ReturnType<typeof mount>) => view.find('[data-spinning-cover]');

	test('gira mientras suena, una vuelta cada ocho segundos', () => {
		const view = mount(SpinningCover, { props: { src: 'tapa.png', state: 'playing' } });
		const style = disc(view).attributes('style') ?? '';

		expect(disc(view).classes()).toContain('animate-spin');
		expect(style).toContain('animation-duration: 8s');
		expect(style).toContain('animation-play-state: running');
	});

	test('en pausa se queda donde estaba: la animación sigue puesta, congelada', async () => {
		const view = mount(SpinningCover, { props: { src: 'tapa.png', state: 'playing' } });
		await view.setProps({ state: 'paused' });

		// Sacar la clase lo haría volver a cero de golpe; congelarla no.
		expect(disc(view).classes()).toContain('animate-spin');
		expect(disc(view).attributes('style')).toContain('animation-play-state: paused');
	});

	test('sin reproducción no gira', () => {
		const view = mount(SpinningCover, { props: { src: 'tapa.png', state: 'stopped' } });

		expect(disc(view).classes()).not.toContain('animate-spin');
		expect(disc(view).attributes('style') ?? '').not.toContain('animation');
	});

	test('con menos movimiento pedido, no gira', () => {
		const view = mount(SpinningCover, { props: { src: 'tapa.png', state: 'playing' } });

		expect(disc(view).classes()).toContain('motion-reduce:animate-none');
	});

	test('sin carátula, el icono sobre la superficie', () => {
		const view = mount(SpinningCover, { props: { state: 'stopped' } });

		expect(view.find('img[src="tapa.png"]').exists()).toBe(false);
		expect(view.find('[data-fallback]').exists()).toBe(true);
		expect(disc(view).classes()).toContain('bg-ui-surface');
	});

	test('una carátula que no carga cae al icono, avisa, y la siguiente se intenta', async () => {
		const view = mount(SpinningCover, { props: { src: 'rota.png', state: 'playing' } });
		await view.find('img').trigger('error');

		expect(view.emitted('error')).toHaveLength(1);
		expect(view.find('[data-fallback]').exists()).toBe(true);

		await view.setProps({ src: 'otra.png' });
		expect(view.find('img').attributes('src')).toBe('otra.png');
	});
});

describe('la tarjeta', () => {
	const base = {
		title: 'Clocks',
		artist: 'Coldplay',
		album: 'A Rush of Blood to the Head',
		state: 'playing' as const,
		position: 30,
		duration: 300,
		canSeek: true,
		canGoPrevious: true,
		canGoNext: true,
	};

	test('dice qué suena, de quién y de qué disco', () => {
		traducir('media.byArtist', 'de {0}');
		const view = mount(NowPlayingCard, { props: base });

		expect(view.find('[data-title]').text()).toBe('Clocks');
		expect(view.find('[data-artist]').text()).toBe('de Coldplay');
		expect(view.find('[data-album]').text()).toBe('A Rush of Blood to the Head');
	});

	test('sin la clave del artista muestra el nombre, no la clave cruda', () => {
		const view = mount(NowPlayingCard, { props: base });

		expect(view.find('[data-artist]').text()).toBe('Coldplay');
	});

	test('un artista con $& no se lee como patrón', () => {
		const view = mount(NowPlayingCard, {
			props: { ...base, artist: 'Rock $& Roll', byArtistLabel: 'de {0}' },
		});

		expect(view.find('[data-artist]').text()).toBe('de Rock $& Roll');
	});

	test('lo que el reproductor no permite se ve apagado, no desaparece, y no emite', async () => {
		const view = mount(NowPlayingCard, {
			props: { ...base, canGoPrevious: false, canGoNext: false },
		});
		const previous = view.find('[data-previous]');
		const next = view.find('[data-next]');

		expect(previous.exists()).toBe(true);
		expect(next.exists()).toBe(true);
		expect(previous.attributes('disabled')).toBeDefined();
		expect(next.attributes('disabled')).toBeDefined();

		await previous.trigger('click');
		await next.trigger('click');
		expect(view.emitted('previous')).toBeUndefined();
		expect(view.emitted('next')).toBeUndefined();
	});

	test('lo que sí permite emite', async () => {
		const view = mount(NowPlayingCard, { props: base });

		await view.find('[data-previous]').trigger('click');
		await view.find('[data-toggle]').trigger('click');
		await view.find('[data-next]').trigger('click');

		expect(view.emitted('previous')).toHaveLength(1);
		expect(view.emitted('toggle')).toHaveLength(1);
		expect(view.emitted('next')).toHaveLength(1);
	});

	test('el central dice lo que va a hacer, según suene o no', async () => {
		traducir('media.play', 'Reproducir');
		traducir('media.pause', 'Pausar');
		const view = mount(NowPlayingCard, { props: base });

		expect(view.find('[data-toggle]').attributes('aria-label')).toBe('Pausar');
		await view.setProps({ state: 'paused' });
		expect(view.find('[data-toggle]').attributes('aria-label')).toBe('Reproducir');
	});

	test('las etiquetas por propiedad ganan al catálogo', () => {
		traducir('media.next', 'Siguiente');
		const view = mount(NowPlayingCard, { props: { ...base, nextLabel: 'Próxima' } });

		expect(view.find('[data-next]').attributes('aria-label')).toBe('Próxima');
	});

	test('la barra respeta canSeek y desaparece con duración cero', async () => {
		const view = mount(NowPlayingCard, { props: { ...base, canSeek: false } });
		expect(view.find('input[type="range"]').attributes('disabled')).toBeDefined();

		await view.setProps({ duration: 0 });
		expect(view.find('[data-seek-bar]').exists()).toBe(false);
	});

	test('un salto en la barra sale de la tarjeta', async () => {
		const view = mount(NowPlayingCard, { props: base });
		const input = view.find('input[type="range"]');

		(input.element as HTMLInputElement).value = '120';
		await input.trigger('change');

		expect(view.emitted('seek')).toEqual([[120]]);
	});

	test('el disco sigue el estado de la tarjeta', async () => {
		const view = mount(NowPlayingCard, { props: base });
		expect(view.find('[data-spinning-cover]').attributes('data-state')).toBe('playing');

		await view.setProps({ state: 'paused' });
		expect(view.find('[data-spinning-cover]').attributes('data-state')).toBe('paused');
	});

	test('sin ecualizador no queda un espacio reservado vacío', () => {
		const view = mount(NowPlayingCard, { props: base });

		expect(view.find('[data-footer]').exists()).toBe(false);
		expect(view.html()).not.toContain('border-t');
	});

	test('con él, va debajo del transporte, separado por una línea', () => {
		const view = mount(NowPlayingCard, {
			props: base,
			slots: { footer: () => h('div', { 'data-eq': '' }, 'EQ') },
		});

		expect(view.find('[data-footer]').classes()).toContain('border-t');
		expect(view.find('[data-footer] [data-eq]').exists()).toBe(true);
	});

	test('los chips los pone la aplicación', () => {
		const view = mount(NowPlayingCard, {
			props: base,
			slots: { details: () => h('button', { 'data-output': '' }, 'Auriculares') },
		});

		expect(view.find('[data-output]').text()).toBe('Auriculares');
	});

	test('sin nada sonando, el título de reserva', () => {
		traducir('media.nothingPlaying', 'No suena nada');
		const view = mount(NowPlayingCard, { props: { state: 'stopped' } });

		expect(view.find('[data-title]').text()).toBe('No suena nada');
		expect(view.find('[data-artist]').exists()).toBe(false);
		expect(view.find('[data-album]').exists()).toBe(false);
	});
});
