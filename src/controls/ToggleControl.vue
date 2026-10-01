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
 *
 * ── Lo que sumó la 2.2.0 ───────────────────────────────────────────────────
 *
 * Lo que dibujaban a mano encima los botones de Red, Bluetooth y tema del
 * escritorio, ahora en el componente. Sin pedirlo, el botón es el de siempre.
 *
 * - `indicator`: un `StatusDot` en la esquina de arriba —conectando (late),
 *   conectado, sin red—. Su `label` se suma al nombre del botón, porque el
 *   punto solo no lo ve quien no ve.
 * - `badge`: un número en la esquina de abajo (dispositivos conectados), con
 *   la misma píldora que `TrayIconButton`. Cero o nada, no se dibuja.
 * - la ranura `overlay`: encima del icono y sin recibir el puntero, para las
 *   barras de señal del Wi-Fi.
 */
import { computed } from 'vue';
import StatusDot, { type StatusDotTone } from '../indicators/StatusDot.vue';
import ThemeIcon from '../icons/ThemeIcon.vue';

export interface ToggleIndicator {
	tone: StatusDotTone;
	pulse?: boolean;
	/** El estado, ya traducido. Se suma al nombre del botón. */
	label?: string;
}

const props = withDefaults(
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
		/** Un punto de estado en la esquina de arriba. */
		indicator?: ToggleIndicator | null;
		/** Un número en la esquina de abajo. Cero o nada, no se dibuja. */
		badge?: number | null;
	}>(),
	{
		name: '',
		type: 'icon',
		pressed: null,
		isActive: false,
		isLoading: false,
		iconClass: () => ({}),
		customClass: () => ({}),
		indicator: null,
		badge: null,
	}
);

defineSlots<{
	overlay?: () => unknown;
}>();

const showsBadge = computed(() => typeof props.badge === 'number' && props.badge > 0);
/** El nombre del botón, con el estado del punto y el número si los tiene. */
const accessibleName = computed(() =>
	[props.label, props.indicator?.label, showsBadge.value ? String(props.badge) : '']
		.filter(Boolean)
		.join(', ')
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
    :title="accessibleName"
    :aria-label="accessibleName"
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
    <span v-if="$slots.overlay" aria-hidden="true" class="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
      <slot name="overlay" />
    </span>
    <span v-if="indicator" class="absolute top-2 right-2 z-30 flex" data-indicator>
      <StatusDot :tone="indicator.tone" :pulse="indicator.pulse" size="md" />
    </span>
    <span
      v-if="showsBadge"
      aria-hidden="true"
      class="absolute right-1 bottom-1 z-30 flex h-4 min-w-4 items-center justify-center rounded-corner-full bg-primary px-1 font-semibold text-label-xs text-tx-on-primary"
      data-badge>
      {{ badge }}
    </span>
  </button>
</template>
