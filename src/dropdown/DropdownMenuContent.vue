<script lang="ts" setup>
/**
 * El cuerpo del menú: el `role="menu"` y el teclado que lo recorre.
 *
 * Se teletransporta al `body` para que no lo recorte el `overflow` de la barra
 * que lo contiene, y se ubica a mano contra el rectángulo del disparador. Eso
 * lo saca del orden del documento, así que **todo** lo que lo ata a quien lo
 * abrió es ARIA: el `id` de acá es el `aria-controls` de allá.
 *
 * # El teclado
 *
 * Las flechas mueven el foco y dan la vuelta en los extremos; Inicio y Fin van
 * a las puntas; Escape cierra y devuelve el foco. El Tabulador **también**
 * cierra: el menú vive al final del `body`, así que dejar que el foco siga su
 * curso desde acá lo manda a cualquier parte de la página. Cerrando y
 * devolviendo el foco, el siguiente Tabulador sale de donde el usuario cree
 * que está parado.
 *
 * Los ítems se buscan en el DOM por su `role` en vez de llevar un registro:
 * un menú se arma con `v-for`, con `v-if` y con ítems que vienen de otro
 * componente, y el documento es el único que sabe cuáles hay y en qué orden.
 *
 * # Dónde entra
 *
 * `side` es una **preferencia**, no una orden: si por el lado pedido no entra y
 * por el de enfrente hay más lugar, el menú se da vuelta. Y lo que sobra
 * después de eso se corta con un techo calculado contra el espacio que queda de
 * verdad —no un número fijo, que se equivoca en los dos sentidos: de más contra
 * el borde de abajo, de menos cuando hay pantalla de sobra— y se desplaza
 * adentro.
 *
 * Sin esto, un menú más alto que la pantalla se cortaba en el borde y lo que
 * quedaba abajo era inalcanzable: no había barra de desplazamiento, y la rueda
 * tampoco hacía nada porque no había nada que desplazar.
 *
 * # La forma (vue-libvasak#74)
 *
 * El panel de un desplegable de Once UI: superficie flotante opaca
 * (`ui-float`), canto `ui-line`, `rounded-corner-l` alrededor de ítems
 * `rounded-corner-m` con `p-1` —las dos curvas concéntricas— y
 * `shadow-surface-m`. Sin `backdrop-blur`: lo de atrás se veía sin desenfocar,
 * que es lo peor de las dos cosas.
 *
 * Entra en 200 ms con `ease-ui-out`, de `scale(.96)` y transparente, **desde la
 * esquina que toca al disparador** según el lado que resultó —hoy crecía desde
 * el centro—, y sale en 150 ms. Sólo `opacity` y `scale`: se compone, no rehace
 * el maquetado. Once UI escala desde 0,9; en un menú de 300 px eso se lee como
 * un salto.
 *
 * Nunca más ancho que la ventana menos el aire de los dos lados: un ítem largo
 * se parte en dos líneas en vez de mandar medio menú afuera.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { computePlacement, MARGIN, type Placement, transformOriginFor } from '../shared/placement';
import { MENU_ITEM_SELECTOR, useMenu } from './types';

const props = withDefaults(
	defineProps<{
		side?: 'top' | 'bottom' | 'left' | 'right';
		align?: 'start' | 'center' | 'end';
		sideOffset?: number;
	}>(),
	{
		side: 'bottom',
		align: 'start',
		sideOffset: 4,
	}
);

defineOptions({ inheritAttrs: false });

const menu = useMenu();
const { menuId, labelId } = menu;
const trigger = computed(() => menu.trigger.value);
const open = computed(() => menu.open.value);

const content = ref<HTMLElement | null>(null);
/** Dónde va, hasta dónde puede crecer y de qué lado quedó. Sin techo mientras no haga falta. */
const position = ref<Placement>({
	top: 0,
	left: 0,
	ceiling: null,
	side: 'bottom',
});

/**
 * La esquina desde la que crece: la que toca al disparador. La cuenta vive en
 * `shared/placement.ts`, que comparte con `PopoverContent`.
 */
const transformOrigin = computed(() => transformOriginFor(position.value.side, props.align));

function computePosition() {
	if (!trigger.value || !content.value) return;

	position.value = computePlacement(
		trigger.value.getBoundingClientRect(),
		// `scrollHeight` y no el rectángulo: ver `computePlacement`.
		{ width: content.value.offsetWidth, height: content.value.scrollHeight },
		{ side: props.side, align: props.align, sideOffset: props.sideOffset },
		{ width: window.innerWidth, height: window.innerHeight }
	);
}

/** Los ítems que hay ahora mismo, en el orden en que se leen. */
function items(): HTMLElement[] {
	if (!content.value) return [];
	return Array.from(content.value.querySelectorAll<HTMLElement>(MENU_ITEM_SELECTOR));
}

/**
 * Enfoca por posición, dando la vuelta.
 *
 * Los índices negativos cuentan desde el final, así que `-1` es el último y no
 * hace falta pedirle la cantidad a nadie.
 */
function focusAt(index: number) {
	const list = items();
	if (!list.length) return;
	const count = list.length;
	list[((index % count) + count) % count]?.focus();
}

/** Dónde está el foco, o `-1` si está en el menú y no en un ítem. */
function focusedIndex(): number {
	const active = document.activeElement;
	return active instanceof HTMLElement ? items().indexOf(active) : -1;
}

function onKeydown(event: KeyboardEvent) {
	const current = focusedIndex();

	switch (event.key) {
		case 'ArrowDown':
			event.preventDefault();
			focusAt(current + 1);
			break;
		case 'ArrowUp':
			event.preventDefault();
			// Sin ítem enfocado la flecha de arriba entra por el final, que es
			// lo mismo que `-1` pide.
			focusAt(current <= 0 ? -1 : current - 1);
			break;
		case 'Home':
			event.preventDefault();
			focusAt(0);
			break;
		case 'End':
			event.preventDefault();
			focusAt(-1);
			break;
		case 'Escape':
			event.preventDefault();
			// Sin cortarlo acá, el Escape sigue subiendo hasta el oyente global
			// de la aplicación, que cierra además lo que haya detrás del menú.
			event.stopPropagation();
			menu.close({ returnFocus: true });
			break;
		case 'Tab':
			event.preventDefault();
			menu.close({ returnFocus: true });
			break;
	}
}

watch(open, async (isOpen) => {
	if (!isOpen) return;

	await nextTick();
	requestAnimationFrame(() => {
		computePosition();
	});

	switch (menu.focusOnOpen.value) {
		case 'first':
			focusAt(0);
			break;
		case 'last':
			focusAt(-1);
			break;
		// Abierto con el ratón: el foco va al menú y no a un ítem —no hay
		// ninguno elegido todavía—, que es lo que deja andar las flechas y el
		// Escape sin haber tocado nada.
		default:
			content.value?.focus();
	}
});

function recomputeIfOpen(event?: Event) {
	if (!open.value) return;
	// Desplazarse **adentro** del menú no lo mueve: el disparador sigue donde
	// estaba. El oyente de `scroll` es de captura y con el techo puesto el menú
	// pasó a ser él mismo un contenedor desplazable, así que ahora sus propios
	// desplazamientos también llegan hasta acá.
	if (event && content.value?.contains(event.target as Node)) return;
	computePosition();
}

function onOutsideClick(event: MouseEvent) {
	const target = event.target as HTMLElement;
	const inside = !!target.closest('[data-dropdown-content]');
	const onTrigger = !!trigger.value?.contains(target);

	if (!inside && !onTrigger) {
		// Sin devolver el foco: quien hizo clic afuera ya eligió dónde está
		// parado, y traérselo de vuelta al disparador es sacárselo de las manos.
		menu.close();
	}
}

onMounted(() => {
	document.addEventListener('click', onOutsideClick);
	window.addEventListener('resize', recomputeIfOpen);
	window.addEventListener('scroll', recomputeIfOpen, true);
});

onBeforeUnmount(() => {
	document.removeEventListener('click', onOutsideClick);
	window.removeEventListener('resize', recomputeIfOpen);
	window.removeEventListener('scroll', recomputeIfOpen, true);
});
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-[opacity,scale] duration-200 ease-ui-out"
      leave-active-class="transition-[opacity,scale] duration-150 ease-ui"
      enter-from-class="opacity-0 scale-96"
      leave-to-class="opacity-0 scale-96"
      @enter="(el) => (el as HTMLElement).offsetHeight"
      @leave="(el) => (el as HTMLElement).offsetHeight">
      <div
        v-show="open"
        ref="content"
        v-bind="$attrs"
        :id="menuId"
        role="menu"
        tabindex="-1"
        aria-orientation="vertical"
        :aria-labelledby="labelId ?? undefined"
        :inert="!open"
        :style="{
          position: 'fixed',
          top: `${position.top}px`,
          left: `${position.left}px`,
          maxHeight: position.ceiling === null ? undefined : `${position.ceiling}px`,
          maxWidth: `calc(100vw - ${2 * MARGIN}px)`,
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          transformOrigin,
          zIndex: 50,
        }"
        data-dropdown-content
        class="min-w-30 rounded-corner-l border border-ui-line bg-ui-float text-tx-main shadow-surface-m focus:outline-none"
        @click="(e) => e.stopPropagation()"
        @keydown="onKeydown">
        <div role="none" class="flex flex-col p-1">
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
