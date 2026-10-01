<script setup lang="ts">
/**
 * El aviso que se queda en su lugar.
 *
 * Es el que explica algo dentro de un formulario o una sección —«hace falta
 * reiniciar», «no se pudo leer el disco»— y no el que aparece y se va: para eso
 * está `ToastArea`. Los dos comparten tono y color, que es lo que hace que un
 * error se vea igual esté donde esté.
 *
 * No se cierra ni desaparece solo. Si el aviso deja de valer, quien lo puso
 * deja de dibujarlo.
 *
 * El título y el icono son opcionales y vienen de la copia del instalador, que
 * es la única de las seis que los tenía. Un aviso de cinco líneas sin título
 * obliga a leerlo entero para saber si importa.
 *
 * # Lo que sumó la 2.1.0
 *
 * - **`icon="auto"`**: el icono del tono (`dialog-information`,
 *   `object-select`, `dialog-warning`, `dialog-error`). Es lo único que la
 *   capa del instalador ponía encima de este componente —ahí un aviso puede
 *   estar diciendo que se va a borrar un disco, y el icono es lo que lo hace
 *   mirar—. Es opcional y no el comportamiento por omisión: un aviso que hoy
 *   sale sin icono no gana uno al subir de versión.
 * - **La ranura `actions`**: los botones del aviso («Recargar», «Mostrar
 *   imágenes», «Reintentar»). Los tenían el editor, el correo y resonance,
 *   cada uno con sus botones dibujados a mano al lado de un aviso de la
 *   librería.
 * - **`dismissible`**: la cruz para cerrarlo, que emite `close`. Que se vaya
 *   lo sigue decidiendo quien lo pone.
 * - **`variant="banner"`**: la barra de lado a lado, sin radio y con el canto
 *   sólo arriba, para pegar al pie de una ventana. Es la barra de avisos del
 *   editor, que no usaba este componente porque la caja redondeada no le
 *   servía.
 */
import { computed } from 'vue';
import ActionButton from '../controls/ActionButton.vue';
import ThemeIcon from '../icons/ThemeIcon.vue';
import { useLabels } from '../shared/labels';
import { type NoticeTone, TONE_CLASSES, toneRole } from './tones';

const props = withDefaults(
	defineProps<{
		tone?: NoticeTone;
		/** Una línea que dice de qué se trata, para no tener que leerlo todo. */
		title?: string;
		/**
		 * Nombre de icono del tema. Sin esto no se dibuja ninguno; con `auto`,
		 * el del tono.
		 */
		icon?: string;
		iconType?: 'icon' | 'symbol';
		/** La caja de siempre, o la barra de lado a lado para el pie de una ventana. */
		variant?: 'box' | 'banner';
		/** La cruz para cerrarlo. Emite `close`. */
		dismissible?: boolean;
		/** El nombre de la cruz. Sin esto, del catálogo (`alert.close`) o «Cerrar». */
		closeLabel?: string;
	}>(),
	{ tone: 'info', iconType: 'symbol', variant: 'box', dismissible: false }
);

const emit = defineEmits<{ close: [] }>();

defineSlots<{
	default?: () => unknown;
	/** Los botones del aviso. Van debajo del texto, o al costado en una barra ancha. */
	actions?: () => unknown;
}>();

/** El icono de cada tono, de la capa del instalador (`ICONO_MENSAJE`). */
const TONE_ICONS: Record<NoticeTone, string> = {
	info: 'dialog-information',
	success: 'object-select',
	warning: 'dialog-warning',
	error: 'dialog-error',
};

const translate = useLabels();
const classes = computed(() => TONE_CLASSES[props.tone]);
const role = computed(() => toneRole(props.tone));
const iconName = computed(() => (props.icon === 'auto' ? TONE_ICONS[props.tone] : props.icon));
const closeName = computed(() => props.closeLabel ?? translate('alert.close', 'Cerrar'));
const isBanner = computed(() => props.variant === 'banner');
</script>

<template>
  <div
    :role="role"
    aria-atomic="true"
    class="flex min-w-0 gap-3 text-body-s"
    :class="[classes, isBanner ? 'items-center border-t px-3 py-2' : 'rounded-corner-l border px-4 py-2']">
    <!-- El icono va alineado con la primera línea y no centrado en la caja: con
         un mensaje de cinco líneas, centrado queda flotando a la mitad del
         párrafo y deja de leerse como su marca. Y no se lee en voz alta: el
         texto del aviso ya dice lo mismo. -->
    <span v-if="iconName" class="shrink-0" :class="isBanner ? '' : 'mt-0.5'">
      <ThemeIcon :name="iconName" :type="iconType" :size="18" alt="" />
    </span>
    <!-- Con acciones, el texto y los botones se acomodan por el ancho del aviso:
         en una barra ancha van en la misma línea; angosta, los botones abajo. -->
    <div class="@container min-w-0 flex-1">
      <div class="flex min-w-0 flex-col gap-2" :class="isBanner ? '@lg:flex-row @lg:items-center' : ''">
        <div class="min-w-0 flex-1">
          <p v-if="title" class="font-semibold text-label-m">{{ title }}</p>
          <div :class="title ? 'mt-1' : ''"><slot /></div>
        </div>
        <div v-if="$slots.actions" class="flex min-w-0 flex-wrap items-center gap-2">
          <slot name="actions" />
        </div>
      </div>
    </div>
    <ActionButton
      v-if="dismissible"
      label=""
      :icon-alt="closeName"
      :title="closeName"
      icon="window-close-symbolic"
      variant="ghost"
      size="sm"
      class="shrink-0"
      @click="emit('close')" />
  </div>
</template>
