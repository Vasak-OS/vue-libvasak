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
 *
 * # La forma (vue-libvasak#74)
 *
 * Las pestañas del control segmentado de Once UI, sin el contenedor: el carril
 * no gana borde ni relleno, para que la barra mida lo mismo que antes en las
 * tres aplicaciones. El botón de pestaña nueva es un botón sin borde de 32,
 * como las pestañas. Arrastrando, una barra fina en `ui-focus` marca dónde cae.
 */
import { computed, nextTick, ref } from 'vue';
import ThemeIcon from '../icons/ThemeIcon.vue';
import { usarLaBarra as useBar } from '../window/tipos';
import TabItem from './TabItem.vue';
import type { TabEntry } from './types';

const props = withDefaults(
	defineProps<{
		tabs: TabEntry[];
		/** El identificador de la activa. */
		modelValue?: string;
		/** Sin esto no se dibuja el botón de pestaña nueva. */
		newLabel?: string;
		/** Lo que se oye en el botón de cerrar. Sin esto, `tabs.close` del catálogo o «Close». */
		closeLabel?: string;
		/** Lo que se oye en una pestaña con cambios sin guardar. Sin esto, `tabs.unsaved` o «Unsaved changes». */
		dirtyLabel?: string;
		/** Para una barra que no deja reordenar. */
		fixedOrder?: boolean;
	}>(),
	{
		modelValue: '',
		newLabel: '',
		closeLabel: undefined,
		dirtyLabel: undefined,
		fixedOrder: false,
	}
);

const emit = defineEmits<{
	'update:modelValue': [id: string];
	select: [id: string];
	close: [id: string];
	new: [];
	reorder: [tabs: TabEntry[]];
	menu: [payload: { id: string; x: number; y: number }];
}>();

const { vertical } = useBar();

const rail = ref<HTMLElement | null>(null);
/**
 * Cuál pestaña entra en el orden de tabulación.
 *
 * El patrón de una lista de pestañas es «foco itinerante»: una sola es
 * alcanzable con Tab y adentro se navega con las flechas. Con todas en el orden
 * de tabulación, salir de una barra de nueve pestañas cuesta nueve pulsaciones.
 */
const focused = ref(0);
const dragged = ref<number | null>(null);
const over = ref<number | null>(null);

function choose(id: string) {
	emit('update:modelValue', id);
	emit('select', id);
}

/** Mueve el foco con las flechas, dando la vuelta en los extremos. */
async function navigate(from: number, a: 'anterior' | 'siguiente' | 'primera' | 'ultima') {
	const last = props.tabs.length - 1;
	if (last < 0) return;

	const target =
		a === 'primera'
			? 0
			: a === 'ultima'
				? last
				: a === 'anterior'
					? (from - 1 + props.tabs.length) % props.tabs.length
					: (from + 1) % props.tabs.length;

	focused.value = target;
	await nextTick();
	// El nodo y no el componente: lo que recibe el foco es el `div` con
	// `tabindex`, y buscarlo por posición es lo que deja que esto no dependa de
	// una referencia por pestaña.
	const nodes = rail.value?.querySelectorAll<HTMLElement>('[role="tab"]');
	nodes?.[target]?.focus();
}

/**
 * Mueve una pestaña de lugar con el teclado.
 *
 * El arrastre nativo es de puntero y nada más: sin esto, reordenar no se puede
 * hacer sin mouse.
 */
function move(from: number, amount: -1 | 1) {
	if (props.fixedOrder) return;
	const to = from + amount;
	if (to < 0 || to >= props.tabs.length) return;

	const list = [...props.tabs];
	const [moved] = list.splice(from, 1);
	if (!moved) return;
	list.splice(to, 0, moved);
	focused.value = to;
	emit('reorder', list);
}

/**
 * La rueda desplaza el carril en su eje.
 *
 * Una rueda vertical sobre un carril horizontal no hace nada por omisión, que
 * es lo que dejaba las pestañas de más inalcanzables sin un mouse con rueda
 * horizontal.
 */
function onWheel(event: WheelEvent) {
	const node = rail.value;
	if (!node) return;
	const amount = event.deltaY || event.deltaX || 0;
	const before = vertical.value ? node.scrollTop : node.scrollLeft;

	if (vertical.value) {
		node.scrollTop += amount;
	} else {
		node.scrollLeft += amount;
	}

	// Sólo se queda el evento si el carril de verdad se movió. Sin esto, una
	// barra con dos pestañas —o una ya en el tope— se comía el desplazamiento
	// de lo que hubiera debajo.
	const after = vertical.value ? node.scrollTop : node.scrollLeft;
	if (after !== before) event.preventDefault();
}

function onDragstart(index: number, event: DragEvent) {
	if (props.fixedOrder) return;
	dragged.value = index;
	event.dataTransfer?.setData('text/plain', String(index));
	if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
}

function onDragover(index: number, event: DragEvent) {
	if (props.fixedOrder || dragged.value === null) return;
	event.preventDefault();
	over.value = index;
	if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
}

function onDrop(index: number) {
	const from = dragged.value;
	onDragend();
	if (props.fixedOrder || from === null || from === index) return;

	const list = [...props.tabs];
	const [moved] = list.splice(from, 1);
	if (!moved) return;
	list.splice(index, 0, moved);
	emit('reorder', list);
}

function onDragend() {
	dragged.value = null;
	over.value = null;
}

/**
 * La marca de dónde cae la pestaña que se arrastra.
 *
 * Una barra de 2 px en `ui-focus` sobre el borde por el que entra, y no un
 * anillo alrededor de la pestaña de destino: el anillo decía «sobre ésta», y
 * lo que pasa al soltar es «entre éstas». Si la arrastrada viene de antes, cae
 * después del destino; si viene de después, antes.
 */
function dropMarker(index: number): string {
	if (over.value !== index || dragged.value === null || dragged.value === index) return '';
	const after = dragged.value < index;
	if (vertical.value) {
		return after
			? 'after:absolute after:inset-x-1 after:-bottom-0.5 after:h-0.5 after:rounded-corner-full after:bg-ui-focus'
			: 'after:absolute after:inset-x-1 after:-top-0.5 after:h-0.5 after:rounded-corner-full after:bg-ui-focus';
	}
	return after
		? 'after:absolute after:inset-y-1 after:-right-0.5 after:w-0.5 after:rounded-corner-full after:bg-ui-focus'
		: 'after:absolute after:inset-y-1 after:-left-0.5 after:w-0.5 after:rounded-corner-full after:bg-ui-focus';
}

const railClasses = computed(() =>
	vertical.value
		// `items-center` y no `items-stretch`: con la barra a un costado las
		// pestañas son del tamaño de un botón y el nombre aparece encima del
		// contenido, no ensanchando la columna.
		? 'flex h-full flex-col items-center gap-1 overflow-y-auto overflow-x-hidden'
		: 'flex items-center gap-1 overflow-x-auto overflow-y-hidden'
);
</script>

<template>
  <div
    class="flex min-h-0 min-w-0 items-center gap-1"
    :class="vertical ? 'w-full flex-col' : 'h-full'"
    role="tablist"
    :aria-orientation="vertical ? 'vertical' : 'horizontal'">
    <div ref="rail" :class="railClasses" @wheel="onWheel">
      <div
        v-for="(tab, index) in tabs"
        :key="tab.id"
        class="relative transition-opacity duration-150 ease-ui"
        :class="[dragged === index ? 'opacity-40' : '', dropMarker(index)]"
        :draggable="!fixedOrder"
        @dragstart="onDragstart(index, $event)"
        @dragover="onDragover(index, $event)"
        @drop.prevent="onDrop(index)"
        @dragend="onDragend">
        <TabItem
          :tab="tab"
          :active="tab.id === modelValue"
          :close-label="closeLabel"
          :dirty-label="dirtyLabel"
          :tabindex="index === focused ? 0 : -1"
          @select="choose(tab.id)"
          @close="emit('close', tab.id)"
          @menu="(position) => emit('menu', { id: tab.id, ...position })"
          @navegar="(a) => navigate(index, a)"
          @mover="(amount) => move(index, amount)" />
      </div>
    </div>

    <button
      v-if="newLabel"
      type="button"
      class="flex size-8 shrink-0 items-center justify-center rounded-corner-m text-tx-main transition-colors duration-200 ease-ui hover:bg-ui-hover active:bg-ui-pressed active:duration-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-focus"
      :title="newLabel"
      :aria-label="newLabel"
      @click="emit('new')">
      <ThemeIcon name="gtk-add" type="symbol" :size="16" />
    </button>
  </div>
</template>
