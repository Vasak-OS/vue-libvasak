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
 */
import { computed } from 'vue';
import { CLASES_POR_TONO, rolDelTono, type TonoDelAviso } from './tonos';

const props = withDefaults(defineProps<{ tone?: TonoDelAviso }>(), { tone: 'info' });

const clases = computed(() => CLASES_POR_TONO[props.tone]);
const rol = computed(() => rolDelTono(props.tone));
</script>

<template>
  <div
    :role="rol"
    aria-atomic="true"
    class="rounded-corner border px-4 py-2 text-sm"
    :class="clases">
    <slot />
  </div>
</template>
