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
 */
import { computed, nextTick, ref, useAttrs, watch } from 'vue';
import { usarElTooltip } from './tipos';

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
const atributos = useAttrs();
const claseDeQuienLoUsa = computed(() => (atributos.class as string | undefined) ?? '');

const props = withDefaults(
	defineProps<{
		side?: 'top' | 'bottom' | 'left' | 'right';
		align?: 'start' | 'center' | 'end';
		sideOffset?: number;
	}>(),
	{ side: 'bottom', align: 'center', sideOffset: 4 }
);

const tooltip = usarElTooltip();
const abierto = computed(() => tooltip.abierto.value);
const globo = ref<HTMLElement | null>(null);
const posicion = ref({ top: 0, left: 0 });

function ubicar() {
	const disparador = tooltip.disparador.value;
	if (!disparador || !globo.value) return;

	const desde = disparador.getBoundingClientRect();
	const suyo = globo.value.getBoundingClientRect();

	let top = 0;
	let left = 0;
	switch (props.side) {
		case 'bottom':
			top = desde.bottom + props.sideOffset;
			left = desde.left + desde.width / 2 - suyo.width / 2;
			break;
		case 'top':
			top = desde.top - suyo.height - props.sideOffset;
			left = desde.left + desde.width / 2 - suyo.width / 2;
			break;
		case 'left':
			left = desde.left - suyo.width - props.sideOffset;
			top = desde.top + desde.height / 2 - suyo.height / 2;
			break;
		case 'right':
			left = desde.right + props.sideOffset;
			top = desde.top + desde.height / 2 - suyo.height / 2;
			break;
	}
	posicion.value = { top, left };
}

watch(abierto, async (seAbrio) => {
	if (!seAbrio) return;
	await nextTick();
	requestAnimationFrame(ubicar);
});
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-200 ease-in-out"
      leave-active-class="transition-all duration-200 ease-in-out"
      enter-from-class="opacity-0 scale-95"
      leave-to-class="opacity-0 scale-95">
      <div
        v-show="abierto"
        ref="globo"
        :style="{ position: 'fixed', top: `${posicion.top}px`, left: `${posicion.left}px`, zIndex: 50 }"
        :class="[
          claseDeQuienLoUsa,
          'pointer-events-none rounded-corner border border-secondary bg-ui-bg/80 px-2 py-1 text-sm shadow-md',
        ]">
        <slot />
      </div>
    </Transition>
  </Teleport>
</template>
