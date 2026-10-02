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
 *
 * # La forma (vue-libvasak#74)
 *
 * 32 de alto fijo (`h-8`, que reemplaza al `py-1.5` y deja el mismo tamaño de
 * antes), `rounded-corner-m` y **el borde de 3:1** (`ui-border-strong`,
 * decisión 5): un campo es un control y su contorno tiene que percibirse; los
 * bordes finos de Once UI son para los contenedores. El foco es el anillo de
 * 2 px separado 2 px con `ui-focus`: el `focus:ring-1` de antes era un píxel
 * que con el esquema de fábrica no llegaba a 3:1. Inválido, el borde de error.
 * Ocupa el ancho que le den y se achica hasta cero sin empujar nada.
 */
import { computed, ref } from 'vue';

const props = withDefaults(
	defineProps<{
		modelValue: string;
		/**
		 * El tipo del campo.
		 *
		 * `date` y `time` están porque la configuración pone la fecha y la hora del
		 * sistema y programa la luz nocturna, y son cuatro campos de verdad. El
		 * navegador les dibuja su propio selector, que es justo lo que se quiere:
		 * uno escrito a mano no entiende de husos ni de formatos locales.
		 *
		 * `datetime-local` (2.1.0) es el «programar el envío» del correo, que lo
		 * dibujaba con un `input` nativo sin estilo al lado de los campos del
		 * sistema.
		 */
		type?: 'text' | 'password' | 'search' | 'url' | 'email' | 'number' | 'date' | 'time' | 'datetime-local';
		/**
		 * El alto: `md` es el de 32 de siempre; `lg` es el de 40, para el campo
		 * que **es** la ventana, como el buscador del lanzador (vasak-prism).
		 *
		 * Va como propiedad y no como clase porque `h-10` y `h-8` en el mismo
		 * atributo no los decide el orden en que se escriben sino el de la hoja.
		 */
		size?: 'md' | 'lg';
		/**
		 * Sin canto ni fondo, para el campo que ya vive dentro de una superficie
		 * que lo enmarca (el lanzador, la búsqueda global del gestor de
		 * archivos). El anillo de foco va por dentro: pegado al canto de la
		 * superficie, uno de afuera lo recorta el `overflow`.
		 */
		bare?: boolean;
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
		/**
		 * La revisión ortográfica del motor (2.4.0). Sin pasarla decide el
		 * motor; en un nombre de usuario, una ruta o un servidor va `false`, o
		 * el subrayado rojo marca como error lo que está bien escrito.
		 */
		spellcheck?: boolean;
		/** Las mayúsculas automáticas de un teclado en pantalla (2.4.0). */
		autocapitalize?: 'none' | 'off' | 'sentences' | 'words' | 'characters';
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
	{
		type: 'text',
		size: 'md',
		bare: false,
		disabled: false,
		readonly: false,
		invalid: false,
		mono: false,
		required: false,
		lazy: false,
		spellcheck: undefined,
		autocapitalize: undefined,
	}
);

const emit = defineEmits<{
	'update:modelValue': [value: string];
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
	keyup: [event: KeyboardEvent];
	keydown: [event: KeyboardEvent];
}>();

function onInput(event: Event) {
	if (props.lazy) return;
	emit('update:modelValue', (event.target as HTMLInputElement).value);
}

function onChange(event: Event) {
	if (!props.lazy) return;
	emit('update:modelValue', (event.target as HTMLInputElement).value);
}

/**
 * El `input` de abajo, para poder enfocarlo desde afuera.
 *
 * Quien lo usa necesita el elemento y no el componente: la ventana de
 * redacción del correo abre con el cursor en «Para», y el buscador vuelve a
 * recibir el foco al salir de la lista. Sin esto había que alcanzarlo por
 * `$el`, que es `any` y deja de compilar el día que este componente crezca una
 * raíz distinta. `SearchField` ya hacía justamente eso por dentro.
 */
const field = ref<HTMLInputElement | null>(null);

/**
 * Enfoca el campo y **dice si lo consiguió**.
 *
 * Lo segundo no es un detalle. Un campo dentro de un panel que está `hidden`
 * no recibe el foco y tampoco falla: `focus()` no hace nada y no avisa, así
 * que la tecla que lleva al buscador parece rota. Devolviendo si llegó, quien
 * llama puede mostrar el panel y reintentar sin preguntar cuánto mide la
 * ventana. Es de la lista del correo, que ya lo había resuelto así.
 *
 * `enfocar` es el nombre de la 1.x y queda como alias obsoleto: lo llaman el
 * escritorio, el correo y el agente de polkit.
 */
function focus(): boolean {
	field.value?.focus();
	return field.value !== null && document.activeElement === field.value;
}

defineExpose({
	focus,
	/** @deprecated Usá `focus()`. Se va en la 3.0. */
	enfocar: focus,
});

/** El canto: el de error, ninguno (`bare`) o el de 3:1. */
function border(): string {
	if (props.invalid) return 'border-status-error';
	return props.bare ? 'border-transparent' : 'border-ui-border-strong';
}

const classes = computed(() => [
	'w-full min-w-0 rounded-corner-m border px-3 text-tx-main',
	props.size === 'lg' ? 'h-10 text-body-m' : 'h-8 text-label-m',
	props.bare ? 'bg-transparent' : 'bg-ui-surface/70',
	'placeholder:text-tx-muted transition-colors duration-200 ease-ui',
	props.bare
		? 'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ui-focus'
		: 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-focus',
	border(),
	props.invalid || props.disabled || props.bare ? '' : 'hover:border-tx-main',
	props.mono ? 'font-mono' : '',
	props.disabled ? 'cursor-not-allowed opacity-50' : '',
]);
</script>

<template>
  <input
    ref="field"
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
    :spellcheck="spellcheck"
    :autocapitalize="autocapitalize"
    :aria-invalid="invalid || undefined"
    :class="classes"
    @input="onInput"
    @change="onChange"
    @keyup="emit('keyup', $event)"
    @keydown="emit('keydown', $event)" />
</template>
