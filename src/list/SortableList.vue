<script setup lang="ts" generic="T">
/**
 * Una lista que se reordena arrastrando, y también con el teclado.
 *
 * Lo que varias pantallas de Configuración escribían a mano con un par de
 * botones «subir»/«bajar» por fila y un `move(index, delta)`: los anclados del
 * panel y los módulos de fastfetch. No dibuja la fila —eso lo pone quien la
 * usa, por la ranura `item`—: pone el asa, el arrastre y el reordenamiento, y
 * emite la lista ya reordenada para que el consumidor no reimplemente el
 * movimiento (como `TabBar`).
 *
 * # El asa, no la fila
 *
 * El arrastre arranca desde un asa propia y no desde toda la fila: así los
 * controles de adentro de la fila —un botón de quitar, uno de plegar— siguen
 * recibiendo el clic sin pelear con el arrastre. El asa es un `<button>`
 * enfocable, que es lo que hace que lo que sigue funcione.
 *
 * # Con el teclado, sin regresión
 *
 * Las pantallas que esto reemplaza reordenaban con el teclado por sus botones
 * de subir/bajar. Acá, con el asa enfocada:
 *
 * - **Flecha arriba/abajo** mueve la fila un lugar, al toque, como los botones
 *   de antes. **Inicio/Fin** la llevan a la punta. El foco sigue a la fila.
 * - **Espacio/Enter** la «agarra»: a partir de ahí las flechas la mueven en
 *   borrador —sin emitir— y se anuncia cada paso; otro Espacio/Enter la suelta
 *   (recién ahí se emite) y **Escape** cancela y la devuelve a donde estaba.
 *
 * Las dos formas conviven: quien no quiera agarrar nada mueve con las flechas y
 * listo; quien prefiera el modelo de «levantar y soltar» tiene Escape para
 * arrepentirse. Lo que pasa se dice por una región viva (`aria-live`).
 *
 * # Las claves no las pone el consumidor
 *
 * Por omisión cada ítem se identifica por su **identidad de objeto** (un
 * `WeakMap`), no por su posición ni por un campo: así los módulos de fastfetch
 * —`{ name, options }`, con nombres que se repiten— se reordenan bien sin que
 * nadie invente una clave única. `itemKey` lo cambia: el nombre de un campo
 * (`'id'` para los anclados) o una función. Con una clave por posición la fila
 * que se mueve se vuelve a montar y pierde el foco; por eso la identidad de
 * objeto es lo de fábrica.
 *
 * # Puntero, no arrastre nativo
 *
 * Con eventos de puntero y captura, no con el arrastre HTML ni una librería de
 * terceros: no suma dependencia, el asa se queda con el puntero aunque se salga
 * de ella, y `touch-none` deja arrastrar con el dedo sin que la lista se
 * desplace. Mientras se arrastra, la fila se reordena en vivo entre las demás
 * —el hueco que deja es el «dónde va a caer»— y se levanta con sombra. Es una
 * lista vertical: los dos consumidores lo son.
 *
 * # La forma (vue-libvasak#74)
 *
 * El asa es un botón sin borde de 32 con el velo neutro al pasar, como los de
 * `TabBar`; la fila levantada usa la superficie flotante y la sombra de Once
 * UI. Colores del esquema, radio del sistema, icono del tema.
 */
import { computed, nextTick, ref, type ComponentPublicInstance, type Ref } from 'vue';
import ThemeIcon from '../icons/ThemeIcon.vue';
import { useLabels } from '../shared/labels';

type ItemKey = string | number;

const props = withDefaults(
	defineProps<{
		/** La lista. Se emite reordenada por `update:modelValue`. */
		modelValue: T[];
		/** Cómo identificar cada ítem: un campo, una función, o la identidad de objeto. */
		itemKey?: keyof T | ((item: T, index: number) => ItemKey);
		/** El nombre accesible de la lista. */
		label?: string;
		/** El icono del asa, del tema. */
		handleIcon?: string;
		/** Lo que se oye en el asa. Sin esto, `sortableList.reorder` del catálogo o «Reorder». */
		handleLabel?: string;
		/** Apaga el reordenamiento: sin asa y sin arrastre. No atenúa nada. */
		disabled?: boolean;
	}>(),
	{
		itemKey: undefined,
		label: undefined,
		handleIcon: 'list-drag-handle',
		handleLabel: undefined,
		disabled: false,
	}
);

const emit = defineEmits<{
	'update:modelValue': [items: T[]];
	/** El movimiento, por si alcanza con los índices. Se emite al mismo tiempo que la lista. */
	reorder: [change: { from: number; to: number }];
}>();

defineSlots<{
	/** Cada fila. El asa la pone el componente; esto es el contenido. */
	item(props: { item: T; index: number }): unknown;
}>();

const translate = useLabels();

/** Un id para atar el asa a su instructivo, estable en el proceso. */
let hintSeq = 0;
const hintId = `vasak-sortable-hint-${hintSeq++}`;

const handleName = computed(() => props.handleLabel ?? translate('sortableList.reorder', 'Reorder'));
const handleFallbacks = ['open-menu', 'view-more', 'view-list'];
const hint = computed(() =>
	translate('sortableList.hint', 'Use the arrow keys to move this item, or press space to pick it up.')
);

/**
 * La identidad de cada ítem.
 *
 * Por omisión un número por objeto (`WeakMap`), para que dos ítems iguales de
 * campo sigan siendo distintos y no se vuelvan a montar al moverse.
 */
const identity = new WeakMap<object, number>();
let nextId = 0;
function keyOf(item: T, index: number): ItemKey {
	const spec = props.itemKey;
	if (typeof spec === 'function') return spec(item, index);
	if (typeof spec === 'string') return (item as Record<string, unknown>)[spec] as ItemKey;
	if (item !== null && typeof item === 'object') {
		let id = identity.get(item as object);
		if (id === undefined) {
			id = nextId++;
			identity.set(item as object, id);
		}
		return `obj-${id}`;
	}
	return item as unknown as ItemKey;
}

/**
 * El borrador que se ve mientras se arrastra o se tiene algo agarrado.
 *
 * Mientras no haya nada en curso es nulo y la lista que se ve es `modelValue`.
 * Así un movimiento con las flechas suelto —sin agarrar— emite y no guarda
 * estado de más; el borrador es sólo para lo que todavía no se confirmó.
 */
const working = ref<T[] | null>(null) as Ref<T[] | null>;
const items = computed<T[]>(() => working.value ?? props.modelValue);

/** La clave de lo que se está moviendo (con el puntero o agarrado). */
const activeKey = ref<ItemKey | null>(null);
/** Agarrado con el teclado: las flechas mueven en borrador y Escape cancela. */
const grabbed = ref(false);
/** De dónde salió lo que se mueve, para el movimiento final y para cancelar. */
const dragStart = ref(0);
/** El puntero que tiene la captura, o nulo si lo que hay en curso es del teclado. */
const pointerId = ref<number | null>(null);

/** Los nodos de cada fila, para medir dónde cae el puntero. */
const rowEls = new Map<ItemKey, HTMLElement>();
function registerRow(key: ItemKey, el: Element | ComponentPublicInstance | null) {
	if (el instanceof HTMLElement) rowEls.set(key, el);
	else rowEls.delete(key);
}

/** Lo que se anuncia por la región viva. */
const announce = ref('');
function say(key: string, fallback: string, ...args: Array<string | number>) {
	let text = translate(key, fallback);
	args.forEach((value, index) => {
		text = text.replace(`{${index}}`, String(value));
	});
	announce.value = text;
}

function listMove(source: T[], from: number, to: number): T[] {
	const list = source.slice();
	const [moved] = list.splice(from, 1);
	if (moved === undefined) return source;
	list.splice(to, 0, moved);
	return list;
}

function activeIndex(list: T[]): number {
	return list.findIndex((item, index) => keyOf(item, index) === activeKey.value);
}

function isActive(item: T, index: number): boolean {
	return activeKey.value !== null && keyOf(item, index) === activeKey.value;
}

/**
 * Cómo se ve la fila que se mueve.
 *
 * Con el puntero se levanta sobre la superficie flotante; agarrada con el
 * teclado, el velo neutro de lo que se recorre, que no es una elección.
 */
function rowClass(item: T, index: number): string {
	if (!isActive(item, index)) return '';
	return pointerId.value !== null
		? 'z-10 cursor-grabbing bg-ui-float shadow-surface-m'
		: 'z-10 bg-ui-selected shadow-surface-s';
}

function reset() {
	pointerId.value = null;
	activeKey.value = null;
	grabbed.value = false;
	working.value = null;
}

/** Deja el foco en el asa de la fila que terminó en `index`. */
async function refocus(index: number) {
	await nextTick();
	const item = items.value[index];
	if (item === undefined) return;
	const el = rowEls.get(keyOf(item, index));
	el?.querySelector<HTMLElement>('[data-sortable-handle]')?.focus();
}

/** Confirma la lista nueva y avisa al consumidor. */
function commit(list: T[], from: number, to: number) {
	if (to !== -1 && from !== to) {
		emit('update:modelValue', list);
		emit('reorder', { from, to });
	}
}

// --- Teclado -------------------------------------------------------------

function moveTo(from: number, to: number) {
	const length = items.value.length;
	if (to < 0 || to >= length || to === from) return;

	if (grabbed.value) {
		working.value = listMove(items.value, from, to);
		say('sortableList.moved', 'Moved to position {0} of {1}.', to + 1, length);
	} else {
		const list = listMove(props.modelValue, from, to);
		commit(list, from, to);
		say('sortableList.moved', 'Moved to position {0} of {1}.', to + 1, length);
	}
	void refocus(to);
}

function toggleGrab(index: number) {
	const length = items.value.length;
	if (!grabbed.value) {
		grabbed.value = true;
		dragStart.value = index;
		activeKey.value = keyOf(items.value[index] as T, index);
		working.value = items.value.slice();
		say(
			'sortableList.grabbed',
			'Picked up. Position {0} of {1}. Use the arrow keys to move, Escape to cancel.',
			index + 1,
			length
		);
	} else {
		const order = working.value ?? props.modelValue;
		const to = activeIndex(order);
		const from = dragStart.value;
		const landed = to === -1 ? from : to;
		commit(order, from, to);
		say('sortableList.dropped', 'Dropped at position {0} of {1}.', landed + 1, length);
		reset();
		void refocus(landed);
	}
}

function cancelGrab() {
	const from = dragStart.value;
	say('sortableList.cancelled', 'Reorder cancelled.');
	// Como agarrado nunca emite, dejar el borrador en nulo devuelve la vista a
	// `modelValue`, que sigue en el orden original.
	reset();
	void refocus(from);
}

function onKeydown(index: number, event: KeyboardEvent) {
	if (props.disabled) return;
	const last = items.value.length - 1;
	switch (event.key) {
		case 'ArrowUp':
			event.preventDefault();
			moveTo(index, index - 1);
			break;
		case 'ArrowDown':
			event.preventDefault();
			moveTo(index, index + 1);
			break;
		case 'Home':
			event.preventDefault();
			moveTo(index, 0);
			break;
		case 'End':
			event.preventDefault();
			moveTo(index, last);
			break;
		case ' ':
		case 'Spacebar':
		case 'Enter':
			event.preventDefault();
			toggleGrab(index);
			break;
		case 'Escape':
			if (grabbed.value) {
				event.preventDefault();
				cancelGrab();
			}
			break;
	}
}

// --- Puntero -------------------------------------------------------------

function onPointerdown(index: number, event: PointerEvent) {
	if (props.disabled) return;
	// Con el ratón, sólo el botón primario; el dedo y el lápiz llegan con 0.
	if (event.pointerType === 'mouse' && event.button !== 0) return;

	const handle = event.currentTarget as HTMLElement;
	handle.setPointerCapture?.(event.pointerId);
	pointerId.value = event.pointerId;
	dragStart.value = index;
	activeKey.value = keyOf(items.value[index] as T, index);
	working.value = props.modelValue.slice();
	event.preventDefault();
}

function onPointermove(event: PointerEvent) {
	if (pointerId.value === null || event.pointerId !== pointerId.value || !working.value) return;

	const order = working.value;
	const current = activeIndex(order);
	if (current === -1) return;

	// El lugar nuevo es cuántas filas (sin contar la que se mueve) tienen su
	// mitad por encima del puntero: así cae donde está el dedo sin importar el
	// sentido del movimiento.
	let target = 0;
	for (let index = 0; index < order.length; index++) {
		if (index === current) continue;
		const el = rowEls.get(keyOf(order[index] as T, index));
		if (!el) continue;
		const rect = el.getBoundingClientRect();
		if (event.clientY > rect.top + rect.height / 2) target++;
	}

	if (target !== current) working.value = listMove(order, current, target);
}

function onPointerup() {
	if (pointerId.value === null || !working.value) {
		reset();
		return;
	}
	const order = working.value;
	const to = activeIndex(order);
	commit(order, dragStart.value, to);
	reset();
}

function onPointercancel() {
	reset();
}
</script>

<template>
  <div class="min-w-0">
    <ul :aria-label="label" role="list" class="flex min-w-0 flex-col gap-1">
      <li
        v-for="(item, index) in items"
        :key="keyOf(item, index)"
        :ref="(el) => registerRow(keyOf(item, index), el)"
        class="relative flex min-w-0 items-start gap-2 rounded-corner-m transition-colors duration-200 ease-ui"
        :class="rowClass(item, index)">
        <button
          v-if="!disabled"
          type="button"
          data-sortable-handle
          class="flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-corner-m text-tx-muted transition-colors duration-200 ease-ui hover:bg-ui-hover hover:text-tx-main active:cursor-grabbing active:bg-ui-pressed active:duration-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-focus"
          :aria-label="handleName"
          :aria-describedby="hintId"
          :aria-pressed="grabbed && isActive(item, index) ? 'true' : undefined"
          @keydown="onKeydown(index, $event)"
          @pointerdown="onPointerdown(index, $event)"
          @pointermove="onPointermove"
          @pointerup="onPointerup"
          @pointercancel="onPointercancel">
          <ThemeIcon :name="handleIcon" :fallbacks="handleFallbacks" type="symbol" :size="16" />
        </button>
        <div class="min-w-0 flex-1">
          <slot name="item" :item="item" :index="index" />
        </div>
      </li>
    </ul>
    <p :id="hintId" class="sr-only">{{ hint }}</p>
    <p role="status" aria-live="polite" class="sr-only">{{ announce }}</p>
  </div>
</template>
