<script setup lang="ts">
/**
 * Un punto de estado: conectado, sin leer, el color de un calendario.
 *
 * Había unos doce dibujados a mano en cuatro aplicaciones (el correo, dos en el
 * calendario, dos en el gestor de archivos y cinco en el escritorio), uno de
 * ellos en `bg-amber-500`, que es de la paleta de Tailwind y no del esquema.
 *
 * # El contorno
 *
 * Con el esquema de fábrica, en claro, el punto verde contra el fondo da
 * 2,96:1 y el amarillo 2,31:1: no llegan al 3:1 que pide WCAG 1.4.11 para lo
 * que hay que ver para entender algo. Por eso el punto lleva un canto de 1 px
 * en `ui-border-strong`, que el config-manager calcula para que llegue a 3:1
 * contra el fondo —es lo que hace el punto del selector de audio del escritorio
 * con la opción sin elegir, y de ahí se tomó—. Así la forma se ve con
 * cualquier relleno, incluido un color de dato que no se conoce de antemano.
 *
 * `outlined` en `false` lo saca, para cuando el punto va al lado de un texto
 * que dice lo mismo («Conectado ●»): ahí el punto no es lo que informa.
 *
 * # Lo que oye un lector de pantalla
 *
 * Con `label`, el punto es una imagen con nombre («Sin leer»). Sin `label` es
 * decoración y no se anuncia: un punto mudo en medio de una fila es un
 * «imagen» suelto que no dice nada.
 */
import { computed } from 'vue';

export type StatusDotTone = 'neutral' | 'accent' | 'success' | 'warning' | 'error';

const props = withDefaults(
	defineProps<{
		tone?: StatusDotTone;
		/** Un color que es dato (del servidor, de la persona), en lugar del tono. */
		color?: string;
		/** Late, para lo que está pasando ahora: conectando, grabando. */
		pulse?: boolean;
		/** El nombre del estado, ya traducido. Sin esto el punto es decoración. */
		label?: string;
		size?: 'sm' | 'md';
		outlined?: boolean;
	}>(),
	{ tone: 'neutral', pulse: false, size: 'sm', outlined: true }
);

const TONE: Record<StatusDotTone, string> = {
	neutral: 'bg-tx-muted',
	accent: 'bg-primary',
	success: 'bg-status-success',
	warning: 'bg-status-warning',
	error: 'bg-status-error',
};

const fill = computed(() => (props.color ? 'bg-(--dot-color)' : TONE[props.tone]));
const dataColor = computed(() => (props.color ? { '--dot-color': props.color } : undefined));
</script>

<template>
  <span
    :role="label ? 'img' : undefined"
    :aria-label="label || undefined"
    :aria-hidden="label ? undefined : 'true'"
    class="inline-block shrink-0 rounded-corner-full"
    :class="[
      fill,
      size === 'md' ? 'size-2.5' : 'size-2',
      outlined ? 'ring-1 ring-ui-border-strong' : '',
      pulse ? 'animate-pulse motion-reduce:animate-none' : '',
    ]"
    :style="dataColor" />
</template>
