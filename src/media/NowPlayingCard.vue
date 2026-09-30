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
 */
import { useI18n } from '@vasakgroup/tauri-plugin-i18n';
import { computed, useSlots } from 'vue';
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
const slots = useSlots();

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

const hasFooter = computed(() => Boolean(slots.footer));

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
	'flex h-10 w-10 items-center justify-center rounded-full text-tx-main transition-colors hover:bg-ui-surface/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent';
</script>

<template>
  <div class="flex w-full flex-col gap-3" data-now-playing>
    <div class="flex min-w-0 items-center gap-4">
      <SpinningCover
        class="w-24"
        :src="coverSrc"
        :alt="title"
        :state="state"
        :fallback-icon="fallbackIcon"
        @error="emit('coverError')" />

      <div class="flex min-w-0 flex-1 flex-col gap-1">
        <p class="line-clamp-2 text-base font-bold text-tx-main" :title="shownTitle" data-title>
          {{ shownTitle }}
        </p>
        <p v-if="artistLine" class="truncate text-sm text-tx-muted" :title="artist" data-artist>
          {{ artistLine }}
        </p>
        <p v-if="album" class="truncate text-xs text-tx-muted" :title="album" data-album>
          {{ album }}
        </p>
        <div v-if="$slots.details" class="mt-1 flex min-w-0 flex-wrap gap-1">
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
        class="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-tx-on-primary transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-default disabled:opacity-40 disabled:hover:scale-100 motion-reduce:transition-none"
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

    <div v-if="hasFooter" class="border-t border-ui-border pt-3" data-footer>
      <slot name="footer" />
    </div>
  </div>
</template>
