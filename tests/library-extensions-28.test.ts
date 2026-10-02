/**
 * La 2.8.0: los gráficos chicos del tablero de tiempo de pantalla
 * (vasak-desktop#150) y la barra de `ListRow`.
 *
 * Es una minor: lo primero que se comprueba de `ListRow` es que **sin pedir la
 * barra** dibuja lo mismo que antes. Después, lo nuevo.
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mount, type VueWrapper } from '@vue/test-utils';
import BarChart from '../src/data/BarChart.vue';
import CalendarHeatmap from '../src/data/CalendarHeatmap.vue';
import ListRow from '../src/list/ListRow.vue';
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

const WEEK = [
	{ label: 'Lun', shortLabel: 'L', value: 3600, valueLabel: '1 h' },
	{ label: 'Mar', shortLabel: 'M', value: 7200, valueLabel: '2 h' },
	{ label: 'Mié', shortLabel: 'X', value: 0, valueLabel: '0 min' },
	{ label: 'Jue', shortLabel: 'J', value: 14400, valueLabel: '4 h', current: true },
	{ label: 'Vie', shortLabel: 'V', value: 30, valueLabel: '1 min' },
];

describe('el gráfico de barras', () => {
	test('una barra por dato, con su nombre y su valor dichos', () => {
		const view = render(BarChart, { props: { bars: WEEK, label: 'Esta semana' } });

		expect(view.get('figure').attributes('aria-label')).toBe('Esta semana');
		const items = view.findAll('li');
		expect(items).toHaveLength(5);
		expect(items[0]?.attributes('aria-label')).toBe('Lun: 1 h');
		expect(items[0]?.attributes('title')).toBe('Lun: 1 h');
		// Sin valor escrito, el número.
		const plain = render(BarChart, { props: { bars: [{ label: 'Sáb', value: 12 }], label: 'x' } });
		expect(plain.get('li').attributes('aria-label')).toBe('Sáb: 12');
	});

	test('el alto es la parte del máximo, y el máximo se puede fijar', () => {
		const view = render(BarChart, { props: { bars: WEEK, label: 'Semana' } });
		const heights = view.findAll('li').map((li) => li.find('[data-bar]'));

		expect(heights[3]?.attributes('style')).toContain('height: 100%');
		expect(heights[1]?.attributes('style')).toContain('height: 50%');

		const fixed = render(BarChart, { props: { bars: WEEK, label: 'Semana', max: 28800 } });
		expect(fixed.findAll('[data-bar]')[2]?.attributes('style')).toContain('height: 50%');
	});

	test('sin valor no hay barra; con muy poco, se ve igual', () => {
		const view = render(BarChart, { props: { bars: WEEK, label: 'Semana' } });
		const items = view.findAll('li');

		expect(items[2]?.find('[data-bar]').exists()).toBe(false);
		// 30 de 14 400 es 0,2 %: queda en el mínimo de 4 % para que se vea.
		expect(items[4]?.find('[data-bar]').attributes('style')).toContain('height: 4%');
	});

	test('todo en cero, o sin datos, no rompe ni divide por cero', () => {
		const zeros = render(BarChart, { props: { bars: [{ label: 'a', value: 0 }, { label: 'b', value: 0 }], label: 'x' } });
		expect(zeros.findAll('[data-bar]')).toHaveLength(0);

		const none = render(BarChart, { props: { bars: [], label: 'x' } });
		expect(none.findAll('li')).toHaveLength(0);

		const weird = render(BarChart, { props: { bars: [{ label: 'a', value: Number.NaN }, { label: 'b', value: 5 }], label: 'x' } });
		expect(weird.findAll('[data-bar]')).toHaveLength(1);
	});

	test('lo de ahora va en el acento y además se dice: no es sólo el color', () => {
		const view = render(BarChart, { props: { bars: WEEK, label: 'Semana' } });
		const today = view.findAll('li')[3];
		const other = view.findAll('li')[0];

		expect(today?.attributes('aria-current')).toBe('true');
		expect(today?.find('[data-bar]').classes()).toContain('bg-ui-data');
		expect(today?.findAll('span').at(-3)?.classes()).toEqual(expect.arrayContaining(['font-semibold', 'text-tx-main']));
		expect(other?.attributes('aria-current')).toBeUndefined();
		expect(other?.find('[data-bar]').classes()).toContain('bg-tx-muted');
		expect(other?.find('[data-bar]').classes()).not.toContain('bg-primary');
	});

	test('se acomoda al contenedor: nombre corto en angosto, largo con espacio', () => {
		const view = render(BarChart, { props: { bars: WEEK, label: 'Semana' } });
		const label = view.findAll('li')[0];

		expect(view.get('figure').classes()).toEqual(expect.arrayContaining(['@container', 'h-full', 'min-h-20']));
		expect(label?.text()).toContain('L');
		expect(label?.find('.\\@\\[16rem\\]\\:hidden').text()).toBe('L');
		expect(label?.find('.\\@\\[16rem\\]\\:inline').text()).toBe('Lun');
	});
});

describe('el mapa de calor del mes', () => {
	// Marzo de 2026 empieza en domingo: con la semana en lunes, seis huecos.
	const MARCH = { year: 2026, month: 3, locale: 'es-AR' };

	test('un cuadro por día y los huecos antes del 1 según el día en que empieza la semana', () => {
		const monday = render(CalendarHeatmap, { props: { ...MARCH, values: {} } });
		expect(monday.findAll('li[data-level]')).toHaveLength(31);
		expect(monday.findAll('li[data-gap]')).toHaveLength(6);

		const sunday = render(CalendarHeatmap, { props: { ...MARCH, values: {}, weekStart: 0 } });
		expect(sunday.findAll('li[data-gap]')).toHaveLength(0);

		// Febrero de 2028 es bisiesto.
		const leap = render(CalendarHeatmap, { props: { year: 2028, month: 2, values: {} } });
		expect(leap.findAll('li[data-level]')).toHaveLength(29);
	});

	test('el título y los días salen de Intl, en el idioma pedido', () => {
		const view = render(CalendarHeatmap, { props: { ...MARCH, values: {} } });

		expect(view.get('figcaption').text()).toBe('Marzo');
		const weekdays = view.findAll('div[aria-hidden] span').map((span) => span.text());
		expect(weekdays).toHaveLength(7);
		expect(weekdays[0]?.toLowerCase()).toBe('l');

		const english = render(CalendarHeatmap, { props: { ...MARCH, locale: 'en-US', values: {} } });
		expect(english.get('figcaption').text()).toBe('March');

		const untitled = render(CalendarHeatmap, { props: { ...MARCH, values: {}, title: '' } });
		expect(untitled.find('figcaption').exists()).toBe(false);
		expect(untitled.get('figure').attributes('aria-label')).toBe('marzo');
	});

	test('cinco niveles: nada, y cuatro tramos del máximo', () => {
		const view = render(CalendarHeatmap, {
			props: { ...MARCH, values: { 1: 100, 2: 75, 3: 50, 4: 25, 5: 1, 6: 0 } },
		});
		const levels = view.findAll('li[data-level]').map((li) => li.attributes('data-level'));

		expect(levels.slice(0, 7)).toEqual(['4', '3', '2', '1', '1', '0', '0']);
		const cells = view.findAll('li[data-level]');
		expect(cells[0]?.classes()).toContain('bg-ui-data');
		expect(cells[3]?.classes()).toContain('bg-ui-data/35');
		expect(cells[6]?.classes()).toContain('bg-ui-line-weak');
	});

	test('con un máximo fijo, el nivel se mide contra él', () => {
		const view = render(CalendarHeatmap, { props: { ...MARCH, values: { 1: 100 }, max: 400 } });
		expect(view.find('li[data-level]').attributes('data-level')).toBe('1');
	});

	test('cada día dice su valor en texto: el color sólo no alcanza', () => {
		const view = render(CalendarHeatmap, {
			props: { ...MARCH, values: { 15: 4800 }, formatValue: (value: number) => `${Math.round(value / 60)} min` },
		});
		const day = view.findAll('li[data-level]')[14];

		expect(day?.attributes('aria-label')).toBe('15 de marzo: 80 min');
		expect(day?.attributes('title')).toBe('15 de marzo: 80 min');
	});

	test('hoy lleva aria-current y el elegido un contorno que se ve sobre cualquier nivel', () => {
		const view = render(CalendarHeatmap, { props: { ...MARCH, values: { 10: 5 }, today: 10, selected: 9 } });
		const cells = view.findAll('li[data-level]');

		expect(cells[9]?.attributes('aria-current')).toBe('date');
		expect(cells[8]?.attributes('aria-current')).toBeUndefined();
		expect(cells[8]?.classes()).toEqual(expect.arrayContaining(['outline-2', 'outline-tx-main']));
		expect(cells[9]?.classes()).not.toContain('outline-2');
	});

	test('vacío no rompe: todo el mes en la vía', () => {
		const view = render(CalendarHeatmap, { props: { ...MARCH, values: {} } });
		const levels = new Set(view.findAll('li[data-level]').map((li) => li.attributes('data-level')));

		expect([...levels]).toEqual(['0']);
	});

	test('los cuadros son cuadrados y llenan la columna: se achican con el contenedor', () => {
		const view = render(CalendarHeatmap, { props: { ...MARCH, values: {} } });

		expect(view.get('figure').classes()).toEqual(expect.arrayContaining(['@container', 'min-w-0', 'w-full']));
		expect(view.find('li[data-level]').classes()).toEqual(expect.arrayContaining(['aspect-square', 'min-w-0']));
		expect(view.get('ol').classes()).toContain('grid-cols-7');
	});
});

describe('la fila de lista con barra', () => {
	test('sin pedir la barra, la fila es la de antes', () => {
		const view = render(ListRow, { props: { title: 'Firefox', meta: '1 h 49 min' } });

		expect(view.find('[data-row-bar]').exists()).toBe(false);
		expect(view.classes()).not.toContain('@container');
		expect(view.classes().join(' ')).not.toContain('hover:');
	});

	test('con barra: el relleno proporcional en ui-data, sobre la vía, y el dato escrito al lado', () => {
		const view = render(ListRow, { props: { title: 'Firefox', meta: '1 h 49 min', icon: 'firefox', bar: 0.62 } });

		const track = view.get('[data-row-bar]');
		expect(track.attributes('aria-hidden')).toBe('true');
		expect(track.classes()).toContain('bg-ui-line-weak');
		const fill = view.get('[data-row-bar-fill]');
		expect(fill.classes()).toContain('bg-ui-data');
		expect(fill.attributes('style')).toContain('width: 62%');
		expect(view.text()).toContain('1 h 49 min');
		expect(view.text()).toContain('Firefox');
	});

	test('la barra se topa en 0 y en 100, y lo que no es un número es cero', () => {
		for (const [bar, width] of [
			[1.7, '100%'],
			[-3, '0%'],
			[Number.NaN, '0%'],
			[0, '0%'],
		] as const) {
			const view = render(ListRow, { props: { title: 'a', bar } });
			expect(view.get('[data-row-bar-fill]').attributes('style')).toContain(`width: ${width}`);
		}
	});

	test('con espacio el título y la barra van en un renglón; angosto, la barra baja', () => {
		const view = render(ListRow, { props: { title: 'LibreOffice', bar: 0.3 } });

		expect(view.classes()).toContain('@container');
		const content = view.get('[data-row-bar]').element.parentElement as HTMLElement;
		expect(content.className).toContain('flex-col');
		expect(content.className).toContain('@[20rem]:flex-row');
		// Apilada, la barra no crece en la columna (le daría alto cero); en
		// renglón, sí, y el título mide lo mismo en todas las filas.
		const track = view.get('[data-row-bar]').classes();
		expect(track).not.toContain('flex-1');
		expect(track).toContain('@[20rem]:flex-1');
		expect(content.firstElementChild?.className).toContain('@[20rem]:w-[30cqw]');
	});

	test('hoverable realza al pasar aunque la fila no haga nada', () => {
		const plain = render(ListRow, { props: { title: 'kitty', hoverable: true } });
		expect(plain.classes()).toContain('hover:bg-ui-hover');
		expect(plain.attributes('role')).toBeUndefined();
		expect(plain.attributes('tabindex')).toBeUndefined();

		// Elegida, el velo de acento manda.
		const selected = render(ListRow, { props: { title: 'kitty', hoverable: true, selected: true } });
		expect(selected.classes()).not.toContain('hover:bg-ui-hover');
	});
});
