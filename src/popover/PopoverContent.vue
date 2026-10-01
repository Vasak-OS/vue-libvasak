<script lang="ts" setup>
/**
 * El cuerpo del globo: un `dialog` no modal que cuelga del ancla.
 *
 * Se teletransporta al `body` para que no lo recorte el `overflow` de quien lo
 * contiene, y se ubica con la misma cuenta que el menú (`shared/placement.ts`):
 * `side` es una preferencia, se da vuelta si del otro lado hay más lugar, se
 * topa contra la ventana y desplaza adentro, nunca se va por el costado.
 *
 * # El foco
 *
 * Al abrir va al primer control de adentro (o al globo mismo si no hay
 * ninguno). Escape cierra y devuelve el foco a quien lo abrió; un clic afuera
 * cierra sin devolverlo —quien hizo clic ya eligió dónde está—.
 *
 * Con `trapFocus` el Tabulador da la vuelta adentro, para un formulario que
 * hay que terminar o cancelar. Sin él, salir por el último (o volver por el
 * primero) **cierra** y devuelve el foco al disparador: el globo vive al final
 * del `body`, y dejar que el foco siga su curso desde acá lo manda a cualquier
 * parte de la página.
 *
 * # Dónde se vuelve a ubicar
 *
 * Al abrir, al desplazar cualquier cosa y cuando cambia de tamaño la página o
 * el propio globo. Lo último va por `ResizeObserver` y no por `resize`, que en
 * WebKitGTK no llega.
 *
 * # La forma
 *
 * La de un desplegable de Once UI: `ui-float` opaco, canto `ui-line`,
 * `rounded-corner-l`, `shadow-surface-m`; entra en 200 ms desde la esquina que
 * toca al ancla y sale en 150. Sin `backdrop-blur`.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { computePlacement, MARGIN, type Placement, transformOriginFor } from '../shared/placement';
import { FOCUSABLE, usePopover } from './types';

const props = withDefaults(
	defineProps<{
		side?: 'top' | 'bottom' | 'left' | 'right';
		align?: 'start' | 'center' | 'end';
		sideOffset?: number;
		trapFocus?: boolean;
		padding?: 'none' | 'sm' | 'md';
		/** El nombre del globo para un lector de pantalla, si no tiene título. */
		label?: string;
	}>(),
	{ side: 'bottom', align: 'start', sideOffset: 4, trapFocus: false, padding: 'md' }
);

defineOptions({ inheritAttrs: false });

const popover = usePopover();
const open = computed(() => popover.open.value);
const anchor = computed(() => popover.anchor.value ?? popover.trigger.value);

const content = ref<HTMLElement | null>(null);
const position = ref<Placement>({ top: 0, left: 0, ceiling: null, side: 'bottom' });
const transformOrigin = computed(() => transformOriginFor(position.value.side, props.align));

const PADDING = { none: '', sm: 'p-2', md: 'p-3' } as const;

function computePosition() {
	if (!anchor.value || !content.value) return;
	position.value = computePlacement(
		anchor.value.getBoundingClientRect(),
		{ width: content.value.offsetWidth, height: content.value.scrollHeight },
		{ side: props.side, align: props.align, sideOffset: props.sideOffset },
		{ width: window.innerWidth, height: window.innerHeight }
	);
}

function focusables(): HTMLElement[] {
	if (!content.value) return [];
	return Array.from(content.value.querySelectorAll<HTMLElement>(FOCUSABLE));
}

function onKeydown(event: KeyboardEvent) {
	if (event.key === 'Escape') {
		event.preventDefault();
		// Que no llegue al oyente global de la aplicación, que cerraría además
		// lo que haya detrás.
		event.stopPropagation();
		popover.close({ returnFocus: true });
		return;
	}
	if (event.key !== 'Tab') return;

	const list = focusables();
	const first = list[0];
	const last = list[list.length - 1];
	const active = document.activeElement;
	const leaving = event.shiftKey ? !first || active === first || active === content.value : !last || active === last;
	if (!leaving) return;

	event.preventDefault();
	if (props.trapFocus) {
		(event.shiftKey ? last : first)?.focus();
		return;
	}
	popover.close({ returnFocus: true });
}

function onOutsideClick(event: MouseEvent) {
	if (!open.value) return;
	const target = event.target as Node;
	if (content.value?.contains(target)) return;
	if (popover.trigger.value?.contains(target)) return;
	if (popover.anchor.value?.contains(target)) return;
	popover.close();
}

function recomputeIfOpen(event?: Event) {
	if (!open.value) return;
	if (event && content.value?.contains(event.target as Node)) return;
	computePosition();
}

let observer: ResizeObserver | null = null;

watch(open, async (isOpen) => {
	if (!isOpen) return;
	await nextTick();
	computePosition();
	requestAnimationFrame(() => computePosition());
	(focusables()[0] ?? content.value)?.focus();
});

watch(content, (element, previous) => {
	if (previous) observer?.unobserve(previous);
	if (element) observer?.observe(element);
});

onMounted(() => {
	document.addEventListener('click', onOutsideClick);
	window.addEventListener('scroll', recomputeIfOpen, true);
	if (typeof ResizeObserver !== 'undefined') {
		observer = new ResizeObserver(() => recomputeIfOpen());
		observer.observe(document.documentElement);
		if (content.value) observer.observe(content.value);
	}
});

onBeforeUnmount(() => {
	document.removeEventListener('click', onOutsideClick);
	window.removeEventListener('scroll', recomputeIfOpen, true);
	observer?.disconnect();
	observer = null;
});
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-[opacity,scale] duration-200 ease-ui-out"
      leave-active-class="transition-[opacity,scale] duration-150 ease-ui"
      enter-from-class="opacity-0 scale-96"
      leave-to-class="opacity-0 scale-96">
      <div
        v-show="open"
        ref="content"
        v-bind="$attrs"
        :id="popover.contentId"
        role="dialog"
        aria-modal="false"
        :aria-label="label"
        tabindex="-1"
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
        data-popover-content
        class="min-w-0 rounded-corner-l border border-ui-line bg-ui-float text-tx-main shadow-surface-m focus:outline-none"
        :class="PADDING[padding]"
        @keydown="onKeydown">
        <slot />
      </div>
    </Transition>
  </Teleport>
</template>
