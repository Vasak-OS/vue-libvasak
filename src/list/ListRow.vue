<script setup lang="ts">
/**
 * Una fila de lista: icono, título, descripción, un dato a la derecha.
 *
 * La forma que unas treinta y cinco listas de nueve aplicaciones escribían a
 * mano: las aplicaciones y los servicios del monitor, las redes Wi-Fi y las
 * cuentas de Configuración, los repositorios de la tienda, los resultados del
 * lanzador, las pistas y las listas de resonance, las cuentas y los mensajes
 * del correo, los contactos, los applets del escritorio.
 *
 * No es `ListCard`: ésa es una tarjeta con canto y relleno que se apoya sola;
 * esto es una fila que vive con otras, en un `ListGroup` o en un panel.
 *
 * # El rol dice qué hace
 *
 * - `none` (por omisión): sólo muestra.
 * - `button`: hace algo al tocarla. Enter y Espacio la activan, como a un botón.
 * - `option`: es una opción de una lista (`role="listbox"`) que maneja otro
 *   —el lanzador la marca desde el campo con `aria-activedescendant`—, así
 *   que no recibe el foco por Tab.
 * - `link`: va a otro lado. Con `href` es un `<a>` de verdad.
 *
 * `selected` es lo elegido (el mensaje abierto, el contacto que se ve): el velo
 * de acento y peso 600, decisión 4. En una opción va como `aria-selected`; en
 * un botón, como `aria-current`, que es «éste es el que se está viendo».
 *
 * # El alto no lo impone
 *
 * La fila no tiene alto fijo: el relleno y el contenido lo dan. Dentro de un
 * desplazador virtual (resonance, el gestor de archivos, el lanzador) el alto
 * lo decide el desplazador, y una fila que impusiera el suyo lo rompería sin
 * que nada fallara (ver la memoria `desplazador-virtual-del-taller`). Para esas
 * listas está `truncate`: el título y la descripción en una línea, con el texto
 * entero en el globo nativo, que es la única forma de cortar sin perder nada.
 */
import { computed, inject } from 'vue';
import ThemeIcon from '../icons/ThemeIcon.vue';
import { LIST_GROUP_KEY } from './context';

type Role = 'none' | 'button' | 'option' | 'link';

const props = withDefaults(
	defineProps<{
		title?: string;
		description?: string;
		/** Un dato corto a la derecha: un tamaño, una hora, un contador. */
		meta?: string;
		/** Nombre de icono del tema. */
		icon?: string;
		iconType?: 'icon' | 'symbol';
		role?: Role;
		/** La destino, para `role="link"`. */
		href?: string;
		selected?: boolean;
		disabled?: boolean;
		/** Todo en una línea, con el texto entero en el globo. Para listas de alto fijo. */
		truncate?: boolean;
		id?: string;
	}>(),
	{ iconType: 'icon', role: 'none', selected: false, disabled: false, truncate: false }
);

const emit = defineEmits<{ click: [event: MouseEvent | KeyboardEvent] }>();

defineSlots<{
	/** En lugar del icono: un avatar, una casilla, una portada. */
	leading?: () => unknown;
	/** En lugar del título y la descripción. */
	default?: () => unknown;
	/** A la derecha, después del dato: un botón, una insignia, un interruptor. */
	trailing?: () => unknown;
}>();

/** Dentro de un `ListGroup` con divisores, la fila va a ras: sin radio propio. */
const group = inject(LIST_GROUP_KEY, null);

const interactive = computed(() => props.role !== 'none');
const tag = computed(() => (props.role === 'link' && props.href ? 'a' : 'div'));

const ariaRole = computed(() => {
	if (props.role === 'none') return undefined;
	if (props.role === 'link' && props.href) return undefined;
	return props.role;
});

const tabindex = computed(() => {
	if (props.disabled) return props.role === 'option' ? undefined : -1;
	if (props.role === 'button' || (props.role === 'link' && !props.href)) return 0;
	return undefined;
});

const tooltip = computed(() =>
	props.truncate ? [props.title, props.description].filter(Boolean).join(' — ') || undefined : undefined
);

function activate(event: MouseEvent | KeyboardEvent) {
	if (props.disabled) {
		event.preventDefault();
		return;
	}
	if (interactive.value) emit('click', event);
}

function onKeydown(event: KeyboardEvent) {
	if (props.role !== 'button' && !(props.role === 'link' && !props.href)) return;
	if (event.target !== event.currentTarget) return;
	if (event.key === 'Enter' || (event.key === ' ' && props.role === 'button')) {
		event.preventDefault();
		activate(event);
	}
}

const classes = computed(() => [
	'flex min-w-0 items-center gap-3 px-3 py-2 text-left text-tx-main transition-colors duration-200 ease-ui',
	group?.divided ? '' : 'rounded-corner-m',
	props.selected ? 'bg-ui-selected-accent font-semibold' : '',
	interactive.value && !props.disabled && !props.selected
		? 'cursor-pointer hover:bg-ui-hover active:bg-ui-pressed active:duration-100'
		: '',
	interactive.value ? 'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ui-focus' : '',
	props.disabled ? 'cursor-not-allowed opacity-50' : '',
]);
</script>

<template>
  <component
    :is="tag"
    :id="id"
    :href="tag === 'a' && !disabled ? href : undefined"
    :role="ariaRole"
    :tabindex="tabindex"
    :aria-selected="role === 'option' ? selected : undefined"
    :aria-current="role === 'button' && selected ? 'true' : undefined"
    :aria-disabled="interactive && disabled ? 'true' : undefined"
    :title="tooltip"
    :class="classes"
    @click="activate"
    @keydown="onKeydown">
    <span v-if="$slots.leading" class="flex shrink-0 items-center"><slot name="leading" /></span>
    <ThemeIcon v-else-if="icon" :name="icon" :type="iconType" :size="24" />
    <span class="flex min-w-0 flex-1 flex-col">
      <slot>
        <span v-if="title" class="text-label-m" :class="truncate ? 'truncate' : 'break-words'">{{ title }}</span>
        <span
          v-if="description"
          class="text-body-xs font-normal text-tx-muted"
          :class="truncate ? 'truncate' : 'break-words'">{{ description }}</span>
      </slot>
    </span>
    <span v-if="meta" class="shrink-0 text-label-xs font-normal text-tx-muted tabular-nums">{{ meta }}</span>
    <span v-if="$slots.trailing" class="flex shrink-0 items-center gap-2"><slot name="trailing" /></span>
  </component>
</template>
