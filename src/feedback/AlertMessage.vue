<script setup lang="ts">
/**
 * El aviso que se queda en su lugar.
 *
 * Es el que explica algo dentro de un formulario o una sección —«hace falta
 * reiniciar», «no se pudo leer el disco»— y no el que aparece y se va: para eso
 * está `ToastArea`. Los dos comparten tono y color, que es lo que hace que un
 * error se vea igual esté donde esté.
 *
 * No se cierra ni desaparece solo. Si el aviso deja de valer, quien lo puso
 * deja de dibujarlo.
 *
 * El título y el icono son opcionales y vienen de la copia del instalador, que
 * es la única de las seis que los tenía. Un aviso de cinco líneas sin título
 * obliga a leerlo entero para saber si importa.
 */
import { computed } from 'vue';
import ThemeIcon from '../icons/ThemeIcon.vue';
import { type NoticeTone, TONE_CLASSES, toneRole } from './tones';

const props = withDefaults(
	defineProps<{
		tone?: NoticeTone;
		/** Una línea que dice de qué se trata, para no tener que leerlo todo. */
		title?: string;
		/** Nombre de icono del tema. Sin esto no se dibuja ninguno. */
		icon?: string;
		iconType?: 'icon' | 'symbol';
	}>(),
	{ tone: 'info', iconType: 'symbol' }
);

const classes = computed(() => TONE_CLASSES[props.tone]);
const role = computed(() => toneRole(props.tone));
</script>

<template>
  <div
    :role="role"
    aria-atomic="true"
    class="flex min-w-0 gap-3 rounded-corner-l border px-4 py-2 text-body-s"
    :class="classes">
    <!-- El icono va alineado con la primera línea y no centrado en la caja: con
         un mensaje de cinco líneas, centrado queda flotando a la mitad del
         párrafo y deja de leerse como su marca. Y no se lee en voz alta: el
         texto del aviso ya dice lo mismo. -->
    <span v-if="icon" class="mt-0.5 shrink-0">
      <ThemeIcon :name="icon" :type="iconType" :size="18" alt="" />
    </span>
    <div class="min-w-0 flex-1">
      <p v-if="title" class="font-semibold text-label-m">{{ title }}</p>
      <div :class="title ? 'mt-1' : ''"><slot /></div>
    </div>
  </div>
</template>
