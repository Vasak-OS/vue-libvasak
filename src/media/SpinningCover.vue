<script setup lang="ts">
/**
 * La carátula como la etiqueta de un vinilo: recortada en círculo, con el
 * agujero al centro, girando mientras suena.
 *
 * # Detenerse sin saltar
 *
 * Al pausar, el disco se queda **donde estaba**. Sacar la animación lo haría
 * volver de golpe a cero —es lo que pasaba con el `animate-spin` del control
 * del panel, que se ponía y se sacaba con `isPlaying`—; lo que se hace es dejarla
 * puesta y congelarla con `animation-play-state`. Sólo sin reproducción
 * (`stopped`) se saca, porque ahí no hay un ángulo que valga la pena conservar.
 *
 * # Menos movimiento
 *
 * Con `prefers-reduced-motion` el disco no gira. Quien pidió que el escritorio
 * no se mueva no pidió una excepción para la música. Lo resuelve el CSS al
 * dibujar: en WebKitGTK `matchMedia` no avisa de los cambios, pero la regla sí
 * se aplica.
 *
 * # Sin carátula
 *
 * El icono de la aplicación sobre la superficie, del tema del sistema. Una
 * carátula que no carga —un `blob:` ya soltado, un archivo que se borró— cae
 * ahí mismo y además se avisa con `error`, para que quien la dio pueda buscar
 * otra.
 *
 * El tamaño lo decide quien lo pone, con las clases de siempre (`class="w-24"`);
 * el disco es cuadrado y ocupa el ancho que le den.
 */
import { computed, ref, watch } from 'vue';
import ThemeIcon from '../icons/ThemeIcon.vue';
import type { PlaybackState } from './playback';

const props = withDefaults(
	defineProps<{
		/** La carátula. Vacía o sin pasar, el icono. */
		src?: string | null;
		/** Qué suena, para quien no ve la carátula. */
		alt?: string;
		state?: PlaybackState;
		/** El icono del tema que va cuando no hay carátula. */
		fallbackIcon?: string;
		/** Cuánto tarda una vuelta, en segundos. */
		period?: number;
	}>(),
	{
		src: null,
		alt: '',
		state: 'stopped',
		fallbackIcon: 'applications-multimedia',
		period: 8,
	}
);

const emit = defineEmits<{
	/** La carátula no se pudo cargar. */
	error: [];
}>();

/** La carátula que no cargó. Otra carátula vuelve a intentarlo. */
const broken = ref(false);
watch(
	() => props.src,
	() => {
		broken.value = false;
	}
);

const hasCover = computed(() => Boolean(props.src) && !broken.value);

/** La animación se queda puesta salvo sin reproducción; ver arriba. */
const spins = computed(() => props.state !== 'stopped');

const spinStyle = computed(() =>
	spins.value
		? {
				animationDuration: `${props.period}s`,
				animationPlayState: props.state === 'playing' ? 'running' : 'paused',
			}
		: {}
);

function onError(): void {
	broken.value = true;
	emit('error');
}
</script>

<template>
  <div
    class="relative aspect-square shrink-0 overflow-hidden rounded-full border border-ui-border bg-ui-surface"
    :class="{ 'animate-spin motion-reduce:animate-none': spins }"
    :style="spinStyle"
    :data-state="state"
    data-spinning-cover>
    <img
      v-if="hasCover"
      :src="src ?? undefined"
      :alt="alt"
      class="h-full w-full object-cover"
      draggable="false"
      @error="onError" />
    <div v-else class="flex h-full w-full items-center justify-center" data-fallback>
      <ThemeIcon :name="fallbackIcon" size="auto" :alt="alt" class="h-1/2 w-1/2" />
    </div>

    <!-- El agujero del disco, con el mismo borde que el canto. -->
    <div
      class="pointer-events-none absolute left-1/2 top-1/2 h-[14%] w-[14%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-ui-border bg-ui-bg"
      aria-hidden="true"></div>
  </div>
</template>
