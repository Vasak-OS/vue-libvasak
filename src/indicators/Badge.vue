<script setup lang="ts">
/**
 * Una insignia: un contador, un estado, un origen. Texto corto en una pastilla.
 *
 * Había unas cuarenta dibujadas a mano en nueve aplicaciones, cada una con su
 * borde, su relleno y su tamaño de letra (`text-[10px]`, `text-[11px]`,
 * `text-xs`). Sale de:
 *
 * - `StatusBadge` de vasak-settings: los tonos de estado.
 * - `InsigniaDeOrigen` de vasak-store: la variante con contorno, y lo que esa
 *   copia sabía —que lo que importa tiene que distinguirse por algo más que un
 *   gris (la del AUR iba en color de advertencia)—.
 * - el «predeterminado» del selector de audio del escritorio: el velo
 *   `ui-selected` con el texto de siempre, que es la insignia de `SideButton`.
 *   Antes iba texto `primary` sobre fondo `primary`, que no se leía.
 *
 * # El texto siempre es `tx-main`
 *
 * Las copias pintaban el texto del color del tono (`text-status-warning`), y
 * con el esquema de fábrica eso no se lee: el amarillo sobre el fondo claro da
 * 2,31:1 y el verde 2,96:1. Acá el tono va en el relleno y en el canto, y el
 * texto es el principal, que sobre el relleno al 15 % da más de 5,5:1 en todos
 * los esquemas del sistema (lo mide `tests/surface-contrast.test.ts`).
 *
 * # Variantes
 *
 * - `soft`: el relleno del tono al 15 %. La de siempre.
 * - `outline`: sólo el canto del tono, para lo que va al lado de otras
 *   insignias y no tiene que gritar (el origen de un paquete).
 * - `solid`: el relleno pleno del primario con su texto (`tone="accent"`), o
 *   el del tono al 25 % para los demás —un rojo pleno con texto encima no
 *   llega a 4,5:1 con ningún texto del esquema, igual que el botón `danger`—.
 * - `overlay`: sobre una imagen o un vídeo, con el velo `ui-overlay`.
 *
 * `color` es para cuando el color **es un dato**: la etiqueta que eligió la
 * persona en el gestor de archivos, el color de un calendario. Va por estilo
 * en línea y tiñe el punto y el canto, nunca el texto.
 */
import { computed } from 'vue';

export type BadgeTone = 'neutral' | 'accent' | 'info' | 'success' | 'warning' | 'error';
type Variant = 'soft' | 'outline' | 'solid' | 'overlay';

const props = withDefaults(
	defineProps<{
		tone?: BadgeTone;
		variant?: Variant;
		size?: 'sm' | 'md';
		/** Un punto del color del tono antes del texto. */
		dot?: boolean;
		/** Un color que es dato (de la persona, del servidor). Tiñe el punto y el canto. */
		color?: string;
		/** El texto, si no va en la ranura. */
		label?: string | number;
	}>(),
	{ tone: 'neutral', variant: 'soft', size: 'sm', dot: false }
);

/** El relleno de cada variante, por tono. */
const FILL: Record<Exclude<Variant, 'overlay'>, Record<BadgeTone, string>> = {
	soft: {
		neutral: 'bg-ui-selected',
		accent: 'bg-ui-selected-accent',
		info: 'bg-ui-selected-accent',
		success: 'bg-status-success/15',
		warning: 'bg-status-warning/15',
		error: 'bg-status-error/15',
	},
	outline: {
		neutral: 'bg-transparent',
		accent: 'bg-transparent',
		info: 'bg-transparent',
		success: 'bg-transparent',
		warning: 'bg-transparent',
		error: 'bg-transparent',
	},
	solid: {
		neutral: 'bg-ui-pressed',
		accent: 'bg-primary',
		info: 'bg-primary',
		success: 'bg-status-success/25',
		warning: 'bg-status-warning/25',
		error: 'bg-status-error/25',
	},
};

/** El canto: sólo lo lleva `outline`; las demás lo tienen transparente para medir lo mismo. */
const OUTLINE_BORDER: Record<BadgeTone, string> = {
	neutral: 'border-ui-line',
	accent: 'border-primary',
	info: 'border-primary',
	success: 'border-status-success',
	warning: 'border-status-warning',
	error: 'border-status-error',
};

const DOT: Record<BadgeTone, string> = {
	neutral: 'bg-tx-muted',
	accent: 'bg-primary',
	info: 'bg-primary',
	success: 'bg-status-success',
	warning: 'bg-status-warning',
	error: 'bg-status-error',
};

const fillClass = computed(() =>
	props.variant === 'overlay' ? 'bg-ui-overlay' : FILL[props.variant][props.tone]
);

/** Con un color de dato, el canto es ése; si no, el del tono en `outline` y ninguno en las demás. */
const borderClass = computed(() => {
	if (props.color) return 'border-(--badge-color)';
	return props.variant === 'outline' ? OUTLINE_BORDER[props.tone] : 'border-transparent';
});

/**
 * El texto, aparte del relleno: dos clases de color de texto en el mismo
 * atributo no las decide el orden en que se escriben sino el de la hoja.
 */
const textClass = computed(() =>
	props.variant === 'solid' && (props.tone === 'accent' || props.tone === 'info') ? 'text-tx-on-primary' : 'text-tx-main'
);

/**
 * Alto **mínimo**: una insignia con un texto que no entra se parte en dos
 * líneas en vez de cortarse, que es perder lo que dice.
 */
const sizeClass = computed(() => (props.size === 'md' ? 'min-h-6 px-2 text-label-s' : 'min-h-5 px-2 text-label-xs'));

/** El color de dato, como variable: el punto y el canto lo leen. */
const dataColor = computed(() => (props.color ? { '--badge-color': props.color } : undefined));
</script>

<template>
  <span
    class="inline-flex max-w-full min-w-0 shrink-0 items-center gap-1 rounded-corner-full border font-semibold break-words"
    :class="[fillClass, borderClass, textClass, sizeClass]"
    :style="dataColor">
    <span
      v-if="dot || color"
      aria-hidden="true"
      class="size-1.5 shrink-0 rounded-corner-full"
      :class="color ? 'bg-(--badge-color)' : DOT[tone]" />
    <span class="min-w-0"><slot>{{ label }}</slot></span>
  </span>
</template>
