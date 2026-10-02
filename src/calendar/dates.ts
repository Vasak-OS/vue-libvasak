/**
 * Las cuentas del calendario que comparten `MonthCalendar`, `EventList` y
 * quien les pase los datos (2.9.0).
 *
 * Son funciones sueltas, sin Vue, porque las usan tres lugares —el tablero de
 * fecha del escritorio, los widgets de calendario y `vasak-calendar`— y lo que
 * cuesta acertar en un calendario no es dibujarlo sino contarlo: en qué día
 * empieza la semana, cuántas filas tiene un mes, qué días toca un evento que
 * cruza la medianoche.
 *
 * # Las fechas viajan como texto
 *
 * Un día es `AAAA-MM-DD` y un mes `AAAA-MM`, en la hora de quien mira. Un
 * `Date` es un instante, no un día: el mismo `Date` cae en dos días distintos
 * según la zona, y comparar días con `Date` es la forma clásica de marcar el
 * evento de las 23:30 en el día de mañana.
 *
 * # Los eventos de día completo van en UTC
 *
 * El almacén de vasak-accounts manda un día completo a medianoche UTC y con
 * `allDay` (`ListOccurrences`): la fecha civil es la de UTC, no la local. Leída
 * en la hora de Buenos Aires, la medianoche UTC del 23 es el 22 a las 21, y el
 * evento aparecía un día antes. Un `AAAA-MM-DD` suelto se toma tal cual.
 */

/** Un día civil, `AAAA-MM-DD`. */
export type IsoDate = string;

/** Un mes, `AAAA-MM`. */
export type IsoMonth = string;

/** Una casilla de la cuadrícula del mes. */
export interface CalendarDay {
	date: IsoDate;
	/** El número que se dibuja. */
	day: number;
	/** Si es del mes que se muestra o del anterior o el siguiente. */
	inMonth: boolean;
	/** 0 domingo … 6 sábado, como `Date.getDay()`. */
	weekday: number;
}

/** Un evento, o una vez de un evento que se repite, tal como se dibuja. */
export interface CalendarEntry {
	id: string;
	title: string;
	start: Date | string;
	/** Exclusivo, como en iCalendar. Sin fin, el evento dura un instante. */
	end?: Date | string | null;
	allDay?: boolean;
	location?: string | null;
	/** El nombre del calendario de origen. */
	calendar?: string | null;
	/** El color del calendario, como lo guardó el servidor (`#rrggbb`). */
	color?: string | null;
}

/** Cuántos días se recorren como mucho por evento: un evento de diez años no tiene que colgar la página. */
const MAX_SPAN_DAYS = 400;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_MONTH = /^(\d{4})-(\d{2})$/;

function pad(value: number): string {
	return String(value).padStart(2, '0');
}

/** El día civil de un instante, en la hora de quien mira. */
export function toIsoDate(date: Date): IsoDate {
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** El día civil de un instante, en UTC. */
function toUtcIsoDate(date: Date): IsoDate {
	return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/**
 * La medianoche local de un día, o `null` si el texto no es un día que exista.
 *
 * `2026-02-30` no es un día: `new Date(2026, 1, 30)` lo corre al 2 de marzo sin
 * avisar, y eso se comprueba a la vuelta.
 */
export function parseIsoDate(value: string): Date | null {
	const match = ISO_DATE.exec(value);
	if (!match) return null;
	const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
	const date = new Date(year, month - 1, day);
	if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
	return date;
}

/** El mes de un día. */
export function monthOf(date: IsoDate): IsoMonth {
	return date.slice(0, 7);
}

/** Un día más `amount` días. Por el calendario y no por milisegundos: un día con cambio de hora tiene 23 o 25 horas. */
export function addDays(date: IsoDate, amount: number): IsoDate {
	const parsed = parseIsoDate(date);
	if (!parsed) return date;
	parsed.setDate(parsed.getDate() + amount);
	return toIsoDate(parsed);
}

/** Un mes más `amount` meses. */
export function addMonths(month: IsoMonth, amount: number): IsoMonth {
	const match = ISO_MONTH.exec(month);
	if (!match) return month;
	const date = new Date(Number(match[1]), Number(match[2]) - 1 + amount, 1);
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

/** Cuántos días tiene un mes. */
export function daysInMonth(month: IsoMonth): number {
	const match = ISO_MONTH.exec(month);
	if (!match) return 0;
	return new Date(Number(match[1]), Number(match[2]), 0).getDate();
}

/**
 * El primer día de la semana para un idioma: 0 domingo … 6 sábado.
 *
 * Sale de `Intl.Locale` —`getWeekInfo()` en los motores nuevos, `weekInfo` en
 * los que lo tenían como propiedad—, que dice `firstDay` del 1 (lunes) al 7
 * (domingo). Sin ninguno de los dos, lunes: es lo que usa la norma ISO y la
 * mayor parte del mundo fuera de América del Norte. Pero no se fija acá: `en-US` y
 * `pt-BR` empiezan en domingo y `ar-EG` en sábado según CLDR, y lo decide el
 * idioma.
 */
export function weekStartOf(locale?: string): number {
	try {
		const info = new Intl.Locale(locale ?? Intl.DateTimeFormat().resolvedOptions().locale) as Intl.Locale & {
			getWeekInfo?: () => { firstDay: number };
			weekInfo?: { firstDay: number };
		};
		const firstDay = info.getWeekInfo?.().firstDay ?? info.weekInfo?.firstDay;
		if (typeof firstDay === 'number' && firstDay >= 1 && firstDay <= 7) return firstDay % 7;
	} catch {
		// Un idioma mal escrito no rompe el calendario: se dibuja con lunes.
	}
	return 1;
}

/**
 * La cuadrícula de un mes: seis semanas de siete días.
 *
 * Seis siempre, aunque el mes entre en cuatro (un febrero de 28 que empieza en
 * el primer día de la semana) o en cinco: con un número fijo de filas el
 * calendario no cambia de alto al pasar de mes, y lo que tiene debajo no salta.
 * Los días que sobran son del mes anterior y del siguiente, con `inMonth` en
 * falso.
 */
export function monthGrid(month: IsoMonth, weekStart = 1): CalendarDay[][] {
	const match = ISO_MONTH.exec(month);
	if (!match) return [];
	const first = new Date(Number(match[1]), Number(match[2]) - 1, 1);
	const lead = (first.getDay() - (((weekStart % 7) + 7) % 7) + 7) % 7;
	const cursor = new Date(first);
	cursor.setDate(1 - lead);

	const weeks: CalendarDay[][] = [];
	for (let week = 0; week < 6; week += 1) {
		const days: CalendarDay[] = [];
		for (let index = 0; index < 7; index += 1) {
			days.push({
				date: toIsoDate(cursor),
				day: cursor.getDate(),
				inMonth: cursor.getMonth() === first.getMonth(),
				weekday: cursor.getDay(),
			});
			cursor.setDate(cursor.getDate() + 1);
		}
		weeks.push(days);
	}
	return weeks;
}

/** Los nombres de los días en el orden de la semana del idioma. */
export function weekdayNames(locale: string | undefined, weekStart: number, style: 'narrow' | 'short' | 'long'): string[] {
	const format = new Intl.DateTimeFormat(locale, { weekday: style });
	// El 4 de enero de 1970 fue domingo.
	return Array.from({ length: 7 }, (_, index) => format.format(new Date(1970, 0, 4 + ((weekStart + index) % 7))));
}

function toDate(value: Date | string): Date | null {
	const date = value instanceof Date ? value : new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
}

/** El día civil en que empieza un evento, según sea de día completo o no. */
function civilDay(value: Date | string, allDay: boolean): IsoDate | null {
	if (typeof value === 'string' && ISO_DATE.test(value)) return value;
	const date = toDate(value);
	if (!date) return null;
	return allDay ? toUtcIsoDate(date) : toIsoDate(date);
}

/** Un instante, o un `AAAA-MM-DD` suelto leído como su medianoche UTC. */
function boundary(value: Date | string): Date | null {
	return toDate(typeof value === 'string' && ISO_DATE.test(value) ? `${value}T00:00:00Z` : value);
}

/** El último día que ocupa un evento, o `null` si no tiene un fin después del comienzo. */
function lastDay(entry: Pick<CalendarEntry, 'start' | 'end'>, allDay: boolean): IsoDate | null {
	if (!entry.end) return null;
	const end = boundary(entry.end);
	const start = boundary(entry.start);
	if (!end || !start || end.getTime() <= start.getTime()) return null;
	// Un milisegundo antes del fin es el último instante que el evento ocupa.
	const lastInstant = new Date(end.getTime() - 1);
	return allDay ? toUtcIsoDate(lastInstant) : toIsoDate(lastInstant);
}

/**
 * Los días que toca un evento.
 *
 * El fin es exclusivo, como en iCalendar: un día completo del 23 termina el 24
 * a las 00:00 y toca sólo el 23; una reunión de 23:00 a 01:00 toca los dos; una
 * que termina justo a medianoche no toca el día siguiente. Sin fin, o con un
 * fin antes del comienzo, toca el día en que empieza.
 */
export function entryDays(entry: Pick<CalendarEntry, 'start' | 'end' | 'allDay'>): IsoDate[] {
	const allDay = Boolean(entry.allDay);
	const first = civilDay(entry.start, allDay);
	if (!first) return [];

	const last = lastDay(entry, allDay) ?? first;
	const days: IsoDate[] = [first];
	let cursor = first;
	while (cursor < last && days.length < MAX_SPAN_DAYS) {
		cursor = addDays(cursor, 1);
		days.push(cursor);
	}
	return days;
}

/** Los días con algún evento, sin repetir y en orden. Es lo que recibe `MonthCalendar` en `markedDates`. */
export function markedDates(entries: readonly CalendarEntry[]): IsoDate[] {
	const days = new Set<IsoDate>();
	for (const entry of entries) {
		for (const day of entryDays(entry)) days.add(day);
	}
	// Un `AAAA-MM-DD` ordena igual como texto que como fecha.
	return [...days].sort((a, b) => a.localeCompare(b));
}

/**
 * Los eventos que tocan un día, en el orden en que se leen: primero los de día
 * completo, después por hora de comienzo, y a igual hora por título.
 */
export function entriesOn<T extends CalendarEntry>(entries: readonly T[], day: IsoDate): T[] {
	const start = (entry: T) => toDate(entry.start)?.getTime() ?? 0;
	return entries
		.filter((entry) => entryDays(entry).includes(day))
		.sort((a, b) => {
			if (Boolean(a.allDay) !== Boolean(b.allDay)) return a.allDay ? -1 : 1;
			return start(a) - start(b) || a.title.localeCompare(b.title);
		});
}

/** Si un evento con hora está pasando en `now`. Uno de día completo no «está pasando»: dura el día. */
export function isOngoing(entry: CalendarEntry, now: Date): boolean {
	if (entry.allDay || !entry.end) return false;
	const start = toDate(entry.start);
	const end = toDate(entry.end);
	return Boolean(start && end && start.getTime() <= now.getTime() && now.getTime() < end.getTime());
}

/**
 * El color de un calendario, si es uno que se puede dibujar.
 *
 * Es un dato —lo eligió la persona en su servidor, como la foto de un
 * contacto— y no un color de la interfaz, así que no sale del esquema: es lo
 * que distingue un calendario de otro. Pero lo escribió el servidor, y a un
 * `style` va sólo un hexadecimal; cualquier otra cosa —un nombre, un `url()`,
 * una cadena con `;`— se descarta y la barra queda en el secundario del
 * esquema.
 */
export function safeCalendarColor(value: string | null | undefined): string | null {
	if (!value) return null;
	const trimmed = value.trim();
	return /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(trimmed) ? trimmed : null;
}
