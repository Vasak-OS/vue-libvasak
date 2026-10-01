<script setup lang="ts" generic="T extends string | number">
/**
 * Elegir una de varias: la salida de audio, el sistema de archivos, el
 * detalle del cartel de avisos.
 *
 * Había once en cuatro aplicaciones, y es el genérico que más copias tiene de
 * la misma cosa: el selector de salida de audio estaba **cuatro veces** —dos en
 * el escritorio (`AudioDeviceSelector` y el applet de música) y dos en
 * Configuración (salida y entrada)—, más los tres grupos de radios de las
 * preferencias del correo y la `OpcionRadio` del instalador con su lista de
 * discos. Lo que sube de cada una:
 *
 * - **el teclado**, de la copia de Configuración (`utils/radio-group.ts`), la
 *   única que lo tenía: se entra y se sale con un solo Tab, y las flechas
 *   eligen. Ver `roving.ts`.
 * - **la insignia** («Predeterminado») y **el punto con su contorno de 3:1**,
 *   del escritorio: el canto del punto sin elegir es `ui-border-strong`, que
 *   el config-manager calcula para que llegue a 3:1; el elegido es el
 *   primario con el centro en `tx-on-primary`. Configuración lo dibujaba en
 *   `bg-white`, que no es del esquema.
 * - **la tarjeta con icono** (`variant="card"`), del instalador: el icono en
 *   un recuadro que cambia con la elección, y la descripción. Es la que hace
 *   falta donde el icono **es** lo que se elige: un disco, un sistema de
 *   archivos.
 *
 * # Semántica
 *
 * `role="radiogroup"` con un `role="radio"` por opción: se anuncia «opción 2
 * de 3, elegida», y no cinco botones iguales. Por eso `label` es obligatorio:
 * es el nombre del grupo. Lo elegido lleva el velo de acento
 * (`ui-selected-accent`, decisión 4 del 30/09/2026), y además el punto: en
 * escala de grises el velo y el reposo se confunden.
 */
import { computed, nextTick } from 'vue';
import ThemeIcon from '../icons/ThemeIcon.vue';
import Badge from '../indicators/Badge.vue';
import { focusableValue, rovingStep } from './roving';
import type { OptionGroupOption } from './types';

const props = withDefaults(
	defineProps<{
		options: OptionGroupOption<T>[];
		/** El nombre del grupo, ya traducido. Lo oye un lector de pantalla al entrar. */
		label: string;
		/**
		 * `list`: filas con el punto a la izquierda, para listas largas (salidas
		 * de audio). `card`: tarjetas con icono y descripción y el punto a la
		 * derecha, para pocas opciones que hay que pensar (el disco).
		 */
		variant?: 'list' | 'card';
		/** `sm` es la fila apretada de un applet; `md`, la de una ventana. */
		size?: 'sm' | 'md';
		disabled?: boolean;
	}>(),
	{ variant: 'list', size: 'md', disabled: false }
);

const model = defineModel<T | null>({ default: null });

const emit = defineEmits<{ change: [value: T] }>();

defineSlots<{
	/** Lo que va en lugar del texto de cada opción. */
	option?: (scope: { option: OptionGroupOption<T>; checked: boolean }) => unknown;
	/** Lo que va a la derecha de cada opción, antes del punto en `card`. */
	trailing?: (scope: { option: OptionGroupOption<T>; checked: boolean }) => unknown;
}>();

const effective = computed(() =>
	props.options.map((option) => ({ ...option, disabled: props.disabled || option.disabled }))
);
const tabStop = computed(() => focusableValue(effective.value, model.value));

function choose(option: OptionGroupOption<T>) {
	if (props.disabled || option.disabled || option.value === model.value) return;
	model.value = option.value;
	emit('change', option.value);
}

async function onKeydown(event: KeyboardEvent, index: number) {
	const next = rovingStep(effective.value, index, event.key);
	if (next === null) return;
	event.preventDefault();
	const option = props.options[next];
	if (!option) return;
	// Las hermanas por el DOM y no por un `ref` en el `v-for`: Vue no promete
	// que ese arreglo venga en el orden de las opciones.
	const group = (event.currentTarget as HTMLElement | null)?.parentElement;
	choose(option);
	await nextTick();
	group?.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus();
}

const isCard = computed(() => props.variant === 'card');

function rowClasses(checked: boolean, disabled: boolean) {
	const shape = isCard.value
		? 'items-start gap-3 rounded-corner-l border p-3'
		: props.size === 'sm'
			? 'flex-wrap items-center gap-2 rounded-corner-m p-2'
			: 'flex-wrap items-center gap-x-3 gap-y-1 rounded-corner-m px-3 py-2';
	const state = checked
		? isCard.value
			? 'border-primary bg-ui-selected-accent'
			: 'bg-ui-selected-accent font-semibold'
		: isCard.value
			? 'border-ui-line'
			: '';
	const hover = disabled || checked ? '' : 'hover:bg-ui-hover active:bg-ui-pressed active:duration-100';
	return [shape, state, hover, disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'];
}
</script>

<template>
  <div role="radiogroup" :aria-label="label" :aria-disabled="disabled || undefined" class="flex min-w-0 flex-col" :class="isCard ? 'gap-2' : 'gap-1'">
    <button
      v-for="(option, index) in options"
      :key="option.value"
      type="button"
      role="radio"
      :aria-checked="option.value === model"
      :disabled="effective[index]?.disabled"
      :tabindex="option.value === tabStop ? 0 : -1"
      class="flex w-full min-w-0 text-left text-tx-main transition-colors duration-200 ease-ui focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ui-focus"
      :class="rowClasses(option.value === model, Boolean(effective[index]?.disabled))"
      @click="choose(option)"
      @keydown="onKeydown($event, index)">
      <!-- El punto: a la izquierda en la lista, a la derecha en la tarjeta,
           como estaban en sus copias. -->
      <span
        v-if="!isCard"
        aria-hidden="true"
        class="flex size-4 shrink-0 items-center justify-center rounded-corner-full border-2 transition-colors duration-200 ease-ui"
        :class="option.value === model ? 'border-primary bg-primary' : 'border-ui-border-strong'">
        <span v-if="option.value === model" class="size-2 rounded-corner-full bg-tx-on-primary" />
      </span>

      <span
        v-if="isCard && option.icon"
        aria-hidden="true"
        class="flex size-10 shrink-0 items-center justify-center rounded-corner-m border transition-colors duration-200 ease-ui"
        :class="option.value === model ? 'border-primary bg-ui-selected-accent' : 'border-ui-line bg-ui-surface/70'">
        <ThemeIcon :name="option.icon" :type="option.iconType ?? 'icon'" :size="24" />
      </span>
      <ThemeIcon
        v-else-if="option.icon"
        :name="option.icon"
        :type="option.iconType ?? 'symbol'"
        :size="size === 'sm' ? 16 : 24" />

      <!-- Un mínimo de 96 px para el texto: en un applet angosto la insignia baja
           a la línea de abajo en vez de dejar el nombre en una columna de tres
           letras. Es lo que hacía el selector del escritorio (`min-w-24`). -->
      <span class="flex min-w-24 flex-1 flex-col">
        <slot name="option" :option="option" :checked="option.value === model">
          <span class="break-words" :class="[size === 'sm' ? 'text-label-s' : 'text-label-m', isCard ? 'font-semibold' : '']">{{ option.label }}</span>
          <span v-if="option.description" class="break-words text-body-xs text-tx-muted font-normal">{{ option.description }}</span>
        </slot>
      </span>

      <Badge v-if="option.badge !== undefined && option.badge !== ''" :label="option.badge" class="self-center" />
      <slot name="trailing" :option="option" :checked="option.value === model" />

      <span
        v-if="isCard"
        aria-hidden="true"
        class="mt-1 flex size-4 shrink-0 items-center justify-center rounded-corner-full border-2 transition-colors duration-200 ease-ui"
        :class="option.value === model ? 'border-primary bg-primary' : 'border-ui-border-strong'">
        <span v-if="option.value === model" class="size-2 rounded-corner-full bg-tx-on-primary" />
      </span>
    </button>
  </div>
</template>
