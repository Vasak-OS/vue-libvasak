<script setup lang="ts">
/**
 * El selector rápido de fondos: una fila de tarjetas inclinadas que se
 * solapan, con la del centro más grande y al frente (vasak-desktop#133).
 *
 * Lo abre el escritorio encima del fondo de pantalla, sin contenedor detrás; lo
 * puede usar también Configuración. No sabe de archivos ni de configuración:
 * recibe la lista (`items`) y avisa qué se eligió (`apply`).
 *
 * # Forma
 *
 * - Paralelogramos: cada tarjeta va sesgada 12° y la imagen de adentro se
 *   endereza con el sesgo contrario, así no se deforma. Para que el
 *   enderezado no deje huecos en las puntas, la imagen es un 7 % más ancha de
 *   cada lado que la tarjeta.
 * - La del centro va a 1,1, al frente y con el borde en el primario —es la
 *   elegida, el estado «decisión» de la especificación—; las de los costados,
 *   más chicas, más atrás y con la imagen atenuada (`placeCard`).
 * - Sombra `surface-l` y canto `ui-line`: están sobre un fondo de pantalla
 *   cualquiera y tienen que despegarse de él.
 * - Debajo, el nombre del enfocado con el halo legible: va escrito directo
 *   sobre el fondo de pantalla.
 *
 * # Tamaño
 *
 * Las tarjetas miden el 38 % del ancho del contenedor (consulta de contenedor,
 * `cqi`), entre 7 y 20 rem: a 240 px la del centro sigue siendo reconocible y
 * en una pantalla grande no se vuelve un póster. Nunca hay desplazamiento
 * horizontal: lo que no entra se corta en el borde del carrusel.
 *
 * # Uso
 *
 * - Flechas (y Arriba/Abajo, Inicio/Fin), la rueda o arrastrar para moverse.
 *   No da la vuelta en las puntas (`stepIndex`).
 * - Enter, Espacio o un clic aplica: `apply` con el fondo. Un clic sobre una
 *   tarjeta de costado aplica esa, como pide el issue; arrastrar no cuenta
 *   como clic.
 * - Escape: `close`.
 * - Con `moreLabel`, al final de la fila va una tarjeta más que emite `more`
 *   (en el escritorio, abrir Configuración → Fondo).
 * - Abre centrado en `current`, que además lleva la marca de aplicado.
 *
 * # Un solo video a la vez
 *
 * `preview` avisa cuál se previsualiza en movimiento —el que tiene el puntero
 * encima o, si no, el enfocado, y sólo si es un video (`previewId`)— o `null`.
 * Sólo esa miniatura recibe `playing`; las demás no tienen `<video>` en el
 * DOM. Quien usa el carrusel carga `videoSrc` de ése cuando lo nombra y lo
 * suelta cuando deja de nombrarlo.
 *
 * # Accesible
 *
 * Es un `listbox` con `aria-activedescendant`: el foco queda en la fila y las
 * flechas mueven la opción activa. El anillo de foco se dibuja en la tarjeta
 * del centro, que es lo que se está mirando.
 */
import { computed, onBeforeUnmount, ref, useId, watch } from 'vue';
import ThemeIcon from '../icons/ThemeIcon.vue';
import { useLabels } from '../shared/labels';
import { initialIndex, placeCard, previewId, stepIndex, type WallpaperItem, wheelSteps } from './carousel';
import WallpaperThumbnail from './WallpaperThumbnail.vue';

const props = withDefaults(
	defineProps<{
		items: readonly WallpaperItem[];
		/** El fondo aplicado ahora: abre centrado en él y lleva la marca. */
		current?: string | null;
		/** El nombre de la fila. */
		label?: string;
		/** La tarjeta del final, que emite `more`. Sin esto no está. */
		moreLabel?: string;
		/** Lo que se lee cuando no hay ningún fondo. */
		emptyLabel?: string;
		videoLabel?: string;
		currentLabel?: string;
	}>(),
	{ current: null }
);

const emit = defineEmits<{
	/** Se eligió este fondo. */
	apply: [item: WallpaperItem];
	/** Se eligió la tarjeta del final. */
	more: [];
	/** Escape. */
	close: [];
	/** Cambió el del centro. */
	focus: [item: WallpaperItem | null];
	/** Cuál se previsualiza en movimiento, o ninguno. Ver arriba. */
	preview: [id: string | null];
}>();

const translate = useLabels();
const listLabel = computed(() => props.label ?? translate('wallpaper.picker', 'Wallpapers'));
const emptyText = computed(() => props.emptyLabel ?? translate('wallpaper.empty', 'No wallpapers available'));

/** Una tarjeta de la fila: un fondo, o la del final. */
type Entry = { kind: 'item'; item: WallpaperItem } | { kind: 'more' };

const entries = computed<Entry[]>(() => {
	const list: Entry[] = props.items.map((item) => ({ kind: 'item', item }));
	if (props.moreLabel) list.push({ kind: 'more' });
	return list;
});

const entryKey = (entry: Entry) => (entry.kind === 'more' ? 'more' : entry.item.id);
const entryLabel = (entry: Entry) => (entry.kind === 'more' ? (props.moreLabel ?? '') : entry.item.label);
const count = computed(() => entries.value.length);

const index = ref(initialIndex(props.items, props.current));
if (index.value === -1 && count.value > 0) index.value = 0;

// Una lista que llega después —el escritorio la pide al abrir— vuelve a
// centrar en el aplicado. Si sólo cambia de largo se queda donde estaba, dentro
// de los bordes.
watch(
	() => props.items,
	(items, before) => {
		if (!before || before.length === 0) {
			const start = initialIndex(items, props.current);
			// Sin fondos puede quedar la tarjeta del final: ahí arranca.
			index.value = start === -1 ? stepIndex(0, 0, count.value) : start;
		} else {
			index.value = stepIndex(index.value, 0, count.value);
		}
	}
);

watch(
	() => props.current,
	(current) => {
		const found = current ? props.items.findIndex((item) => item.id === current) : -1;
		if (found !== -1) index.value = found;
	}
);

const focusedEntry = computed<Entry | undefined>(() => (index.value >= 0 ? entries.value[index.value] : undefined));
const focusedItem = computed<WallpaperItem | null>(() => {
	const entry = focusedEntry.value;
	return entry?.kind === 'item' ? entry.item : null;
});

watch(focusedItem, (item) => emit('focus', item));

const hovered = ref<string | null>(null);
const previewing = computed(() => previewId(props.items, focusedItem.value ? index.value : -1, hovered.value));
watch(previewing, (id) => emit('preview', id), { immediate: true });

const baseId = useId();
const optionId = (position: number) => `${baseId}-option-${position}`;

/** Las que se dibujan: hasta `VISIBLE_SIDE` a cada lado del centro. */
const rendered = computed(() =>
	entries.value
		.map((entry, position) => ({ entry, position, place: placeCard(position - index.value) }))
		.filter(({ place }) => place.visible)
);

function cardStyle(place: ReturnType<typeof placeCard>) {
	return {
		zIndex: place.layer,
		transform: `translate(-50%, -50%) translateX(calc(var(--card-width) * ${place.shift})) scale(${place.scale}) skewX(-12deg)`,
	};
}

function move(delta: number): void {
	if (count.value === 0) return;
	index.value = stepIndex(index.value, delta, count.value);
}

function activate(position: number): void {
	const entry = entries.value[position];
	if (entry === undefined) return;
	index.value = position;
	if (entry.kind === 'more') emit('more');
	else emit('apply', entry.item);
}

function onKeydown(event: KeyboardEvent): void {
	switch (event.key) {
		case 'ArrowLeft':
		case 'ArrowUp':
			move(-1);
			break;
		case 'ArrowRight':
		case 'ArrowDown':
			move(1);
			break;
		case 'Home':
			move(-count.value);
			break;
		case 'End':
			move(count.value);
			break;
		case 'Enter':
		case ' ':
			if (index.value >= 0) activate(index.value);
			break;
		case 'Escape':
			emit('close');
			break;
		default:
			return;
	}
	event.preventDefault();
	event.stopPropagation();
}

let wheelRest = 0;
function onWheel(event: WheelEvent): void {
	const { steps, rest } = wheelSteps(wheelRest, event.deltaX, event.deltaY);
	wheelRest = rest;
	if (steps !== 0) move(steps);
}

// ── Arrastrar ────────────────────────────────────────────────────────────
// Cada vez que el puntero recorre un paso de tarjeta, el carrusel avanza uno y
// el origen se corre ese paso: así se siente pegado al dedo y no hace falta
// soltar para ver adónde se llega.
const track = ref<HTMLElement | null>(null);
let dragOrigin: number | null = null;
let dragged = false;
let swallowClick = false;

function stepWidth(): number {
	const card = track.value?.querySelector<HTMLElement>('[data-center="true"]');
	const width = card?.offsetWidth ?? 0;
	return width > 0 ? width * 0.62 : 120;
}

function onPointerDown(event: PointerEvent): void {
	if (event.button !== 0) return;
	dragOrigin = event.clientX;
	dragged = false;
}

function onPointerMove(event: PointerEvent): void {
	if (dragOrigin === null) return;
	const step = stepWidth();
	const distance = event.clientX - dragOrigin;
	if (Math.abs(distance) < step) return;
	const steps = Math.trunc(distance / step);
	// Arrastrar a la derecha trae lo de la izquierda.
	move(-steps);
	dragOrigin += steps * step;
	dragged = true;
}

function onPointerUp(): void {
	if (dragged) swallowClick = true;
	dragOrigin = null;
	dragged = false;
}

/**
 * El clic se escucha en la fila y no en cada tarjeta: la tarjeta no es un
 * control que reciba el foco —el foco es de la fila, y las flechas mueven la
 * opción activa—, así que el teclado ya lo atiende `onKeydown`.
 */
function onClick(event: MouseEvent): void {
	if (swallowClick) {
		swallowClick = false;
		return;
	}
	const card = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-position]');
	if (card?.dataset.position !== undefined) activate(Number(card.dataset.position));
}

onBeforeUnmount(() => {
	dragOrigin = null;
});

defineExpose({ move, activate, index });
</script>

<template>
  <div
    class="group relative w-full min-w-0 select-none overflow-hidden focus-visible:outline-none"
    role="listbox"
    tabindex="0"
    :aria-label="listLabel"
    :aria-activedescendant="index >= 0 ? optionId(index) : undefined"
    data-wallpaper-carousel
    @keydown="onKeydown"
    @click="onClick"
    @wheel.prevent="onWheel"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
    @pointerleave="hovered = null">
    <div class="@container w-full">
      <div
        ref="track"
        class="relative w-full [--card-width:clamp(7rem,38cqi,20rem)]"
        style="height: calc(var(--card-width) * 0.625 * 1.1 + 2rem)">
        <p v-if="count === 0" class="absolute inset-0 flex items-center justify-center px-4 text-center text-body-s text-tx-main text-shadow-legible" data-empty>
          {{ emptyText }}
        </p>
        <div
          v-for="{ entry, position, place } in rendered"
          :id="optionId(position)"
          :key="entryKey(entry)"
          role="option"
          :aria-selected="position === index ? 'true' : 'false'"
          :aria-label="entryLabel(entry)"
          :aria-current="entry.kind === 'item' && entry.item.id === current ? 'true' : undefined"
          :data-center="position === index ? 'true' : undefined"
          :data-offset="position - index"
          :data-position="position"
          class="absolute left-1/2 top-1/2 aspect-[16/10] w-(--card-width) cursor-pointer transition-transform duration-300 ease-ui-out motion-reduce:transition-none"
          :style="cardStyle(place)"
          @mouseenter="hovered = entry.kind === 'item' ? entry.item.id : null"
          @mouseleave="hovered = null">
          <div
            class="relative h-full w-full overflow-hidden rounded-corner-l border shadow-surface-l"
            :class="[
              position === index ? 'border-2 border-primary' : 'border-ui-line',
              position === index ? 'group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-ui-focus' : '',
            ]">
            <!-- La imagen, enderezada y un poco más ancha para cubrir las puntas. -->
            <div class="absolute inset-y-0 -inset-x-[7%]" style="transform: skewX(12deg)">
              <div
                v-if="entry.kind === 'more'"
                class="flex h-full w-full flex-col items-center justify-center gap-2 bg-ui-shell px-[10%] text-center text-tx-main"
                data-more>
                <ThemeIcon name="preferences-desktop-wallpaper" :fallbacks="['preferences-desktop']" :size="32" />
                <span class="line-clamp-2 text-label-m">{{ moreLabel }}</span>
              </div>
              <WallpaperThumbnail
                v-else
                fill
                :src="entry.item.thumbnail"
                :video="Boolean(entry.item.video)"
                :video-src="entry.item.id === previewing ? entry.item.videoSrc : null"
                :playing="entry.item.id === previewing"
                :selected="entry.item.id === current"
                :dimmed="place.dimmed"
                :video-label="videoLabel"
                :selected-label="currentLabel" />
            </div>
          </div>
        </div>
      </div>
    </div>
    <p
      v-if="focusedEntry !== undefined"
      class="mt-1 truncate px-4 text-center text-label-m font-semibold text-tx-main text-shadow-legible"
      aria-live="polite"
      data-focused-label>
      {{ entryLabel(focusedEntry) }}
    </p>
  </div>
</template>
