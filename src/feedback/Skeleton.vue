<script setup lang="ts">
/**
 * El lugar de algo que todavía no llegó: una línea de texto, una miniatura, un
 * avatar.
 *
 * Seis copias en tres aplicaciones (el gestor de archivos, la galería,
 * Configuración), cada una con su gris y su animación. Acá es el velo
 * `ui-selected` —el gris del esquema, en claro y en oscuro— y late despacio
 * con `animate-pulse`. Con movimiento reducido queda quieto: quien pidió que
 * nada se mueva no pidió una excepción para lo que carga.
 *
 * No se anuncia: es decoración. Lo que está cargando lo dice quien lo usa, con
 * `aria-busy` en la región o un `LoadingState`.
 *
 * El tamaño: `width` y `height` aceptan cualquier medida CSS (`'60%'`,
 * `'3rem'`) o un número de píxeles. Sin `width`, ocupa el ancho que le den
 * —nunca más—, así que en una columna angosta no desborda; en una fila se
 * encoge al lado de un círculo, que es lo único que no se encoge.
 */
import { computed } from 'vue';

const props = withDefaults(
	defineProps<{
		width?: string | number;
		height?: string | number;
		shape?: 'line' | 'block' | 'circle';
	}>(),
	{ shape: 'line' }
);

function measure(value: string | number | undefined): string | undefined {
	if (value === undefined || value === '') return undefined;
	return typeof value === 'number' ? `${value}px` : value;
}

const style = computed(() => {
	const width = measure(props.width);
	const height = measure(props.height);
	// El círculo es cuadrado: sin alto, el del ancho.
	if (props.shape === 'circle') {
		const side = width ?? height ?? '2rem';
		return { width: side, height: height ?? side };
	}
	return { width, height };
});

const SHAPE: Record<'line' | 'block' | 'circle', string> = {
	line: 'h-4 rounded-corner-xs',
	block: 'h-24 rounded-corner-m',
	circle: 'rounded-corner-full',
};
</script>

<template>
  <span
    aria-hidden="true"
    data-skeleton
    class="block max-w-full animate-pulse bg-ui-selected motion-reduce:animate-none"
    :class="[SHAPE[shape], shape === 'circle' ? 'shrink-0' : 'min-w-0', width === undefined && shape !== 'circle' ? 'w-full' : '']"
    :style="style" />
</template>
