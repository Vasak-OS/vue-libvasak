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

import { describe, expect, mock, test } from 'bun:test';
import { mount } from '@vue/test-utils';
import { h, nextTick, ref, Transition, vShow, withDirectives } from 'vue';
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

/**
 * La 2.21.1 declara `appear` y los hooks de entrada y salida en los dos
 * componentes. Se prueba con el `<Transition>` de verdad (`stubs: { transition:
 * false }`), no con el doble de `@vue/test-utils`: lo que importa es que el hook
 * corra cuando la transición corre.
 *
 * Con `happy-dom` no hay CSS de transición, así que la transición termina en el
 * siguiente cuadro; se espera cuadro a cuadro, sin dormir. Lo que no se puede
 * medir acá es la duración real ni el `transitionend` del navegador (ver el
 * informe de QA).
 */
const componentes = [
	['RevealTransition', RevealTransition],
	['SlideTransition', SlideTransition],
] as const;

/** Espera cuadros de animación hasta que se cumpla la condición (con tope). */
async function hasta(condicion: () => boolean) {
	for (let i = 0; i < 20 && !condicion(); i++) {
		await new Promise((resolver) => requestAnimationFrame(() => resolver(null)));
	}
}

/** Monta el componente con una transición real y un contenido que se puede esconder. */
function montarReal(component: typeof RevealTransition | typeof SlideTransition, props: Props = {}, visible = true) {
	const mostrar = ref(visible);
	const wrapper = mount(component as never, {
		props,
		global: { stubs: { transition: false } },
		slots: { default: () => (mostrar.value ? h('div', { id: 'contenido' }, 'contenido') : null) },
	});
	return { wrapper, mostrar };
}

describe.each(componentes)('%s: appear y hooks', (_nombre, Componente) => {
	test('declara appear, onEnter y onLeave como props y los seis eventos como emits', () => {
		const declaradas = Object.keys((Componente as unknown as { props: Props }).props);
		const emitidos = (Componente as unknown as { emits: string[] }).emits;

		expect(declaradas).toEqual(expect.arrayContaining(['appear', 'onEnter', 'onLeave']));
		expect(emitidos).toEqual(
			expect.arrayContaining(['beforeEnter', 'afterEnter', 'enterCancelled', 'beforeLeave', 'afterLeave', 'leaveCancelled'])
		);
		// enter y leave van como props, no como emits: un reenvío propio de dos
		// parámetros haría que el Transition esperara `done` para siempre.
		expect(emitidos).not.toContain('enter');
		expect(emitidos).not.toContain('leave');
	});

	test('con appear la transición de entrada corre al montar', async () => {
		const { wrapper } = montarReal(Componente, { appear: true });

		expect(wrapper.emitted('beforeEnter')?.[0]?.[0]).toBe(wrapper.find('#contenido').element);
		await hasta(() => !!wrapper.emitted('afterEnter'));
		expect(wrapper.emitted('afterEnter')?.[0]?.[0]).toBe(wrapper.find('#contenido').element);
	});

	test('sin appear no hay transición al montar', async () => {
		const { wrapper } = montarReal(Componente);

		await hasta(() => !!wrapper.emitted('beforeEnter'));
		expect(wrapper.emitted('beforeEnter')).toBeUndefined();
		expect(wrapper.emitted('afterEnter')).toBeUndefined();
	});

	test('con appear el Transition recibe appear=true y sin él no se le fuerza', () => {
		expect(transitionProps(Componente, { appear: true }).wrapper.findComponent(Transition).props('appear')).toBe(true);
		expect(transitionProps(Componente).wrapper.findComponent(Transition).props('appear')).toBeFalsy();
	});

	test('al mostrarse emite beforeEnter y afterEnter con el elemento', async () => {
		const { wrapper, mostrar } = montarReal(Componente, {}, false);

		mostrar.value = true;
		await nextTick();
		const el = wrapper.find('#contenido').element;
		expect(wrapper.emitted('beforeEnter')?.[0]).toEqual([el]);
		await hasta(() => !!wrapper.emitted('afterEnter'));
		expect(wrapper.emitted('afterEnter')?.[0]).toEqual([el]);
	});

	test('al esconderse emite beforeLeave y afterLeave con el elemento', async () => {
		const { wrapper, mostrar } = montarReal(Componente);
		const el = wrapper.find('#contenido').element;

		mostrar.value = false;
		await nextTick();
		expect(wrapper.emitted('beforeLeave')?.[0]).toEqual([el]);
		await hasta(() => !!wrapper.emitted('afterLeave'));
		expect(wrapper.emitted('afterLeave')?.[0]).toEqual([el]);
	});

	test('si se esconde en plena entrada emite enterCancelled', async () => {
		const { wrapper, mostrar } = montarReal(Componente, {}, false);

		mostrar.value = true;
		await nextTick();
		mostrar.value = false;
		await nextTick();

		expect(wrapper.emitted('enterCancelled')).toHaveLength(1);
	});

	test('si se vuelve a mostrar en plena salida emite leaveCancelled', async () => {
		// Con v-show el mismo elemento sale y vuelve; con v-if sería otro nodo.
		const mostrar = ref(true);
		const wrapper = mount(Componente as never, {
			global: { stubs: { transition: false } },
			slots: { default: () => withDirectives(h('div', { id: 'contenido' }), [[vShow, mostrar.value]]) },
		});

		mostrar.value = false;
		await nextTick();
		mostrar.value = true;
		await nextTick();

		expect(wrapper.emitted('leaveCancelled')).toHaveLength(1);
	});

	test('un oyente en la forma @after-enter se llama una sola vez, con el elemento', async () => {
		const alTerminar = mock((_el: Element) => {});
		const mostrar = ref(false);
		const wrapper = mount(Componente as never, {
			attrs: { onAfterEnter: alTerminar },
			global: { stubs: { transition: false } },
			slots: { default: () => (mostrar.value ? h('div', { id: 'contenido' }) : null) },
		});

		mostrar.value = true;
		await nextTick();
		await hasta(() => alTerminar.mock.calls.length > 0);
		await hasta(() => false);
		expect(alTerminar).toHaveBeenCalledTimes(1);
		expect(alTerminar.mock.calls[0]?.[0]).toBe(wrapper.find('#contenido').element);
	});

	test('onEnter y onLeave llegan al Transition tal cual, con su aridad', () => {
		const entrar = (_el: Element) => {};
		const salir = (_el: Element, _done: () => void) => {};
		const t = transitionProps(Componente, { onEnter: entrar, onLeave: salir });
		const interno = t.wrapper.findComponent(Transition).props() as Record<string, unknown>;

		expect(interno.onEnter).toBe(entrar);
		expect(interno.onLeave).toBe(salir);
		expect((interno.onEnter as () => void).length).toBe(1);
		expect((interno.onLeave as () => void).length).toBe(2);
	});

	test('un onEnter de un parámetro no hace esperar un done: la entrada termina sola', async () => {
		const entrar = mock((_el: Element) => {});
		const { wrapper, mostrar } = montarReal(Componente, { onEnter: entrar }, false);

		mostrar.value = true;
		await nextTick();
		expect(entrar).toHaveBeenCalledTimes(1);
		expect(entrar.mock.calls[0]?.[0]).toBe(wrapper.find('#contenido').element);
		await hasta(() => !!wrapper.emitted('afterEnter'));
		expect(wrapper.emitted('afterEnter')).toHaveLength(1);
	});

	test('un onLeave de un parámetro no hace esperar un done: la salida termina sola', async () => {
		const salir = mock((_el: Element) => {});
		const { wrapper, mostrar } = montarReal(Componente, { onLeave: salir });
		const el = wrapper.find('#contenido').element;

		mostrar.value = false;
		await nextTick();
		expect(salir).toHaveBeenCalledTimes(1);
		expect(salir.mock.calls[0]?.[0]).toBe(el);
		await hasta(() => !!wrapper.emitted('afterLeave'));
		expect(wrapper.emitted('afterLeave')).toHaveLength(1);
	});

	test('sin onEnter ni onLeave la transición termina sola, sin esperar un done', async () => {
		const { wrapper, mostrar } = montarReal(Componente);

		mostrar.value = false;
		await nextTick();
		await hasta(() => !!wrapper.emitted('afterLeave'));
		expect(wrapper.emitted('afterLeave')).toHaveLength(1);
	});

	test('un onEnter de dos parámetros espera a done para terminar la entrada', async () => {
		let hecho: (() => void) | undefined;
		const entrar = (_el: Element, done: () => void) => {
			hecho = done;
		};
		const { wrapper, mostrar } = montarReal(Componente, { onEnter: entrar }, false);

		mostrar.value = true;
		await nextTick();
		await hasta(() => !!wrapper.emitted('afterEnter'));
		expect(wrapper.emitted('afterEnter')).toBeUndefined();

		hecho?.();
		await nextTick();
		expect(wrapper.emitted('afterEnter')).toHaveLength(1);
	});

	test('un onLeave de dos parámetros espera a done para terminar la salida', async () => {
		let hecho: (() => void) | undefined;
		const salir = (_el: Element, done: () => void) => {
			hecho = done;
		};
		const { wrapper, mostrar } = montarReal(Componente, { onLeave: salir });

		mostrar.value = false;
		await nextTick();
		await hasta(() => !!wrapper.emitted('afterLeave'));
		expect(wrapper.emitted('afterLeave')).toBeUndefined();

		hecho?.();
		await nextTick();
		expect(wrapper.emitted('afterLeave')).toHaveLength(1);
	});
});
