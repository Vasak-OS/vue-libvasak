<template>
  <component
    :is="interactive ? 'button' : 'div'"
    v-bind="interactive ? { type: 'button', 'aria-label': accessibleName } : {}"
    class="relative rounded-corner-m p-1 text-tx-main transition-colors duration-200 ease-ui group"
    :class="[
      customClass,
      interactive
        ? 'cursor-pointer hover:bg-ui-hover active:bg-ui-pressed active:duration-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ui-focus'
        : '',
    ]"
    :title="tooltip"
    @click="handleClick"
    @mouseenter="showTooltip = true"
    @mouseleave="showTooltip = false"
  >
    <ThemeIcon
      v-if="name || fallbackSrc"
      :name="name"
      :type="type"
      :size="22"
      :alt="alt"
      :fallbacks="fallbacks"
      :fallback-src="fallbackSrc"
      class="m-auto"
      :class="iconClass"
    />
    
    <!-- El progreso de LauncherEntry (2.2.0): una línea al pie, sólo si viene. -->
    <span
      v-if="hasProgress"
      class="pointer-events-none absolute right-1 bottom-0.5 left-1"
      data-progress>
      <ProgressTrack :value="percent" :label="progressText" height="h-1" fill="bg-primary" />
    </span>

    <!-- Badge/Counter -->
    <div
      v-if="badge !== null && badge > 0"
      class="absolute right-1 bottom-1 flex h-4 min-w-4 items-center justify-center rounded-corner-full bg-primary px-1 font-semibold text-label-xs text-tx-on-primary"
    >
      {{ badge }}
    </div>

    <!-- Tooltip personalizado -->
    <div 
      v-if="showCustomTooltip && customTooltipText"
      class="pointer-events-none absolute top-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-corner-s border border-ui-line bg-ui-float px-2 py-1 text-body-xs text-tx-main shadow-surface-s transition-[opacity,translate] duration-150 ease-ui-out"
      :class="[
        tooltipClass,
        {
          'opacity-0 -translate-y-0.5': !showTooltip,
          'opacity-100 translate-y-0': showTooltip
        }
      ]"
    >
      {{ customTooltipText }}
    </div>

    <!-- Slot para contenido adicional personalizado -->
    <slot></slot>
  </component>
</template>

<script setup lang="ts">
/**
 * ── El que hace algo es un botón, el que informa no ────────────────────────
 *
 * Con `interactive` —que es lo normal— la raíz es un `<button>` de verdad, con
 * su `type` y su nombre accesible. Sin él es un `<div>` quieto: los que sólo
 * informan se pintaban al pasar el mouse como si fueran botones, y se
 * anunciaban como «botón» a quien no ve el icono. Las dos cosas prometen un
 * clic que no existe.
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
 * ── La forma (vue-libvasak#74) ─────────────────────────────────────────────
 *
 * Un botón sin borde de Once UI: `rounded-corner-m` y el velo `ui-hover` al
 * pasar —era el relleno del primario—. La insignia es una píldora
 * `rounded-corner-full` en peso 600 y ya no rebota: un número que salta sin
 * parar en el panel distrae de todo lo demás. El globo propio es el mismo
 * globo de `TooltipContent`.
 *
 * ── Lo que sumó la 2.2.0 ───────────────────────────────────────────────────
 *
 * `progress` (0–100): una línea fina al pie del icono, el progreso que una
 * aplicación publica por `com.canonical.Unity.LauncherEntry` (una descarga,
 * una copia). El número de la misma interfaz ya entraba por `badge`. Las dos
 * son **opcionales y sólo se dibujan si vienen**: de dónde salen (DBusMenu,
 * LauncherEntry) es del escritorio (vasak-desktop#145), no de la librería.
 * También `fallbacks` y `fallbackSrc`, que pasan a `ThemeIcon`: el nombre de
 * icono que manda otra aplicación puede no estar en el tema.
 */
import { computed, ref } from 'vue';
import ProgressTrack from '../forms/ProgressTrack.vue';
import ThemeIcon from '../icons/ThemeIcon.vue';
import { useLabels } from '../shared/labels';


interface Props {
  /** El nombre del icono en el tema del escritorio. */
  name?: string;
  /** Cuál de las dos variantes del tema. */
  type?: 'icon' | 'symbol';
  alt?: string;
  tooltip?: string;
  badge?: number | null;
  iconClass?: string | Record<string, boolean>;
  customClass?: string | Record<string, boolean>;
  tooltipClass?: string | Record<string, boolean>;
  showCustomTooltip?: boolean;
  customTooltipText?: string;
  /**
   * Si hacer clic hace algo.
   *
   * Los que sólo informan —la batería, Bloq Mayús, el micrófono silenciado— se
   * pintaban al pasar el mouse como si fueran botones: el resaltado promete un
   * clic que no existe. Y peor, se anunciaban como «botón» a quien no ve el
   * icono. Con esto quedan quietos y se dibujan como un `div`.
   */
  interactive?: boolean;
  /** El progreso que publica la aplicación, de 0 a 100. Sin esto no hay línea. */
  progress?: number | null;
  /** Cómo se llama la línea para un lector de pantalla. */
  progressLabel?: string;
  /** Otros nombres del tema para el icono, en orden. */
  fallbacks?: readonly string[];
  /** El dibujo que manda la aplicación, si ningún nombre resolvió. */
  fallbackSrc?: string;
}

const props = withDefaults(defineProps<Props>(), {
  name: '',
  type: 'icon',
  alt: '',
  tooltip: '',
  badge: null,
  iconClass: () => ({}),
  customClass: '',
  tooltipClass: '',
  showCustomTooltip: false,
  customTooltipText: '',
  interactive: true,
  progress: null,
  progressLabel: undefined,
  fallbacks: () => [],
  fallbackSrc: '',
});

const translate = useLabels();
const hasProgress = computed(() => typeof props.progress === 'number' && Number.isFinite(props.progress));
const percent = computed(() => Math.min(Math.max(props.progress ?? 0, 0), 100));
const progressText = computed(() => props.progressLabel ?? translate('tray.progress', 'Progress'));

const emit = defineEmits<{
  click: [];
}>();

/**
 * Cómo se llama el botón para quien no ve el icono.
 *
 * El dibujo es todo el contenido, así que sin esto un lector de pantalla
 * anuncia un botón **vacío**. Se usa el `alt` del icono, y si no hay, el texto
 * del tooltip.
 */
const accessibleName = computed(() => props.alt || props.tooltip || undefined);

const showTooltip = ref(false);


const handleClick = () => {
  emit('click');
};
</script>
