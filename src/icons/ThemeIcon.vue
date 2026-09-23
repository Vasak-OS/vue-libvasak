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
 *
 * `size` acepta un número de píxeles —lo habitual— o `'auto'`, que es la forma
 * de decir «el tamaño lo pongo yo». Con `'auto'` el componente **no escribe
 * estilo en línea**, y el alto y el ancho salen de las clases o del estilo que
 * le ponga quien lo usa: es lo único que deja dibujar un icono que se mide con
 * su caja, como el del clima, que va en `cqmin` y no en píxeles.
 *
 * El número por omisión se queda en 18 a propósito. Sacarlo dejaría a los
 * cuarenta y seis lugares del taller que no pasan `size` dibujando el icono en
 * su tamaño natural: no falla, no avisa, y se ve mal recién cuando alguien mira.
 */
import { computed, toRef, useTemplateRef, watch } from 'vue';
import { useIconoDelTema } from '../internos/iconoDelTema';

const props = withDefaults(
	defineProps<{
		name: string;
		type?: 'icon' | 'symbol';
		size?: number | 'auto';
		alt?: string;
	}>(),
	{ type: 'icon', size: 18, alt: '' }
);

const { fuente, mirarElemento } = useIconoDelTema(toRef(props, 'name'), toRef(props, 'type'));
const dibujo = useTemplateRef<HTMLElement>('dibujo');
// El elemento cambia cuando el icono resuelve: el hueco es un `span` y lo que
// queda después es el `img`. Con un `ref` a secas se vigilaría el hueco y nunca
// la imagen.
watch(dibujo, (elemento) => mirarElemento(elemento), { immediate: true });
/**
 * El estilo en línea, o nada.
 *
 * Va `undefined` y no un objeto vacío: un `:style="{}"` igual escribe el
 * atributo, y una regla de `style` en línea le gana a cualquier clase. Con
 * `'auto'` la idea es justamente que no haya nada que ganarle.
 */
const medida = computed(() =>
	props.size === 'auto' ? undefined : { width: `${props.size}px`, height: `${props.size}px` }
);
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
    :style="medida"
    class="shrink-0 object-contain">
  <!-- Un hueco del mismo tamaño mientras resuelve, para que la fila no salte.
       Con `size="auto"` tampoco lleva medida: la caja es la misma para los dos,
       así que el hueco ya ocupa lo que va a ocupar la imagen.

       Y va `inline-block` porque un `span` es inline, y el alto y el ancho **no
       aplican a un inline no reemplazado**: la imagen sí se mide —es un
       elemento reemplazado— pero el hueco no, así que fuera de un contenedor
       flex no reservaba nada y la fila saltaba igual al aparecer el icono. En
       flex no cambia nada: ahí el hueco ya es un elemento flex y su `display`
       se convierte solo. -->
  <span v-else ref="dibujo" :style="medida" class="inline-block shrink-0" />
</template>
