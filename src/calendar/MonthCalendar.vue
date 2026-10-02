<script setup lang="ts">
/**
 * El mes en cuadrícula, con hoy, el día elegido y los días con eventos (2.9.0).
 *
 * Lo piden el tablero de fecha del escritorio (vasak-desktop#130), los widgets
 * de calendario (#112) y `vasak-calendar`. Recibe **las fechas** con eventos,
 * no los eventos: de qué días toca cada uno lo cuenta `markedDates()` de
 * `dates.ts`, y así el componente no sabe nada de dónde salen.
 *
 * # La forma
 *
 * La del calendario de Once UI y del video de referencia: el mes y el año en
 * mayúsculas chicas entre las dos flechas, los días de la semana atenuados, y
 * los números en `tx-main`. **Hoy** va relleno en el acento —es lo de ahora, y
 * el acento es para eso—; el **día elegido**, si no es hoy, con el canto en el
 * acento; y un día con eventos lleva un punto chico en el secundario, que es la
 * segunda señal y no compite con la primera. Los días de otro mes, en
 * `tx-muted` sin bajar la opacidad: siguen teniendo que leerse a 4,5:1.
 *
 * Siempre seis semanas (`monthGrid`): el calendario no cambia de alto al pasar
 * de mes.
 *
 * # El teclado
 *
 * Una cuadrícula con un solo Tab (`role="grid"`), como la de un selector de
 * fecha de WAI-ARIA: las flechas mueven un día o una semana, Inicio y Fin van
 * al principio y al final de la semana, y Re Pág / Av Pág cambian de mes. Al
 * salirse del mes, el mes cambia solo. Enter y Espacio eligen.
 *
 * # Se acomoda a lo que le den
 *
 * Las casillas miden 32 px —la zona de toque mínima— y la cuadrícula reparte el
 * resto: a 240 px entra entera, y más ancha sólo se separa.
 */
import { computed, nextTick, ref, watch } from 'vue';
import ActionButton from '../controls/ActionButton.vue';
import { useLabels } from '../shared/labels';
import {
	addDays,
	addMonths,
	type CalendarDay,
	type IsoDate,
	type IsoMonth,
	monthGrid,
	monthOf,
	parseIsoDate,
	toIsoDate,
	weekdayNames,
	weekStartOf,
} from './dates';

const props = withDefaults(
	defineProps<{
		/** El día elegido, `AAAA-MM-DD`. */
		modelValue?: IsoDate | null;
		/** El mes que se muestra, `AAAA-MM`. Sin esto, el del día elegido o el de hoy. */
		month?: IsoMonth | null;
		/** Hoy. Sin esto, el día de la máquina; se pasa en un banco o una prueba. */
		today?: IsoDate | null;
		/** Los días con eventos. */
		markedDates?: readonly IsoDate[];
		/** El idioma, como `es-AR`. Sin esto, el del sistema. */
		locale?: string;
		/** 0 domingo … 6 sábado. Sin esto, el del idioma (`weekStartOf`). */
		weekStart?: number;
		previousLabel?: string;
		nextLabel?: string;
		/** Lo que se suma al nombre de un día con eventos para quien no ve el punto. */
		markedLabel?: string;
		todayLabel?: string;
	}>(),
	{
		modelValue: null,
		month: null,
		today: null,
		markedDates: () => [],
		locale: undefined,
		weekStart: undefined,
		previousLabel: undefined,
		nextLabel: undefined,
		markedLabel: undefined,
		todayLabel: undefined,
	}
);

const emit = defineEmits<{
	'update:modelValue': [date: IsoDate];
	'update:month': [month: IsoMonth];
	/** Se eligió un día: con el ratón, el dedo, Enter o Espacio. */
	select: [date: IsoDate];
}>();

defineSlots<{
	/** Al lado de las flechas: el «+» para crear un evento, por ejemplo. */
	actions?: () => unknown;
}>();

const label = useLabels();
const previousText = computed(() => props.previousLabel ?? label('calendar.previousMonth', 'Mes anterior'));
const nextText = computed(() => props.nextLabel ?? label('calendar.nextMonth', 'Mes siguiente'));
const markedText = computed(() => props.markedLabel ?? label('calendar.hasEvents', 'con eventos'));
const todayText = computed(() => props.todayLabel ?? label('calendar.today', 'hoy'));

const todayDate = computed(() => props.today ?? toIsoDate(new Date()));
const start = computed(() => props.weekStart ?? weekStartOf(props.locale));

const visibleMonth = ref<IsoMonth>(props.month ?? monthOf(props.modelValue ?? todayDate.value));
watch(
	() => props.month,
	(value) => {
		if (value) visibleMonth.value = value;
	}
);
watch(
	() => props.modelValue,
	(value) => {
		// Elegir desde afuera un día de otro mes lleva a ese mes, salvo que quien
		// lo use maneje el mes él mismo.
		if (value && !props.month && monthOf(value) !== visibleMonth.value) visibleMonth.value = monthOf(value);
	}
);

/** El día que tiene el Tab: el elegido si está a la vista, si no hoy, si no el primero del mes. */
const focusTarget = ref<IsoDate | null>(null);

const weeks = computed<CalendarDay[][]>(() => monthGrid(visibleMonth.value, start.value));
const marked = computed(() => new Set(props.markedDates));
const names = computed(() => ({
	narrow: weekdayNames(props.locale, start.value, 'narrow'),
	long: weekdayNames(props.locale, start.value, 'long'),
}));

const title = computed(() => {
	const first = parseIsoDate(`${visibleMonth.value}-01`);
	return first ? first.toLocaleDateString(props.locale, { month: 'long', year: 'numeric' }) : visibleMonth.value;
});

const tabStop = computed<IsoDate>(() => {
	const inView = (date: IsoDate | null) => (date && monthOf(date) === visibleMonth.value ? date : null);
	return inView(focusTarget.value) ?? inView(props.modelValue) ?? inView(todayDate.value) ?? `${visibleMonth.value}-01`;
});

function dayLabel(day: CalendarDay): string {
	const date = parseIsoDate(day.date);
	const text = date
		? date.toLocaleDateString(props.locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
		: day.date;
	const extras = [day.date === todayDate.value ? todayText.value : '', marked.value.has(day.date) ? markedText.value : ''];
	return [text, ...extras.filter(Boolean)].join(', ');
}

function dayClasses(day: CalendarDay): string[] {
	const isToday = day.date === todayDate.value;
	const isSelected = day.date === props.modelValue;
	if (isToday) return ['bg-primary', 'text-tx-on-primary', 'font-semibold', 'border-transparent'];
	return [
		isSelected ? 'border-primary font-semibold' : 'border-transparent',
		day.inMonth ? 'text-tx-main' : 'text-tx-muted',
		'hover:bg-ui-hover',
		'active:bg-ui-pressed',
	];
}

function showMonth(month: IsoMonth): void {
	visibleMonth.value = month;
	emit('update:month', month);
}

function shift(amount: number): void {
	showMonth(addMonths(visibleMonth.value, amount));
}

function choose(date: IsoDate): void {
	focusTarget.value = date;
	if (monthOf(date) !== visibleMonth.value) showMonth(monthOf(date));
	emit('update:modelValue', date);
	emit('select', date);
}

const grid = ref<HTMLElement | null>(null);

async function moveFocus(date: IsoDate): Promise<void> {
	focusTarget.value = date;
	if (monthOf(date) !== visibleMonth.value) showMonth(monthOf(date));
	await nextTick();
	grid.value?.querySelector<HTMLElement>(`[data-date="${date}"]`)?.focus();
}

function onKeydown(event: KeyboardEvent): void {
	const current = (event.target as HTMLElement | null)?.dataset?.date;
	if (!current) return;
	const weekday = parseIsoDate(current)?.getDay() ?? 0;
	const offset = (weekday - start.value + 7) % 7;

	const targets: Record<string, () => IsoDate> = {
		ArrowLeft: () => addDays(current, -1),
		ArrowRight: () => addDays(current, 1),
		ArrowUp: () => addDays(current, -7),
		ArrowDown: () => addDays(current, 7),
		Home: () => addDays(current, -offset),
		End: () => addDays(current, 6 - offset),
		PageUp: () => clampToMonth(current, -1),
		PageDown: () => clampToMonth(current, 1),
	};
	const target = targets[event.key];
	if (target) {
		event.preventDefault();
		void moveFocus(target());
		return;
	}
	if (event.key === 'Enter' || event.key === ' ') {
		event.preventDefault();
		choose(current);
	}
}

/** El mismo número de día en otro mes, o el último si ese mes es más corto: del 31 de enero, Av Pág va al 28 de febrero. */
function clampToMonth(date: IsoDate, amount: number): IsoDate {
	const month = addMonths(monthOf(date), amount);
	const day = Number(date.slice(8, 10));
	for (let candidate = day; candidate >= 28; candidate -= 1) {
		const iso = `${month}-${String(candidate).padStart(2, '0')}`;
		if (parseIsoDate(iso)) return iso;
	}
	return `${month}-${String(Math.min(day, 28)).padStart(2, '0')}`;
}
</script>

<template>
  <div class="@container flex w-full min-w-0 flex-col gap-2" data-month-calendar>
    <div class="flex min-w-0 items-center gap-1">
      <ActionButton
        label=""
        icon="go-previous"
        :icon-alt="previousText"
        :title="previousText"
        variant="ghost"
        size="sm"
        @click="shift(-1)" />
      <h2
        class="m-0 min-w-0 flex-1 truncate text-center text-label-s font-semibold uppercase tracking-wide text-tx-main"
        aria-live="polite"
        data-month-title>
        {{ title }}
      </h2>
      <ActionButton
        label=""
        icon="go-next"
        :icon-alt="nextText"
        :title="nextText"
        variant="ghost"
        size="sm"
        @click="shift(1)" />
      <slot name="actions" />
    </div>

    <div ref="grid" role="grid" :aria-label="title" class="flex min-w-0 flex-col gap-1" @keydown="onKeydown">
      <div role="row" class="grid grid-cols-7">
        <span
          v-for="(name, index) in names.narrow"
          :key="`${index}-${name}`"
          role="columnheader"
          :aria-label="names.long[index]"
          class="text-center text-label-xs text-tx-muted select-none">
          {{ name }}
        </span>
      </div>
      <div v-for="(week, row) in weeks" :key="row" role="row" class="grid grid-cols-7">
        <div
          v-for="day in week"
          :key="day.date"
          role="gridcell"
          :aria-selected="day.date === modelValue"
          class="flex justify-center">
          <button
            type="button"
            :data-date="day.date"
            :data-in-month="day.inMonth"
            :data-today="day.date === todayDate || undefined"
            :data-marked="marked.has(day.date) || undefined"
            :tabindex="day.date === tabStop ? 0 : -1"
            :aria-label="dayLabel(day)"
            :aria-current="day.date === todayDate ? 'date' : undefined"
            class="relative flex size-8 items-center justify-center rounded-corner-m border text-label-s tabular-nums transition-colors duration-200 ease-ui focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-focus"
            :class="dayClasses(day)"
            @click="choose(day.date)">
            {{ day.day }}
            <span
              v-if="marked.has(day.date)"
              aria-hidden="true"
              class="absolute bottom-0.5 size-1 rounded-corner-full"
              :class="day.date === todayDate ? 'bg-tx-on-primary' : 'bg-secondary'"></span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
