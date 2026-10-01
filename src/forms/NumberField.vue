<script setup lang="ts">
/**
 * Un campo numérico.
 *
 * Sale de dos copias que sabían cosas distintas:
 *
 * - el `NumberInput` de vasak-settings (26 usos, más los dos puertos de
 *   «Cuentas en línea»): **nunca emite `NaN`**. Vaciar el campo escribía `NaN`
 *   en la configuración, y eso se dibujaba como un campo vacío que no se
 *   recuperaba. Lo que no se puede leer como número no se emite, y al salir
 *   del campo vuelve a mostrar el último valor bueno.
 * - el `NumberField` de vasak-file-manager: los botones − y +, que no dejan
 *   pasar los límites y se apagan en ellos.
 *
 * Y suma lo que no tenía ninguna: **el ajuste a los límites va al salir del
 * campo, no en cada tecla**. La copia del gestor de archivos lo hacía en cada
 * tecla, así que con un mínimo de 10 no se podía escribir «15»: el «1» ya se
 * convertía en 10. Y los pasos decimales se redondean a la cantidad de cifras
 * del paso: 0,1 + 0,2 da 0,30000000000000004 en coma flotante y eso no es lo
 * que la persona escribió.
 *
 * # La forma
 *
 * La de `TextInput`: 32 de alto, `rounded-corner-m`, el canto de 3:1. Los
 * botones son los `ghost` de 32 de `ActionButton`, con los iconos `list-remove`
 * y `list-add` del tema. Con ellos, las flechas nativas del campo se apagan:
 * dos maneras de sumar uno en el mismo lugar es una de más.
 */
import { computed, ref } from 'vue';
import ActionButton from '../controls/ActionButton.vue';
import { useLabels } from '../shared/labels';

const props = withDefaults(
	defineProps<{
		modelValue: number;
		min?: number;
		max?: number;
		step?: number;
		/** Los botones − y + a los costados. */
		stepper?: boolean;
		/** Del ancho de su contenido (128 px) en vez de llenar la fila. */
		narrow?: boolean;
		invalid?: boolean;
		disabled?: boolean;
		id?: string;
		/** El nombre del campo cuando no hay etiqueta visible que se lo dé. */
		ariaLabel?: string;
		describedBy?: string;
		placeholder?: string;
		/** Lo que se oye en el botón −. Sin esto, del catálogo (`numberField.decrement`) o «Restar». */
		decrementLabel?: string;
		/** Lo que se oye en el botón +. Sin esto, del catálogo (`numberField.increment`) o «Sumar». */
		incrementLabel?: string;
	}>(),
	{ step: 1, stepper: false, narrow: false, invalid: false, disabled: false }
);

const emit = defineEmits<{
	'update:modelValue': [value: number];
	/** Al salir del campo o al apretar un botón, con el valor ya ajustado. */
	change: [value: number];
}>();

const translate = useLabels();
const field = ref<HTMLInputElement | null>(null);

/** Cuántas cifras decimales tiene el paso, para redondear a ellas. */
const decimals = computed(() => {
	const text = String(props.step);
	const dot = text.indexOf('.');
	return dot === -1 ? 0 : text.length - dot - 1;
});

function round(value: number): number {
	return Number(value.toFixed(decimals.value));
}

function clamp(value: number): number {
	let result = value;
	if (props.min !== undefined) result = Math.max(props.min, result);
	if (props.max !== undefined) result = Math.min(props.max, result);
	return round(result);
}

/** Lo que el campo dice ahora, o `null` si no es un número. */
function parse(raw: string): number | null {
	if (raw.trim() === '') return null;
	const value = Number.parseFloat(raw.replace(',', '.'));
	return Number.isNaN(value) ? null : value;
}

function onInput(event: Event) {
	const value = parse((event.target as HTMLInputElement).value);
	if (value === null) return;
	emit('update:modelValue', value);
}

/**
 * Al salir: el valor se ajusta a los límites, y si lo escrito no era un
 * número el campo vuelve a mostrar el último bueno.
 */
function onChange(event: Event) {
	const target = event.target as HTMLInputElement;
	const value = parse(target.value);
	const settled = value === null ? props.modelValue : clamp(value);
	target.value = String(settled);
	if (settled !== props.modelValue) emit('update:modelValue', settled);
	emit('change', settled);
}

function nudge(direction: 1 | -1) {
	const settled = clamp(props.modelValue + direction * props.step);
	emit('update:modelValue', settled);
	emit('change', settled);
}

const atMin = computed(() => props.min !== undefined && props.modelValue <= props.min);
const atMax = computed(() => props.max !== undefined && props.modelValue >= props.max);

const decrementName = computed(() => props.decrementLabel ?? translate('numberField.decrement', 'Restar'));
const incrementName = computed(() => props.incrementLabel ?? translate('numberField.increment', 'Sumar'));

function focus(): boolean {
	field.value?.focus();
	return field.value !== null && document.activeElement === field.value;
}

defineExpose({ focus });

const inputClasses = computed(() => [
	'h-8 min-w-0 flex-1 rounded-corner-m border bg-ui-surface/70 px-3 text-label-m text-tx-main tabular-nums',
	'placeholder:text-tx-muted transition-colors duration-200 ease-ui',
	'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-focus',
	props.invalid ? 'border-status-error' : 'border-ui-border-strong',
	props.invalid || props.disabled ? '' : 'hover:border-tx-main',
	props.disabled ? 'cursor-not-allowed opacity-50' : '',
	props.stepper
		? '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
		: '',
]);
</script>

<template>
  <div class="flex min-w-0 items-center gap-1" :class="narrow ? 'w-32 max-w-full' : 'w-full'">
    <ActionButton
      v-if="stepper"
      :label="''"
      :icon-alt="decrementName"
      icon="list-remove-symbolic"
      variant="ghost"
      :disabled="disabled || atMin"
      @click="nudge(-1)" />
    <input
      :id="id"
      ref="field"
      type="number"
      inputmode="decimal"
      :value="modelValue"
      :min="min"
      :max="max"
      :step="step"
      :placeholder="placeholder"
      :disabled="disabled"
      :aria-label="ariaLabel"
      :aria-describedby="describedBy"
      :aria-invalid="invalid || undefined"
      :class="inputClasses"
      @input="onInput"
      @change="onChange" />
    <ActionButton
      v-if="stepper"
      :label="''"
      :icon-alt="incrementName"
      icon="list-add-symbolic"
      variant="ghost"
      :disabled="disabled || atMax"
      @click="nudge(1)" />
  </div>
</template>
