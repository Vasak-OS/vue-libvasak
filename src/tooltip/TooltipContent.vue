<script setup lang="ts">
/**
 * El globo, que se teletransporta al `body`.
 *
 * Va ahí y no al lado del disparador porque dentro de una barra con
 * `overflow: hidden` —o de cualquier lista que recorte— un tooltip absoluto se
 * corta justo cuando hace falta leerlo. Teletransportado se posiciona `fixed`
 * contra las coordenadas del disparador, que es lo que lo deja salir de todo.
 *
 * Mide después de pintar: la posición depende del ancho del propio globo, y
 * antes de que exista en el DOM ese ancho es cero. De ahí el `nextTick` y el
 * cuadro de espera.
 *
 * # La forma (vue-libvasak#74)
 *
 * El globo de Once UI: superficie flotante opaca, canto `ui-line`,
 * `rounded-corner-s`, `text-body-xs` y `shadow-surface-s`. Hoy llevaba el borde
 * del color secundario y `text-sm`, que en un globo de tres palabras grita. Entra
 * en 150 ms sólo con opacidad y dos píxeles de desplazamiento **desde el
 * disparador**, y sale igual: una escala en algo tan chico se lee como un
 * parpadeo. Nunca más ancho que la ventana: un texto largo se parte.
 */
import { computed, nextTick, ref, useAttrs, watch } from 'vue';
import { useTooltip } from './types';

/**
 * La clase que pasa quien lo usa, a mano.
 *
 * Vue **no** mete `class` en `props` aunque se declare: se queda en `attrs` y
 * cae sola al nodo raíz. Acá la raíz es un `Teleport`, que no es un elemento,
 * así que caería en la nada. De ahí el `inheritAttrs: false` y leerla del
 * `attrs`: es lo que deja pasarle `flex flex-col gap-1` a un tooltip de más de
 * una línea, que es lo que una de las dos copias había perdido.
 */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
const callerClass = computed(() => (attrs.class as string | undefined) ?? '');

const props = withDefaults(
	defineProps<{
		side?: 'top' | 'bottom' | 'left' | 'right';
		align?: 'start' | 'center' | 'end';
		sideOffset?: number;
	}>(),
	{ side: 'bottom', align: 'center', sideOffset: 4 }
);

const tooltip = useTooltip();
const open = computed(() => tooltip.open.value);
const bubble = ref<HTMLElement | null>(null);
const position = ref({ top: 0, left: 0 });

/** De dónde llega: dos píxeles del lado del disparador. */
const OFFSET_FROM: Record<'top' | 'bottom' | 'left' | 'right', string> = {
	bottom: '-translate-y-0.5',
	top: 'translate-y-0.5',
	right: '-translate-x-0.5',
	left: 'translate-x-0.5',
};
const hiddenClass = computed(() => `opacity-0 ${OFFSET_FROM[props.side]}`);

function place() {
	const trigger = tooltip.trigger.value;
	if (!trigger || !bubble.value) return;

	const from = trigger.getBoundingClientRect();
	const own = bubble.value.getBoundingClientRect();

	let top = 0;
	let left = 0;
	switch (props.side) {
		case 'bottom':
			top = from.bottom + props.sideOffset;
			left = from.left + from.width / 2 - own.width / 2;
			break;
		case 'top':
			top = from.top - own.height - props.sideOffset;
			left = from.left + from.width / 2 - own.width / 2;
			break;
		case 'left':
			left = from.left - own.width - props.sideOffset;
			top = from.top + from.height / 2 - own.height / 2;
			break;
		case 'right':
			left = from.right + props.sideOffset;
			top = from.top + from.height / 2 - own.height / 2;
			break;
	}
	// Que no se salga de la ventana: un botón pegado al borde centraba medio
	// globo afuera, donde no se puede leer.
	const margin = 8;
	left = Math.min(Math.max(left, margin), Math.max(margin, window.innerWidth - own.width - margin));
	top = Math.min(Math.max(top, margin), Math.max(margin, window.innerHeight - own.height - margin));
	position.value = { top, left };
}

watch(open, async (isOpen) => {
	if (!isOpen) return;
	await nextTick();
	requestAnimationFrame(place);
});
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-[opacity,translate] duration-150 ease-ui-out"
      leave-active-class="transition-[opacity,translate] duration-150 ease-ui"
      :enter-from-class="hiddenClass"
      :leave-to-class="hiddenClass">
      <div
        v-show="open"
        ref="bubble"
        :style="{
          position: 'fixed',
          top: `${position.top}px`,
          left: `${position.left}px`,
          maxWidth: 'calc(100vw - 16px)',
          zIndex: 50,
        }"
        :class="[
          callerClass,
          'pointer-events-none rounded-corner-s border border-ui-line bg-ui-float px-2 py-1 text-body-xs text-tx-main shadow-surface-s',
        ]">
        <slot />
      </div>
    </Transition>
  </Teleport>
</template>
