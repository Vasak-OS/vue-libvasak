<script lang="ts" setup>
/**
 * Una búsqueda que vive en la barra de la ventana.
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
 * # Y por qué se cierra sola
 *
 * Con Escape y al perder el foco. Un campo abierto encima del contenido que no
 * se cierra tapa justo lo que se está buscando.
 *
 * El `mousedown.prevent` de la lupa es lo que la deja cerrar: sin eso, apretarla
 * con el campo enfocado disparaba primero el `blur` —que cierra— y después el
 * clic —que vuelve a abrir—, así que el botón no podía plegar nunca.
 */
import { computed, nextTick, ref } from 'vue';
import ThemeIcon from '../icons/ThemeIcon.vue';
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
	}>(),
	{ modelValue: '', placeholder: '', label: 'Search', collapsed: false }
);

const emit = defineEmits<{
	'update:modelValue': [valor: string];
	search: [valor: string];
	open: [];
	close: [];
}>();

const { vertical, posicion } = usarLaBarra();

const abierto = ref(false);
const campo = ref<HTMLInputElement | null>(null);

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
	campo.value?.focus();
}

function cerrar() {
	if (!abierto.value) return;
	abierto.value = false;
	emit('close');
}

function escribir(evento: Event) {
	emit('update:modelValue', (evento.target as HTMLInputElement).value);
}

function buscar() {
	emit('search', props.modelValue);
}
</script>

<template>
  <div class="relative flex shrink-0 items-center">
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

    <div v-if="muestraElCampo" :class="clasesDelDesplegado">
      <input
        ref="campo"
        type="search"
        class="w-full rounded-corner border border-ui-border bg-ui-bg/80 px-2 py-1 text-sm outline-none focus:border-ui-border-strong"
        :class="sePliega ? '' : 'w-48'"
        :value="modelValue"
        :placeholder="placeholder || label"
        :aria-label="label"
        @input="escribir"
        @keydown.enter="buscar"
        @keydown.esc="cerrar"
        @blur="cerrar">
    </div>
  </div>
</template>
