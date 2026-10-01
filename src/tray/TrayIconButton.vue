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
      v-if="name"
      :name="name"
      :type="type"
      :size="22"
      :alt="alt"
      class="m-auto"
      :class="iconClass"
    />
    
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
 */
import { computed, ref } from 'vue';
import ThemeIcon from '../icons/ThemeIcon.vue';


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
});

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
