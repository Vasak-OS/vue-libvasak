<script setup lang="ts">
/**
 * Dónde soltar lo que se arrastra: archivos sobre la biblioteca de música, un
 * paquete sobre la tienda, una carpeta sobre el gestor de archivos.
 *
 * Cuatro copias en tres aplicaciones. Es sólo el dibujo: quién escucha
 * `dragenter`/`drop` y qué hace con lo soltado sigue siendo de la aplicación,
 * que es la que sabe qué acepta. Le pasa `active` mientras haya algo encima.
 *
 * # En línea o encima
 *
 * - En línea (por omisión): un recuadro de canto punteado con un icono y el
 *   texto; con `active`, el velo de acento y el canto del primario. La ranura
 *   va debajo del texto (un botón «Elegir archivos», que es la otra mitad de
 *   cualquier zona de soltar: sin ratón no se arrastra).
 * - `overlay`: tapa el contenedor —que tiene que ser `relative`— **sólo
 *   mientras** `active`, con el velo `ui-scrim` y una tarjeta flotante opaca
 *   (`ui-float`) con el texto, que es donde se lee. No atrapa el puntero: el
 *   `drop` llega a quien lo escucha debajo.
 *
 * # Trabada
 *
 * `locked` es «acá no se puede soltar» (una carpeta de sólo lectura, una
 * instalación en curso): canto de advertencia, otro icono y otro texto. Se
 * anuncia: mientras se arrastra, quien no ve tiene que saber que soltar ahí no
 * hace nada.
 *
 * Los textos salen de la propiedad, del catálogo (`dropZone.label`,
 * `dropZone.locked`) o del respaldo en inglés.
 */
import { computed } from 'vue';
import ThemeIcon from '../icons/ThemeIcon.vue';
import { useLabels } from '../shared/labels';

const props = withDefaults(
	defineProps<{
		active?: boolean;
		label?: string;
		locked?: boolean;
		lockedLabel?: string;
		overlay?: boolean;
		/** El icono del tema. */
		icon?: string;
	}>(),
	{ active: false, locked: false, overlay: false, icon: 'document-import' }
);

const translate = useLabels();
const text = computed(() =>
	props.locked
		? (props.lockedLabel ?? translate('dropZone.locked', "Can't drop here"))
		: (props.label ?? translate('dropZone.label', 'Drop files here'))
);
const shownIcon = computed(() => (props.locked ? 'changes-prevent' : props.icon));
const shownFallbacks = computed(() => (props.locked ? ['action-unavailable', 'dialog-warning'] : ['document-open', 'go-down']));

const frame = computed(() => {
	if (props.locked) return 'border-status-warning bg-status-warning/15';
	return props.active ? 'border-primary bg-ui-selected-accent' : 'border-ui-border-strong bg-transparent';
});
</script>

<template>
  <div
    v-if="overlay"
    v-show="active"
    class="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-ui-scrim p-4"
    :data-active="active"
    data-drop-zone="overlay">
    <div
      class="flex max-w-full min-w-0 flex-col items-center gap-2 rounded-corner-xl border-2 border-dashed bg-ui-float px-6 py-4 text-center text-tx-main shadow-surface-l"
      :class="locked ? 'border-status-warning' : 'border-primary'"
      role="status">
      <ThemeIcon :name="shownIcon" :fallbacks="shownFallbacks" :size="32" />
      <p class="m-0 break-words font-semibold text-label-m">{{ text }}</p>
    </div>
  </div>
  <div
    v-else
    class="@container flex min-w-0 flex-col items-center justify-center gap-2 rounded-corner-l border-2 border-dashed p-4 text-center text-tx-main transition-colors duration-200 ease-ui"
    :class="frame"
    :data-active="active"
    data-drop-zone="inline">
    <ThemeIcon :name="shownIcon" :fallbacks="shownFallbacks" :size="32" class="hidden @[10rem]:block" />
    <p class="m-0 min-w-0 break-words font-semibold text-label-m" :role="locked ? 'status' : undefined">{{ text }}</p>
    <slot />
  </div>
</template>
