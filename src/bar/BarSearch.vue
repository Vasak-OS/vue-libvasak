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
 */
import { computed, nextTick, ref } from 'vue';
import ThemeIcon from '../icons/ThemeIcon.vue';
import SearchField from '../search/SearchField.vue';
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
		label: 'Search',
		collapsed: false,
		disabled: false,
		debounce: 0,
	}
);

const emit = defineEmits<{
	'update:modelValue': [valor: string];
	search: [valor: string];
	open: [];
	close: [];
}>();

const { vertical, posicion } = usarLaBarra();

const abierto = ref(false);
const campo = ref<InstanceType<typeof SearchField> | null>(null);

/** Vertical no hay opción; horizontal decide la aplicación. */
const sePliega = computed(() => vertical.value || props.collapsed);
const muestraElCampo = computed(() => !sePliega.value || abierto.value);

/** De qué lado sale el campo cuando la barra está a un costado. */
const clasesDelDesplegado = computed(() => {
	if (!sePliega.value) return '';
	const base = 'absolute z-40 w-64 rounded-corner border border-ui-border bg-ui-surface/95 p-1 shadow-lg';
	if (posicion.value === 'left') return `${base} left-full top-0 ml-1`;
	if (posicion.value === 'right') return `${base} right-full top-0 mr-1`;
	if (posicion.value === 'bottom') return `${base} bottom-full right-0 mb-1`;
	return `${base} top-full right-0 mt-1`;
});

async function abrir() {
	abierto.value = true;
	emit('open');
	await nextTick();
	campo.value?.enfocar();
}

function cerrar() {
	if (!abierto.value) return;
	abierto.value = false;
	emit('close');
}

/**
 * Cerrar al irse el foco, sin cerrarse al moverse por dentro.
 *
 * En `focusout` y no en `blur`: `blur` no burbujea, así que desde el envoltorio
 * no se oye. Y sin mirar a dónde fue el foco, pasar del campo a la cruz de
 * vaciarlo plegaría la búsqueda en el medio del gesto.
 */
function alSalirElFoco(evento: FocusEvent) {
	const destino = evento.relatedTarget as Node | null;
	if (destino && (evento.currentTarget as HTMLElement).contains(destino)) return;
	cerrar();
}
</script>

<template>
  <div class="relative flex shrink-0 items-center" @focusout="alSalirElFoco">
    <button
      v-if="sePliega"
      type="button"
      class="flex size-7 items-center justify-center rounded-corner border border-ui-border bg-ui-bg/80 hover:bg-ui-surface/70"
      :title="label"
      :aria-label="label"
      :aria-expanded="abierto"
      @mousedown.prevent
      @click="abierto ? cerrar() : abrir()">
      <ThemeIcon name="system-search" type="symbol" :size="14" />
    </button>

    <div v-if="muestraElCampo" :class="clasesDelDesplegado" @keydown.esc="cerrar">
      <SearchField
        ref="campo"
        :model-value="modelValue"
        :placeholder="placeholder"
        :label="label"
        :disabled="disabled"
        :debounce="debounce"
        :class="sePliega ? '' : 'w-48'"
        @update:model-value="emit('update:modelValue', $event)"
        @search="emit('search', $event)" />
    </div>
  </div>
</template>
