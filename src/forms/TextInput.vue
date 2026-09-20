<script setup lang="ts">
/**
 * Un campo de texto.
 *
 * Venía de tres formas —51, 73 y 61 líneas—, y las tres habían llegado por
 * separado a las mismas dos propiedades que no son obvias: `invalid`, que
 * dibuja el borde de peligro para un valor que quien llama juzgó mal, y `mono`,
 * para valores donde la alineación importa —rutas, órdenes, reglas—. Que las
 * tres las inventaran solas es la mejor señal de que van acá.
 *
 * No trae etiqueta: para eso está `FormGroup`, que ya la ata al campo por `id`.
 * Poner otra acá dejaría dos formas de hacer lo mismo. Pero el `id` de esa atadura
 * va declarado —era lo único que sostenía ese contrato y no estaba escrito en
 * ningún lado—, y queda `ariaLabel` para el campo que se usa suelto: una caja de
 * búsqueda con lupa y sin etiqueta visible no tiene otra forma de tener nombre, y
 * sin nombre un lector de pantalla sólo dice «campo de texto».
 */
import { computed } from 'vue';

const props = withDefaults(
	defineProps<{
		modelValue: string;
		type?: 'text' | 'password' | 'search' | 'url' | 'email' | 'number';
		/** La otra mitad del `for` de `FormGroup`: sin esto la etiqueta no ata a nada. */
		id?: string;
		/** El nombre del campo cuando no hay etiqueta visible que se lo dé. */
		ariaLabel?: string;
		/**
		 * El `id` del texto que explica el error o la ayuda de abajo.
		 *
		 * Sin esto, el mensaje de error se ve pero no se anuncia: quien no mira la
		 * pantalla oye que el campo es inválido y nunca por qué.
		 */
		describedBy?: string;
		/**
		 * Qué autocompletar. Va declarado y no por caída de atributos porque con
		 * `strictTemplates` lo que no está declarado no se puede pasar.
		 */
		autocomplete?: string;
		placeholder?: string;
		disabled?: boolean;
		readonly?: boolean;
		/** El borde de peligro, para un valor que quien llama juzgó inválido. */
		invalid?: boolean;
		/** Para valores donde la alineación importa: rutas, órdenes, reglas. */
		mono?: boolean;
		required?: boolean;
		/**
		 * Avisa al salir del campo y no en cada tecla.
		 *
		 * Para lo que cuesta caro validar o guardar. Sin esto, escribir una ruta
		 * de treinta letras dispara treinta veces lo que haya del otro lado.
		 */
		lazy?: boolean;
	}>(),
	{ type: 'text', disabled: false, readonly: false, invalid: false, mono: false, required: false, lazy: false }
);

const emit = defineEmits<{
	'update:modelValue': [valor: string];
	/**
	 * Las teclas, declaradas y reenviadas a mano.
	 *
	 * Caían solas sobre el `input` —es su nodo raíz— y funcionaban, pero con
	 * `strictTemplates` lo que no está declarado no se puede pasar, y hay dos
	 * usos de verdad: la tienda confirma con Enter y la configuración conecta
	 * al Wi-Fi y guarda credenciales con Enter, en siete lugares.
	 *
	 * Declararlas tiene un filo conocido: Vue saca de los atributos **todo**
	 * evento declarado, así que el reenvío de abajo no es opcional. Sin él el
	 * campo enmudece, el chequeo de tipos sigue en cero y nada avisa. De ahí
	 * que cada uno tenga su prueba.
	 */
	keyup: [evento: KeyboardEvent];
	keydown: [evento: KeyboardEvent];
}>();

function alEscribir(evento: Event) {
	if (props.lazy) return;
	emit('update:modelValue', (evento.target as HTMLInputElement).value);
}

function alSalir(evento: Event) {
	if (!props.lazy) return;
	emit('update:modelValue', (evento.target as HTMLInputElement).value);
}

const clases = computed(() => [
	'w-full rounded-corner border bg-ui-surface/70 px-3 py-1.5 text-sm text-tx-main',
	'placeholder:text-tx-muted focus:outline-none focus:ring-1 focus:ring-primary',
	props.invalid ? 'border-status-error' : 'border-ui-border',
	props.mono ? 'font-mono' : '',
	props.disabled ? 'cursor-not-allowed opacity-60' : '',
]);
</script>

<template>
  <input
    :id="id"
    :aria-label="ariaLabel"
    :type="type"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :required="required"
    :aria-describedby="describedBy"
    :autocomplete="autocomplete"
    :aria-invalid="invalid || undefined"
    :class="clases"
    @input="alEscribir"
    @change="alSalir"
    @keyup="emit('keyup', $event)"
    @keydown="emit('keydown', $event)" />
</template>
