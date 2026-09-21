<script lang="ts" setup>
/**
 * Un icono del tema del escritorio, que sigue al tema.
 *
 * Se pide por **nombre** y nunca por ruta: el tema cambia en caliente y sus
 * rutas no son estables. `tipo` elige la variante — `icon` la común, en color,
 * que es la que usa el resto del escritorio; `symbol` la monocroma, que no
 * todos los nombres tienen.
 *
 * El `ref` a lo que dibuja no es para tocarlo: es para que el planificador sepa
 * si este icono está en pantalla y lo recargue antes que los que no lo están.
 * Con una lista larga —el menú de aplicaciones del escritorio son entre sesenta
 * y ciento cincuenta— eso es la diferencia entre ver el tema nuevo en seguida y
 * verlo cuando terminaron de resolver todos.
 */
import { computed, toRef, useTemplateRef, watch } from 'vue';
import { useIconoDelTema } from '../internos/iconoDelTema';

const props = withDefaults(
	defineProps<{ name: string; type?: 'icon' | 'symbol'; size?: number; alt?: string }>(),
	{ type: 'icon', size: 18, alt: '' }
);

const { fuente, mirarElemento } = useIconoDelTema(toRef(props, 'name'), toRef(props, 'type'));
const dibujo = useTemplateRef<HTMLElement>('dibujo');
// El elemento cambia cuando el icono resuelve: el hueco es un `span` y lo que
// queda después es el `img`. Con un `ref` a secas se vigilaría el hueco y nunca
// la imagen.
watch(dibujo, (elemento) => mirarElemento(elemento), { immediate: true });
const lado = computed(() => `${props.size}px`);
</script>

<template>
  <!-- `alt` vacío cuando el icono acompaña a un texto que ya dice lo mismo: un
       lector de pantalla no tiene que leer «icono de procesador» antes de
       «Procesador». Cuando el icono **es** la etiqueta, quien lo usa pasa `alt`. -->
  <img
    v-if="fuente"
    ref="dibujo"
    :src="fuente"
    :alt="alt"
    :style="{ width: lado, height: lado }"
    class="shrink-0 object-contain">
  <!-- Un hueco del mismo tamaño mientras resuelve, para que la fila no salte. -->
  <span v-else ref="dibujo" :style="{ width: lado, height: lado }" class="shrink-0" />
</template>
