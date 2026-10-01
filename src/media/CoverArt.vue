<script setup lang="ts">
/**
 * La carátula de un disco, una radio, un artista: la imagen, o algo en su
 * lugar.
 *
 * Unas siete copias en dos aplicaciones: resonance (la ficha del tema, los
 * álbumes, los artistas, los favoritos, las radios) y el `MusicWidget` del
 * escritorio, que no se migra porque se mide en unidades de contenedor.
 * `SpinningCover` la usa por dentro.
 *
 * # Siempre algo
 *
 * Sin imagen, o con una que no carga, `fallbackText` (las iniciales de una
 * radio, la letra de un artista) o, si no hay, el icono del tema
 * `fallbackIcon`. La que no cargó avisa con `error`, para que quien la dio
 * pueda buscar otra, y una dirección nueva se vuelve a intentar.
 *
 * # Tamaño
 *
 * `size` en `sm`/`md`/`lg`/`xl` (40, 64, 96, 160) o `fill`, que ocupa el ancho
 * que le den —el de siempre de `SpinningCover`—. Siempre cuadrada: una foto
 * apaisada se recorta (`object-cover`), no deforma la fila.
 *
 * `shape="round"` es el disco; `square` lleva el radio del sistema.
 */
import { computed, ref, watch } from 'vue';
import ThemeIcon from '../icons/ThemeIcon.vue';

export type CoverArtSize = 'sm' | 'md' | 'lg' | 'xl' | 'fill';

const props = withDefaults(
	defineProps<{
		src?: string | null;
		/** Qué es, para quien no ve la imagen. Vacío si el texto de al lado ya lo dice. */
		alt?: string;
		fallbackIcon?: string;
		/** Un texto corto en lugar del icono: unas iniciales, una letra. */
		fallbackText?: string;
		size?: CoverArtSize;
		shape?: 'square' | 'round';
	}>(),
	{ src: null, alt: '', fallbackIcon: 'audio-x-generic', fallbackText: '', size: 'fill', shape: 'square' }
);

const emit = defineEmits<{
	/** La imagen no se pudo cargar. */
	error: [];
}>();

const broken = ref(false);
watch(
	() => props.src,
	() => {
		broken.value = false;
	}
);

const hasImage = computed(() => Boolean(props.src) && !broken.value);

const SIZE: Record<CoverArtSize, string> = {
	sm: 'size-10',
	md: 'size-16',
	lg: 'size-24',
	xl: 'size-40',
	fill: 'w-full',
};

/** El texto de respaldo crece con la caja; en `fill` no se sabe, así que el del medio. */
const TEXT: Record<CoverArtSize, string> = {
	sm: 'text-label-s',
	md: 'text-heading-xs',
	lg: 'text-heading-m',
	xl: 'text-heading-l',
	fill: 'text-heading-m',
};

const corner = computed(() =>
	props.shape === 'round' ? 'rounded-corner-full' : props.size === 'sm' ? 'rounded-corner-s' : 'rounded-corner-m'
);

function onError(): void {
	broken.value = true;
	emit('error');
}
</script>

<template>
  <div
    class="relative aspect-square max-w-full shrink-0 overflow-hidden border border-ui-line bg-ui-surface"
    :class="[SIZE[size], corner]"
    data-cover-art>
    <img
      v-if="hasImage"
      :src="src ?? undefined"
      :alt="alt"
      class="h-full w-full object-cover"
      draggable="false"
      @error="onError" />
    <div
      v-else
      class="flex h-full w-full items-center justify-center text-tx-muted"
      :role="alt ? 'img' : undefined"
      :aria-label="alt || undefined"
      data-fallback>
      <span
        v-if="fallbackText"
        aria-hidden="true"
        class="truncate px-1 font-semibold"
        :class="TEXT[size]">{{ fallbackText }}</span>
      <ThemeIcon v-else :name="fallbackIcon" size="auto" class="h-1/2 w-1/2" />
    </div>
    <slot />
  </div>
</template>
