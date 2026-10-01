<script setup lang="ts">
/**
 * El rincón donde aparecen los avisos transitorios.
 *
 * ── Qué pone la librería y qué pone la aplicación ────────────────────────────
 *
 * Acá viven la **posición, la forma, la animación y lo que oye un lector de
 * pantalla**: es lo que hace que un aviso del gestor de archivos y uno de la
 * galería se sientan del mismo sistema. Venían de seis formas distintas, entre
 * 23 y 120 líneas, cada una con su esquina y su color.
 *
 * La **cola** la pone la aplicación: cuándo aparece un aviso, cuánto dura y
 * cuándo se va son decisiones suyas, y ya las tiene resueltas cada una en su
 * `useToast` o `useNotification`. Esto sólo dibuja la lista que le pasen, así
 * que no hay temporizador acá adentro.
 *
 * Se teletransporta al `body` por la misma razón que el diálogo: dentro de un
 * contenedor con `overflow` se recorta, y su `z-index` tiene que competir con
 * el de la ventana.
 *
 * ── Y por encima del diálogo ────────────────────────────────────────────────
 *
 * Los dos se teletransportan al `body`, así que con el mismo `z-index` el
 * orden lo decide cuál se agregó último — y el diálogo se agrega al abrirse,
 * o sea siempre después. Un aviso disparado desde adentro de un diálogo
 * quedaba tapado por él, que es justo cuando más falta hace: «se copió», «no
 * se pudo guardar». Por eso la pila va más arriba, y no empatada.
 */
import { computed } from 'vue';
import ActionButton from '../controls/ActionButton.vue';
import ProgressBar from '../forms/ProgressBar.vue';
import { type NoticeTone, TOAST_TONE_CLASSES, toneRole } from './tones';

export interface ToastNotice {
	/** Estable mientras el aviso viva: es la clave de la animación. */
	id: string | number;
	message: string;
	tone?: NoticeTone;
	/**
	 * Una línea en negrita arriba del mensaje: «Copiando 3 archivos». (2.1.0,
	 * de los avisos del gestor de archivos, que tenían título y descripción.)
	 */
	title?: string;
	/** Una línea atenuada debajo del mensaje: el detalle, el destino. */
	description?: string;
	/**
	 * Una barra de progreso, de 0 a 100, o `null` si no se sabe cuánto falta.
	 * Es el `CustomProgress` del gestor de archivos.
	 */
	progress?: number | null;
	/**
	 * Un botón en el aviso: «Deshacer» en el correo, «Cancelar» en una copia.
	 * Al tocarlo, `ToastArea` emite `action` con el aviso.
	 */
	action?: { label: string };
}

/** @deprecated Usá `ToastNotice`. Se va en la 3.0. */
export type AvisoTransitorio = ToastNotice;

const props = withDefaults(
	defineProps<{
		toasts: ToastNotice[];
		/**
		 * Dónde se apilan.
		 *
		 * Abajo a la derecha por omisión, que es la convención del escritorio y
		 * lo que ya hacía el gestor de archivos. Abajo al centro es lo que usa
		 * la galería, y se conserva como opción: en una ventana de ver fotos, la
		 * esquina compite con los controles.
		 */
		position?: 'bottom-right' | 'bottom-center';
	}>(),
	{ position: 'bottom-right' }
);

const emit = defineEmits<{
	/** Se tocó el botón de un aviso. Qué hacer —y si el aviso se va— lo decide quien lo puso. */
	action: [toast: ToastNotice];
}>();

defineSlots<{
	/**
	 * El contenido de cada aviso, si el de siempre no alcanza. El aviso llega
	 * como `toast`; `aviso` es su nombre de la 2.0.0 y sigue llegando.
	 */
	default?: (scope: { toast: ToastNotice; aviso: ToastNotice }) => unknown;
}>();

/**
 * Los avisos con barra van de un ancho fijo: si no, la barra mide lo que mide
 * el texto y avanza en una tira de tres palabras.
 */
function widthOf(toast: ToastNotice): string {
	return toast.progress !== undefined ? 'w-80' : '';
}

const placement = computed(() =>
	props.position === 'bottom-center'
		? 'bottom-4 left-1/2 -translate-x-1/2'
		: 'right-4 bottom-4'
);
</script>

<template>
  <Teleport to="body">
    <!-- `pointer-events-none` en la pila y `auto` en cada aviso: la columna
         ocupa una franja de la ventana, y sin esto se come los clics de lo que
         haya debajo aunque no se vea nada. -->
    <div class="pointer-events-none fixed z-60 flex flex-col gap-2" :class="placement">
      <TransitionGroup
        enter-active-class="transition-[opacity,translate] duration-200 ease-ui-out"
        leave-active-class="transition-[opacity,translate] duration-150 ease-ui"
        enter-from-class="translate-y-2 opacity-0"
        leave-to-class="translate-y-2 opacity-0"
        move-class="transition-[translate] duration-300 ease-ui">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :role="toneRole(toast.tone ?? 'info')"
          aria-atomic="true"
          class="pointer-events-auto max-w-[calc(100vw-32px)] rounded-corner-l border bg-ui-float px-4 py-2 text-body-s text-tx-main shadow-surface-m"
          :class="[TOAST_TONE_CLASSES[toast.tone ?? 'info'], widthOf(toast)]">
          <slot :toast="toast" :aviso="toast">
            <template v-if="toast.title || toast.description || toast.progress !== undefined || toast.action">
              <div class="flex min-w-0 items-start gap-3">
                <div class="flex min-w-0 flex-1 flex-col gap-1">
                  <p v-if="toast.title" class="m-0 break-words font-semibold text-label-m">{{ toast.title }}</p>
                  <p class="m-0 break-words">{{ toast.message }}</p>
                  <p v-if="toast.description" class="m-0 break-words text-body-xs text-tx-muted">{{ toast.description }}</p>
                </div>
                <ActionButton
                  v-if="toast.action"
                  :label="toast.action.label"
                  variant="secondary"
                  size="sm"
                  class="shrink-0"
                  @click="emit('action', toast)" />
              </div>
              <ProgressBar
                v-if="toast.progress !== undefined"
                :value="toast.progress"
                :label="toast.title || toast.message"
                size="xs"
                class="mt-2" />
            </template>
            <template v-else>{{ toast.message }}</template>
          </slot>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
