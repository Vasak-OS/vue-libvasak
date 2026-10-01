<script setup lang="ts" generic="T extends string | number">
/**
 * Unas pocas opciones de una sola elección, una al lado de la otra: lista o
 * cuadrícula, claro u oscuro, el ancho de la sangría.
 *
 * Es el `SegmentedControl` de Once UI. Había ocho dibujados a mano en siete
 * aplicaciones: text (la sangría), store (las secciones), settings (oscuro o
 * claro), file-manager (lista o cuadrícula), resonance (las etiquetas de las
 * radios), desktop (los dispositivos del teléfono) y la galería.
 *
 * - **`segmented`**: un carril con canto fino y las opciones adentro. La
 *   elegida lleva el velo de acento y peso 600 —decisión 4: lo elegido se
 *   marca con el acento— y no el relleno pleno del primario que usaba la
 *   tienda, que en una barra de cuatro secciones era una gritando.
 * - **`chips`**: pastillas sueltas que se acomodan en varias líneas, para un
 *   filtro con muchas opciones (las etiquetas de las radios de resonance).
 *
 * Lo que sube de la tienda: **la insignia** con el contador de pendientes
 * (`badge` en la opción), y que una sección es una **navegación** y no un grupo
 * de radios: con `href` en las opciones el control es un `<nav>` con enlaces y
 * `aria-current="page"` en la actual, como lo tenía `SelectorDeSeccion`. Ahí no
 * hay flechas —los enlaces se recorren con Tab, como cualquier navegación— y
 * `navigate` deja que la aplicación use su enrutador en vez del enlace.
 *
 * # Teclado
 *
 * Como `OptionGroup`: `role="radiogroup"`, un solo Tab para entrar y salir, y
 * las flechas eligen (`roving.ts`).
 *
 * # Adaptable
 *
 * Las opciones se parten en dos líneas antes de salirse: el carril tiene
 * `flex-wrap`, y cada opción tiene un mínimo de 32 de alto aunque el texto sea
 * chico, que es el objetivo táctil del sistema.
 */
import { computed, nextTick } from 'vue';
import ThemeIcon from '../icons/ThemeIcon.vue';
import Badge from '../indicators/Badge.vue';
import { focusableValue, rovingStep } from './roving';
import type { SegmentedOption } from './types';

const props = withDefaults(
	defineProps<{
		options: SegmentedOption<T>[];
		/** El nombre del grupo, ya traducido. */
		label: string;
		variant?: 'segmented' | 'chips';
		disabled?: boolean;
	}>(),
	{ variant: 'segmented', disabled: false }
);

const model = defineModel<T | null>({ default: null });

const emit = defineEmits<{
	change: [value: T];
	/**
	 * Se eligió un enlace. `event.preventDefault()` acá deja que la aplicación
	 * navegue con su enrutador en vez de cargar la página de nuevo.
	 */
	navigate: [value: T, event: MouseEvent];
}>();

const navigation = computed(() => props.options.some((option) => option.href !== undefined));
const effective = computed(() =>
	props.options.map((option) => ({ ...option, disabled: props.disabled || option.disabled }))
);
const tabStop = computed(() => focusableValue(effective.value, model.value));

function choose(option: SegmentedOption<T>) {
	if (props.disabled || option.disabled || option.value === model.value) return;
	model.value = option.value;
	emit('change', option.value);
}

function onLinkClick(option: SegmentedOption<T>, event: MouseEvent) {
	if (props.disabled || option.disabled) {
		event.preventDefault();
		return;
	}
	emit('navigate', option.value, event);
	choose(option);
}

async function onKeydown(event: KeyboardEvent, index: number) {
	const next = rovingStep(effective.value, index, event.key);
	if (next === null) return;
	event.preventDefault();
	const option = props.options[next];
	if (!option) return;
	const group = (event.currentTarget as HTMLElement | null)?.parentElement;
	choose(option);
	await nextTick();
	group?.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus();
}

const isChips = computed(() => props.variant === 'chips');

const containerClass = computed(() =>
	isChips.value
		? 'flex flex-wrap gap-2'
		: 'inline-flex max-w-full flex-wrap gap-0.5 rounded-corner-l border border-ui-line bg-ui-surface/70 p-0.5'
);

function itemClasses(selected: boolean, disabled: boolean) {
	const shape = isChips.value
		? 'rounded-corner-full border px-3'
		: 'rounded-corner-m border border-transparent px-3';
	const state = selected
		? isChips.value
			? 'border-primary bg-ui-selected-accent font-semibold'
			: 'bg-ui-selected-accent font-semibold'
		: isChips.value
			? 'border-ui-line'
			: '';
	const hover = disabled || selected ? '' : 'hover:bg-ui-hover active:bg-ui-pressed active:duration-100';
	return [shape, state, hover, disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'];
}
</script>

<template>
  <nav v-if="navigation" :aria-label="label" :class="containerClass">
    <a
      v-for="(option, index) in options"
      :key="option.value"
      :href="effective[index]?.disabled ? undefined : option.href"
      :aria-current="option.value === model ? 'page' : undefined"
      :aria-disabled="effective[index]?.disabled || undefined"
      :aria-label="option.iconOnly ? option.label : undefined"
      :title="option.iconOnly ? option.label : undefined"
      class="inline-flex min-h-8 min-w-0 items-center justify-center gap-2 text-label-m text-tx-main transition-colors duration-200 ease-ui focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ui-focus"
      :class="itemClasses(option.value === model, Boolean(effective[index]?.disabled))"
      @click="onLinkClick(option, $event)">
      <ThemeIcon v-if="option.icon" :name="option.icon" :type="option.iconType ?? 'symbol'" :size="16" />
      <span v-if="!option.iconOnly" class="min-w-0 break-words">{{ option.label }}</span>
      <Badge v-if="option.badge !== undefined && option.badge !== ''" :label="option.badge" :tone="option.badgeTone ?? 'neutral'" variant="solid" />
    </a>
  </nav>
  <div v-else role="radiogroup" :aria-label="label" :class="containerClass">
    <button
      v-for="(option, index) in options"
      :key="option.value"
      type="button"
      role="radio"
      :aria-checked="option.value === model"
      :aria-label="option.iconOnly ? option.label : undefined"
      :title="option.iconOnly ? option.label : undefined"
      :disabled="effective[index]?.disabled"
      :tabindex="option.value === tabStop ? 0 : -1"
      class="inline-flex min-h-8 min-w-0 items-center justify-center gap-2 text-label-m text-tx-main transition-colors duration-200 ease-ui focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ui-focus"
      :class="itemClasses(option.value === model, Boolean(effective[index]?.disabled))"
      @click="choose(option)"
      @keydown="onKeydown($event, index)">
      <ThemeIcon v-if="option.icon" :name="option.icon" :type="option.iconType ?? 'symbol'" :size="16" />
      <span v-if="!option.iconOnly" class="min-w-0 break-words">{{ option.label }}</span>
      <Badge v-if="option.badge !== undefined && option.badge !== ''" :label="option.badge" :tone="option.badgeTone ?? 'neutral'" variant="solid" />
    </button>
  </div>
</template>
