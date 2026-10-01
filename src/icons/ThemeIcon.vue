<script lang="ts" setup>
/**
 * Un icono del tema del escritorio, que sigue al tema.
 *
 * Se pide por **nombre** y nunca por ruta: el tema cambia en caliente y sus
 * rutas no son estables. `type` elige la variante — `icon` la común, en color,
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
 *
 * # Los respaldos (2.2.0)
 *
 * `fallbacks` son otros nombres del tema, probados en orden cuando el tema no
 * tiene `name`. Es lo que hacía a mano `IconoDeApp` de la tienda —el `Icon=`
 * del `.desktop`, el identificador de AppStream, el nombre del paquete— y lo
 * que necesitan los botones de la bandeja y de Connect, que reciben un nombre
 * de otra aplicación que el tema puede no tener.
 *
 * `fallbackSrc` es el último recurso: un dibujo **que trae otra aplicación**
 * (el mapa de bits de un ítem de la bandeja, el icono que publica un
 * catálogo), no uno propio de quien usa el componente. Sólo se dibuja si
 * ningún nombre resolvió.
 *
 * # Lo que dibuja
 *
 * `alt` vacío cuando el icono acompaña a un texto que ya dice lo mismo: un
 * lector de pantalla no tiene que leer «icono de procesador» antes de
 * «Procesador». Cuando el icono **es** la etiqueta, quien lo usa pasa `alt`.
 *
 * Mientras resuelve, un hueco del mismo tamaño, para que la fila no salte. Con
 * `size="auto"` tampoco lleva medida: la caja es la misma para los dos, así
 * que el hueco ya ocupa lo que va a ocupar la imagen. Y va `inline-block`
 * porque un `span` es inline, y el alto y el ancho **no aplican a un inline no
 * reemplazado**: la imagen sí se mide —es un elemento reemplazado— pero el
 * hueco no, así que fuera de un contenedor flex no reservaba nada y la fila
 * saltaba igual al aparecer el icono.
 *
 * Estas explicaciones vivían en comentarios de la plantilla, **antes** de la
 * raíz: eso la parte en un fragmento en desarrollo y las clases de quien lo
 * usa (`class="m-auto"`) no caían en ningún lado. Pasaron acá en la 2.2.0.
 */
import { computed, toRef, useTemplateRef, watch } from 'vue';
import { useThemeIcon } from '../internal/themeIcon';

const props = withDefaults(
	defineProps<{
		name: string;
		type?: 'icon' | 'symbol';
		size?: number | 'auto';
		alt?: string;
		/** Otros nombres del tema, en orden, para cuando no tiene `name`. */
		fallbacks?: readonly string[];
		/** El dibujo de otra aplicación, si ningún nombre resolvió. */
		fallbackSrc?: string;
	}>(),
	{ type: 'icon', size: 18, alt: '', fallbacks: () => [], fallbackSrc: '' }
);

const names = computed<readonly string[]>(() => [props.name, ...props.fallbacks]);
const { source, watchElement } = useThemeIcon(names, toRef(props, 'type'));
/** Lo que se dibuja: lo del tema, o el dibujo de respaldo. */
const drawn = computed(() => source.value || props.fallbackSrc);
const drawing = useTemplateRef<HTMLElement>('drawing');
// El elemento cambia cuando el icono resuelve: el hueco es un `span` y lo que
// queda después es el `img`. Con un `ref` a secas se vigilaría el hueco y nunca
// la imagen.
watch(drawing, (element) => watchElement(element), { immediate: true });
/**
 * El estilo en línea, o nada.
 *
 * Va `undefined` y no un objeto vacío: un `:style="{}"` igual escribe el
 * atributo, y una regla de `style` en línea le gana a cualquier clase. Con
 * `'auto'` la idea es justamente que no haya nada que ganarle.
 */
const dimensions = computed(() =>
	props.size === 'auto' ? undefined : { width: `${props.size}px`, height: `${props.size}px` }
);
</script>

<template>
  <img
    v-if="drawn"
    ref="drawing"
    :src="drawn"
    :alt="alt"
    :style="dimensions"
    class="shrink-0 object-contain">
  <span v-else ref="drawing" :style="dimensions" class="inline-block shrink-0" />
</template>
