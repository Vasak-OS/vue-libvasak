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

const { vertical, posicion } = usarLaBarra();

/** Cuánto hay que sostener para que cuente como pulsación larga. */
const ESPERA_DE_LA_PULSACION = 500;
/** Cuánto puede moverse el puntero sin que deje de ser una pulsación. */
const TOLERANCIA = 8;
/** El aire entre la barra y el nombre desplegado. */
const SEPARACION = 6;

const raiz = ref<HTMLElement | null>(null);
const encima = ref(false);
const enfocada = ref(false);
const enElDesplegado = ref(false);
const caja = ref({ top: 0, left: 0, right: 0 });
let temporizador: ReturnType<typeof setTimeout> | null = null;
let origen: { x: number; y: number } | null = null;

const sePuedeCerrar = computed(() => props.tab.closable !== false);
/** Lo que se lee y lo que se oye, que no son lo mismo cuando hay cambios. */
const textoDeAyuda = computed(() => props.tab.tooltip ?? props.tab.label);
const nombreAccesible = computed(() =>
	props.tab.dirty ? `${props.tab.label} · ${props.dirtyLabel}` : props.tab.label
);

/** La inicial, cuando no hay icono: un cuadrado vacío no distingue nada. */
const inicial = computed(() => props.tab.label.trim().charAt(0).toUpperCase());

/** El punto de «sin guardar» deja su lugar al botón cuando se lo va a usar. */
const activoElPuntero = computed(() => encima.value || enElDesplegado.value);
const muestraElPunto = computed(
	() => Boolean(props.tab.dirty) && !(activoElPuntero.value && sePuedeCerrar.value)
);
const muestraElCierre = computed(
	() => sePuedeCerrar.value && (activoElPuntero.value || props.active || !props.tab.dirty)
);

/**
 * El nombre desplegado se ve al pasar por encima y **también al enfocar**.
 *
 * Sólo con el puntero, quien navega con el tabulador tendría una columna de
 * iniciales sin manera de saber qué son.
 */
const desplegado = computed(
	() => vertical.value && (encima.value || enfocada.value || enElDesplegado.value)
);

/** Dónde se dibuja el desplegado, en coordenadas de la ventana. */
const estiloDelDesplegado = computed(() => {
	const base = { position: 'fixed' as const, top: `${caja.value.top}px`, zIndex: 50 };
	return posicion.value === 'right'
		? { ...base, right: `${caja.value.right + SEPARACION}px` }
		: { ...base, left: `${caja.value.left + SEPARACION}px` };
});

/** Se mide al abrirlo: la pestaña se mueve al desplazar el carril. */
function medir() {
	const nodo = raiz.value;
	if (!nodo) return;
	const rect = nodo.getBoundingClientRect();
	caja.value = {
		top: rect.top,
		left: rect.right,
		right: window.innerWidth - rect.left,
	};
}

function entrar() {
	encima.value = true;
	medir();
}

function enfocar() {
	enfocada.value = true;
	medir();
}

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
    ref="raiz"
    class="group relative flex shrink-0 cursor-pointer items-center gap-2 rounded-corner border border-ui-border transition-colors"
    :class="[
      active ? 'bg-primary font-bold text-tx-on-primary' : 'bg-ui-bg/80 hover:bg-ui-surface/70',
      vertical ? 'size-8 justify-center p-0 text-sm' : 'w-34 max-w-34 px-3 py-1 text-sm',
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
    @mouseenter="entrar"
    @mouseleave="encima = false"
    @focus="enfocar"
    @blur="enfocada = false">
    <ThemeIcon v-if="tab.icon" :name="tab.icon" :size="16" class="shrink-0" />
    <!-- Sin icono y con la barra a un costado, la inicial: un cuadrado vacío no
         distingue una pestaña de otra. -->
    <span v-else-if="vertical" aria-hidden="true">{{ inicial }}</span>

    <span v-if="!vertical" class="min-w-0 flex-1 truncate">{{ tab.label }}</span>

    <!-- El punto de «sin guardar». Va `aria-hidden` porque el estado ya está
         en el nombre accesible de la pestaña: dicho dos veces, un lector de
         pantalla lo lee dos veces. Compacta se dibuja en la esquina, que es el
         único lugar que queda. -->
    <span
      v-if="muestraElPunto"
      class="size-2 shrink-0 rounded-full bg-current"
      :class="vertical ? 'absolute right-0.5 top-0.5' : ''"
      aria-hidden="true" />

    <button
      v-else-if="muestraElCierre && !vertical"
      type="button"
      class="flex size-4 shrink-0 items-center justify-center rounded-corner-sm hover:bg-ui-surface"
      :title="closeLabel"
      :aria-label="`${closeLabel}: ${nombreAccesible}`"
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
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="opacity-0 scale-95"
        leave-active-class="transition duration-100 ease-in"
        leave-to-class="opacity-0 scale-95">
        <div
          v-if="desplegado"
          class="flex items-center gap-2 rounded-corner border border-ui-border bg-ui-surface/95 px-3 py-1 text-sm shadow-lg"
          :class="active ? 'font-bold' : ''"
          :style="estiloDelDesplegado"
          @mouseenter="enElDesplegado = true"
          @mouseleave="enElDesplegado = false">
          <span class="whitespace-nowrap">{{ tab.label }}</span>

          <span v-if="tab.dirty" class="size-2 shrink-0 rounded-full bg-current" aria-hidden="true" />

          <button
            v-if="sePuedeCerrar"
            type="button"
            class="flex size-4 shrink-0 items-center justify-center rounded-corner-sm hover:bg-ui-surface"
            :title="closeLabel"
            :aria-label="`${closeLabel}: ${nombreAccesible}`"
            @click.stop="emit('close')">
            <ThemeIcon name="gtk-close" type="symbol" :size="12" />
          </button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
