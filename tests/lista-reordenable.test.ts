/**
 * La lista que se reordena, con el teclado y con el puntero.
 *
 * Lo que tiene que andar sin regresión respecto de los botones «subir»/«bajar»
 * que reemplaza: mover con las flechas emite la lista ya reordenada; el modo de
 * «agarrar» con la barra espaciadora mueve en borrador y recién suelta al
 * confirmar, con Escape para arrepentirse. Y lo que el arrastre nativo no
 * resolvía: dos ítems de mismo nombre siguen siendo distintos, porque la clave
 * por omisión es la identidad del objeto y no la posición.
 *
 * El arrastre con el puntero se prueba con los rectángulos de las filas
 * falseados: `happy-dom` no maqueta, así que sin eso `getBoundingClientRect`
 * devuelve ceros y no habría dónde soltar.
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mount, type VueWrapper } from '@vue/test-utils';
import { h } from 'vue';
import SortableList from '../src/list/SortableList.vue';
import { olvidarTodo, traducir, vaciarElCatalogo } from './dobles';

type Item = { id: string; name: string };

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

function tres(): Item[] {
	return [
		{ id: 'a', name: 'Uno' },
		{ id: 'b', name: 'Dos' },
		{ id: 'c', name: 'Tres' },
	];
}

function montar(props: Record<string, unknown> = {}, model: unknown[] = tres()) {
	const vista = mount(SortableList, {
		attachTo: document.body,
		props: { modelValue: model, itemKey: 'id', ...props },
		slots: { item: (scope: { item: Item }) => h('span', { class: 'row-name' }, scope.item.name) },
	});
	mounted = vista;
	return vista;
}

/** Los nombres en el orden en que se dibujan ahora mismo. */
function nombres(vista: VueWrapper) {
	return vista.findAll('.row-name').map((nodo) => nodo.text());
}

/** Las asas, en orden. */
function asas(vista: VueWrapper) {
	return vista.findAll('[data-sortable-handle]');
}

function ids(lista: unknown): string[] {
	return (lista as Item[]).map((item) => item.id);
}

describe('el asa', () => {
	test('hay una por fila, y es un botón', () => {
		const vista = montar();
		const todas = asas(vista);

		expect(todas).toHaveLength(3);
		expect(todas[0]?.attributes('type')).toBe('button');
	});

	test('se nombra con la propiedad, con el catálogo o con el respaldo', () => {
		traducir('sortableList.reorder', 'Reordenar');
		expect(asas(montar())[0]?.attributes('aria-label')).toBe('Reordenar');

		mounted?.unmount();
		expect(asas(montar({ handleLabel: 'Mover' }))[0]?.attributes('aria-label')).toBe('Mover');

		mounted?.unmount();
		vaciarElCatalogo();
		expect(asas(montar())[0]?.attributes('aria-label')).toBe('Reorder');
	});

	test('apagada, no hay asa ni se reordena', () => {
		const vista = montar({ disabled: true });

		expect(asas(vista)).toHaveLength(0);
		expect(nombres(vista)).toEqual(['Uno', 'Dos', 'Tres']);
	});
});

describe('con el teclado, suelto', () => {
	test('la flecha abajo mueve un lugar y emite la lista reordenada', async () => {
		const vista = montar();

		await asas(vista)[0]?.trigger('keydown', { key: 'ArrowDown' });

		const emitido = vista.emitted('update:modelValue');
		expect(emitido).toHaveLength(1);
		expect(ids(emitido?.[0]?.[0])).toEqual(['b', 'a', 'c']);
		expect(vista.emitted('reorder')?.[0]?.[0]).toEqual({ from: 0, to: 1 });
	});

	test('la flecha arriba en la primera no hace nada', async () => {
		const vista = montar();

		await asas(vista)[0]?.trigger('keydown', { key: 'ArrowUp' });

		expect(vista.emitted('update:modelValue')).toBeUndefined();
	});

	test('Fin la lleva al final', async () => {
		const vista = montar();

		await asas(vista)[0]?.trigger('keydown', { key: 'End' });

		expect(ids(vista.emitted('update:modelValue')?.[0]?.[0])).toEqual(['b', 'c', 'a']);
		expect(vista.emitted('reorder')?.[0]?.[0]).toEqual({ from: 0, to: 2 });
	});
});

describe('con el teclado, agarrando', () => {
	test('la barra agarra: anuncia, marca el botón y mueve en borrador sin emitir', async () => {
		const vista = montar();
		const asa = asas(vista)[0];

		await asa?.trigger('keydown', { key: ' ' });
		expect(asa?.attributes('aria-pressed')).toBe('true');
		expect(vista.find('[role="status"]').text()).not.toBe('');

		// El mismo nodo del asa: la fila `a` se movió con su asa, así que la
		// referencia sigue apuntándole.
		await asa?.trigger('keydown', { key: 'ArrowDown' });

		expect(vista.emitted('update:modelValue')).toBeUndefined();
		expect(nombres(vista)).toEqual(['Dos', 'Uno', 'Tres']);
	});

	test('Enter suelta y recién ahí emite', async () => {
		const vista = montar();
		const asa = asas(vista)[0];

		await asa?.trigger('keydown', { key: ' ' });
		await asa?.trigger('keydown', { key: 'ArrowDown' });
		await asa?.trigger('keydown', { key: 'Enter' });

		const emitido = vista.emitted('update:modelValue');
		expect(emitido).toHaveLength(1);
		expect(ids(emitido?.[0]?.[0])).toEqual(['b', 'a', 'c']);
		expect(vista.emitted('reorder')?.[0]?.[0]).toEqual({ from: 0, to: 1 });
		expect(asa?.attributes('aria-pressed')).toBeUndefined();
	});

	test('Escape cancela: vuelve al orden original y no emite', async () => {
		const vista = montar();
		const asa = asas(vista)[0];

		await asa?.trigger('keydown', { key: ' ' });
		await asa?.trigger('keydown', { key: 'ArrowDown' });
		await asa?.trigger('keydown', { key: 'Escape' });

		expect(vista.emitted('update:modelValue')).toBeUndefined();
		expect(nombres(vista)).toEqual(['Uno', 'Dos', 'Tres']);
		expect(asa?.attributes('aria-pressed')).toBeUndefined();
	});
});

describe('la identidad de cada ítem', () => {
	test('por omisión es el objeto: dos de mismo nombre no se confunden al mover', async () => {
		// El caso de los módulos de fastfetch: `{ name, options }` con nombres
		// repetidos. Sin `itemKey`, la clave es la identidad del objeto, así que
		// mover el primer «CPU» reordena por posición y deja el segundo donde
		// estaba. El campo `tag` —que no se dibuja— distingue a los gemelos; por
		// referencia no se puede, porque la prop reactiva de Vue los envuelve.
		const lista = [
			{ name: 'CPU', tag: 0 },
			{ name: 'CPU', tag: 1 },
			{ name: 'GPU', tag: 2 },
		];
		const vista = mount(SortableList, {
			attachTo: document.body,
			props: { modelValue: lista },
			slots: { item: (scope: { item: { name: string } }) => h('span', { class: 'row-name' }, scope.item.name) },
		});
		mounted = vista;

		await asas(vista)[0]?.trigger('keydown', { key: 'ArrowDown' });

		const emitida = vista.emitted('update:modelValue')?.[0]?.[0] as Array<{ tag: number }>;
		expect(emitida.map((item) => item.tag)).toEqual([1, 0, 2]);
	});
});

describe('con el puntero', () => {
	/** Les pone a las filas un rectángulo de 40 px de alto, en su orden actual. */
	function medir(vista: VueWrapper) {
		vista.findAll('li').forEach((fila, indice) => {
			(fila.element as HTMLElement).getBoundingClientRect = () =>
				({
					top: indice * 40,
					bottom: indice * 40 + 40,
					height: 40,
					left: 0,
					right: 100,
					width: 100,
					x: 0,
					y: indice * 40,
					toJSON() {},
				}) as DOMRect;
		});
	}

	test('arrastrar la primera hasta abajo la reordena en vivo y la emite al soltar', async () => {
		const vista = montar();
		medir(vista);
		const asa = asas(vista)[0];

		await asa?.trigger('pointerdown', { pointerId: 1, button: 0, pointerType: 'mouse' });
		await asa?.trigger('pointermove', { pointerId: 1, clientY: 110 });

		expect(nombres(vista)).toEqual(['Dos', 'Tres', 'Uno']);
		expect(vista.emitted('update:modelValue')).toBeUndefined();

		await asa?.trigger('pointerup', { pointerId: 1 });

		expect(ids(vista.emitted('update:modelValue')?.[0]?.[0])).toEqual(['b', 'c', 'a']);
		expect(vista.emitted('reorder')?.[0]?.[0]).toEqual({ from: 0, to: 2 });
	});

	test('soltar sin moverse no emite nada', async () => {
		const vista = montar();
		medir(vista);
		const asa = asas(vista)[0];

		await asa?.trigger('pointerdown', { pointerId: 1, button: 0, pointerType: 'mouse' });
		await asa?.trigger('pointerup', { pointerId: 1 });

		expect(vista.emitted('update:modelValue')).toBeUndefined();
	});
});

describe('la forma (vue-libvasak#74)', () => {
	test('el asa es un botón de 32 sin borde, con el velo neutro y el foco visible', () => {
		const clases = asas(montar())[0]?.classes() ?? [];

		expect(clases).toContain('size-8');
		expect(clases).toContain('hover:bg-ui-hover');
		expect(clases).toContain('active:bg-ui-pressed');
		expect(clases).toContain('focus-visible:outline-ui-focus');
		expect(clases.join(' ')).not.toMatch(/(^|\s)border(-|\s|$)/);
	});

	test('la fila que se arrastra se levanta sobre la superficie flotante', async () => {
		const vista = montar();
		await asas(vista)[0]?.trigger('pointerdown', { pointerId: 1, button: 0, pointerType: 'mouse' });

		const clases = vista.findAll('li')[0]?.classes() ?? [];
		expect(clases).toContain('bg-ui-float');
		expect(clases).toContain('shadow-surface-m');
		expect(clases).toContain('z-10');
	});
});
