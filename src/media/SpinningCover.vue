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
 * otra. Desde la 2.2.0 eso lo hace `CoverArt`, que es la carátula de la
 * librería; este componente le suma el giro, el agujero, el aro y el botón.
 *
 * El tamaño lo decide quien lo pone, con las clases de siempre (`class="w-24"`);
 * el disco es cuadrado y ocupa el ancho que le den.
 *
 * # El aro de progreso (2.2.0)
 *
 * `progress` (0–100) dibuja cuánto va del tema en un aro alrededor del disco:
 * es el control de música de la bandeja del escritorio (`TrayMusicControl`).
 * Sin SVG —los dibujos de la librería salen del tema o del CSS—: un
 * `conic-gradient` del primario sobre el canto, recortado en anillo con una
 * máscara. Sin `progress` no hay aro y el disco ocupa lo de siempre: la
 * pantalla que no lo pide no cambia.
 *
 * # Botón (2.2.0)
 *
 * Con `interactive` el disco es un `<button>` con nombre (`label`, obligatorio
 * para eso: un disco no tiene texto que leer) y emite `click`. Es lo que hace
 * el control de la bandeja: tocar la carátula abre el reproductor.
 *
 * La forma (vue-libvasak#74): el canto en `ui-line`, y el agujero en la
 * superficie y no en el fondo de la ventana —el disco puede estar sobre una
 * tarjeta—. El círculo es `rounded-corner-full`: con el radio del usuario en
 * cero, el disco también es cuadrado, como el resto del escritorio.
 */
import { computed } from 'vue';
import { useLabels } from '../shared/labels';
import CoverArt from './CoverArt.vue';
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
		/** Cuánto va del tema, de 0 a 100. Sin esto no hay aro. */
		progress?: number | null;
		/** Cómo se llama el aro para un lector de pantalla. */
		progressLabel?: string;
		/** El disco es un botón. */
		interactive?: boolean;
		/** El nombre del botón, cuando es un botón. */
		label?: string;
	}>(),
	{
		src: null,
		alt: '',
		state: 'stopped',
		fallbackIcon: 'applications-multimedia',
		period: 8,
		progress: null,
		interactive: false,
	}
);

const emit = defineEmits<{
	/** La carátula no se pudo cargar. */
	error: [];
	/** Se tocó el disco, con `interactive`. */
	click: [];
}>();

const translate = useLabels();

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

const hasProgress = computed(() => typeof props.progress === 'number' && Number.isFinite(props.progress));
const percent = computed(() => Math.min(Math.max(props.progress ?? 0, 0), 100));
const progressText = computed(() => props.progressLabel ?? translate('media.progress', 'Progress'));

/**
 * El nombre del botón. Lo de adentro de un `<button>` no se anuncia aparte
 * —el aro dejaría de ser una barra de progreso para un lector de pantalla—,
 * así que con `interactive` el avance se suma al nombre y el aro se calla.
 */
const buttonName = computed(() =>
	hasProgress.value
		? [props.label, progressText.value, `${Math.round(percent.value)} %`].filter(Boolean).join(', ')
		: props.label
);

/**
 * El aro: el primario hasta donde va y el canto el resto, recortado en un
 * anillo de 3 px. La máscara usa `currentColor` porque sólo importa su opacidad.
 */
const ringStyle = computed(() => {
	const ring = 'radial-gradient(farthest-side, transparent calc(100% - 3px), currentColor calc(100% - 3px))';
	return {
		background: `conic-gradient(var(--color-primary) ${percent.value}%, var(--color-ui-line) 0)`,
		mask: ring,
		WebkitMask: ring,
	};
});
</script>

<template>
  <component
    :is="interactive ? 'button' : 'div'"
    v-bind="interactive ? { type: 'button', 'aria-label': buttonName } : {}"
    class="relative aspect-square shrink-0 rounded-corner-full"
    :class="[
      hasProgress ? 'p-1' : '',
      interactive
        ? 'cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-focus'
        : '',
    ]"
    @click="interactive && emit('click')">
    <span
      v-if="hasProgress"
      v-bind="
        interactive
          ? { 'aria-hidden': 'true' }
          : {
              role: 'progressbar',
              'aria-valuemin': 0,
              'aria-valuemax': 100,
              'aria-valuenow': Math.round(percent),
              'aria-label': progressText,
            }
      "
      class="absolute inset-0 rounded-corner-full"
      :style="ringStyle"
      data-progress-ring />
    <CoverArt
      :src="src"
      :alt="alt"
      :fallback-icon="fallbackIcon"
      shape="round"
      class="relative"
      :class="{ 'animate-spin motion-reduce:animate-none': spins }"
      :style="spinStyle"
      v-bind="{ 'data-state': state, 'data-spinning-cover': '' }"
      @error="emit('error')">
      <!-- El agujero del disco, con el mismo borde que el canto. -->
      <div
        class="pointer-events-none absolute left-1/2 top-1/2 h-[14%] w-[14%] -translate-x-1/2 -translate-y-1/2 rounded-corner-full border border-ui-line bg-ui-surface"
        aria-hidden="true"></div>
    </CoverArt>
  </component>
</template>
