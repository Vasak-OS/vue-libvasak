<script lang="ts" setup>
/**
 * Un icono del tema del escritorio, que sigue al tema.
 *
 * Se pide por **nombre** y nunca por ruta: el tema cambia en caliente y sus
 * rutas no son estables. `tipo` elige la variante — `icon` la común, en color,
 * que es la que usa el resto del escritorio; `symbol` la monocroma, que no
 * todos los nombres tienen.
 */
import { computed, toRef } from 'vue';
import { useIconoDelTema } from '../internos/iconoDelTema';

const props = withDefaults(
	defineProps<{ name: string; type?: 'icon' | 'symbol'; size?: number; alt?: string }>(),
	{ type: 'icon', size: 18, alt: '' }
);

const fuente = useIconoDelTema(toRef(props, 'name'), toRef(props, 'type'));
const lado = computed(() => `${props.size}px`);
</script>

<template>
  <!-- `alt` vacío cuando el icono acompaña a un texto que ya dice lo mismo: un
       lector de pantalla no tiene que leer «icono de procesador» antes de
       «Procesador». Cuando el icono **es** la etiqueta, quien lo usa pasa `alt`. -->
  <img
    v-if="fuente"
    :src="fuente"
    :alt="alt"
    :style="{ width: lado, height: lado }"
    class="shrink-0 object-contain">
  <!-- Un hueco del mismo tamaño mientras resuelve, para que la fila no salte. -->
  <span v-else :style="{ width: lado, height: lado }" class="shrink-0" />
</template>
