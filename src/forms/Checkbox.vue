<script setup lang="ts">
/**
 * Una casilla: sí o no, sin que cambie nada en el momento.
 *
 * Es la hermana de `SwitchToggle`, no su reemplazo. El interruptor aplica al
 * tocarlo («Wi-Fi encendido»); la casilla marca algo que se usa después —un
 * filtro de búsqueda, «recordar esta decisión», una fila elegida para borrar—.
 * Donde hoy hay una casilla, sigue habiendo una casilla (decisión 2 del
 * 01/10/2026).
 *
 * Había dieciocho en siete aplicaciones, casi todas `<input type="checkbox">`
 * nativos, que WebKitGTK dibuja con el tema de GTK: blancos sobre una ventana
 * oscura y sin el anillo de foco del sistema. Sale de monitor (3), text (3),
 * polkit (1), file-manager (7), settings (2), resonance (1) e installer (1).
 *
 * # Por qué es un `input` de verdad
 *
 * El control es el `<input type="checkbox">` con su dibujo apagado
 * (`appearance-none`), no un `div` con `role="checkbox"`: así el navegador pone
 * el teclado (Espacio), el estado, el formulario y el nombre por la etiqueta
 * envolvente, y no hay nada de eso que se pueda olvidar. La tilde y la raya de
 * «a medias» son dos trazos de CSS sobre la caja —como el punto de una opción—,
 * no un icono: un icono simbólico del tema se dibuja en su gris y no seguiría
 * al texto sobre el primario.
 *
 * # La forma
 *
 * La caja de 16 px con el canto de 3:1 (`ui-border-strong`) de los controles
 * (decisión 5), `rounded-corner-xs`; marcada, el relleno del primario con la
 * tilde en `tx-on-primary`. La fila entera mide 32 de alto como mínimo, que es
 * el objetivo táctil del sistema aunque la caja se vea de 16.
 */
import { computed, onMounted, ref, useId, watch } from 'vue';

const props = withDefaults(
	defineProps<{
		/** Lo que marca la casilla, ya traducido. Es su nombre accesible. */
		label: string;
		/** Una segunda línea que explica, atada por `aria-describedby`. */
		description?: string;
		disabled?: boolean;
		/**
		 * «A medias»: algunas filas de la lista elegidas y otras no.
		 *
		 * Es un estado de **dibujo**: no cambia el modelo. Al tocarla, la
		 * casilla pasa a marcada como cualquier otra, y quien la usa decide qué
		 * significa eso para las filas.
		 */
		indeterminate?: boolean;
		/** La etiqueta sólo para el lector de pantalla, para la casilla de una fila. */
		hideLabel?: boolean;
		id?: string;
		name?: string;
		value?: string;
	}>(),
	{ disabled: false, indeterminate: false, hideLabel: false }
);

const model = defineModel<boolean>({ default: false });

const emit = defineEmits<{ change: [checked: boolean] }>();

const generatedId = useId();
const inputId = computed(() => props.id ?? generatedId);
const descriptionId = computed(() => `${inputId.value}-description`);

const input = ref<HTMLInputElement | null>(null);

/**
 * `indeterminate` no es un atributo de HTML: es una propiedad del elemento, y
 * sólo se puede poner por código. Un `:indeterminate` en la plantilla no hace
 * nada.
 */
function syncIndeterminate() {
	if (input.value) input.value.indeterminate = props.indeterminate;
}

watch(() => props.indeterminate, syncIndeterminate);
onMounted(syncIndeterminate);

function onChange(event: Event) {
	const checked = (event.target as HTMLInputElement).checked;
	model.value = checked;
	emit('change', checked);
	// El navegador saca el «a medias» al hacer clic; si quien lo usa sigue
	// diciendo que va a medias hasta que actualice las filas, se respeta.
	syncIndeterminate();
}

function focus(): boolean {
	input.value?.focus();
	return input.value !== null && document.activeElement === input.value;
}

defineExpose({ focus });
</script>

<template>
  <label
    :for="inputId"
    class="inline-flex min-h-8 min-w-0 items-start gap-2 py-2 text-tx-main"
    :class="disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'">
    <span class="relative mt-0.5 flex size-4 shrink-0 items-center justify-center">
      <input
        :id="inputId"
        ref="input"
        type="checkbox"
        :name="name"
        :value="value"
        :checked="model"
        :disabled="disabled"
        :aria-describedby="description ? descriptionId : undefined"
        class="peer size-4 shrink-0 cursor-[inherit] appearance-none rounded-corner-xs border border-ui-border-strong bg-ui-surface/70 transition-colors duration-200 ease-ui checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary hover:border-tx-main checked:hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-focus disabled:hover:border-ui-border-strong"
        @change="onChange" />
      <!-- La tilde: una «L» con dos cantos, girada. -->
      <span
        aria-hidden="true"
        class="pointer-events-none absolute top-0.5 hidden h-2 w-1 rotate-45 border-r-2 border-b-2 border-tx-on-primary peer-checked:block peer-indeterminate:hidden" />
      <!-- La raya de «a medias». -->
      <span
        aria-hidden="true"
        class="pointer-events-none absolute hidden h-0.5 w-2 bg-tx-on-primary peer-indeterminate:block" />
    </span>
    <span class="flex min-w-0 flex-col" :class="hideLabel ? 'sr-only' : ''">
      <span class="text-label-m break-words">{{ label }}</span>
      <span v-if="description" :id="descriptionId" class="text-body-xs text-tx-muted break-words">{{ description }}</span>
    </span>
  </label>
</template>
