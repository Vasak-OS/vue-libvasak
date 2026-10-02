<script setup lang="ts">
/**
 * Un icono del tema en un recuadro: el que acompaña a un paso, una cuenta, una
 * opción.
 *
 * Unos diez en tres aplicaciones —el instalador (cinco: el de cada paso, el que
 * cambia con la opción elegida), el escritorio, Configuración— y el recuadro
 * que `SwitchRow` y `PageHeader` dibujan por dentro.
 *
 * # Tonos
 *
 * `neutral` es la superficie con su canto; `selected`, el velo de acento con el
 * canto del primario (lo que se eligió, como la tarjeta elegida de Once UI);
 * `accent`, el primario pleno; `success`, `warning` y `error`, el velo del tono
 * al 15 % con su canto. El icono es el del tema, en sus colores: el tono es
 * del recuadro.
 *
 * # La esquina
 *
 * `status` pone un icono chico en la esquina —hecho, falló, atención—, que es
 * lo que el instalador muestra en cada paso. Con `statusLabel` se anuncia; sin
 * él es decoración, porque casi siempre el texto de al lado ya dice lo mismo.
 *
 * `shape="circle"` es para lo redondo por naturaleza (una persona, un
 * dispositivo); el recuadro sigue el radio del sistema.
 */
import { computed } from 'vue';
import ThemeIcon from '../icons/ThemeIcon.vue';

export type IconTileTone = 'neutral' | 'selected' | 'accent' | 'success' | 'warning' | 'error';
export type IconTileStatus = 'success' | 'warning' | 'error';

const props = withDefaults(
	defineProps<{
		name: string;
		type?: 'icon' | 'symbol';
		size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
		tone?: IconTileTone;
		shape?: 'square' | 'circle';
		status?: IconTileStatus | null;
		statusLabel?: string;
		/** Si el recuadro **es** la etiqueta, su nombre. Sin él, decoración. */
		label?: string;
	}>(),
	{ type: 'icon', size: 'md', tone: 'neutral', shape: 'square', status: null }
);

const TONE: Record<IconTileTone, string> = {
	neutral: 'border-ui-line bg-ui-surface/70',
	selected: 'border-primary bg-ui-selected-accent',
	accent: 'border-primary bg-primary',
	success: 'border-status-success bg-status-success/15',
	warning: 'border-status-warning bg-status-warning/15',
	error: 'border-status-error bg-status-error/15',
};

/**
 * 32, 40 y 48 de lado, con el icono a 20, 24 y 32; y desde la 2.4.0 `xl` (64,
 * icono de 40) y `2xl` (80, icono de 48): el círculo de las acciones de la
 * sesión del escritorio, que seguía local porque el recuadro llegaba a 48.
 */
const BOX = { sm: 'size-8', md: 'size-10', lg: 'size-12', xl: 'size-16', '2xl': 'size-20' } as const;
const ICON = { sm: 20, md: 24, lg: 32, xl: 40, '2xl': 48 } as const;

const STATUS_ICON: Record<IconTileStatus, string> = {
	success: 'object-select',
	warning: 'dialog-warning',
	error: 'dialog-error',
};
/** El canto del tono; el relleno va en una capa aparte, encima del opaco. */
const STATUS_BORDER: Record<IconTileStatus, string> = {
	success: 'border-status-success',
	warning: 'border-status-warning',
	error: 'border-status-error',
};
const STATUS_FILL: Record<IconTileStatus, string> = {
	success: 'bg-status-success/15',
	warning: 'bg-status-warning/15',
	error: 'bg-status-error/15',
};

/**
 * El nombre del recuadro: el suyo y el del estado juntos, porque un `img` con
 * nombre esconde lo que tiene adentro.
 */
const accessibleName = computed(() =>
	props.label ? [props.label, props.statusLabel].filter(Boolean).join(', ') : undefined
);
const announced = computed(() => Boolean(props.label || props.statusLabel));

/**
 * Las esquinas del recuadro: la `m` del sistema hasta 40, la `l` en el grande
 * —el anidado de Once UI, para que el icono no quede en una caja más curva que
 * la tarjeta que la contiene— y la `xl` en los de 64 y 80. El círculo es
 * círculo.
 */
const corner = computed(() => {
	if (props.shape === 'circle') return 'rounded-corner-full';
	if (props.size === 'xl' || props.size === '2xl') return 'rounded-corner-xl';
	return props.size === 'lg' ? 'rounded-corner-l' : 'rounded-corner-m';
});
</script>

<template>
  <span
    class="relative inline-flex shrink-0 items-center justify-center border transition-colors duration-200 ease-ui"
    :class="[BOX[size], TONE[tone], corner]"
    :role="label ? 'img' : undefined"
    :aria-label="accessibleName"
    :aria-hidden="announced ? undefined : 'true'"
    :data-tone="tone">
    <ThemeIcon :name="name" :type="type" :size="ICON[size]" />
    <span
      v-if="status"
      class="absolute -right-1 -bottom-1 flex size-4 items-center justify-center rounded-corner-full border bg-ui-float"
      :class="STATUS_BORDER[status]"
      :role="statusLabel && !label ? 'img' : undefined"
      :aria-label="statusLabel && !label ? statusLabel : undefined"
      :data-status="status">
      <span aria-hidden="true" class="absolute inset-0 rounded-corner-full" :class="STATUS_FILL[status]" />
      <ThemeIcon :name="STATUS_ICON[status]" type="symbol" :size="12" class="relative" />
    </span>
  </span>
</template>
