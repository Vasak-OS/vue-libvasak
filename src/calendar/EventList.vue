<script setup lang="ts">
/**
 * Los eventos de un día: hora, título, lugar y calendario (2.9.0).
 *
 * El otro componente que comparten el tablero de fecha del escritorio
 * (vasak-desktop#130) y los widgets de calendario (#112). Recibe los eventos ya
 * elegidos —los de un día, con `entriesOn()` de `dates.ts`—, en el orden en que
 * se quieren leer.
 *
 * # La forma
 *
 * Cada evento es una tarjeta de Once UI (`rounded-corner-l`, canto `ui-line`,
 * superficie al 70 %) con una barra fina a la izquierda en el color de su
 * calendario. Ese color es un dato del servidor y no del esquema —es lo que
 * distingue un calendario de otro, como la foto de un contacto—, así que pasa
 * por `safeCalendarColor()` y sin uno válido la barra va en el secundario. El
 * evento que está pasando ahora lleva el canto en el acento.
 *
 * # Sin desplazamiento de costado
 *
 * En `grid` las tarjetas se reparten en las columnas que entren, de al menos
 * 12 rem —tres en un tablero de 900 px, una a 240—, y lo que no entra baja de
 * renglón: nada se corta ni pide desplazar de costado. `list` es una columna.
 *
 * # Sin eventos
 *
 * Lo dice (`emptyLabel`, o la ranura `empty`) en vez de dejar un hueco.
 *
 * # Elegir un evento
 *
 * Si alguien escucha `select`, cada tarjeta es un botón; si no, es texto. Un
 * botón que no hace nada es peor que ninguno.
 */
import { computed, getCurrentInstance } from 'vue';
import EmptyState from '../feedback/EmptyState.vue';
import ThemeIcon from '../icons/ThemeIcon.vue';
import { useLabels } from '../shared/labels';
import { type CalendarEntry, isOngoing, safeCalendarColor } from './dates';

const props = withDefaults(
	defineProps<{
		entries: readonly CalendarEntry[];
		/** Para saber cuál está pasando. Sin esto, la hora de la máquina al dibujar. */
		now?: Date;
		locale?: string;
		/** Forzar 12 o 24 horas, como en `ClockDisplay`. Sin esto, lo que diga el idioma. */
		hour12?: boolean;
		layout?: 'grid' | 'list';
		emptyLabel?: string;
		allDayLabel?: string;
		ongoingLabel?: string;
	}>(),
	{
		now: undefined,
		locale: undefined,
		hour12: undefined,
		layout: 'grid',
		emptyLabel: undefined,
		allDayLabel: undefined,
		ongoingLabel: undefined,
	}
);

const emit = defineEmits<{
	select: [entry: CalendarEntry];
}>();

defineSlots<{
	empty?: () => unknown;
}>();

const label = useLabels();
const emptyText = computed(() => props.emptyLabel ?? label('calendar.noEvents', 'Nada agendado para este día'));
const allDayText = computed(() => props.allDayLabel ?? label('calendar.allDay', 'Todo el día'));
const ongoingText = computed(() => props.ongoingLabel ?? label('calendar.ongoing', 'En curso'));

/** Se mira el `vnode` porque un evento declarado no aparece en `$attrs`. */
const instance = getCurrentInstance();
const selectable = computed(() => Boolean(instance?.vnode.props?.onSelect));

function toDate(value: Date | string | null | undefined): Date | null {
	if (!value) return null;
	const date = value instanceof Date ? value : new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
}

/** «10:00 – 11:30», en el formato del idioma; el texto de día completo para los que lo son. */
function timeRange(entry: CalendarEntry): string {
	if (entry.allDay) return allDayText.value;
	const start = toDate(entry.start);
	if (!start) return '';
	const format = new Intl.DateTimeFormat(props.locale, { hour: '2-digit', minute: '2-digit', hour12: props.hour12 });
	const end = toDate(entry.end);
	if (!end || end.getTime() <= start.getTime()) return format.format(start);
	return typeof format.formatRange === 'function'
		? format.formatRange(start, end)
		: `${format.format(start)} – ${format.format(end)}`;
}

const items = computed(() => {
	const now = props.now ?? new Date();
	return props.entries.map((entry) => {
		const color = safeCalendarColor(entry.color);
		return {
			entry,
			time: timeRange(entry),
			ongoing: isOngoing(entry, now),
			barStyle: color ? { backgroundColor: color } : undefined,
		};
	});
});
</script>

<template>
  <div class="@container w-full min-w-0" data-event-list>
    <template v-if="items.length === 0">
      <slot name="empty">
        <EmptyState :title="emptyText" icon="" size="sm" muted />
      </slot>
    </template>

    <ul
      v-else
      role="list"
      class="m-0 grid min-w-0 list-none gap-2 p-0"
      :class="layout === 'grid' ? 'grid-cols-[repeat(auto-fill,minmax(min(100%,12rem),1fr))]' : 'grid-cols-1'">
      <li v-for="item in items" :key="item.entry.id" class="min-w-0">
        <component
          :is="selectable ? 'button' : 'div'"
          :type="selectable ? 'button' : undefined"
          :aria-current="item.ongoing ? 'true' : undefined"
          :data-ongoing="item.ongoing || undefined"
          class="relative flex h-full w-full min-w-0 flex-col gap-1 overflow-hidden rounded-corner-l border bg-ui-surface/70 py-2 pr-3 pl-5 text-start"
          :class="[
            item.ongoing ? 'border-primary' : 'border-ui-line',
            selectable
              ? 'transition-colors duration-200 ease-ui hover:bg-ui-hover active:bg-ui-pressed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-focus'
              : '',
          ]"
          @click="selectable ? emit('select', item.entry) : undefined">
          <span
            aria-hidden="true"
            data-calendar-bar
            class="absolute inset-y-2 left-2 w-1 rounded-corner-full"
            :class="item.barStyle ? '' : 'bg-secondary'"
            :style="item.barStyle"></span>
          <span class="line-clamp-2 min-w-0 break-words text-label-m font-semibold text-tx-main">{{ item.entry.title }}</span>
          <span class="flex min-w-0 items-center gap-1 text-label-xs text-tx-muted tabular-nums">
            <ThemeIcon name="appointment-soon" type="symbol" :size="14" class="shrink-0" />
            <span class="min-w-0 truncate">{{ item.time }}</span>
            <span v-if="item.ongoing" class="sr-only">, {{ ongoingText }}</span>
          </span>
          <span v-if="item.entry.location" class="flex min-w-0 items-center gap-1 text-label-xs text-tx-muted">
            <ThemeIcon name="mark-location" type="symbol" :size="14" class="shrink-0" />
            <span class="min-w-0 truncate" :title="item.entry.location">{{ item.entry.location }}</span>
          </span>
          <span v-if="item.entry.calendar" class="min-w-0 truncate text-label-xs text-tx-muted" :title="item.entry.calendar">
            {{ item.entry.calendar }}
          </span>
        </component>
      </li>
    </ul>
  </div>
</template>
