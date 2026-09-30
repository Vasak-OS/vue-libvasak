<script setup lang="ts">
/**
 * Por dónde va la pista, y a dónde saltar.
 *
 * Sale de la barra que tenía el widget de música del escritorio, que era la
 * única que se podía arrastrar sin que el pulgar volviera solo: la posición
 * llega de afuera cada medio segundo, y cada llegada reescribe el valor del
 * control. Mientras alguien arrastra, lo que se dibuja es **lo que tiene en la
 * mano** y no lo que manda el reproductor; al soltar se emite `seek` y la barra
 * vuelve a seguir a la música.
 *
 * # Cuándo no hay barra
 *
 * Con `duration` en cero no se dibuja nada: una radio en vivo no sabe cuánto
 * dura, y una barra ahí diría algo que nadie sabe. Con `seekable` en falso la
 * barra está, avanza y dice los tiempos, pero no se puede mover: hay
 * reproductores que no dejan saltar y un pulgar que se suelta y vuelve es peor
 * que uno quieto.
 *
 * # Por qué un `input` invisible encima
 *
 * El control nativo trae gratis el arrastre, el teclado y lo que oye un lector
 * de pantalla; lo que no trae es un aspecto que se pueda pintar con los tokens
 * del tema en WebKitGTK sin una hoja de estilos propia. Así que el dibujo es de
 * `div` —la pista en superficie, lo recorrido en `primary`, el tirador que
 * aparece al pasar por encima— y el `input` va encima, transparente, recibiendo
 * todo.
 *
 * # La unidad es de quien la usa
 *
 * `position`, `duration` y `step` van en la misma unidad, la que sea: MPRIS
 * cuenta en microsegundos y un reproductor propio en segundos. `format` es lo
 * único que tiene que saberla; por omisión, segundos.
 */
import { useI18n } from '@vasakgroup/tauri-plugin-i18n';
import { computed, ref, watch } from 'vue';
import { formatPlaybackTime, playedRatio } from './playback';

const props = withDefaults(
	defineProps<{
		/** Dónde va la pista. */
		position: number;
		/** Cuánto dura. En cero, no hay barra. */
		duration: number;
		/** Si el reproductor deja saltar. */
		seekable?: boolean;
		/** Cuánto avanza con las flechas del teclado, en la misma unidad. */
		step?: number;
		/** Cómo se escribe un tiempo. Por omisión, segundos como `3:07`. */
		format?: (value: number) => string;
		/**
		 * Lo que oye un lector de pantalla. Sin pasarlo sale del catálogo de la
		 * aplicación, `media.seek`; pasarlo gana.
		 */
		label?: string;
	}>(),
	{ seekable: true, step: 1, format: formatPlaybackTime }
);

const emit = defineEmits<{
	/** Al soltar: a dónde saltar, en la unidad de `position`. */
	seek: [value: number];
}>();

const { t } = useI18n();

const seekLabel = computed(() => props.label ?? t('media.seek'));

/**
 * Lo que tiene en la mano quien arrastra. `null` es que nadie está tocando la
 * barra, y ahí manda la posición que llega de afuera.
 */
const dragging = ref<number | null>(null);

// Si el reproductor deja de permitir saltos a mitad de un arrastre —cambió la
// pista, o de reproductor—, lo que se tenía en la mano ya no va a ningún lado.
watch(
	() => props.seekable,
	(seekable) => {
		if (!seekable) dragging.value = null;
	}
);

const hasBar = computed(() => props.duration > 0);
const shown = computed(() => dragging.value ?? props.position);
const percent = computed(() => `${playedRatio(shown.value, props.duration) * 100}%`);
const elapsed = computed(() => props.format(shown.value));
const total = computed(() => props.format(props.duration));

function valueOf(event: Event): number {
	return Number((event.target as HTMLInputElement).value);
}

function onInput(event: Event): void {
	if (!props.seekable) return;
	dragging.value = valueOf(event);
}

function onChange(event: Event): void {
	const value = valueOf(event);
	dragging.value = null;
	if (!props.seekable || !hasBar.value) return;
	emit('seek', Math.min(props.duration, Math.max(0, value)));
}
</script>

<template>
  <div
    v-if="hasBar"
    class="flex w-full items-center gap-2 text-xs text-tx-muted tabular-nums"
    data-seek-bar>
    <span class="shrink-0" data-elapsed>{{ elapsed }}</span>

    <div
      class="group relative flex h-4 min-w-0 flex-1 items-center rounded-full has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-primary"
      :class="seekable ? 'cursor-pointer' : 'opacity-60'">
      <div class="h-1 w-full overflow-hidden rounded-full bg-ui-surface">
        <div class="h-full rounded-full bg-primary" :style="{ width: percent }" data-played></div>
      </div>
      <div
        v-if="seekable"
        class="pointer-events-none absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary opacity-0 transition-opacity group-hover:opacity-100 group-has-[input:focus-visible]:opacity-100"
        :class="{ 'opacity-100': dragging !== null }"
        :style="{ left: percent }"
        data-thumb></div>
      <input
        type="range"
        class="absolute inset-0 h-full w-full cursor-[inherit] opacity-0 disabled:cursor-default"
        min="0"
        :max="duration"
        :step="step"
        :value="shown"
        :disabled="!seekable"
        :aria-label="seekLabel"
        :aria-valuetext="`${elapsed} / ${total}`"
        @input="onInput"
        @change="onChange" />
    </div>

    <span class="shrink-0" data-total>{{ total }}</span>
  </div>
</template>
