<script lang="ts" setup>
/**
 * Una opción del menú.
 *
 * Era un `div` con un `@click` y nada más: sin `role`, no era un ítem de menú
 * para nadie que no viera la pantalla, y sin estar en el orden de tabulación no
 * había manera de llegar hasta él con el teclado.
 *
 * # Apagado, pero no escondido
 *
 * Un ítem apagado sigue enfocable y las flechas lo recorren, con
 * `aria-disabled` en vez de sacarlo de la lista: es la misma decisión que en
 * las pestañas del escritorio. Una opción que desaparece del recorrido no se
 * puede descubrir, y «pegar» que no está es indistinguible de «pegar» que no
 * existe en este menú.
 *
 * # `select` y `click`
 *
 * Los dos se emiten al elegir, porque las dos formas estaban en uso. `click`
 * pasa a ser un evento del componente y no el nativo del `div`: así también
 * llega cuando se elige con el teclado, y —lo que antes no pasaba— deja de
 * llegar cuando el ítem está apagado.
 *
 * # La forma (vue-libvasak#74)
 *
 * La opción de Once UI: `rounded-corner-m` dentro del `rounded-corner-l` del
 * panel, 32 de alto como mínimo, `px-3` y un borde de un píxel transparente que
 * la deja del mismo tamaño en todos los estados. **Pasar por encima ya no pinta
 * el acento**: era `hover:bg-primary hover:text-tx-on-primary`, una fila rosa
 * con el texto oscuro en cada movimiento del puntero; ahora es el velo neutro
 * `ui-hover` con el texto de siempre, y `ui-pressed` al apretar. El foco del
 * teclado suma el anillo **por dentro** (`outline-offset: -2px`): el menú
 * desplaza, y un anillo de afuera lo recortaría en el primer y el último ítem.
 *
 * Un nombre largo se parte en dos líneas en vez de cortarse: en un menú, lo
 * que no se lee no se puede elegir.
 *
 * # Lo que sumó la 2.2.0
 *
 * Lo que necesitan el menú de la bandeja (DBusMenu, `TrayPopupView` del
 * escritorio) y los menús con atajos del gestor de archivos. Nada cambia si no
 * se pide.
 *
 * - `checked` (`true`/`false`) vuelve al ítem una opción que se marca:
 *   `role="menuitemcheckbox"` —o `menuitemradio` con `toggle="radio"`, el
 *   «toggle-type» de DBusMenu— con `aria-checked` y la tilde del tema. En
 *   `null` (por omisión) es un ítem común. Al elegirlo emite además
 *   `update:checked` con el valor nuevo: la casilla se invierte, la radio
 *   queda marcada.
 * - `inset` corre el texto tantas columnas de icono (28 px cada una) como se
 *   pida, para que un ítem sin tilde ni icono quede alineado con los que la
 *   tienen —o para el nivel de un submenú aplanado—.
 * - `icon` (un nombre del tema) o la ranura `prefix` adelante; la ranura
 *   `description` debajo del nombre; `shortcut` (las teclas, que dibuja
 *   `Kbd`) o la ranura del mismo nombre al extremo derecho.
 * - `danger`: el velo de pasar por encima y de apretar en el tono de error,
 *   para «Borrar». El texto **no** va en rojo: el rojo del esquema de fábrica
 *   sobre la superficie flotante no llega a 4,5:1 (lo mide
 *   `tests/surface-contrast.test.ts`), así que lo que avisa es la palabra y el
 *   velo, como en `FormGroup`.
 *
 * El teclado del menú recorre los tres roles (`MENU_ITEM_SELECTOR`).
 *
 * # El estado indeterminado (2.4.0)
 *
 * `checked="mixed"` es la casilla a medias: el `toggle-state` −1 de DBusMenu,
 * que el menú de la bandeja del escritorio dibujaba local. Va con
 * `aria-checked="mixed"` y una raya en la columna de la marca —dibujada, como
 * el punto de la radio, porque no hay un nombre del estándar de freedesktop
 * para la casilla indeterminada—. Sólo tiene sentido en una casilla: en una
 * radio, `mixed` se anuncia como no marcada. Al elegirla, `update:checked`
 * sale con `true`, que es lo que hace una casilla indeterminada al tocarla.
 */
import { computed } from 'vue';
import ThemeIcon from '../icons/ThemeIcon.vue';
import Kbd from '../text/Kbd.vue';
import { useMenu } from './types';

const props = withDefaults(
	defineProps<{
		disabled?: boolean;
		/** Marcado, no, o a medias (`mixed`). `null` es un ítem que no se marca. */
		checked?: boolean | 'mixed' | null;
		/** Casilla o radio, cuando se marca. */
		toggle?: 'checkbox' | 'radio';
		/** Columnas de icono que se corre el texto. */
		inset?: number;
		/** Un icono del tema adelante del nombre. */
		icon?: string;
		iconType?: 'icon' | 'symbol';
		/** Las teclas del atajo, ya traducidas. */
		shortcut?: readonly string[];
		danger?: boolean;
	}>(),
	{
		disabled: false,
		checked: null,
		toggle: 'checkbox',
		inset: 0,
		icon: '',
		iconType: 'symbol',
		shortcut: () => [],
		danger: false,
	}
);

const emit = defineEmits<{
	select: [];
	click: [event: Event];
	'update:checked': [value: boolean];
}>();

defineSlots<{
	default?: () => unknown;
	prefix?: () => unknown;
	description?: () => unknown;
	shortcut?: () => unknown;
}>();

const menu = useMenu();

const checkable = computed(() => props.checked !== null);
/** A medias: sólo una casilla puede estarlo. */
const mixed = computed(() => props.checked === 'mixed' && props.toggle === 'checkbox');
const ariaChecked = computed(() => {
	if (!checkable.value) return undefined;
	if (mixed.value) return 'mixed';
	return props.checked === true ? 'true' : 'false';
});
const role = computed(() =>
	!checkable.value ? 'menuitem' : props.toggle === 'radio' ? 'menuitemradio' : 'menuitemcheckbox'
);
/** 28 px por columna: el icono de 16 y la separación de 12. */
const insetStyle = computed(() =>
	props.inset > 0 ? { paddingInlineStart: `calc(0.75rem + ${props.inset * 1.75}rem)` } : undefined
);

function choose(event: Event) {
	if (props.disabled) return;
	if (checkable.value) emit('update:checked', props.toggle === 'radio' || mixed.value ? true : !props.checked);
	emit('select');
	emit('click', event);
	menu.close({ returnFocus: true });
}
</script>

<template>
  <div
    :role="role"
    tabindex="0"
    :aria-disabled="disabled || undefined"
    :aria-checked="ariaChecked"
    :class="[
      'flex min-h-8 min-w-0 items-center gap-3 rounded-corner-m border border-transparent px-3 py-1 text-label-m',
      'transition-colors duration-200 ease-ui',
      'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ui-focus',
      'text-tx-main',
      disabled
        ? 'cursor-not-allowed opacity-50'
        : danger
          ? 'cursor-pointer hover:bg-status-error/10 focus-visible:bg-status-error/10 active:bg-status-error/15 active:duration-100'
          : 'cursor-pointer hover:bg-ui-hover focus-visible:bg-ui-hover active:bg-ui-pressed active:duration-100',
    ]"
    :style="insetStyle"
    :data-danger="danger || undefined"
    @click="choose"
    @keydown.enter.prevent="choose"
    @keydown.space.prevent="choose">
    <!-- La columna de la marca: vacía si no está marcado, para que los ítems
         de un grupo queden alineados. -->
    <span v-if="checkable" aria-hidden="true" class="flex size-4 shrink-0 items-center justify-center" data-check>
      <span v-if="mixed" class="h-0.5 w-2 rounded-corner-full bg-tx-main" data-mixed />
      <template v-else-if="checked === true">
        <span v-if="toggle === 'radio'" class="size-2 rounded-corner-full bg-tx-main" />
        <ThemeIcon v-else name="object-select" type="symbol" :size="16" />
      </template>
    </span>
    <span v-if="$slots.prefix || icon" aria-hidden="true" class="flex shrink-0 items-center">
      <slot name="prefix"><ThemeIcon :name="icon" :type="iconType" :size="16" /></slot>
    </span>
    <span class="flex min-w-0 flex-1 flex-col">
      <span class="min-w-0 break-words"><slot /></span>
      <span v-if="$slots.description" class="min-w-0 break-words text-body-xs text-tx-muted"><slot name="description" /></span>
    </span>
    <span v-if="$slots.shortcut || shortcut.length" class="ml-auto flex shrink-0 items-center text-tx-muted">
      <slot name="shortcut"><Kbd :keys="shortcut" /></slot>
    </span>
  </div>
</template>
