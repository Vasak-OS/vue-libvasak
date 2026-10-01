<script lang="ts" setup>
/**
 * Una búsqueda que vive en la barra de la ventana.
 *
 * Es el `SearchField` del sistema más lo único que la barra agrega: plegarse.
 * El campo, la lupa, la cruz para vaciarlo y el rebote son los mismos que en
 * cualquier otra búsqueda de cualquier otra ventana, y por eso viven allá.
 *
 * # Por qué se despliega
 *
 * Con la barra a un costado hay cuarenta y ocho píxeles de ancho, y un campo de
 * texto ahí no se puede ni leer ni escribir. Plegado queda sólo la lupa; al
 * apretarla el campo se abre **al lado** de la barra, no adentro, que es el
 * único lugar donde entra.
 *
 * Horizontal también se pliega si la aplicación lo pide: una barra con
 * pestañas, acciones y un campo de doscientos píxeles se queda sin lugar para
 * las pestañas mucho antes de lo que parece.
 *
 * Fuera de una barra —en un menú, en un panel— `usarLaBarra` responde
 * horizontal y esto es, simplemente, el campo.
 *
 * # Y por qué se cierra sola
 *
 * Con Escape y al salir el foco. Un campo abierto encima del contenido que no
 * se cierra tapa justo lo que se está buscando. Qué significa Escape lo decide
 * acá y no el campo: en un desplegable cierra la lista, en una vista cierra la
 * vista, y acá pliega.
 *
 * El `mousedown.prevent` de la lupa es lo que la deja cerrar: sin eso, apretarla
 * con el campo enfocado disparaba primero la salida del foco —que cierra— y
 * después el clic —que vuelve a abrir—, así que el botón no podía plegar nunca.
 *
 * La forma (vue-libvasak#74): plegada es un botón sin borde de 32; lo que
 * despliega es un panel flotante (`ui-float`, `rounded-corner-l`,
 * `shadow-surface-m`) que nunca es más ancho que la ventana. El nombre de la
 * lupa sale de la propiedad, del catálogo (`search.label`) o es «Search».
 */
import { computed, nextTick, ref } from 'vue';
import ThemeIcon from '../icons/ThemeIcon.vue';
import SearchField from '../search/SearchField.vue';
import { useLabels } from '../shared/labels';
import { usarLaBarra } from '../window/tipos';

const props = withDefaults(
	defineProps<{
		modelValue?: string;
		placeholder?: string;
		/** Lo que oye un lector de pantalla en la lupa. */
		label?: string;
		/**
		 * Plegado aunque la barra sea horizontal.
		 *
		 * Vertical se pliega siempre: ahí no es una preferencia, es que no entra.
		 */
		collapsed?: boolean;
		disabled?: boolean;
		/** Ver `SearchField`: en cero, `search` sale sólo con Enter. */
		debounce?: number;
	}>(),
	{
		modelValue: '',
		placeholder: '',
		label: undefined,
		collapsed: false,
		disabled: false,
		debounce: 0,
	}
);

const emit = defineEmits<{
	'update:modelValue': [value: string];
	search: [value: string];
	open: [];
	close: [];
}>();

const { vertical, posicion: barPosition } = usarLaBarra();
const translate = useLabels();
/** Sin pasarla, `search.label` del catálogo de la aplicación, o «Search». */
const labelText = computed(() => props.label ?? translate('search.label', 'Search'));

const isOpen = ref(false);
const field = ref<InstanceType<typeof SearchField> | null>(null);

/** Vertical no hay opción; horizontal decide la aplicación. */
const folds = computed(() => vertical.value || props.collapsed);
const showsField = computed(() => !folds.value || isOpen.value);

/** De qué lado sale el campo cuando la barra está a un costado. */
const popoverClasses = computed(() => {
	if (!folds.value) return '';
	const base =
		'absolute z-40 w-64 max-w-[calc(100vw-16px)] rounded-corner-l border border-ui-line bg-ui-float p-1 shadow-surface-m';
	if (barPosition.value === 'left') return `${base} left-full top-0 ml-1`;
	if (barPosition.value === 'right') return `${base} right-full top-0 mr-1`;
	if (barPosition.value === 'bottom') return `${base} bottom-full right-0 mb-1`;
	return `${base} top-full right-0 mt-1`;
});

async function open() {
	isOpen.value = true;
	emit('open');
	await nextTick();
	field.value?.focus();
}

function close() {
	if (!isOpen.value) return;
	isOpen.value = false;
	emit('close');
}

/**
 * Cerrar al irse el foco, sin cerrarse al moverse por dentro.
 *
 * En `focusout` y no en `blur`: `blur` no burbujea, así que desde el envoltorio
 * no se oye. Y sin mirar a dónde fue el foco, pasar del campo a la cruz de
 * vaciarlo plegaría la búsqueda en el medio del gesto.
 */
function onFocusout(event: FocusEvent) {
	const target = event.relatedTarget as Node | null;
	if (target && (event.currentTarget as HTMLElement).contains(target)) return;
	close();
}
</script>

<template>
  <div class="relative flex shrink-0 items-center" @focusout="onFocusout">
    <button
      v-if="folds"
      type="button"
      class="flex size-8 items-center justify-center rounded-corner-m text-tx-main transition-colors duration-200 ease-ui hover:bg-ui-hover active:bg-ui-pressed active:duration-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-focus"
      :title="labelText"
      :aria-label="labelText"
      :aria-expanded="isOpen"
      @mousedown.prevent
      @click="isOpen ? close() : open()">
      <ThemeIcon name="system-search" type="symbol" :size="16" />
    </button>

    <div v-if="showsField" :class="popoverClasses" @keydown.esc="close">
      <SearchField
        ref="field"
        :model-value="modelValue"
        :placeholder="placeholder"
        :label="labelText"
        :disabled="disabled"
        :debounce="debounce"
        :class="folds ? '' : 'w-48 max-w-full'"
        @update:model-value="emit('update:modelValue', $event)"
        @search="emit('search', $event)" />
    </div>
  </div>
</template>
