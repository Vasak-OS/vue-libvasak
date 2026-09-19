<script lang="ts" setup>
/**
 * La barra de pestañas del escritorio.
 *
 * Una sola para la terminal, el gestor de archivos y el editor: las tres tenían
 * la suya, con prestaciones que no se solapaban.
 *
 * # Se amolda a dónde está la barra
 *
 * Horizontal es un carril que se desplaza con la rueda; vertical, una columna
 * que se desplaza igual. El eje del desplazamiento y el del arrastre salen de
 * la orientación que provee el marco, así que la aplicación no pasa nada.
 *
 * # Reordenar
 *
 * Con arrastre nativo del navegador y no con una librería de terceros: anda en
 * los dos ejes, no suma una dependencia y es lo que ya usaba el editor. Lo que
 * se emite es la lista nueva, no un par de índices: así quien la recibe no
 * tiene que reimplementar el movimiento.
 */
import { computed, nextTick, ref } from 'vue';
import ThemeIcon from '../icons/ThemeIcon.vue';
import { usarLaBarra } from '../window/tipos';
import TabItem from './TabItem.vue';
import type { ElementoDePestana } from './tipos';

const props = withDefaults(
	defineProps<{
		tabs: ElementoDePestana[];
		/** El identificador de la activa. */
		modelValue?: string;
		/** Sin esto no se dibuja el botón de pestaña nueva. */
		newLabel?: string;
		closeLabel?: string;
		/** Lo que se oye en una pestaña con cambios sin guardar. */
		dirtyLabel?: string;
		/** Para una barra que no deja reordenar. */
		fixedOrder?: boolean;
	}>(),
	{
		modelValue: '',
		newLabel: '',
		closeLabel: 'Close',
		dirtyLabel: 'Unsaved changes',
		fixedOrder: false,
	}
);

const emit = defineEmits<{
	'update:modelValue': [id: string];
	select: [id: string];
	close: [id: string];
	new: [];
	reorder: [tabs: ElementoDePestana[]];
	menu: [carga: { id: string; x: number; y: number }];
}>();

const { vertical } = usarLaBarra();

const carril = ref<HTMLElement | null>(null);
/**
 * Cuál pestaña entra en el orden de tabulación.
 *
 * El patrón de una lista de pestañas es «foco itinerante»: una sola es
 * alcanzable con Tab y adentro se navega con las flechas. Con todas en el orden
 * de tabulación, salir de una barra de nueve pestañas cuesta nueve pulsaciones.
 */
const enfocada = ref(0);
const arrastrada = ref<number | null>(null);
const encimaDe = ref<number | null>(null);

function elegir(id: string) {
	emit('update:modelValue', id);
	emit('select', id);
}

/** Mueve el foco con las flechas, dando la vuelta en los extremos. */
async function navegar(desde: number, a: 'anterior' | 'siguiente' | 'primera' | 'ultima') {
	const ultima = props.tabs.length - 1;
	if (ultima < 0) return;

	const destino =
		a === 'primera'
			? 0
			: a === 'ultima'
				? ultima
				: a === 'anterior'
					? (desde - 1 + props.tabs.length) % props.tabs.length
					: (desde + 1) % props.tabs.length;

	enfocada.value = destino;
	await nextTick();
	// El nodo y no el componente: lo que recibe el foco es el `div` con
	// `tabindex`, y buscarlo por posición es lo que deja que esto no dependa de
	// una referencia por pestaña.
	const nodos = carril.value?.querySelectorAll<HTMLElement>('[role="tab"]');
	nodos?.[destino]?.focus();
}

/**
 * Mueve una pestaña de lugar con el teclado.
 *
 * El arrastre nativo es de puntero y nada más: sin esto, reordenar no se puede
 * hacer sin mouse.
 */
function mover(desde: number, cuanto: -1 | 1) {
	if (props.fixedOrder) return;
	const hasta = desde + cuanto;
	if (hasta < 0 || hasta >= props.tabs.length) return;

	const lista = [...props.tabs];
	const [movida] = lista.splice(desde, 1);
	if (!movida) return;
	lista.splice(hasta, 0, movida);
	enfocada.value = hasta;
	emit('reorder', lista);
}

/**
 * La rueda desplaza el carril en su eje.
 *
 * Una rueda vertical sobre un carril horizontal no hace nada por omisión, que
 * es lo que dejaba las pestañas de más inalcanzables sin un mouse con rueda
 * horizontal.
 */
function rueda(evento: WheelEvent) {
	const nodo = carril.value;
	if (!nodo) return;
	const cuanto = evento.deltaY || evento.deltaX || 0;
	const antes = vertical.value ? nodo.scrollTop : nodo.scrollLeft;

	if (vertical.value) {
		nodo.scrollTop += cuanto;
	} else {
		nodo.scrollLeft += cuanto;
	}

	// Sólo se queda el evento si el carril de verdad se movió. Sin esto, una
	// barra con dos pestañas —o una ya en el tope— se comía el desplazamiento
	// de lo que hubiera debajo.
	const despues = vertical.value ? nodo.scrollTop : nodo.scrollLeft;
	if (despues !== antes) evento.preventDefault();
}

function comenzar(indice: number, evento: DragEvent) {
	if (props.fixedOrder) return;
	arrastrada.value = indice;
	evento.dataTransfer?.setData('text/plain', String(indice));
	if (evento.dataTransfer) evento.dataTransfer.effectAllowed = 'move';
}

function sobre(indice: number, evento: DragEvent) {
	if (props.fixedOrder || arrastrada.value === null) return;
	evento.preventDefault();
	encimaDe.value = indice;
	if (evento.dataTransfer) evento.dataTransfer.dropEffect = 'move';
}

function soltar(indice: number) {
	const desde = arrastrada.value;
	terminar();
	if (props.fixedOrder || desde === null || desde === indice) return;

	const lista = [...props.tabs];
	const [movida] = lista.splice(desde, 1);
	if (!movida) return;
	lista.splice(indice, 0, movida);
	emit('reorder', lista);
}

function terminar() {
	arrastrada.value = null;
	encimaDe.value = null;
}

const clasesDelCarril = computed(() =>
	vertical.value
		? 'flex h-full w-full flex-col items-stretch gap-1 overflow-y-auto overflow-x-hidden'
		: 'flex items-center gap-1 overflow-x-auto overflow-y-hidden'
);
</script>

<template>
  <div
    class="flex min-h-0 min-w-0 items-center gap-1"
    :class="vertical ? 'w-full flex-col' : 'h-full'"
    role="tablist"
    :aria-orientation="vertical ? 'vertical' : 'horizontal'">
    <div ref="carril" :class="clasesDelCarril" @wheel="rueda">
      <div
        v-for="(tab, indice) in tabs"
        :key="tab.id"
        class="transition-opacity"
        :class="[
          arrastrada === indice ? 'opacity-40' : '',
          encimaDe === indice && arrastrada !== indice ? 'ring-2 ring-secondary rounded-corner' : '',
        ]"
        :draggable="!fixedOrder"
        @dragstart="comenzar(indice, $event)"
        @dragover="sobre(indice, $event)"
        @drop.prevent="soltar(indice)"
        @dragend="terminar">
        <TabItem
          :tab="tab"
          :active="tab.id === modelValue"
          :close-label="closeLabel"
          :dirty-label="dirtyLabel"
          :tabindex="indice === enfocada ? 0 : -1"
          @select="elegir(tab.id)"
          @close="emit('close', tab.id)"
          @menu="(posicion) => emit('menu', { id: tab.id, ...posicion })"
          @navegar="(a) => navegar(indice, a)"
          @mover="(cuanto) => mover(indice, cuanto)" />
      </div>
    </div>

    <button
      v-if="newLabel"
      type="button"
      class="flex size-7 shrink-0 items-center justify-center rounded-corner border border-ui-border bg-ui-bg/80 hover:bg-ui-surface/70"
      :title="newLabel"
      :aria-label="newLabel"
      @click="emit('new')">
      <ThemeIcon name="gtk-add" type="symbol" :size="14" />
    </button>
  </div>
</template>
