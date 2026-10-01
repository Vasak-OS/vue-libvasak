<script lang="ts" setup>
/**
 * Una pestaña.
 *
 * Lo que hace, que es la unión de lo que hacían las tres del escritorio:
 *
 * - se elige con un clic;
 * - se cierra con su botón y con el clic del medio, que es lo que espera quien
 *   viene de un navegador;
 * - muestra un punto cuando hay cambios sin guardar, y ese punto se convierte
 *   en el botón de cerrar al pasar el puntero: en ciento treinta y seis píxeles
 *   no entran los dos;
 * - abre su menú con el clic derecho **y** con una pulsación larga, que es la
 *   única forma en una pantalla táctil;
 * - se arrastra para reordenar;
 * - se mueve con Alt y una flecha, que es lo único que deja reordenar sin
 *   mouse: el arrastre nativo es de puntero y nada más;
 * - se cierra con Suprimir, que con la barra a un costado es la única forma sin
 *   mouse: el botón de cerrar vive en el desplegado, y el desplegado está
 *   teletransportado al `body`, así que el tabulador no pasa por él;
 * - dice su nombre entero en el `title` cuando se corta, o lo que la pestaña
 *   ponga en `tooltip`.
 *
 * La pulsación larga cancela si el puntero se mueve: sin eso, empezar a
 * arrastrar abría el menú a mitad de camino.
 *
 * # Con la barra a un costado
 *
 * La pestaña se encoge al tamaño de un botón y el nombre aparece **encima** del
 * contenido al pasar el puntero o al enfocarla, no al lado: ocupando el ancho
 * de la columna, una barra vertical se comía la ventana.
 *
 * El desplegado va teletransportado al `body` y ubicado con coordenadas fijas.
 * Adentro del carril lo recortaba el `overflow` que necesita para desplazarse,
 * y el `overflow` no se puede sacar sin perder el desplazamiento.
 *
 * # La forma (vue-libvasak#74)
 *
 * El segmento de Once UI: sin borde, `rounded-corner-m`, 32 de alto. La activa
 * lleva el velo de acento `ui-selected-accent` y peso 600 (decisión 4): era el
 * relleno pleno del primario con el texto en negrita, y en una terminal con
 * nueve pestañas eso es una fila tranquila con una que grita. Las demás son
 * transparentes, con el velo `ui-hover` al pasar. El foco va por dentro: el
 * carril desplaza y un anillo de afuera lo recortaría. El nombre desplegado de
 * la barra vertical es un globo (`ui-float`, `rounded-corner-s`,
 * `shadow-surface-s`), y si no entra se parte en vez de salirse de la ventana.
 */
import { computed, onBeforeUnmount, ref } from 'vue';
import ThemeIcon from '../icons/ThemeIcon.vue';
import { useLabels } from '../shared/labels';
import { usarLaBarra as useBar } from '../window/tipos';
import type { TabEntry } from './types';

const props = withDefaults(
	defineProps<{
		tab: TabEntry;
		active?: boolean;
		/** Lo que se oye en el botón de cerrar. Sin esto, `tabs.close` del catálogo o «Close». */
		closeLabel?: string;
		/**
		 * Lo que se dice de una pestaña con cambios sin guardar.
		 *
		 * El punto es lo único que lo indicaba, y va `aria-hidden`: quien usa un
		 * lector de pantalla podía cerrar una pestaña modificada sin enterarse.
		 * Entra por propiedad porque una librería que traduce obliga a todas las
		 * aplicaciones a compartir sus claves. Sin pasarla, `tabs.unsaved` del
		 * catálogo de la aplicación, o «Unsaved changes».
		 */
		dirtyLabel?: string;
		/** El índice dentro de la barra, para el foco itinerante. */
		tabindex?: number;
	}>(),
	{ active: false, closeLabel: undefined, dirtyLabel: undefined, tabindex: 0 }
);

const emit = defineEmits<{
	select: [];
	close: [];
	menu: [posicion: { x: number; y: number }];
	mover: [cuanto: -1 | 1];
	navegar: [a: 'anterior' | 'siguiente' | 'primera' | 'ultima'];
}>();

const { vertical, posicion: barPosition } = useBar();
const translate = useLabels();
const closeText = computed(() => props.closeLabel ?? translate('tabs.close', 'Close'));
const dirtyText = computed(() => props.dirtyLabel ?? translate('tabs.unsaved', 'Unsaved changes'));

/** Cuánto hay que sostener para que cuente como pulsación larga. */
const LONG_PRESS_DELAY = 500;
/** Cuánto puede moverse el puntero sin que deje de ser una pulsación. */
const PRESS_TOLERANCE = 8;
/** El aire entre la barra y el nombre desplegado. */
const EXPANDED_GAP = 6;

const root = ref<HTMLElement | null>(null);
const expandedRef = ref<HTMLElement | null>(null);
const hovered = ref(false);
const focused = ref(false);
const inExpanded = ref(false);
const box = ref({ top: 0, left: 0, right: 0 });
let timer: ReturnType<typeof setTimeout> | null = null;
let origin: { x: number; y: number } | null = null;

const closable = computed(() => props.tab.closable !== false);
/** Lo que se lee y lo que se oye, que no son lo mismo cuando hay cambios. */
const helpText = computed(() => props.tab.tooltip ?? props.tab.label);
const accessibleName = computed(() =>
	props.tab.dirty ? `${props.tab.label} · ${dirtyText.value}` : props.tab.label
);

/** La inicial, cuando no hay icono: un cuadrado vacío no distingue nada. */
const initial = computed(() => props.tab.label.trim().charAt(0).toUpperCase());

/** El punto de «sin guardar» deja su lugar al botón cuando se lo va a usar. */
const pointerActive = computed(() => hovered.value || inExpanded.value);
const showsDot = computed(
	() => Boolean(props.tab.dirty) && !(pointerActive.value && closable.value)
);
const showsClose = computed(
	() => closable.value && (pointerActive.value || props.active || !props.tab.dirty)
);

/**
 * El nombre desplegado se ve al pasar por encima y **también al enfocar**.
 *
 * Sólo con el puntero, quien navega con el tabulador tendría una columna de
 * iniciales sin manera de saber qué son.
 */
const expanded = computed(
	() => vertical.value && (hovered.value || focused.value || inExpanded.value)
);

/** Dónde se dibuja el desplegado, en coordenadas de la ventana. */
const expandedStyle = computed(() => {
	// Topado contra el borde de abajo: un nombre largo partido en varias
	// líneas en una pestaña baja se salía de la ventana con su botón de
	// cerrar. Con el techo, desplaza adentro.
	const base = {
		position: 'fixed' as const,
		top: `${box.value.top}px`,
		maxHeight: `calc(100vh - ${box.value.top}px - 8px)`,
		overflowY: 'auto' as const,
		zIndex: 50,
	};
	return barPosition.value === 'right'
		? { ...base, right: `${box.value.right + EXPANDED_GAP}px` }
		: { ...base, left: `${box.value.left + EXPANDED_GAP}px` };
});

/** Se mide al abrirlo: la pestaña se mueve al desplazar el carril. */
function measure() {
	const node = root.value;
	if (!node) return;
	const rect = node.getBoundingClientRect();
	box.value = {
		top: rect.top,
		left: rect.right,
		right: window.innerWidth - rect.left,
	};
}

/**
 * El foco se fue del desplegado, ¿o sólo se movió adentro?
 *
 * `focusout` salta también al pasar de un hijo a otro. Sin mirar a dónde fue,
 * el desplegado se cerraba al entrar en su propio botón de cerrar.
 */
function onExpandedFocusout(event: FocusEvent) {
	const target = event.relatedTarget as Node | null;
	if (target && expandedRef.value?.contains(target)) return;
	inExpanded.value = false;
}

function onEnter() {
	hovered.value = true;
	measure();
}

function onFocus() {
	focused.value = true;
	measure();
}

function cancelPress() {
	if (timer !== null) clearTimeout(timer);
	timer = null;
	origin = null;
}

function onPointerdown(event: PointerEvent) {
	// Sólo el botón principal: el derecho ya tiene su propio camino.
	if (event.button !== 0) return;
	origin = { x: event.clientX, y: event.clientY };
	timer = setTimeout(() => {
		if (origin) emit('menu', origin);
		cancelPress();
	}, LONG_PRESS_DELAY);
}

function onPointermove(event: PointerEvent) {
	if (!origin) return;
	const far =
		Math.abs(event.clientX - origin.x) > PRESS_TOLERANCE ||
		Math.abs(event.clientY - origin.y) > PRESS_TOLERANCE;
	if (far) cancelPress();
}

function onAuxclick(event: MouseEvent) {
	// El del medio cierra, que es lo que hace cualquier navegador.
	if (event.button === 1 && closable.value) {
		event.preventDefault();
		emit('close');
	}
}

function onContextmenu(event: MouseEvent) {
	event.preventDefault();
	emit('menu', { x: event.clientX, y: event.clientY });
}

onBeforeUnmount(cancelPress);
</script>

<template>
  <div
    ref="root"
    class="group relative flex shrink-0 cursor-pointer items-center gap-2 rounded-corner-m text-label-m text-tx-main transition-colors duration-200 ease-ui focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ui-focus"
    :class="[
      active ? 'bg-ui-selected-accent font-semibold' : 'hover:bg-ui-hover active:bg-ui-pressed active:duration-100',
      vertical ? 'size-8 justify-center p-0' : 'h-8 w-34 max-w-34 pr-1 pl-3',
    ]"
    role="tab"
    :aria-selected="active"
    :title="helpText"
    :aria-label="accessibleName"
    :tabindex="tabindex"
    @click.stop="emit('select')"
    @keydown.enter.stop="emit('select')"
    @keydown.space.prevent.stop="emit('select')"
    @keydown.left.prevent.stop="emit('navegar', 'anterior')"
    @keydown.up.prevent.stop="emit('navegar', 'anterior')"
    @keydown.right.prevent.stop="emit('navegar', 'siguiente')"
    @keydown.down.prevent.stop="emit('navegar', 'siguiente')"
    @keydown.home.prevent.stop="emit('navegar', 'primera')"
    @keydown.end.prevent.stop="emit('navegar', 'ultima')"
    @keydown.alt.left.prevent.stop="emit('mover', -1)"
    @keydown.alt.up.prevent.stop="emit('mover', -1)"
    @keydown.alt.right.prevent.stop="emit('mover', 1)"
    @keydown.alt.down.prevent.stop="emit('mover', 1)"
    @keydown.delete.prevent.stop="closable && emit('close')"
    @auxclick.stop="onAuxclick"
    @contextmenu="onContextmenu"
    @pointerdown="onPointerdown"
    @pointermove="onPointermove"
    @pointerup="cancelPress"
    @pointerleave="cancelPress"
    @mouseenter="onEnter"
    @mouseleave="hovered = false"
    @focus="onFocus"
    @blur="focused = false">
    <ThemeIcon v-if="tab.icon" :name="tab.icon" :size="16" class="shrink-0" />
    <!-- Sin icono y con la barra a un costado, la inicial: un cuadrado vacío no
         distingue una pestaña de otra. -->
    <span v-else-if="vertical" aria-hidden="true">{{ initial }}</span>

    <span v-if="!vertical" class="min-w-0 flex-1 truncate">{{ tab.label }}</span>

    <!-- El punto de «sin guardar». Va `aria-hidden` porque el estado ya está
         en el nombre accesible de la pestaña: dicho dos veces, un lector de
         pantalla lo lee dos veces. Compacta se dibuja en la esquina, que es el
         único lugar que queda. -->
    <span
      v-if="showsDot"
      class="size-2 shrink-0 rounded-corner-full bg-current" data-tab-dirty
      :class="vertical ? 'absolute right-0.5 top-0.5' : ''"
      aria-hidden="true" />

    <button
      v-else-if="showsClose && !vertical"
      type="button"
      class="flex size-6 shrink-0 items-center justify-center rounded-corner-s text-tx-muted transition-colors duration-200 ease-ui hover:bg-ui-hover active:bg-ui-pressed"
      :title="closeText"
      :aria-label="`${closeText}: ${accessibleName}`"
      @click.stop="emit('close')">
      <ThemeIcon name="gtk-close" type="symbol" :size="12" />
    </button>

    <!--
    El nombre entero, encima del contenido.

    Teletransportado al `body` porque adentro del carril lo recorta el
    `overflow` que éste necesita para desplazarse. Y con coordenadas fijas
    medidas al abrirlo, no con posicionamiento relativo, por lo mismo.
  -->
    <Teleport to="body">
        <Transition
        enter-active-class="transition-[opacity,translate] duration-150 ease-ui-out"
        :enter-from-class="barPosition === 'right' ? 'opacity-0 translate-x-0.5' : 'opacity-0 -translate-x-0.5'"
        leave-active-class="transition-opacity duration-100 ease-ui"
        leave-to-class="opacity-0">
        <div
          v-if="expanded"
          class="flex max-w-[calc(100vw-16px)] items-center gap-2 rounded-corner-s border border-ui-line bg-ui-float py-1 pr-1 pl-2 text-body-xs text-tx-main shadow-surface-s"
          :class="active ? 'font-semibold' : ''"
          ref="expandedRef"
          :style="expandedStyle"
          @mouseenter="inExpanded = true"
          @mouseleave="inExpanded = false"
          @focusin="inExpanded = true"
          @focusout="onExpandedFocusout">
          <span class="min-w-0 break-words" data-tab-expanded-label>{{ tab.label }}</span>

          <span v-if="tab.dirty" class="size-2 shrink-0 rounded-corner-full bg-current" data-tab-dirty aria-hidden="true" />

          <button
            v-if="closable"
            type="button"
            class="flex size-6 shrink-0 items-center justify-center rounded-corner-xs text-tx-muted transition-colors duration-200 ease-ui hover:bg-ui-hover active:bg-ui-pressed"
            :title="closeText"
            :aria-label="`${closeText}: ${accessibleName}`"
            @click.stop="emit('close')">
            <ThemeIcon name="gtk-close" type="symbol" :size="12" />
          </button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
