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
 *
 * ── La forma (vue-libvasak#74) ───────────────────────────────────────────────
 *
 * La del `TextInput`, con la lupa y la cruz a 16 px y `pl-8`/`pr-8` para que el
 * texto no pase por debajo. La cruz es un botón sin borde de 24 px con
 * `rounded-corner-s` y el velo `ui-hover`, como el `tertiary` de Once UI. La
 * ruedita de carga es `process-working`, el nombre de la especificación de
 * iconos de freedesktop, que traen `VasakOS-light` y `VasakOS-dark` mismos;
 * `content-loading` no es del estándar y en `VasakOS-light` sólo llegaba
 * heredado de Breeze. Es la misma que usa `ActionButton`.
 *
 * ── Las teclas ─────────────────────────────────────────────────────────────────
 *
 * El Enter se oye en la caja y no en el campo: burbujea igual y alcanza
 * una sola vez, aunque mañana haya más de un elemento adentro que lo
 * produzca.
 *
 * Las demás teclas **se reenvían** en vez de atenderse: qué significa
 * Escape depende de dónde viva esta caja —cerrar el desplegable, plegar la
 * barra, salir de la vista— y ésa no es una decisión del campo. Se reenvían
 * desde el campo y no desde acá para no reinterpretar a mano lo que el
 * modificador `.enter` de Vue ya decide bien.
 *
 * ── La cruz también busca (2.4.0) ───────────────────────────────────────────
 *
 * Vaciar con la cruz emite `update:modelValue('')`, `clear` **y**
 * `search('')`, en ese orden. Hasta la 2.3 emitía sólo los dos primeros, y lo
 * que escuchaba únicamente `search` —la tienda— seguía mostrando los
 * resultados de lo que ya no estaba escrito (store#36 lo arregló en la
 * aplicación). Quien escuche los dos y haga lo mismo con ambos recibe dos
 * avisos seguidos: con `search` alcanza.
 *
 * ── `autocomplete` y `spellcheck` (2.4.0) ─────────────────────────────────────
 *
 * Van al `input`. El lanzador ponía `autocomplete="off"` sobre el componente y
 * no llegaba a ningún lado (prism#59): el motor ofrecía lo escrito antes encima
 * de los resultados.
 *
 * (Esto vivía como comentario arriba de la raíz de la plantilla, y eso la
 * partía en un fragmento: los atributos de quien lo usa no caían en ningún
 * lado.)
 */
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import TextInput from '../forms/TextInput.vue';
import ThemeIcon from '../icons/ThemeIcon.vue';
import { useLabels } from '../shared/labels';

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
		/**
		 * Lo que se oye en la cruz. Sin esto sale del catálogo (`search.clear`), y
		 * si la aplicación no tiene la clave, «Vaciar».
		 */
		clearLabel?: string;
		/**
		 * `lg` es el campo de 40 que **es** la ventana: el buscador del lanzador
		 * (vasak-prism), que lo dibujaba a mano. La lupa y la cruz crecen a 20.
		 */
		size?: 'md' | 'lg';
		/**
		 * Sin canto ni fondo, para cuando ya está dentro de una superficie que lo
		 * enmarca: el lanzador, la búsqueda global del gestor de archivos.
		 */
		bare?: boolean;
		/** El `autocomplete` del `input`: `off` para que el motor no ofrezca lo de antes. */
		autocomplete?: string;
		/** La revisión ortográfica del motor. */
		spellcheck?: boolean;
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
		size: 'md',
		bare: false,
		autocomplete: undefined,
		spellcheck: undefined,
	}
);

const emit = defineEmits<{
	'update:modelValue': [value: string];
	search: [value: string];
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
	keydown: [event: KeyboardEvent];
}>();

const translate = useLabels();
const field = ref<InstanceType<typeof TextInput> | null>(null);
let timer: ReturnType<typeof setTimeout> | undefined;

const hasText = computed(() => props.modelValue.length > 0);

/** «Buscar: vaciar» cuando hay etiqueta, para saber qué se vacía. */
const clearName = computed(() => {
	const clear = props.clearLabel ?? translate('search.clear', 'Vaciar');
	return props.label ? `${props.label}: ${clear}` : clear;
});

/**
 * El cableado de combobox, puesto en un solo lugar y pasado en bloque.
 *
 * Va con `v-bind` de un objeto y no como atributos sueltos porque `TextInput`
 * es un campo de formulario y no tiene por qué declarar en su contrato las
 * propiedades de un patrón que no es suyo. Caen igual sobre el `input`, que es
 * su raíz.
 */
const listWiring = computed(() =>
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
const showsClear = computed(() => props.clearable && hasText.value && !props.disabled);

/** El icono y el lugar que se le deja al texto, por tamaño. */
const large = computed(() => props.size === 'lg');
const iconSize = computed(() => (large.value ? 20 : 16));

function cancelDebounce() {
	clearTimeout(timer);
	timer = undefined;
}

function write(value: string) {
	emit('update:modelValue', value);
	if (props.debounce <= 0) return;
	cancelDebounce();
	timer = setTimeout(() => emit('search', value), props.debounce);
}

function searchNow() {
	cancelDebounce();
	emit('search', props.modelValue);
}

function clear() {
	cancelDebounce();
	emit('update:modelValue', '');
	emit('clear');
	emit('search', '');
	focus();
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
 *
 * `enfocar` es el nombre de la 1.x y queda como alias obsoleto.
 */
function focus(): boolean {
	return field.value?.focus() ?? false;
}

defineExpose({
	focus,
	/** @deprecated Usá `focus()`. Se va en la 3.0. */
	enfocar: focus,
});

onMounted(async () => {
	if (!props.autofocus) return;
	await nextTick();
	focus();
});

// Un rebote pendiente sobre un componente que ya no está busca contra una vista
// desmontada. La copia de la tienda también tenía que acordarse de esto.
onUnmounted(cancelDebounce);

watch(
	() => props.disabled,
	(off) => {
		if (off) cancelDebounce();
	}
);
</script>

<template>
  <div class="relative flex min-w-0 items-center" @keydown.enter="searchNow">
    <!-- La lupa —o la ruedita mientras busca— no se lee: la etiqueta del campo
         ya dice qué es esto, y un lector de pantalla que diga «imagen, buscar»
         antes de «buscar, campo de texto» repite. -->
    <span class="pointer-events-none absolute flex items-center" :class="large ? 'left-3' : 'left-2'">
      <ThemeIcon
        :name="busy ? 'process-working-symbolic' : 'system-search'"
        type="symbol"
        :size="iconSize"
        :class="busy ? 'animate-spin opacity-70' : 'opacity-60'" />
    </span>

    <TextInput
      ref="field"
      type="search"
      :model-value="modelValue"
      :placeholder="placeholder || label"
      :ariaLabel="label || undefined"
      v-bind="listWiring"
      :disabled="disabled"
      :size="size"
      :bare="bare"
      :autocomplete="autocomplete"
      :spellcheck="spellcheck"
      class="truncate [&::-webkit-search-cancel-button]:appearance-none"
      :class="[large ? 'pl-10' : 'pl-8', showsClear ? (large ? 'pr-10' : 'pr-8') : '']"
      @update:model-value="write"
      @keydown="emit('keydown', $event)" />

    <button
      v-if="showsClear"
      type="button"
      class="absolute right-1 flex items-center justify-center rounded-corner-s text-tx-muted transition-colors duration-200 ease-ui hover:bg-ui-hover active:bg-ui-pressed active:duration-100"
      :class="large ? 'size-8' : 'size-6'"
      :aria-label="clearName"
      @mousedown.prevent
      @click="clear">
      <ThemeIcon name="gtk-close" type="symbol" :size="iconSize" alt="" />
    </button>
  </div>
</template>
