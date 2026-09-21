<script setup lang="ts">
/**
 * El campo de búsqueda del sistema.
 *
 * Había tres nombres para esto mismo —`modelValue` acá, `valor` y `buscar` en
 * la tienda, `filter` y `update:filter` en el escritorio—, y el gestor de
 * archivos lo dibujaba a mano con su lupa, su cruz y su ruedita de carga
 * sueltas. Tres contratos y cuatro aspectos para el mismo gesto.
 *
 * Por dentro es el `TextInput` del sistema, no una copia de sus clases: así un
 * cambio de aspecto llega a los dos a la vez y no hay forma de que se separen.
 *
 * ── Dos eventos, que no son lo mismo ─────────────────────────────────────────
 *
 * `update:modelValue` sale en cada tecla y es el texto. `search` es «buscá de
 * verdad», y sale con Enter y también sola cuando pasa el rebote. Lo que filtra
 * una lista que ya está en memoria escucha el primero; lo que recorre quince mil
 * paquetes y además consulta al AUR escucha el segundo, que es exactamente por
 * qué la tienda se había hecho su propio campo.
 *
 * Enter **cancela** el rebote pendiente. Sin eso, apretar Enter busca y
 * doscientos milisegundos después el temporizador busca otra vez con el mismo
 * texto — el error estaba escrito como advertencia en la copia de la tienda.
 */
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import TextInput from '../forms/TextInput.vue';
import ThemeIcon from '../icons/ThemeIcon.vue';

const props = withDefaults(
	defineProps<{
		modelValue?: string;
		placeholder?: string;
		/** Lo que oye un lector de pantalla: el campo no lleva etiqueta visible. */
		label?: string;
		disabled?: boolean;
		/**
		 * El foco al montar, para la búsqueda que se abre en un menú o un panel.
		 *
		 * Se hace a mano y no con el atributo `autofocus` del HTML, que el
		 * navegador sólo atiende al cargar el documento: un campo que aparece
		 * después —dentro de un menú que se abre— no lo recibe nunca. El
		 * escritorio lo había descubierto y resuelto con una directiva propia.
		 */
		autofocus?: boolean;
		/**
		 * Cuánto se espera tras la última tecla antes de emitir `search`.
		 *
		 * En cero —lo normal— `search` sale sólo con Enter. Se sube cuando buscar
		 * cuesta caro: cada tecla disparando un recorrido entero hace además que
		 * el resultado de la penúltima pueda llegar después que el de la última y
		 * pisarla.
		 */
		debounce?: number;
		/** La cruz para vaciarlo, que si no cada aplicación se dibuja la suya. */
		clearable?: boolean;
		/** Cambia la lupa por la ruedita: la búsqueda está trabajando. */
		busy?: boolean;
		/**
		 * El `id` de la lista que este campo maneja, si maneja una.
		 *
		 * Con esto el campo pasa a anunciarse como **combobox**, que es el patrón
		 * de un campo que conduce una lista de resultados: sirve para el
		 * desplegable de acá al lado y para el panel de resultados que arme una
		 * aplicación. Sin esto es un campo de búsqueda a secas.
		 */
		listboxId?: string;
		/**
		 * El `id` de la opción marcada dentro de esa lista.
		 *
		 * Es lo que hace que un lector de pantalla diga por cuál opción se está
		 * pasando **sin mover el foco del campo**, que es lo que deja seguir
		 * escribiendo mientras se recorre con las flechas.
		 */
		activeOptionId?: string;
		/** Si la lista está desplegada. */
		expanded?: boolean;
	}>(),
	{
		modelValue: '',
		placeholder: '',
		label: '',
		disabled: false,
		autofocus: false,
		debounce: 0,
		clearable: true,
		busy: false,
	}
);

const emit = defineEmits<{
	'update:modelValue': [valor: string];
	search: [valor: string];
	clear: [];
	/**
	 * Las teclas, para que quien lo usa pueda atender las suyas.
	 *
	 * Escape sobre todo: qué significa depende de dónde viva esta caja, así que
	 * no lo decide el campo. Eso ya estaba dicho, pero no se podía hacer: con
	 * `strictTemplates`, un `@keydown` sobre un componente que no lo declara es
	 * un error de tipos, y la salida era un `v-bind` de objeto, que no se
	 * comprueba. Declararlo lo saca de `$attrs`, así que reenviarlo abajo no es
	 * opcional: sin eso el campo enmudece y nada avisa.
	 */
	keydown: [evento: KeyboardEvent];
}>();

const campo = ref<InstanceType<typeof TextInput> | null>(null);
let temporizador: ReturnType<typeof setTimeout> | undefined;

const hayTexto = computed(() => props.modelValue.length > 0);

/**
 * El cableado de combobox, puesto en un solo lugar y pasado en bloque.
 *
 * Va con `v-bind` de un objeto y no como atributos sueltos porque `TextInput`
 * es un campo de formulario y no tiene por qué declarar en su contrato las
 * propiedades de un patrón que no es suyo. Caen igual sobre el `input`, que es
 * su raíz.
 */
const cableadoDeLaLista = computed(() =>
	props.listboxId
		? {
				role: 'combobox',
				'aria-autocomplete': 'list',
				'aria-controls': props.listboxId,
				'aria-expanded': String(props.expanded),
				'aria-activedescendant': props.activeOptionId || undefined,
			}
		: {}
);
const muestraLaCruz = computed(() => props.clearable && hayTexto.value && !props.disabled);

function cancelarElRebote() {
	clearTimeout(temporizador);
	temporizador = undefined;
}

function escribir(valor: string) {
	emit('update:modelValue', valor);
	if (props.debounce <= 0) return;
	cancelarElRebote();
	temporizador = setTimeout(() => emit('search', valor), props.debounce);
}

function buscarYa() {
	cancelarElRebote();
	emit('search', props.modelValue);
}

function vaciar() {
	cancelarElRebote();
	emit('update:modelValue', '');
	emit('clear');
	enfocar();
}

/**
 * Para que quien lo usa pueda devolverle el foco sin tocar el DOM.
 *
 * Es además la salida para el caso en que el campo aparezca detrás de una
 * animación y el foco de `autofocus` llegue demasiado pronto.
 *
 * Se lo pide a `TextInput`, que lo expone. Antes se alcanzaba el elemento por
 * `$el`, que es `any` y deja de andar sin avisar el día que ese componente
 * crezca una raíz distinta.
 *
 * Devuelve si el foco llegó: dentro de un panel `hidden` no llega y tampoco
 * falla, y quien llama necesita saberlo para mostrar el panel y reintentar.
 */
function enfocar(): boolean {
	return campo.value?.enfocar() ?? false;
}

defineExpose({ enfocar });

onMounted(async () => {
	if (!props.autofocus) return;
	await nextTick();
	enfocar();
});

// Un rebote pendiente sobre un componente que ya no está busca contra una vista
// desmontada. La copia de la tienda también tenía que acordarse de esto.
onUnmounted(cancelarElRebote);

watch(
	() => props.disabled,
	(apagado) => {
		if (apagado) cancelarElRebote();
	}
);
</script>

<template>
  <!-- El Enter se oye en la caja y no en el campo: burbujea igual y alcanza
       una sola vez, aunque mañana haya más de un elemento adentro que lo
       produzca.

       Las demás teclas **se reenvían** en vez de atenderse: qué significa
       Escape depende de dónde viva esta caja —cerrar el desplegable, plegar la
       barra, salir de la vista— y ésa no es una decisión del campo. Se reenvían
       desde el campo y no desde acá para no reinterpretar a mano lo que el
       modificador `.enter` de Vue ya decide bien. -->
  <div class="relative flex items-center" @keydown.enter="buscarYa">
    <!-- La lupa —o la ruedita mientras busca— no se lee: la etiqueta del campo
         ya dice qué es esto, y un lector de pantalla que diga «imagen, buscar»
         antes de «buscar, campo de texto» repite. -->
    <span class="pointer-events-none absolute left-2 flex items-center">
      <ThemeIcon
        :name="busy ? 'content-loading' : 'system-search'"
        type="symbol"
        :size="14"
        :class="busy ? 'animate-spin opacity-70' : 'opacity-60'" />
    </span>

    <TextInput
      ref="campo"
      type="search"
      :model-value="modelValue"
      :placeholder="placeholder || label"
      :ariaLabel="label || undefined"
      v-bind="cableadoDeLaLista"
      :disabled="disabled"
      class="pl-7 [&::-webkit-search-cancel-button]:appearance-none"
      :class="muestraLaCruz ? 'pr-8' : ''"
      @update:model-value="escribir"
      @keydown="emit('keydown', $event)" />

    <button
      v-if="muestraLaCruz"
      type="button"
      class="absolute right-1 flex size-6 items-center justify-center rounded-corner text-tx-muted hover:bg-ui-surface"
      :aria-label="label ? `${label}: vaciar` : 'Vaciar'"
      @mousedown.prevent
      @click="vaciar">
      <ThemeIcon name="gtk-close" type="symbol" :size="12" alt="" />
    </button>
  </div>
</template>
