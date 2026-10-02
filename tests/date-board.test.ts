/**
 * Las piezas de la 2.9.0: el tablero de fecha del escritorio
 * (vasak-desktop#130) y lo que comparte con los widgets de calendario (#112).
 *
 * Primero las cuentas de `dates.ts`, que es donde se equivoca un calendario:
 * en qué día empieza la semana, cuántos días tiene el mes, qué días toca un
 * evento que cruza la medianoche o que es de día completo. Después cada
 * componente: lo que dibuja, cómo se elige y qué oye un lector de pantalla.
 *
 * La zona horaria se fija al principio en la de Buenos Aires (UTC−3): es donde
 * un día completo, que viaja a medianoche UTC, caía un día antes.
 */

process.env.TZ = 'America/Argentina/Buenos_Aires';

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mount, type VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import EventList from '../src/calendar/EventList.vue';
import MonthCalendar from '../src/calendar/MonthCalendar.vue';
import {
	addDays,
	addMonths,
	type CalendarEntry,
	daysInMonth,
	entriesOn,
	entryDays,
	isOngoing,
	markedDates,
	monthGrid,
	parseIsoDate,
	safeCalendarColor,
	toIsoDate,
	weekdayNames,
	weekStartOf,
} from '../src/calendar/dates';
import ClockDisplay from '../src/data/ClockDisplay.vue';
import HourlyForecast from '../src/data/HourlyForecast.vue';
import ProgressRing from '../src/data/ProgressRing.vue';
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
	document.body.innerHTML = '';
});

describe('la cuadrícula del mes', () => {
	test('siempre seis semanas de siete días, para que el calendario no cambie de alto', () => {
		for (const month of ['2026-02', '2026-03', '2026-08', '2015-02']) {
			const weeks = monthGrid(month, 1);
			expect(weeks).toHaveLength(6);
			for (const week of weeks) expect(week).toHaveLength(7);
		}
	});

	test('meses de 28, 29, 30 y 31 días', () => {
		const inMonth = (month: string) => monthGrid(month, 1).flat().filter((day) => day.inMonth).length;

		expect(inMonth('2026-02')).toBe(28);
		expect(inMonth('2024-02')).toBe(29);
		expect(inMonth('2026-04')).toBe(30);
		expect(inMonth('2026-03')).toBe(31);
		expect(daysInMonth('2024-02')).toBe(29);
		expect(daysInMonth('2100-02')).toBe(28);
	});

	test('la semana empieza donde dice el idioma', () => {
		// Marzo de 2026 empieza en domingo.
		const monday = monthGrid('2026-03', 1);
		const sunday = monthGrid('2026-03', 0);

		expect(monday[0]?.[0]?.weekday).toBe(1);
		expect(monday[0]?.[0]?.date).toBe('2026-02-23');
		expect(monday[0]?.[6]?.date).toBe('2026-03-01');
		expect(sunday[0]?.[0]?.weekday).toBe(0);
		expect(sunday[0]?.[0]?.date).toBe('2026-03-01');

		expect(weekStartOf('en-US')).toBe(0);
		expect(weekStartOf('es-ES')).toBe(1);
		expect(weekStartOf('ar-EG')).toBe(6);
		// Un idioma mal escrito no rompe nada: lunes.
		expect(weekStartOf('no es un idioma')).toBe(1);
	});

	test('los días de otros meses están, marcados como de afuera', () => {
		const days = monthGrid('2026-03', 1).flat();
		const outside = days.filter((day) => !day.inMonth).map((day) => day.date);

		expect(outside.slice(0, 6)).toEqual(['2026-02-23', '2026-02-24', '2026-02-25', '2026-02-26', '2026-02-27', '2026-02-28']);
		expect(outside.at(-1)).toBe('2026-04-05');
		expect(days.find((day) => day.date === '2026-03-22')?.inMonth).toBe(true);
	});

	test('los nombres de los días siguen el orden de la semana', () => {
		expect(weekdayNames('es-AR', 1, 'long')[0]).toBe('lunes');
		expect(weekdayNames('es-AR', 0, 'long')[0]).toBe('domingo');
		expect(weekdayNames('en-US', 0, 'short')).toHaveLength(7);
	});

	test('las fechas viajan como texto y un día que no existe no es un día', () => {
		expect(parseIsoDate('2026-02-30')).toBeNull();
		expect(parseIsoDate('22/03/2026')).toBeNull();
		expect(toIsoDate(parseIsoDate('2026-03-22') as Date)).toBe('2026-03-22');
		expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
		expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
		expect(addMonths('2026-12', 1)).toBe('2027-01');
		expect(addMonths('2026-01', -1)).toBe('2025-12');
	});
});

describe('los días que toca un evento', () => {
	test('uno con hora toca el día en que empieza, en la hora de quien mira', () => {
		// 22:30 en Buenos Aires es 01:30 UTC del día siguiente.
		expect(entryDays({ start: '2026-03-23T01:30:00Z', end: '2026-03-23T02:30:00Z' })).toEqual(['2026-03-22']);
	});

	test('uno que cruza la medianoche toca los dos días; uno que termina justo a medianoche, no', () => {
		expect(entryDays({ start: new Date(2026, 2, 22, 23), end: new Date(2026, 2, 23, 1) })).toEqual(['2026-03-22', '2026-03-23']);
		expect(entryDays({ start: new Date(2026, 2, 22, 22), end: new Date(2026, 2, 23, 0) })).toEqual(['2026-03-22']);
	});

	test('uno de día completo se lee en UTC: no cae un día antes al oeste de Greenwich', () => {
		// Lo que manda `ListOccurrences`: medianoche UTC, fin exclusivo.
		expect(entryDays({ start: '2026-03-23T00:00:00Z', end: '2026-03-24T00:00:00Z', allDay: true })).toEqual(['2026-03-23']);
		// Y un día suelto se toma tal cual.
		expect(entryDays({ start: '2026-03-23', allDay: true })).toEqual(['2026-03-23']);
	});

	test('uno de varios días los toca todos, y el fin exclusivo no suma uno de más', () => {
		expect(entryDays({ start: '2026-03-27T00:00:00Z', end: '2026-03-30T00:00:00Z', allDay: true })).toEqual([
			'2026-03-27',
			'2026-03-28',
			'2026-03-29',
		]);
		expect(entryDays({ start: new Date(2026, 2, 30, 9), end: new Date(2026, 3, 2, 18) })).toEqual([
			'2026-03-30',
			'2026-03-31',
			'2026-04-01',
			'2026-04-02',
		]);
	});

	test('sin fin, o con el fin antes del comienzo, toca sólo el primer día; y uno de diez años no cuelga nada', () => {
		expect(entryDays({ start: new Date(2026, 2, 22, 9) })).toEqual(['2026-03-22']);
		expect(entryDays({ start: new Date(2026, 2, 22, 9), end: new Date(2026, 2, 20) })).toEqual(['2026-03-22']);
		expect(entryDays({ start: '2020-01-01', end: '2030-01-01', allDay: true }).length).toBe(400);
		expect(entryDays({ start: 'cualquier cosa' })).toEqual([]);
	});

	const entries: CalendarEntry[] = [
		{ id: 'b', title: 'Daily', start: new Date(2026, 2, 23, 10), end: new Date(2026, 2, 23, 10, 30) },
		{ id: 'a', title: 'Feriado', start: '2026-03-23T00:00:00Z', end: '2026-03-25T00:00:00Z', allDay: true },
		{ id: 'c', title: 'Almuerzo', start: new Date(2026, 2, 23, 9), end: new Date(2026, 2, 23, 9, 45) },
		{ id: 'd', title: 'Otro día', start: new Date(2026, 2, 26, 9), end: new Date(2026, 2, 26, 10) },
	];

	test('los días marcados no se repiten y van en orden', () => {
		expect(markedDates(entries)).toEqual(['2026-03-23', '2026-03-24', '2026-03-26']);
	});

	test('los de un día: primero los de día completo, después por hora', () => {
		expect(entriesOn(entries, '2026-03-23').map((entry) => entry.id)).toEqual(['a', 'c', 'b']);
		expect(entriesOn(entries, '2026-03-24').map((entry) => entry.id)).toEqual(['a']);
		expect(entriesOn(entries, '2026-03-25')).toEqual([]);
	});

	test('está pasando el que tiene hora y la contiene; uno de día completo dura el día y no cuenta', () => {
		const now = new Date(2026, 2, 23, 10, 15);
		expect(isOngoing(entries[0] as CalendarEntry, now)).toBe(true);
		expect(isOngoing(entries[2] as CalendarEntry, now)).toBe(false);
		expect(isOngoing(entries[1] as CalendarEntry, now)).toBe(false);
	});

	test('el color del calendario va al estilo sólo si es un hexadecimal', () => {
		expect(safeCalendarColor('#1e88e5')).toBe('#1e88e5');
		expect(safeCalendarColor(' #ABC ')).toBe('#ABC');
		expect(safeCalendarColor('#1e88e5ff')).toBe('#1e88e5ff');
		expect(safeCalendarColor('red')).toBeNull();
		expect(safeCalendarColor('#123; background: url(x)')).toBeNull();
		expect(safeCalendarColor(null)).toBeNull();
	});
});

describe('el calendario del mes', () => {
	const base = { today: '2026-03-22', month: '2026-03', locale: 'es-AR', weekStart: 1 };
	const cell = (view: VueWrapper, date: string) => view.get(`[data-date="${date}"]`);

	test('hoy va relleno en el acento y lo dice; el elegido, con el canto en el acento', () => {
		const view = render(MonthCalendar, { props: { ...base, modelValue: '2026-03-25' } });

		expect(cell(view, '2026-03-22').classes()).toEqual(expect.arrayContaining(['bg-primary', 'text-tx-on-primary']));
		expect(cell(view, '2026-03-22').attributes('aria-current')).toBe('date');
		expect(cell(view, '2026-03-25').classes()).toContain('border-primary');
		expect(cell(view, '2026-03-25').classes()).not.toContain('bg-primary');
		expect(cell(view, '2026-03-24').classes()).toContain('border-transparent');
	});

	test('el título es el mes y el año, en mayúsculas chicas', () => {
		const view = render(MonthCalendar, { props: base });
		const title = view.get('[data-month-title]');

		expect(title.text()).toBe('marzo de 2026');
		expect(title.classes()).toEqual(expect.arrayContaining(['uppercase', 'text-label-s']));
	});

	test('un día con eventos lleva el punto en el secundario, y quien no lo ve lo oye', () => {
		const view = render(MonthCalendar, { props: { ...base, markedDates: ['2026-03-23', '2026-03-22'] } });

		expect(cell(view, '2026-03-23').find('span').classes()).toContain('bg-secondary');
		expect(cell(view, '2026-03-23').attributes('aria-label')).toBe('lunes, 23 de marzo de 2026, con eventos');
		// Sobre el relleno de hoy el punto va en el color del texto de encima.
		expect(cell(view, '2026-03-22').find('span').classes()).toContain('bg-tx-on-primary');
		expect(cell(view, '2026-03-22').attributes('aria-label')).toBe('domingo, 22 de marzo de 2026, hoy, con eventos');
		expect(cell(view, '2026-03-24').find('span').exists()).toBe(false);
	});

	test('los días de otro mes se atenúan sin bajar la opacidad', () => {
		const view = render(MonthCalendar, { props: base });

		expect(cell(view, '2026-02-23').classes()).toContain('text-tx-muted');
		expect(cell(view, '2026-02-23').classes().join(' ')).not.toMatch(/opacity-/);
		expect(cell(view, '2026-03-10').classes()).toContain('text-tx-main');
	});

	test('la cabecera sigue la semana del idioma', () => {
		const monday = render(MonthCalendar, { props: base });
		const sunday = render(MonthCalendar, { props: { ...base, weekStart: 0 } });

		expect(monday.findAll('[role="columnheader"]')[0]?.attributes('aria-label')).toBe('lunes');
		expect(sunday.findAll('[role="columnheader"]')[0]?.attributes('aria-label')).toBe('domingo');
		expect(monday.findAll('[role="row"]')).toHaveLength(7);
	});

	test('tocar un día lo elige', async () => {
		const view = render(MonthCalendar, { props: base });
		await cell(view, '2026-03-27').trigger('click');

		expect(view.emitted('update:modelValue')?.[0]).toEqual(['2026-03-27']);
		expect(view.emitted('select')?.[0]).toEqual(['2026-03-27']);
	});

	test('tocar un día de otro mes lleva a ese mes', async () => {
		const view = render(MonthCalendar, { props: base });
		await cell(view, '2026-04-02').trigger('click');

		expect(view.emitted('update:month')?.[0]).toEqual(['2026-04']);
		expect(view.get('[data-month-title]').text()).toBe('abril de 2026');
	});

	test('las flechas cambian de mes, con nombre', async () => {
		const view = render(MonthCalendar, { props: { ...base, month: null } });
		const [previous, next] = view.findAll('button').slice(0, 2);

		expect(previous?.attributes('aria-label')).toBe('Mes anterior');
		await next?.trigger('click');
		expect(view.emitted('update:month')?.[0]).toEqual(['2026-04']);
		await previous?.trigger('click');
		await previous?.trigger('click');
		expect(view.emitted('update:month')?.[2]).toEqual(['2026-02']);
	});

	test('los nombres salen de la propiedad o del catálogo', () => {
		traducir('calendar.previousMonth', 'Previous month');
		const fromCatalog = render(MonthCalendar, { props: base });
		const fromProp = render(MonthCalendar, { props: { ...base, nextLabel: 'Siguiente' } });

		expect(fromCatalog.findAll('button')[0]?.attributes('aria-label')).toBe('Previous month');
		expect(fromProp.findAll('button')[1]?.attributes('aria-label')).toBe('Siguiente');
	});

	test('un solo Tab: el elegido si está a la vista, si no hoy', () => {
		const view = render(MonthCalendar, { props: { ...base, modelValue: '2026-03-25' } });
		const stops = view.findAll('[data-date]').filter((day) => day.attributes('tabindex') === '0');

		expect(stops.map((day) => day.attributes('data-date'))).toEqual(['2026-03-25']);

		const other = render(MonthCalendar, { props: { ...base, modelValue: '2026-01-10' } });
		expect(other.findAll('[data-date]').filter((day) => day.attributes('tabindex') === '0').map((day) => day.attributes('data-date'))).toEqual([
			'2026-03-22',
		]);
	});

	test('las flechas del teclado mueven el foco, y al salirse del mes cambia el mes', async () => {
		const view = render(MonthCalendar, { props: { ...base, month: null, modelValue: '2026-03-30' }, attachTo: document.body });
		const focused = () => (document.activeElement as HTMLElement | null)?.dataset.date;

		cell(view, '2026-03-30').element.focus();
		await cell(view, '2026-03-30').trigger('keydown', { key: 'ArrowRight' });
		await nextTick();
		expect(focused()).toBe('2026-03-31');

		await view.get('[data-date="2026-03-31"]').trigger('keydown', { key: 'ArrowDown' });
		await nextTick();
		expect(focused()).toBe('2026-04-07');
		expect(view.emitted('update:month')?.at(-1)).toEqual(['2026-04']);

		await view.get('[data-date="2026-04-07"]').trigger('keydown', { key: 'Home' });
		await nextTick();
		expect(focused()).toBe('2026-04-06');

		await view.get('[data-date="2026-04-06"]').trigger('keydown', { key: 'Enter' });
		expect(view.emitted('select')?.at(-1)).toEqual(['2026-04-06']);
	});

	test('Av Pág desde el 31 de enero va al último de febrero', async () => {
		const view = render(MonthCalendar, {
			props: { ...base, month: null, today: '2026-01-31', modelValue: '2026-01-31' },
			attachTo: document.body,
		});
		cell(view, '2026-01-31').element.focus();
		await cell(view, '2026-01-31').trigger('keydown', { key: 'PageDown' });
		await nextTick();

		expect((document.activeElement as HTMLElement | null)?.dataset.date).toBe('2026-02-28');
	});

	test('las casillas son de 32 px, la zona de toque mínima, con el foco visible', () => {
		const view = render(MonthCalendar, { props: base });

		expect(cell(view, '2026-03-10').classes()).toEqual(
			expect.arrayContaining(['size-8', 'rounded-corner-m', 'focus-visible:outline-ui-focus'])
		);
		expect(view.classes()).toContain('@container');
	});
});

describe('la lista de eventos', () => {
	const now = new Date(2026, 2, 23, 10, 15);
	const entries: CalendarEntry[] = [
		{ id: '1', title: 'Feriado', start: '2026-03-23T00:00:00Z', end: '2026-03-24T00:00:00Z', allDay: true, calendar: 'Feriados' },
		{
			id: '2',
			title: 'Daily del equipo',
			start: new Date(2026, 2, 23, 10),
			end: new Date(2026, 2, 23, 10, 30),
			location: 'Sala 3',
			calendar: 'Trabajo',
			color: '#1e88e5',
		},
		{ id: '3', title: 'Dentista', start: new Date(2026, 2, 23, 17), end: new Date(2026, 2, 23, 18), color: 'url(x)' },
	];

	test('sin eventos lo dice, en vez de quedar en blanco', () => {
		const view = render(EventList, { props: { entries: [] } });

		expect(view.text()).toBe('Nada agendado para este día');
		expect(view.find('ul').exists()).toBe(false);
	});

	test('cada evento con su título, su horario, su lugar y su calendario', () => {
		const view = render(EventList, { props: { entries, now, locale: 'es-AR', hour12: false } });
		const cards = view.findAll('li');

		expect(cards).toHaveLength(3);
		expect(cards[0]?.text()).toContain('Todo el día');
		expect(cards[0]?.text()).toContain('Feriados');
		expect(cards[1]?.text()).toContain('Daily del equipo');
		expect(cards[1]?.text()).toMatch(/10:00\s*–\s*10:30/);
		expect(cards[1]?.text()).not.toMatch(/a\.\s*m\./);
		expect(cards[1]?.text()).toContain('Sala 3');
		expect(cards[1]?.text()).toContain('Trabajo');
	});

	test('la barra va en el color del calendario si es válido, y si no en el secundario', () => {
		const view = render(EventList, { props: { entries, now } });
		const bars = view.findAll('[data-calendar-bar]');

		expect(bars[1]?.attributes('style')).toContain('background-color');
		expect(bars[1]?.classes()).not.toContain('bg-secondary');
		expect(bars[2]?.attributes('style')).toBeUndefined();
		expect(bars[2]?.classes()).toContain('bg-secondary');
	});

	test('el que está pasando lleva el canto en el acento y lo dice', () => {
		const view = render(EventList, { props: { entries, now } });
		const ongoing = view.get('[data-ongoing]');

		expect(ongoing.classes()).toContain('border-primary');
		expect(ongoing.attributes('aria-current')).toBe('true');
		expect(ongoing.text()).toContain('En curso');
		expect(view.findAll('[data-ongoing]')).toHaveLength(1);
	});

	test('las tarjetas son botones sólo si alguien escucha', async () => {
		const quiet = render(EventList, { props: { entries, now } });
		expect(quiet.find('button').exists()).toBe(false);

		const picked: CalendarEntry[] = [];
		const view = render(EventList, { props: { entries, now, onSelect: (entry: CalendarEntry) => picked.push(entry) } });
		await view.findAll('button')[2]?.trigger('click');
		expect(picked.map((entry) => entry.id)).toEqual(['3']);
	});

	test('en grilla se reparten en columnas de al menos 12 rem y bajan de renglón: nada de desplazar de costado', () => {
		const grid = render(EventList, { props: { entries, now } });
		const list = render(EventList, { props: { entries, now, layout: 'list' } });

		expect(grid.get('ul').classes()).toContain('grid-cols-[repeat(auto-fill,minmax(min(100%,12rem),1fr))]');
		expect(grid.get('ul').classes().join(' ')).not.toMatch(/overflow-x/);
		expect(list.get('ul').classes()).toContain('grid-cols-1');
	});
});

describe('el pronóstico por hora', () => {
	const hours = [19, 20, 21, 22, 23, 0, 1].map((hour, index) => ({
		time: new Date(2026, 2, 22 + (hour < 19 ? 1 : 0), hour),
		icon: 'weather-clear-night',
		temperature: 9 - index * 0.6,
		description: 'Despejado',
	}));

	test('cada hora con su nombre entero, y la de ahora en una píldora en el acento', () => {
		const view = render(HourlyForecast, { props: { hours, current: 3, locale: 'es-AR', hour12: false } });
		const items = view.findAll('li');

		expect(items).toHaveLength(7);
		expect(items[3]?.attributes('aria-label')).toBe('22:00, Despejado, 7°');
		expect(items[3]?.attributes('aria-current')).toBe('time');
		expect(items[3]?.classes()).toEqual(expect.arrayContaining(['bg-primary', 'text-tx-on-primary', 'rounded-corner-full']));
		expect(items[0]?.classes()).toContain('text-tx-muted');
		expect(view.findAll('[aria-current]')).toHaveLength(1);
	});

	test('en arco, de izquierda a derecha por arriba: la del medio es la más alta', () => {
		const view = render(HourlyForecast, { props: { hours, current: 3 } });
		const position = (index: number) => {
			const style = view.findAll('li')[index]?.attributes('style') ?? '';
			return {
				x: Number(/--arc-x:\s*([\d.]+)%/.exec(style)?.[1]),
				y: Number(/--arc-y:\s*([\d.]+)%/.exec(style)?.[1]),
			};
		};

		expect(position(0).x).toBeLessThan(position(3).x);
		expect(position(3).x).toBeCloseTo(50, 1);
		expect(position(6).x).toBeGreaterThan(position(3).x);
		expect(position(3).y).toBeLessThan(position(0).y);
		expect(position(0).y).toBeCloseTo(position(6).y, 1);
	});

	test('el arco sólo con lugar: en angosto es una tira que baja de renglón', () => {
		const arc = render(HourlyForecast, { props: { hours } });
		const strip = render(HourlyForecast, { props: { hours, layout: 'strip' } });

		expect(arc.get('ol').classes()).toEqual(expect.arrayContaining(['flex-wrap', '@xs:absolute']));
		expect(arc.findAll('li')[0]?.classes()).toContain('@xs:absolute');
		expect(strip.findAll('li')[0]?.attributes('style')).toBeUndefined();
		expect(strip.findAll('li')[0]?.classes()).not.toContain('@xs:absolute');
	});

	test('con 12 horas, sólo la hora: «10:00 p. m.» no entra en la columna', () => {
		const view = render(HourlyForecast, { props: { hours: hours.slice(3, 4), locale: 'en-US' } });

		expect(view.get('li span').text()).toMatch(/^10\sPM$/);
	});

	test('el centro del arco es la ranura', () => {
		const view = render(HourlyForecast, { props: { hours }, slots: { default: '<p data-clock>22:41</p>' } });

		expect(view.find('[data-clock]').exists()).toBe(true);
	});
});

describe('el anillo', () => {
	test('es un medidor con su nombre y el texto que se ve como valor', () => {
		const view = render(ProgressRing, { props: { value: 20, label: 'Viento', display: '6 km/h' } });
		const meter = view.get('[role="meter"]');

		expect(meter.attributes('aria-label')).toBe('Viento');
		expect(meter.attributes('aria-valuenow')).toBe('20');
		expect(meter.attributes('aria-valuetext')).toBe('6 km/h');
		expect(view.get('[data-ring]').attributes('style')).toContain('--ring-value: 20%');
		expect(view.text()).toContain('Viento');
	});

	test('se recorta a 0–100, y sin valor deja la pista sola', () => {
		expect(render(ProgressRing, { props: { value: 140, label: 'Humedad' } }).get('[role="meter"]').attributes('aria-valuenow')).toBe('100');
		const empty = render(ProgressRing, { props: { value: null, label: 'Lluvia' } });

		expect(empty.get('[role="meter"]').attributes('aria-valuenow')).toBeUndefined();
		expect(empty.get('[role="meter"]').attributes('aria-valuetext')).toBe('–');
		expect(empty.get('[data-ring]').attributes('style')).toContain('--ring-value: 0%');
	});

	test('el aro va en utilidades: las aplicaciones no cargan la hoja de la librería', () => {
		const ring = render(ProgressRing, { props: { value: 50, label: 'Humedad' } }).get('[data-ring]');

		expect(ring.classes().join(' ')).toContain('conic-gradient(var(--use-primary)');
		expect(ring.classes().join(' ')).toContain('[mask:radial-gradient');
	});

	test('sin texto, el valor con «%»', () => {
		expect(render(ProgressRing, { props: { value: 71.4, label: 'Humedad' } }).get('[role="meter"]').text()).toBe('71%');
	});

	test('con unidad, el número arriba y la unidad debajo: «12 km/h» no entra en un renglón de 44 px', () => {
		const view = render(ProgressRing, { props: { value: 20, label: 'Viento', display: '12', unit: 'km/h' } });
		const meter = view.get('[role="meter"]');

		expect(meter.attributes('aria-valuetext')).toBe('12 km/h');
		expect(view.get('[data-ring-unit]').text()).toBe('km/h');
		expect(view.get('[data-ring-unit]').classes()).toContain('text-tx-muted');
	});
});

describe('el reloj con los segundos chicos', () => {
	const NOW = new Date(2026, 2, 22, 22, 41, 2);

	test('la hora y los minutos grandes, los segundos aparte y atenuados', () => {
		const view = render(ClockDisplay, { props: { now: NOW, locale: 'es-AR', hour12: false, seconds: true, smallSeconds: true } });
		const seconds = view.get('[data-clock-seconds]');

		expect(seconds.text()).toBe('02');
		expect(seconds.classes()).toEqual(expect.arrayContaining(['text-heading-m', 'text-tx-muted']));
		expect(view.get('time').text().replace(/\s+/g, '')).toBe('22:4102');
	});

	test('sin pedirlo, el reloj de siempre', () => {
		const view = render(ClockDisplay, { props: { now: NOW, locale: 'es-AR', hour12: false, seconds: true } });

		expect(view.find('[data-clock-seconds]').exists()).toBe(false);
		expect(view.get('time').text()).toBe('22:41:02');
	});

	test('con 12 horas, «p. m.» va con los segundos', () => {
		const view = render(ClockDisplay, { props: { now: NOW, locale: 'en-US', seconds: true, smallSeconds: true } });

		expect(view.get('[data-clock-seconds]').text()).toMatch(/^02\sPM$/);
	});
});
