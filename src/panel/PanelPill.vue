<script setup lang="ts">
/**
 * Una píldora del panel: un botón redondo, un dato con icono o un grupo.
 *
 * Es la pieza del panel en píldoras flotantes del escritorio
 * (vasak-desktop#151, el panel del video de referencia): la barra deja de ser
 * una franja continua y pasa a ser píldoras sueltas sobre el fondo —la
 * búsqueda, el reloj con la fecha debajo, el clima, la Wi-Fi con el nombre de
 * la red, el volumen—, y entre ellas se ve el escritorio.
 *
 * # Superficie
 *
 * Va sobre el escritorio, así que es `bg-ui-shell` —la ventana al 85 %— y
 * **nunca** `backdrop-blur`: el desenfoque lo pone Wayfire detrás de cada
 * superficie translúcida (spec §13). Canto fino `ui-line` y radio
 * `rounded-corner-full`, derivado del radio del usuario.
 *
 * # Activo
 *
 * `active` la rellena en el primario con el texto `tx-on-primary`: lo
 * conectado o lo de ahora (la Wi-Fi conectada, el Bluetooth con un
 * dispositivo). Es el único lugar donde va el acento. El icono va teñido con
 * ese mismo color de texto (`ThemeIcon` con `tint`): el simbólico del tema es
 * claro en oscuro y sobre el primario no llegaba al 3:1.
 *
 * # Botón o no
 *
 * Con `interactive` —lo normal— la raíz es un `<button>` con su `type`, su
 * nombre y el anillo de foco; sin él es un `<div>` quieto que no se pinta al
 * pasar, para lo que sólo informa (la batería) o para agrupar otros botones
 * (la bandeja, los espacios de trabajo). Igual que `TrayIconButton` y `Chip`.
 *
 * `expanded` dice que el applet que abre está abierto: lleva `aria-expanded`
 * y el velo del acento `ui-selected-accent` (lo elegido, decisión 4 de
 * vue-libvasak#74), que se suma sobre la superficie sin taparla.
 *
 * # El texto no la rompe
 *
 * `label` y `caption` (el renglón chico de abajo, «01:42 / 04:19» o la fecha)
 * se cortan con puntos suspensivos; la píldora no crece más que su contenedor
 * (`min-w-0`, `max-w-full`). Los números van con cifras tabulares para que no
 * bailen al cambiar. El texto entero queda en el globo y en el nombre
 * accesible.
 *
 * # De costado
 *
 * `orientation="vertical"` la apila para un panel a un costado: el ancho es el
 * de la barra y lo de adentro va en columna. `flush` le saca el relleno, para
 * un grupo de botones que ya miden 32 cada uno (los espacios de trabajo, la
 * bandeja).
 */
import { computed, useAttrs } from 'vue';
import ThemeIcon from '../icons/ThemeIcon.vue';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
	defineProps<{
		/** El dato principal. */
		label?: string;
		/** El renglón chico de abajo. */
		caption?: string;
		/** Un icono del tema, por nombre. */
		icon?: string;
		iconType?: 'icon' | 'symbol';
		/** Otros nombres del tema para el icono, en orden. */
		iconFallbacks?: readonly string[];
		/** Rellena en el primario: conectado, activo. */
		active?: boolean;
		/** Es un botón. */
		interactive?: boolean;
		/** Lo que abre está abierto. `undefined` no dice nada. */
		expanded?: boolean;
		/** El globo. Sin esto, el dato y el renglón de abajo. */
		title?: string;
		/** El nombre para un lector de pantalla. Sin esto, el globo. */
		accessibleLabel?: string;
		orientation?: 'horizontal' | 'vertical';
		/** Sin relleno: para un grupo cuyos botones ya miden lo suyo. */
		flush?: boolean;
		/**
		 * El rol de una píldora quieta que agrupa otros botones (`group`). Con
		 * él, `accessibleLabel` nombra al grupo.
		 */
		role?: string;
	}>(),
	{
		label: '',
		caption: '',
		icon: '',
		iconType: 'symbol',
		iconFallbacks: () => [],
		active: false,
		interactive: true,
		expanded: undefined,
		title: undefined,
		accessibleLabel: undefined,
		orientation: 'horizontal',
		flush: false,
		role: undefined,
	}
);

const emit = defineEmits<{
	/** Se tocó, con `interactive`. */
	click: [event: MouseEvent];
}>();

const attrs = useAttrs();

const fullText = computed(() => [props.label, props.caption].filter(Boolean).join(' · '));
const tooltip = computed(() => props.title ?? (fullText.value || undefined));
const name = computed(() => props.accessibleLabel ?? tooltip.value);
const vertical = computed(() => props.orientation === 'vertical');
const iconOnly = computed(() => !props.label && !props.caption);

const rootBindings = computed(() =>
	props.interactive
		? {
				type: 'button',
				'aria-label': name.value,
				'aria-expanded': props.expanded === undefined ? undefined : String(props.expanded),
			}
		: { role: props.role, 'aria-label': props.role ? props.accessibleLabel : undefined }
);

const surface = computed(() =>
	props.active
		? 'border-transparent bg-primary text-tx-on-primary'
		: 'border-ui-line bg-ui-shell text-tx-main'
);

const states = computed(() => {
	if (!props.interactive) return '';
	const veil = props.active
		? 'hover:bg-primary/90 active:bg-primary/80'
		: 'hover:before:bg-ui-hover active:before:bg-ui-pressed';
	return `cursor-pointer ${veil} active:duration-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-focus`;
});

const shape = computed(() => {
	if (vertical.value) return `w-8 min-h-8 flex-col ${props.flush ? '' : 'py-2'}`;
	if (props.flush) return 'h-8 min-w-8';
	return iconOnly.value ? 'h-8 min-w-8 justify-center px-1' : 'h-8 px-3';
});

function onClick(event: MouseEvent): void {
	if (props.interactive) emit('click', event);
}
</script>

<template>
  <component
    :is="interactive ? 'button' : 'div'"
    v-bind="{ ...attrs, ...rootBindings }"
    data-panel-pill
    :data-active="active ? 'true' : undefined"
    class="relative isolate inline-flex min-w-0 max-w-full items-center gap-2 rounded-corner-full border tabular-nums transition-colors duration-200 ease-ui before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:rounded-corner-full before:transition-colors before:duration-200 before:ease-ui"
    :class="[surface, states, shape, expanded && !active ? 'before:bg-ui-selected-accent' : '']"
    :title="tooltip"
    @click="onClick">
    <slot name="leading">
      <ThemeIcon
        v-if="icon"
        :name="icon"
        :type="iconType"
        :fallbacks="iconFallbacks"
        :size="18"
        :tint="active"
        alt=""
        class="shrink-0" />
    </slot>
    <span
      v-if="label || caption"
      class="flex min-w-0 flex-col items-start gap-0.5"
      :class="vertical ? 'items-center' : ''"
      data-pill-text>
      <span v-if="label" class="max-w-full min-w-0 truncate text-label-s leading-none font-medium" data-pill-label>{{ label }}</span>
      <span
        v-if="caption"
        class="max-w-full min-w-0 truncate text-label-xs leading-none"
        :class="active ? 'text-tx-on-primary' : 'text-tx-muted'"
        data-pill-caption>{{ caption }}</span>
    </span>
    <slot />
  </component>
</template>
