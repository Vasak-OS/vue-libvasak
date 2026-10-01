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
import { type NoticeTone, TOAST_TONE_CLASSES, toneRole } from './tones';

export interface ToastNotice {
	/** Estable mientras el aviso viva: es la clave de la animación. */
	id: string | number;
	message: string;
	tone?: NoticeTone;
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
          :class="TOAST_TONE_CLASSES[toast.tone ?? 'info']">
          <slot :aviso="toast">{{ toast.message }}</slot>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
