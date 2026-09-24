<template>
  <component
    :is="interactive ? 'button' : 'div'"
    v-bind="interactive ? { type: 'button', 'aria-label': accessibleName } : {}"
    class="p-1 rounded-corner relative group transition-[background-color] duration-300"
    :class="[customClass, interactive ? 'cursor-pointer hover:bg-primary' : '']"
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
    <!-- La ruta ya resuelta, mientras `icon` siga existiendo. -->
    <img
      v-else
      :src="icon"
      :alt="alt"
      class="m-auto h-5.5 w-auto"
      :class="iconClass"
    />
    
    <!-- Badge/Counter -->
    <div
      v-if="badge !== null && badge > 0"
      class="absolute bottom-1 right-1 bg-primary text-tx-on-primary text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold animate-bounce"
    >
      {{ badge }}
    </div>

    <!-- Tooltip personalizado -->
    <div 
      v-if="showCustomTooltip && customTooltipText"
      class="absolute top-1 left-1/2 transform -translate-x-1/2 text-xs font-semibold p-1 rounded-corner transition-[opacity,translate] duration-300 pointer-events-none background"
      :class="[
        tooltipClass,
        {
          'opacity-0 -translate-y-2': !showTooltip,
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
 * `icon` —la ruta ya resuelta— sigue funcionando y está **obsoleto**. Era lo
 * contrario de lo que hace el resto de la librería: obligaba a quien lo usara a
 * resolver la ruta por su cuenta, escuchar el cambio de tema y volver a
 * pedirla, que es exactamente el composable que este barrido viene borrando de
 * cada repositorio. Se va en la próxima mayor; hasta entonces avisa por consola.
 */
import { computed, onMounted, ref } from 'vue';
import ThemeIcon from '../icons/ThemeIcon.vue';


interface Props {
  /** El nombre del icono en el tema del escritorio. */
  name?: string;
  /** Cuál de las dos variantes del tema. */
  type?: 'icon' | 'symbol';
  /** @deprecated La ruta ya resuelta. Usá `name`. Se va en la próxima mayor. */
  icon?: string;
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
  icon: '',
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

/**
 * El aviso de que `icon` está obsoleto.
 *
 * Por consola y no un error: quien todavía lo use tiene que seguir viendo su
 * icono, no una ventana rota. Y en `onMounted`, una vez por instancia.
 */
onMounted(() => {
	if (props.icon && !props.name) {
		console.warn(
			'[TrayIconButton] «icon» está obsoleto y se va en la próxima mayor: recibe una ruta ya resuelta. Usá «name» con el nombre del icono del tema, y «type» si hace falta el símbolo.'
		);
	}
});

const handleClick = () => {
  emit('click');
};
</script>
