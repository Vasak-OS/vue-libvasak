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
 *
 * ── La forma (vue-libvasak#74) ─────────────────────────────────────────────
 *
 * Una tarjeta chica de Once UI: `rounded-corner-l`, canto `ui-line` y la
 * superficie al 70 %. Encendido es la tarjeta elegida —el velo de acento con el
 * canto del primario—, que es donde el acento tiene sentido: algo que actúa.
 * Ya no se agranda, no se apaga a la mitad al pasar por encima ni echa sombra:
 * pasar por encima es el velo `ui-hover`. El tamaño es el de antes.
 *
 * ── El icono va por nombre ─────────────────────────────────────────────────
 *
 * `name` es el **nombre** del icono en el tema del escritorio, y `type` cuál de
 * las dos variantes. Lo dibuja `ThemeIcon`, así que sigue al tema y entra en el
 * planificador de recarga como cualquier otro.
 *
 * `icon` —la ruta ya resuelta— se fue en la 2.0.0, como avisaba desde la 1.x:
 * obligaba a quien lo usara a resolver la ruta por su cuenta, escuchar el
 * cambio de tema y volver a pedirla. Ninguna aplicación lo usaba al sacarlo.
 */
import ThemeIcon from '../icons/ThemeIcon.vue';

withDefaults(
	defineProps<{
		/** El nombre del icono en el tema del escritorio. */
		name?: string;
		/** Cuál de las dos variantes del tema. */
		type?: 'icon' | 'symbol';
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
	{
		name: '',
		type: 'icon',
		pressed: null,
		isActive: false,
		isLoading: false,
		iconClass: () => ({}),
		customClass: () => ({}),
	}
);

const emit = defineEmits<{ click: [] }>();

function onClick() {
	emit('click');
}
</script>

<template>
  <button
    type="button"
    class="group relative h-17.5 w-17.5 overflow-hidden rounded-corner-l border p-2 text-tx-main transition-colors duration-200 ease-ui active:duration-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-focus disabled:cursor-not-allowed"
    :class="{
      'animate-pulse': isLoading,
      'border-primary bg-ui-selected-accent': isActive,
      'border-ui-line bg-ui-surface/70 hover:bg-linear-to-r hover:from-ui-hover hover:to-ui-hover active:from-ui-pressed active:to-ui-pressed': !isActive,
      ...customClass,
    }"
    :disabled="isLoading"
    :title="label"
    :aria-label="label"
    :aria-pressed="pressed ?? undefined"
    :aria-busy="isLoading || undefined"
    @click="onClick">
    <!-- El icono no se lee: el botón ya tiene nombre, y repetirlo haría que un
         lector de pantalla diga la misma cosa dos veces. Apagado va atenuado,
         que es como Once UI dibuja lo que está apagado. -->
    <ThemeIcon
      v-if="name"
      :name="name"
      :type="type"
      :size="50"
      class="relative z-10 m-auto transition-opacity duration-200 ease-ui"
      :class="{
        'animate-spin': isLoading,
        'opacity-60': !isActive,
        ...iconClass,
      }" />
  </button>
</template>
