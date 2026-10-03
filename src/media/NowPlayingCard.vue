<script setup lang="ts">
/**
 * Qué suena: el disco, los datos de la pista, la barra y el transporte.
 *
 * Es la tarjeta del reproductor desplegable del panel, armada con
 * `SpinningCover` y `SeekBar` para que las tres piezas se puedan usar sueltas:
 * el widget de música del escritorio usa sólo la barra, y el mini-reproductor
 * de Resonance ya tiene su propia disposición y puede tomar el disco.
 *
 * No sabe nada de MPRIS ni de ningún reproductor: recibe lo que hay que dibujar
 * y emite lo que se tocó. Quién escucha y a quién se lo manda es de la
 * aplicación.
 *
 * # Lo que no se puede hacer se ve apagado, no desaparece
 *
 * Con un vídeo de YouTube el navegador contesta que no hay anterior ni
 * siguiente. Si los botones desaparecieran, el de reproducir se correría de
 * lugar según la fuente, y la mano lo buscaría donde ya no está. Apagados
 * (`disabled`) se quedan quietos, no emiten y dicen por qué con su estado.
 *
 * # Lo que pone cada aplicación
 *
 * - `details`: los chips debajo del artista —la salida de audio, la aplicación
 *   de origen—. Son de la aplicación porque cambiar de salida es suyo.
 * - `footer`: lo que va debajo del transporte, separado por una línea. Es el
 *   lugar del ecualizador. **Sin contenido no se dibuja**, ni la línea: una
 *   tarjeta con un espacio reservado vacío dice que falta algo.
 *
 * # Los textos
 *
 * Por propiedad, traducidos por la aplicación; sin pasarlos salen de su
 * catálogo (`media.previous`, `media.play`, `media.pause`, `media.next`,
 * `media.seek`, `media.byArtist`, `media.nothingPlaying`). `media.byArtist`
 * lleva `{0}` donde va el artista; si la aplicación no la tiene, se muestra el
 * artista solo en lugar de la clave cruda.
 *
 * # Angosta, una columna (2.10.1)
 *
 * La tarjeta mira su propio ancho (`@container`). Desde 20 rem (`@xs`) es la
 * de siempre: el disco a la izquierda y los datos al lado. Por debajo, el
 * disco va arriba y más chico, y los datos debajo, centrados y cortados con
 * puntos suspensivos si no entran (la columna se estira al ancho, no al
 * texto: un renglón centrado más ancho que la tarjeta se cortaba de los dos
 * lados sin aviso). A 240 px con el
 * disco al costado al título le quedaban seis letras y los chips de `details`
 * se aplastaban hasta no decir nada.
 *
 * La forma (vue-libvasak#74): título en `text-heading-xs` peso 600 —nada en
 * 700—, los botones laterales sin borde con el velo `ui-hover` y el de
 * reproducir con el relleno del primario, que es lo que actúa. Nada escala al
 * pasar por encima.
 */
import { useI18n } from '@vasakgroup/tauri-plugin-i18n';
import { computed } from 'vue';
import ThemeIcon from '../icons/ThemeIcon.vue';
import type { PlaybackState } from './playback';
import SeekBar from './SeekBar.vue';
import SpinningCover from './SpinningCover.vue';

const props = withDefaults(
	defineProps<{
		title?: string;
		artist?: string;
		album?: string;
		coverSrc?: string | null;
		/** El icono del disco cuando no hay carátula. */
		fallbackIcon?: string;
		state?: PlaybackState;
		/** Posición y duración, en la unidad que entienda `format`. */
		position?: number;
		duration?: number;
		format?: (value: number) => string;
		/** Cuánto avanza la barra con el teclado. */
		seekStep?: number;
		canSeek?: boolean;
		canGoPrevious?: boolean;
		canGoNext?: boolean;
		/** Si el reproductor acepta reproducir o pausar. */
		canPlayPause?: boolean;
		previousLabel?: string;
		nextLabel?: string;
		playLabel?: string;
		pauseLabel?: string;
		seekLabel?: string;
		/** «de {0}»: la línea del artista, con `{0}` donde va el nombre. */
		byArtistLabel?: string;
		/** El título cuando no suena nada. */
		nothingPlayingLabel?: string;
	}>(),
	{
		title: '',
		artist: '',
		album: '',
		coverSrc: null,
		fallbackIcon: 'applications-multimedia',
		state: 'stopped',
		position: 0,
		duration: 0,
		canSeek: false,
		canGoPrevious: false,
		canGoNext: false,
		canPlayPause: true,
	}
);

const emit = defineEmits<{
	previous: [];
	next: [];
	/** Reproducir o pausar, según el estado. */
	toggle: [];
	/** A dónde saltar, en la unidad de `position`. */
	seek: [value: number];
	/** La carátula no cargó. */
	coverError: [];
}>();

const { t } = useI18n();

const playing = computed(() => props.state === 'playing');

const labels = computed(() => ({
	previous: props.previousLabel ?? t('media.previous'),
	next: props.nextLabel ?? t('media.next'),
	toggle: playing.value
		? (props.pauseLabel ?? t('media.pause'))
		: (props.playLabel ?? t('media.play')),
}));

const shownTitle = computed(
	() => props.title || (props.nothingPlayingLabel ?? t('media.nothingPlaying'))
);

/**
 * «de Artista», o el artista solo.
 *
 * `t()` devuelve la clave cruda cuando no la tiene; una clave sin `{0}` no
 * sabe dónde poner el nombre, así que ahí va el nombre solo. Con la forma de
 * función en el reemplazo: un artista que se llame «AC/DC $&» no se
 * interpreta como patrón.
 */
const artistLine = computed(() => {
	if (!props.artist) return '';
	const template = props.byArtistLabel ?? t('media.byArtist');
	if (!template.includes('{0}')) return props.artist;
	return template.replace('{0}', () => props.artist);
});

function previous(): void {
	if (props.canGoPrevious) emit('previous');
}

function next(): void {
	if (props.canGoNext) emit('next');
}

function toggle(): void {
	if (props.canPlayPause) emit('toggle');
}

const SIDE_BUTTON =
	'flex size-10 items-center justify-center rounded-corner-full text-tx-main transition-colors duration-200 ease-ui hover:bg-ui-hover active:bg-ui-pressed active:duration-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-focus disabled:cursor-default disabled:opacity-50 disabled:hover:bg-transparent';
</script>

<template>
  <div class="@container flex w-full flex-col gap-3" data-now-playing>
    <div class="flex min-w-0 flex-col items-center gap-3 @xs:flex-row @xs:gap-4" data-now-playing-head>
      <SpinningCover
        class="w-20 @xs:w-24"
        :src="coverSrc"
        :alt="title"
        :state="state"
        :fallback-icon="fallbackIcon"
        @error="emit('coverError')" />

      <div class="flex w-full min-w-0 flex-1 flex-col gap-1 text-center @xs:w-auto @xs:text-left" data-now-playing-text>
        <p class="line-clamp-2 font-semibold text-heading-xs text-tx-main" :title="shownTitle" data-title>
          {{ shownTitle }}
        </p>
        <p v-if="artistLine" class="truncate text-body-s text-tx-muted" :title="artist" data-artist>
          {{ artistLine }}
        </p>
        <p v-if="album" class="truncate text-body-xs text-tx-muted" :title="album" data-album>
          {{ album }}
        </p>
        <div v-if="$slots.details" class="mt-1 flex w-full min-w-0 flex-wrap justify-center gap-1 @xs:justify-start">
          <slot name="details" />
        </div>
      </div>
    </div>

    <SeekBar
      :position="position"
      :duration="duration"
      :seekable="canSeek"
      :label="seekLabel"
      :format="format"
      :step="seekStep"
      @seek="emit('seek', $event)" />

    <div class="flex items-center justify-center gap-4">
      <button
        type="button"
        :class="SIDE_BUTTON"
        :disabled="!canGoPrevious"
        :title="labels.previous"
        :aria-label="labels.previous"
        data-previous
        @click="previous">
        <ThemeIcon name="media-skip-backward" type="symbol" :size="22" />
      </button>

      <button
        type="button"
        class="flex size-12 items-center justify-center rounded-corner-full bg-primary text-tx-on-primary transition-colors duration-200 ease-ui hover:bg-primary/90 active:bg-primary/80 active:duration-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-focus disabled:cursor-default disabled:opacity-50"
        :disabled="!canPlayPause"
        :title="labels.toggle"
        :aria-label="labels.toggle"
        data-toggle
        @click="toggle">
        <ThemeIcon
          :name="playing ? 'media-playback-pause' : 'media-playback-start'"
          type="symbol"
          :size="24" />
      </button>

      <button
        type="button"
        :class="SIDE_BUTTON"
        :disabled="!canGoNext"
        :title="labels.next"
        :aria-label="labels.next"
        data-next
        @click="next">
        <ThemeIcon name="media-skip-forward" type="symbol" :size="22" />
      </button>
    </div>

    <!-- `$slots` en la plantilla y no en un `computed`: el objeto de
         `useSlots()` no es reactivo, y un ecualizador que aparece después del
         montaje no se dibujaría nunca. -->
    <div v-if="$slots.footer" class="border-t border-ui-line-weak pt-3" data-footer>
      <slot name="footer" />
    </div>
  </div>
</template>
