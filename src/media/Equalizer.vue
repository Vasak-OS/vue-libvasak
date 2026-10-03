<script setup lang="ts">
/**
 * El ecualizador: diez bandas verticales unidas por una curva, el encabezado
 * con el perfil y si está guardado, y la grilla de perfiles.
 *
 * Es el pie del reproductor desplegable del escritorio (vasak-desktop#131) y
 * la sección Sonido de Configuración, sobre el ecualizador de sistema de
 * vasak-wireplumber-modules (`org.vasak.Equalizer1`). Como la tarjeta del
 * reproductor, **no sabe nada de D-Bus**: recibe frecuencias, ganancias,
 * rango, perfiles y estado, y emite lo que se tocó. Quién limita las llamadas
 * mientras se arrastra (unas 30 por segundo) es de la aplicación.
 *
 * # Las bandas
 *
 * Cada banda es un control con `role="slider"` vertical: el puntero la arrastra
 * (también tocando cualquier punto de su columna), y con el teclado se mueve
 * con las flechas (`step`), Re Pág / Av Pág (tres pasos), Inicio (el máximo) y
 * Fin (el mínimo). Se oye la frecuencia y la ganancia («1 kHz: +3 dB»). No es
 * un `<input type="range">` girado: los controles verticales no se dibujan
 * igual en todos los WebKit, y el tirador tiene que quedar sobre la curva.
 *
 * # La curva
 *
 * Une los tiradores con un trazo suave (Catmull-Rom muestreado) y un velo
 * tenue debajo. **Sin SVG** —los dibujos de la librería salen del tema o del
 * CSS—: son dos cajas recortadas con `clip-path: polygon()`, en el primario.
 * Las dos tienen siempre la misma cantidad de puntos, así que al llegar
 * ganancias nuevas (otro perfil) la curva **se anima** hacia ellas igual que
 * los tiradores, con una transición corta; con `prefers-reduced-motion`, sin
 * animación.
 *
 * # Lo que no se puede usar
 *
 * `available` en falso (el servicio no está en el bus) apaga todo y dice por
 * qué; `enabled` en falso atenúa las bandas pero deja elegir perfil.
 *
 * La línea que lo separa de lo de arriba la pone quien lo contiene (el pie de
 * `NowPlayingCard` ya la trae): dos líneas seguidas se ven como un error.
 *
 * La forma (vue-libvasak#74): vías en `ui-line`, el primario sólo en lo activo (el perfil elegido, la
 * curva y los tiradores), perfiles en `bg-ui-surface/70` con radio del
 * sistema, cifras tabulares.
 */
import { computed, ref } from 'vue';
import { useLabels } from '../shared/labels';

export interface EqualizerPreset {
	value: string;
	/** El nombre ya traducido. */
	label: string;
}

const props = withDefaults(
	defineProps<{
		/** Las frecuencias de las bandas, en Hz. */
		frequencies: readonly number[];
		/** La ganancia de cada banda, en dB, en el mismo orden. */
		gains: readonly number[];
		/** Mínimo y máximo de cada banda, en dB. */
		range?: readonly [number, number];
		step?: number;
		presets?: readonly EqualizerPreset[];
		/** El perfil elegido; uno que no está en `presets` es el propio. */
		preset?: string;
		/** El nombre del perfil propio, ya traducido. */
		customLabel?: string;
		saved?: boolean;
		enabled?: boolean;
		available?: boolean;
		title?: string;
		savedLabel?: string;
		unsavedLabel?: string;
		unavailableLabel?: string;
		presetsLabel?: string;
	}>(),
	{
		range: () => [-12, 12] as const,
		step: 0.5,
		presets: () => [],
		preset: '',
		customLabel: undefined,
		saved: true,
		enabled: true,
		available: true,
		title: undefined,
		savedLabel: undefined,
		unsavedLabel: undefined,
		unavailableLabel: undefined,
		presetsLabel: undefined,
	}
);

const emit = defineEmits<{
	/** Una banda se movió: cuál y a cuánto, en dB. */
	gain: [band: number, value: number];
	/** Se eligió un perfil. */
	preset: [value: string];
}>();

const translate = useLabels();
const text = computed(() => ({
	title: props.title ?? translate('equalizer.title', 'Equalizer'),
	saved: props.savedLabel ?? translate('equalizer.saved', 'Saved'),
	unsaved: props.unsavedLabel ?? translate('equalizer.unsaved', 'Not saved'),
	unavailable: props.unavailableLabel ?? translate('equalizer.unavailable', 'The equalizer is not available'),
	presets: props.presetsLabel ?? translate('equalizer.presets', 'Presets'),
	custom: props.customLabel ?? translate('equalizer.custom', 'Custom'),
}));

const min = computed(() => props.range[0]);
const max = computed(() => props.range[1]);
const interactive = computed(() => props.available);

const clamp = (value: number) => Math.min(Math.max(value, min.value), max.value);
const snap = (value: number) => clamp(Math.round(value / props.step) * props.step);

/** Dónde queda una ganancia, de 0 (arriba, el máximo) a 100 (abajo, el mínimo). */
function topOf(gain: number): number {
	const span = max.value - min.value;
	if (span <= 0) return 50;
	return ((max.value - clamp(Number.isFinite(gain) ? gain : 0)) / span) * 100;
}

const bands = computed(() =>
	props.frequencies.map((frequency, index) => {
		const gain = props.gains[index] ?? 0;
		return { frequency, gain, top: topOf(gain), label: frequencyLabel(frequency) };
	})
);

/** «31», «500», «1k», «16k». */
function frequencyLabel(hz: number): string {
	if (hz >= 1000) {
		const k = hz / 1000;
		return `${Number.isInteger(k) ? k : k.toFixed(1)}k`;
	}
	return String(Math.round(hz));
}

function gainText(gain: number): string {
	const tenths = Math.round(gain * 10) / 10;
	return `${tenths > 0 ? "+" : ""}${tenths} dB`;
}

function spokenBand(index: number): string {
	const band = bands.value[index];
	if (!band) return '';
	const hz = band.frequency >= 1000 ? `${frequencyLabel(band.frequency).replace('k', '')} kHz` : `${band.label} Hz`;
	return `${hz}: ${gainText(band.gain)}`;
}

// ── La curva ────────────────────────────────────────────────────────────────

/** Cuántos puntos por tramo entre dos bandas: suave, y siempre los mismos. */
const SAMPLES = 8;

/** Los puntos de la curva, en % del ancho y del alto del área. */
const curve = computed(() => {
	const list = bands.value;
	const n = list.length;
	if (n === 0) return [] as Array<[number, number]>;
	const xs = list.map((_, index) => ((index + 0.5) / n) * 100);
	const ys = list.map((band) => band.top);
	if (n === 1) return [[xs[0] as number, ys[0] as number]] as Array<[number, number]>;
	const points: Array<[number, number]> = [];
	for (let i = 0; i < n - 1; i++) {
		const p0 = ys[Math.max(i - 1, 0)] as number;
		const p1 = ys[i] as number;
		const p2 = ys[i + 1] as number;
		const p3 = ys[Math.min(i + 2, n - 1)] as number;
		const x1 = xs[i] as number;
		const x2 = xs[i + 1] as number;
		for (let s = 0; s < SAMPLES; s++) {
			const t = s / SAMPLES;
			const t2 = t * t;
			const t3 = t2 * t;
			const y =
				0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
			points.push([x1 + (x2 - x1) * t, Math.min(Math.max(y, 0), 100)]);
		}
	}
	points.push([xs[n - 1] as number, ys[n - 1] as number]);
	return points;
});

const fmt = (value: number) => `${Math.round(value * 100) / 100}%`;

/** El trazo: la curva y la misma curva 2 px más abajo, de vuelta. */
const strokeClip = computed(() => {
	const upper = curve.value.map(([x, y]) => `${fmt(x)} calc(${fmt(y)} - 1px)`);
	const lower = [...curve.value].reverse().map(([x, y]) => `${fmt(x)} calc(${fmt(y)} + 1px)`);
	return `polygon(${[...upper, ...lower].join(', ')})`;
});

/** El velo: de la curva hasta abajo. */
const areaClip = computed(() => {
	const first = curve.value[0];
	const last = curve.value[curve.value.length - 1];
	if (!first || !last) return 'polygon(0 0)';
	const upper = curve.value.map(([x, y]) => `${fmt(x)} ${fmt(y)}`);
	return `polygon(${[...upper, `${fmt(last[0])} 100%`, `${fmt(first[0])} 100%`].join(', ')})`;
});

// ── Arrastrar ───────────────────────────────────────────────────────────────

const dragging = ref<number | null>(null);

function gainAt(event: PointerEvent, column: HTMLElement): number {
	const rect = column.getBoundingClientRect();
	if (rect.height <= 0) return 0;
	const ratio = (event.clientY - rect.top) / rect.height;
	return snap(max.value - ratio * (max.value - min.value));
}

function setGain(index: number, value: number): void {
	const next = snap(value);
	if (next === (props.gains[index] ?? 0)) return;
	emit('gain', index, next);
}

function onPointerDown(index: number, event: PointerEvent): void {
	if (!interactive.value) return;
	const column = event.currentTarget as HTMLElement;
	dragging.value = index;
	column.setPointerCapture?.(event.pointerId);
	(column.querySelector('[role="slider"]') as HTMLElement | null)?.focus();
	setGain(index, gainAt(event, column));
}

function onPointerMove(index: number, event: PointerEvent): void {
	if (dragging.value !== index) return;
	setGain(index, gainAt(event, event.currentTarget as HTMLElement));
}

function onPointerUp(index: number, event: PointerEvent): void {
	if (dragging.value !== index) return;
	dragging.value = null;
	(event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId);
}

function onKeydown(index: number, event: KeyboardEvent): void {
	if (!interactive.value) return;
	const current = props.gains[index] ?? 0;
	const targets: Record<string, number> = {
		ArrowUp: current + props.step,
		ArrowRight: current + props.step,
		ArrowDown: current - props.step,
		ArrowLeft: current - props.step,
		PageUp: current + props.step * 3,
		PageDown: current - props.step * 3,
		Home: max.value,
		End: min.value,
	};
	const target = targets[event.key];
	if (target === undefined) return;
	event.preventDefault();
	setGain(index, target);
}

// ── Perfiles ────────────────────────────────────────────────────────────────

const presetName = computed(
	() => props.presets.find((entry) => entry.value === props.preset)?.label ?? text.value.custom
);
const status = computed(() => `${props.saved ? text.value.saved : text.value.unsaved} · ${presetName.value}`);

function choosePreset(value: string): void {
	if (!interactive.value || value === props.preset) return;
	emit('preset', value);
}

function onPresetKeydown(index: number, event: KeyboardEvent): void {
	const count = props.presets.length;
	if (count === 0) return;
	const steps: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
	const step = steps[event.key];
	if (step === undefined) return;
	event.preventDefault();
	const next = props.presets[(index + step + count) % count];
	if (!next) return;
	choosePreset(next.value);
	const group = (event.currentTarget as HTMLElement).parentElement;
	(group?.querySelector(`[data-preset="${next.value}"]`) as HTMLElement | null)?.focus();
}

/** El que lleva el Tab: el elegido, o el primero si el elegido es el propio. */
const presetTabStop = computed(() =>
	props.presets.some((entry) => entry.value === props.preset) ? props.preset : props.presets[0]?.value
);
</script>

<template>
  <section class="@container flex min-w-0 flex-col gap-3" :aria-label="text.title" data-equalizer>
    <header class="flex min-w-0 items-baseline justify-between gap-2">
      <h3 class="min-w-0 truncate font-semibold text-label-m text-tx-main">{{ text.title }}</h3>
      <p v-if="available" class="min-w-0 truncate text-body-xs text-tx-muted" :title="status" data-status>{{ status }}</p>
    </header>

    <p v-if="!available" class="rounded-corner-m bg-ui-surface/70 p-3 text-body-xs text-tx-muted" data-unavailable>
      {{ text.unavailable }}
    </p>

    <template v-else>
      <div class="flex min-w-0 flex-col gap-1" :class="enabled ? '' : 'opacity-50'">
        <div class="relative h-28 min-w-0" data-bands>
          <!-- El velo y el trazo, debajo de los tiradores. -->
          <div
            class="pointer-events-none absolute inset-0 bg-primary/10 transition-[clip-path] duration-200 ease-ui motion-reduce:transition-none"
            :style="{ clipPath: areaClip }"
            aria-hidden="true"
            data-curve-area />
          <div
            class="pointer-events-none absolute inset-0 bg-primary transition-[clip-path] duration-200 ease-ui motion-reduce:transition-none"
            :style="{ clipPath: strokeClip }"
            aria-hidden="true"
            data-curve />
          <div class="relative grid h-full" :style="{ gridTemplateColumns: `repeat(${bands.length}, minmax(0, 1fr))` }">
            <div
              v-for="(band, index) in bands"
              :key="band.frequency"
              class="relative flex h-full touch-none justify-center"
              :class="interactive ? 'cursor-pointer' : ''"
              :data-band="index"
              @pointerdown="onPointerDown(index, $event)"
              @pointermove="onPointerMove(index, $event)"
              @pointerup="onPointerUp(index, $event)"
              @pointercancel="onPointerUp(index, $event)">
              <span class="h-full w-1 rounded-corner-full bg-ui-line" aria-hidden="true" />
              <span
                role="slider"
                aria-orientation="vertical"
                :aria-label="band.label"
                :aria-valuemin="min"
                :aria-valuemax="max"
                :aria-valuenow="band.gain"
                :aria-valuetext="spokenBand(index)"
                :aria-disabled="interactive ? undefined : 'true'"
                :tabindex="interactive ? 0 : -1"
                :title="spokenBand(index)"
                class="absolute left-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-corner-full border-2 border-ui-float bg-primary shadow-surface-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-focus"
                :class="dragging === index ? '' : 'transition-[top] duration-200 ease-ui motion-reduce:transition-none'"
                :style="{ top: `${band.top}%` }"
                :data-thumb="index"
                @keydown="onKeydown(index, $event)" />
            </div>
          </div>
        </div>
        <div class="grid text-center text-body-xs text-tx-muted tabular-nums" :style="{ gridTemplateColumns: `repeat(${bands.length}, minmax(0, 1fr))` }" aria-hidden="true">
          <span v-for="band in bands" :key="band.frequency" class="min-w-0 truncate" data-frequency>{{ band.label }}</span>
        </div>
      </div>

      <div v-if="presets.length" role="radiogroup" :aria-label="text.presets" class="grid grid-cols-2 gap-1 @xs:grid-cols-4" data-presets>
        <button
          v-for="(entry, index) in presets"
          :key="entry.value"
          type="button"
          role="radio"
          :aria-checked="entry.value === preset"
          :tabindex="entry.value === presetTabStop ? 0 : -1"
          class="min-h-8 min-w-0 truncate rounded-corner-m px-2 text-label-xs transition-colors duration-200 ease-ui focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-focus"
          :class="
            entry.value === preset
              ? 'bg-primary font-semibold text-tx-on-primary'
              : 'bg-ui-surface/70 text-tx-main hover:bg-ui-hover active:bg-ui-pressed'
          "
          :title="entry.label"
          :data-preset="entry.value"
          @click="choosePreset(entry.value)"
          @keydown="onPresetKeydown(index, $event)">
          {{ entry.label }}
        </button>
      </div>
    </template>
  </section>
</template>
