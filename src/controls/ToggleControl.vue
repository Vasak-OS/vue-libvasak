<script setup lang="ts">
/**
 * Un botón de icono que alterna algo: Wi-Fi, Bluetooth, el tema.
 *
 * ── Lo que le faltaba ───────────────────────────────────────────────────────
 *
 * Es un `<button>` cuyo único contenido es un `<img>`, y ese `img` llevaba un
 * `alt` que por omisión era la cadena vacía. O sea que **por omisión el botón
 * no tenía nombre**: un lector de pantalla decía «botón» y nada más. Por eso
 * `label` es obligatorio y reemplaza a `alt` y `tooltip`, que eran dos formas
 * de nombrar lo mismo y ninguna obligaba a hacerlo.
 *
 * Tampoco decía si estaba encendido, que junto con el nombre es todo lo que
 * este control transmite.
 */
const props = withDefaults(
	defineProps<{
		icon: string;
		/**
		 * Qué controla este botón, ya traducido. Obligatorio: el botón no tiene
		 * más contenido que un icono, y un icono no tiene nada que leer.
		 */
		label: string;
		/**
		 * El estado de dos posiciones, cuando el botón **realmente alterna algo**.
		 *
		 * Se deja en `null` —lo que viene por omisión— en los que abren un panel:
		 * ahí `aria-pressed` mentiría, diría «no presionado» sobre algo que no
		 * tiene dos estados, y lo que hay es sólo el resaltado de `isActive`.
		 *
		 * Es `boolean | null` y no `boolean | undefined` por una trampa de Vue:
		 * **una propiedad booleana que no se pasa llega como `false`**, no como
		 * `undefined`, salvo que tenga un valor por omisión declarado. La copia
		 * del escritorio tenía este mismo criterio escrito en su comentario y no
		 * lo cumplía: medida, ponía `aria-pressed="false"` en todos los botones
		 * que abren un panel. Declarar el `null` es lo que apaga esa conversión, y además es lo que Vue
		 * saca del atributo.
		 *
		 * El `?? undefined` de la plantilla es para el chequeo de tipos y no
		 * para el navegador —`aria-pressed` no acepta `null` en los tipos,
		 * aunque en el DOM `null` y `undefined` borran el atributo igual—. Sin
		 * él no cambia nada de lo que se dibuja, y el chequeo queda en rojo.
		 */
		pressed?: boolean | null;
		isActive?: boolean;
		isLoading?: boolean;
		iconClass?: Record<string, boolean>;
		customClass?: Record<string, boolean>;
	}>(),
	{ pressed: null, isActive: false, isLoading: false, iconClass: () => ({}), customClass: () => ({}) }
);

const emit = defineEmits<{ click: [] }>();

function alApretar() {
	emit('click');
}
</script>

<template>
  <button
    type="button"
    class="p-2 rounded-corner bg-ui-bg/80 hover:opacity-50 transition-all duration-300 h-17.5 w-17.5 group relative overflow-hidden hover:scale-105 hover:shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    :class="{
      'animate-pulse': isLoading,
      'ring-2 ring-primary': isActive,
      'opacity-60': !isActive,
      ...customClass,
    }"
    :disabled="isLoading"
    :title="label"
    :aria-label="label"
    :aria-pressed="pressed ?? undefined"
    :aria-busy="isLoading || undefined"
    @click="alApretar">
    <!-- El icono no se lee: el botón ya tiene nombre, y repetirlo haría que un
         lector de pantalla diga la misma cosa dos veces. -->
    <img
      :src="icon"
      alt=""
      class="m-auto w-12.5 h-12.5 transition-all duration-300 group-hover:scale-110 relative z-10"
      :class="{
        'animate-spin': isLoading,
        'filter brightness-75': !isActive,
        'drop-shadow-lg': isActive,
        ...iconClass,
      }" />
  </button>
</template>
