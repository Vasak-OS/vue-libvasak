/**
 * La capa de transiciones compartida de la 2.21.0 (`RevealTransition` y
 * `SlideTransition`).
 *
 * Lo propio de cada componente es traducir sus props a las clases que le pasa al
 * `<Transition>`: de ahí sale cuánto se mueve, de qué lado y con qué curva. Se lee
 * lo que recibe el `<Transition>` y no el DOM, porque las clases de transición
 * sólo viven durante la animación. Las clases tienen que ser las completas
 * (`-translate-x-1.5`) y no armadas por pedazos: Tailwind sólo emite las que lee
 * escritas.
 */

import { describe, expect, test } from 'bun:test';
import { mount } from '@vue/test-utils';
import { h, Transition } from 'vue';
import RevealTransition from '../src/transition/RevealTransition.vue';
import SlideTransition from '../src/transition/SlideTransition.vue';

type Props = Record<string, unknown>;

/** Lo que el componente le pasa al `<Transition>`, con las clases como lista. */
function transitionProps(component: typeof RevealTransition | typeof SlideTransition, props: Props = {}) {
	const wrapper = mount(component as never, {
		props,
		slots: { default: () => h('div', 'contenido') },
	});
	const raw = wrapper.findComponent(Transition).props() as Record<string, unknown>;
	const attrs = wrapper.findComponent(Transition).vm.$attrs as Record<string, unknown>;
	const get = (key: string) => (raw[key] ?? attrs[key]) as string | undefined;
	const classes = (key: string) => (get(key) ?? '').split(/\s+/).filter(Boolean);
	return {
		wrapper,
		mode: get('mode'),
		enterActive: classes('enterActiveClass'),
		leaveActive: classes('leaveActiveClass'),
		enterFrom: classes('enterFromClass'),
		leaveTo: classes('leaveToClass'),
	};
}

describe('RevealTransition', () => {
	test('muestra el contenido que envuelve', () => {
		const { wrapper } = transitionProps(RevealTransition);

		expect(wrapper.text()).toBe('contenido');
	});

	test('entra con opacidad en 200 ms con ease-ui-out y sale en 150 ms con ease-in', () => {
		const t = transitionProps(RevealTransition);

		expect(t.enterActive).toContain('duration-200');
		expect(t.enterActive).toContain('ease-ui-out');
		expect(t.leaveActive).toContain('duration-150');
		expect(t.leaveActive).toContain('ease-in');
		expect(t.enterFrom).toContain('opacity-0');
		expect(t.leaveTo).toContain('opacity-0');
	});

	test('sin scale ni from sólo se anima la opacidad', () => {
		const t = transitionProps(RevealTransition);

		expect([...t.enterFrom, ...t.leaveTo].filter((c) => /scale|translate/.test(c))).toEqual([]);
	});

	test('con scale crece de 0,96 al entrar y se achica a 0,98 al salir, y con movimiento reducido no escala', () => {
		const t = transitionProps(RevealTransition, { scale: true });

		expect(t.enterFrom).toContain('scale-96');
		expect(t.enterFrom).toContain('motion-reduce:scale-100');
		expect(t.leaveTo).toContain('scale-98');
		expect(t.leaveTo).toContain('motion-reduce:scale-100');
	});

	test('con scale no se desplaza', () => {
		const t = transitionProps(RevealTransition, { scale: true });

		expect([...t.enterFrom, ...t.leaveTo].filter((c) => /translate/.test(c))).toEqual([]);
	});

	test.each([
		['left', '-translate-x-1.5', 'motion-reduce:translate-x-0'],
		['right', 'translate-x-1.5', 'motion-reduce:translate-x-0'],
		['up', '-translate-y-1.5', 'motion-reduce:translate-y-0'],
		['down', 'translate-y-1.5', 'motion-reduce:translate-y-0'],
	])('con from=%s entra desplazado 6 px desde ese lado y sale sin desplazarse', (from, offset, reduced) => {
		const t = transitionProps(RevealTransition, { from });

		expect(t.enterFrom).toContain(offset);
		expect(t.enterFrom).toContain(reduced);
		expect(t.leaveTo.filter((c) => /translate/.test(c))).toEqual([]);
		expect(t.enterFrom.filter((c) => /scale/.test(c))).toEqual([]);
	});

	test('scale y from se pueden combinar', () => {
		const t = transitionProps(RevealTransition, { scale: true, from: 'down' });

		expect(t.enterFrom).toContain('scale-96');
		expect(t.enterFrom).toContain('translate-y-1.5');
		expect(t.leaveTo).toContain('scale-98');
	});

	test('el mode llega al Transition y sin mode no se fuerza ninguno', () => {
		expect(transitionProps(RevealTransition, { mode: 'out-in' }).mode).toBe('out-in');
		expect(transitionProps(RevealTransition, { mode: 'in-out' }).mode).toBe('in-out');
		expect(transitionProps(RevealTransition).mode).toBeUndefined();
	});
});

describe('SlideTransition', () => {
	test('muestra el contenido que envuelve', () => {
		const { wrapper } = transitionProps(SlideTransition);

		expect(wrapper.text()).toBe('contenido');
	});

	test('entra en 200 ms con ease-ui-out y sale en 150 ms con ease-in, moviendo sólo opacidad y translate', () => {
		const t = transitionProps(SlideTransition);

		expect(t.enterActive).toContain('duration-200');
		expect(t.enterActive).toContain('ease-ui-out');
		expect(t.leaveActive).toContain('duration-150');
		expect(t.leaveActive).toContain('ease-in');
		expect(t.enterActive).toContain('transition-[opacity,translate]');
		expect(t.leaveActive).toContain('transition-[opacity,translate]');
		expect(t.enterFrom).toContain('opacity-0');
		expect(t.leaveTo).toContain('opacity-0');
	});

	test('por omisión la sección nueva entra desde la derecha y la anterior sale hacia la izquierda', () => {
		const t = transitionProps(SlideTransition);

		expect(t.enterFrom).toContain('translate-x-4');
		expect(t.leaveTo).toContain('-translate-x-4');
	});

	test.each([
		['left', ['-translate-x-4', 'motion-reduce:translate-x-0'], ['translate-x-4', 'motion-reduce:translate-x-0']],
		['right', ['translate-x-4', 'motion-reduce:translate-x-0'], ['-translate-x-4', 'motion-reduce:translate-x-0']],
		['up', ['-translate-y-4', 'motion-reduce:translate-y-0'], ['translate-y-4', 'motion-reduce:translate-y-0']],
		['down', ['translate-y-4', 'motion-reduce:translate-y-0'], ['-translate-y-4', 'motion-reduce:translate-y-0']],
	])('con direction=%s entra desde ese lado y la anterior sale al contrario, y con movimiento reducido no se mueve', (direction, enters, leaves) => {
		const t = transitionProps(SlideTransition, { direction });

		expect(t.enterFrom).toEqual(['opacity-0', ...enters]);
		expect(t.leaveTo).toEqual(['opacity-0', ...leaves]);
	});

	test('el mode llega al Transition y sin mode no se fuerza ninguno', () => {
		expect(transitionProps(SlideTransition, { mode: 'out-in' }).mode).toBe('out-in');
		expect(transitionProps(SlideTransition).mode).toBeUndefined();
	});
});
