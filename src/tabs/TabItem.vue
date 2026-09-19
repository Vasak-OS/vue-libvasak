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
 * - dice su nombre entero en el `title` cuando se corta, o lo que la pestaña
 *   ponga en `tooltip`;
 * - se mueve con Alt y una flecha, que es lo único que deja reordenar sin
 *   mouse: el arrastre nativo es de puntero y nada más.
 *
 * La pulsación larga cancela si el puntero se mueve: sin eso, empezar a
 * arrastrar abría el menú a mitad de camino.
 */
import { computed, onBeforeUnmount, ref } from 'vue';
import ThemeIcon from '../icons/ThemeIcon.vue';
import { usarLaBarra } from '../window/tipos';
import type { ElementoDePestana } from './tipos';

const props = withDefaults(
	defineProps<{
		tab: ElementoDePestana;
		active?: boolean;
		closeLabel?: string;
		/**
		 * Lo que se dice de una pestaña con cambios sin guardar.
		 *
		 * El punto es lo único que lo indicaba, y va `aria-hidden`: quien usa un
		 * lector de pantalla podía cerrar una pestaña modificada sin enterarse.
		 * Entra por propiedad porque una librería que traduce obliga a todas las
		 * aplicaciones a compartir sus claves.
		 */
		dirtyLabel?: string;
		/** El índice dentro de la barra, para el foco itinerante. */
		tabindex?: number;
	}>(),
	{ active: false, closeLabel: 'Close', dirtyLabel: 'Unsaved changes', tabindex: 0 }
);

const emit = defineEmits<{
	select: [];
	close: [];
	menu: [posicion: { x: number; y: number }];
	mover: [cuanto: -1 | 1];
	navegar: [a: 'anterior' | 'siguiente' | 'primera' | 'ultima'];
}>();

const { vertical } = usarLaBarra();

/** Cuánto hay que sostener para que cuente como pulsación larga. */
const ESPERA_DE_LA_PULSACION = 500;
/** Cuánto puede moverse el puntero sin que deje de ser una pulsación. */
const TOLERANCIA = 8;

const encima = ref(false);
let temporizador: ReturnType<typeof setTimeout> | null = null;
let origen: { x: number; y: number } | null = null;

const sePuedeCerrar = computed(() => props.tab.closable !== false);
/** Lo que se lee y lo que se oye, que no son lo mismo cuando hay cambios. */
const textoDeAyuda = computed(() => props.tab.tooltip ?? props.tab.label);
const nombreAccesible = computed(() =>
	props.tab.dirty ? `${props.tab.label} · ${props.dirtyLabel}` : props.tab.label
);
/** El punto de «sin guardar» deja su lugar al botón cuando se lo va a usar. */
const muestraElPunto = computed(() => Boolean(props.tab.dirty) && !(encima.value && sePuedeCerrar.value));
const muestraElCierre = computed(
	() => sePuedeCerrar.value && (encima.value || props.active || !props.tab.dirty)
);

function cancelarLaPulsacion() {
	if (temporizador !== null) clearTimeout(temporizador);
	temporizador = null;
	origen = null;
}

function alApretar(evento: PointerEvent) {
	// Sólo el botón principal: el derecho ya tiene su propio camino.
	if (evento.button !== 0) return;
	origen = { x: evento.clientX, y: evento.clientY };
	temporizador = setTimeout(() => {
		if (origen) emit('menu', origen);
		cancelarLaPulsacion();
	}, ESPERA_DE_LA_PULSACION);
}

function alMover(evento: PointerEvent) {
	if (!origen) return;
	const lejos =
		Math.abs(evento.clientX - origen.x) > TOLERANCIA ||
		Math.abs(evento.clientY - origen.y) > TOLERANCIA;
	if (lejos) cancelarLaPulsacion();
}

function alSoltarElMedio(evento: MouseEvent) {
	// El del medio cierra, que es lo que hace cualquier navegador.
	if (evento.button === 1 && sePuedeCerrar.value) {
		evento.preventDefault();
		emit('close');
	}
}

function alMenu(evento: MouseEvent) {
	evento.preventDefault();
	emit('menu', { x: evento.clientX, y: evento.clientY });
}

onBeforeUnmount(cancelarLaPulsacion);
</script>

<template>
  <div
    class="group relative flex shrink-0 cursor-pointer items-center gap-2 rounded-corner border border-ui-border px-3 py-1 text-sm transition-colors"
    :class="[
      active ? 'bg-primary font-bold text-tx-on-primary' : 'bg-ui-bg/80 hover:bg-ui-surface/70',
      vertical ? 'w-full justify-between' : 'w-34 max-w-34',
    ]"
    role="tab"
    :aria-selected="active"
    :title="textoDeAyuda"
    :aria-label="nombreAccesible"
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
    @auxclick.stop="alSoltarElMedio"
    @contextmenu="alMenu"
    @pointerdown="alApretar"
    @pointermove="alMover"
    @pointerup="cancelarLaPulsacion"
    @pointerleave="cancelarLaPulsacion"
    @mouseenter="encima = true"
    @mouseleave="encima = false">
    <ThemeIcon v-if="tab.icon" :name="tab.icon" :size="16" class="shrink-0" />

    <span class="min-w-0 flex-1 truncate">{{ tab.label }}</span>

    <!-- El punto de «sin guardar». Va `aria-hidden` porque el estado ya está
         en el nombre accesible de la pestaña: dicho dos veces, un lector de
         pantalla lo lee dos veces. -->
    <span
      v-if="muestraElPunto"
      class="size-2 shrink-0 rounded-full bg-current"
      aria-hidden="true" />

    <button
      v-else-if="muestraElCierre"
      type="button"
      class="flex size-4 shrink-0 items-center justify-center rounded-corner-sm hover:bg-ui-surface"
      :title="closeLabel"
      :aria-label="`${closeLabel}: ${nombreAccesible}`"
      @click.stop="emit('close')">
      <ThemeIcon name="gtk-close" type="symbol" :size="12" />
    </button>
  </div>
</template>
