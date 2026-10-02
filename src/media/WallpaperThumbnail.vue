<script setup lang="ts">
/**
 * La miniatura de un fondo de pantalla: una imagen, o un video que se mueve
 * sólo cuando se lo pide.
 *
 * La usan el selector rápido del escritorio (dentro de `WallpaperCarousel`) y
 * la pantalla de fondos de Configuración, para que los dos lugares muestren los
 * fondos igual (vasak-desktop#133).
 *
 * # Quieta salvo que se pida
 *
 * `src` es la miniatura quieta —una copia chica, nunca el original de 4K: diez
 * de ésos decodificados son medio giga—. Con `video` y `playing`, encima va un
 * `<video>` mudo y en bucle con `videoSrc`. Cuando `playing` pasa a `false` el
 * elemento **se saca del DOM**, no se pausa: un video pausado sigue teniendo su
 * decodificador de GStreamer abierto, y lo que se quiere es que haya uno solo
 * andando a la vez. Quién se reproduce lo decide quien tiene la fila entera
 * (`previewId` en `carousel.ts`), no cada miniatura.
 *
 * `videoSrc` lo resuelve la aplicación: en WebKitGTK un `<video>` no puede leer
 * del protocolo de assets de Tauri (lo explica `DesktopView.vue` del
 * escritorio), así que el escritorio trae los bytes y pasa un `blob:`.
 *
 * # Marcas
 *
 * - Un video lleva ▶ chico arriba a la derecha, sobre `ui-overlay` —el velo que
 *   sostiene el texto encima de cualquier imagen—.
 * - `selected` es el fondo aplicado ahora: una marca de verificación en el
 *   primario, abajo a la izquierda. Las dos esquinas son las que una tarjeta
 *   inclinada hacia la derecha no recorta (ver `WallpaperCarousel`).
 *
 * Los dos son iconos del tema (`media-playback-start`, `object-select`) y
 * llevan nombre para un lector de pantalla en un texto oculto —no en el
 * `alt` del icono, que no existe mientras el tema no resolvió—, por propiedad,
 * con respaldo en el catálogo y después acá.
 *
 * # Tamaño
 *
 * Apaisada 16:9 al ancho que le den. Con `fill` ocupa la caja de quien la pone
 * —el carrusel la mete en una tarjeta inclinada—.
 */
import { computed, ref, watch } from 'vue';
import ThemeIcon from '../icons/ThemeIcon.vue';
import { useLabels } from '../shared/labels';

const props = withDefaults(
	defineProps<{
		/** La miniatura quieta. */
		src?: string | null;
		/** Qué fondo es, para quien no ve la imagen. */
		alt?: string;
		/** Si es un fondo en movimiento. */
		video?: boolean;
		/** De dónde se reproduce, cuando `playing`. */
		videoSrc?: string | null;
		/** Reproducirlo ahora. Sin `video` no hace nada. */
		playing?: boolean;
		/** Es el fondo aplicado. */
		selected?: boolean;
		/** Atenuar la imagen: lo usa el carrusel en las de los costados. */
		dimmed?: boolean;
		/** Ocupar la caja de quien la pone en lugar de ir a 16:9. */
		fill?: boolean;
		/** El nombre de la marca ▶. */
		videoLabel?: string;
		/** El nombre de la marca de aplicado. */
		selectedLabel?: string;
	}>(),
	{
		src: null,
		alt: '',
		video: false,
		videoSrc: null,
		playing: false,
		selected: false,
		dimmed: false,
		fill: false,
	}
);

const emit = defineEmits<{
	/** La miniatura no se pudo cargar. */
	error: [];
}>();

const translate = useLabels();
const videoText = computed(() => props.videoLabel ?? translate('wallpaper.video', 'Video wallpaper'));
const selectedText = computed(() => props.selectedLabel ?? translate('wallpaper.current', 'Current wallpaper'));

/** Sólo uno a la vez, y sólo mientras se pide: ver arriba. */
const showsVideo = computed(() => props.video && props.playing && Boolean(props.videoSrc));

/** El video aparece cuando tiene un cuadro, no antes: así no parpadea en negro. */
const videoReady = ref(false);
watch(showsVideo, () => {
	videoReady.value = false;
});

const broken = ref(false);
watch(
	() => props.src,
	() => {
		broken.value = false;
	}
);

function onError(): void {
	broken.value = true;
	emit('error');
}
</script>

<template>
  <div
    class="relative overflow-hidden bg-ui-surface"
    :class="fill ? 'h-full w-full' : 'aspect-video w-full rounded-corner-m border border-ui-line'"
    :data-video="video ? 'true' : undefined"
    :data-selected="selected ? 'true' : undefined"
    data-wallpaper-thumbnail>
    <img
      v-if="src && !broken"
      :src="src"
      :alt="alt"
      class="h-full w-full object-cover transition-opacity duration-300 ease-ui"
      :class="dimmed ? 'opacity-60' : 'opacity-100'"
      draggable="false"
      @error="onError" />
    <div
      v-else
      class="flex h-full w-full items-center justify-center text-tx-muted"
      :role="alt ? 'img' : undefined"
      :aria-label="alt || undefined"
      data-fallback>
      <ThemeIcon name="preferences-desktop-wallpaper" :fallbacks="['image-x-generic']" size="auto" class="h-1/3 w-1/3" />
    </div>
    <video
      v-if="showsVideo"
      :src="videoSrc ?? undefined"
      class="absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ease-ui"
      :class="videoReady ? 'opacity-100' : 'opacity-0'"
      muted
      loop
      autoplay
      playsinline
      disablePictureInPicture
      disableRemotePlayback
      preload="auto"
      data-preview
      @playing="videoReady = true"></video>
    <span
      v-if="video"
      class="absolute right-2 top-2 flex size-6 items-center justify-center rounded-corner-full bg-ui-overlay text-tx-main"
      data-video-badge>
      <ThemeIcon name="media-playback-start" type="symbol" :size="14" />
      <span class="sr-only">{{ videoText }}</span>
    </span>
    <span
      v-if="selected"
      class="absolute bottom-2 left-2 flex size-6 items-center justify-center rounded-corner-full bg-primary text-tx-on-primary"
      data-selected-badge>
      <ThemeIcon name="object-select" type="symbol" :size="14" />
      <span class="sr-only">{{ selectedText }}</span>
    </span>
    <slot />
  </div>
</template>
