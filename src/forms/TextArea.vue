<script setup lang="ts">
/**
 * Un campo de texto de varias líneas.
 *
 * Es el espejo de `TextInput`, con las mismas propiedades y el mismo
 * `focus()`: quien sabe usar uno sabe usar el otro, y un cambio de forma llega
 * a los dos. Había cuatro `<textarea>` sueltos en dos aplicaciones —el cuerpo
 * del mensaje en la ventana de redacción del correo, el editor de atajos y dos
 * campos de la VPN en Configuración—, todos con el dibujo del tema de GTK.
 *
 * Como `TextInput`, no trae etiqueta: la pone `FormGroup`, que la ata por `id`.
 *
 * # La forma
 *
 * La de `TextInput` —`rounded-corner-m`, el canto de 3:1 de los controles
 * (decisión 5), el anillo de 2 px separado 2 px—, sin el alto fijo: lo dan
 * `rows` y lo que la persona estire. Se estira sólo a lo alto por omisión:
 * estirado a lo ancho se sale de la columna que le dieron.
 */
import { computed, ref } from 'vue';

const props = withDefaults(
	defineProps<{
		modelValue: string;
		/** Cuántas líneas se ven antes de desplazar. */
		rows?: number;
		id?: string;
		/** El nombre del campo cuando no hay etiqueta visible que se lo dé. */
		ariaLabel?: string;
		/** El `id` del texto que explica el error o la ayuda. */
		describedBy?: string;
		placeholder?: string;
		disabled?: boolean;
		readonly?: boolean;
		/** El borde de peligro, para un valor que quien llama juzgó inválido. */
		invalid?: boolean;
		/** Para texto donde la alineación importa: una receta, un registro. */
		mono?: boolean;
		required?: boolean;
		maxlength?: number;
		/** Hacia dónde se puede estirar. */
		resize?: 'none' | 'vertical' | 'both';
		/** Avisa al salir del campo y no en cada tecla. */
		lazy?: boolean;
		spellcheck?: boolean;
	}>(),
	{
		rows: 4,
		disabled: false,
		readonly: false,
		invalid: false,
		mono: false,
		required: false,
		resize: 'vertical',
		lazy: false,
		spellcheck: true,
	}
);

const emit = defineEmits<{
	'update:modelValue': [value: string];
	/**
	 * Las teclas, declaradas y reenviadas a mano, como en `TextInput`: el
	 * correo manda con Ctrl+Enter desde el cuerpo del mensaje. Declararlas las
	 * saca de los atributos, así que el reenvío de la plantilla no es opcional.
	 */
	keydown: [event: KeyboardEvent];
	keyup: [event: KeyboardEvent];
}>();

function onInput(event: Event) {
	if (props.lazy) return;
	emit('update:modelValue', (event.target as HTMLTextAreaElement).value);
}

function onChange(event: Event) {
	if (!props.lazy) return;
	emit('update:modelValue', (event.target as HTMLTextAreaElement).value);
}

const field = ref<HTMLTextAreaElement | null>(null);

/** Enfoca el campo y dice si lo consiguió, como `TextInput.focus()`. */
function focus(): boolean {
	field.value?.focus();
	return field.value !== null && document.activeElement === field.value;
}

defineExpose({ focus });

const RESIZE: Record<'none' | 'vertical' | 'both', string> = {
	none: 'resize-none',
	vertical: 'resize-y',
	both: 'resize',
};

const classes = computed(() => [
	'block w-full min-w-0 rounded-corner-m border bg-ui-surface/70 px-3 py-2 text-label-m text-tx-main',
	'placeholder:text-tx-muted transition-colors duration-200 ease-ui',
	'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-focus',
	props.invalid ? 'border-status-error' : 'border-ui-border-strong',
	props.invalid || props.disabled ? '' : 'hover:border-tx-main',
	props.mono ? 'font-mono' : '',
	props.disabled ? 'cursor-not-allowed opacity-50' : '',
	RESIZE[props.resize],
]);
</script>

<template>
  <textarea
    :id="id"
    ref="field"
    :value="modelValue"
    :rows="rows"
    :aria-label="ariaLabel"
    :aria-describedby="describedBy"
    :aria-invalid="invalid || undefined"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :required="required"
    :maxlength="maxlength"
    :spellcheck="spellcheck"
    :class="classes"
    @input="onInput"
    @change="onChange"
    @keydown="emit('keydown', $event)"
    @keyup="emit('keyup', $event)" />
</template>
