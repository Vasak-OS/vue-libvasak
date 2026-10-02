<script setup lang="ts">
/**
 * Un desplegable con búsqueda, para listas largas.
 *
 * ── Por qué existe ──────────────────────────────────────────────────────────
 *
 * Porque la lista desplegada de un `<select>` **la dibuja el sistema**, no la
 * página: no toma los colores del tema, y en una ventana oscura aparece un
 * rectángulo blanco que no se parece a nada del resto del escritorio. Y porque
 * son más de cuatrocientas zonas horarias: un `<select>` con eso adentro obliga
 * a desplazar a ciegas, y con un campo arriba se llega escribiendo tres letras.
 *
 * `<input list>` con `<datalist>` sería lo natural y WebKitGTK lo dibuja de
 * forma inconsistente, así que va a mano.
 *
 * ── De dónde sale ───────────────────────────────────────────────────────────
 *
 * Vivía dos veces: 145 líneas en `vasak-installer` y 268 en `vasak-calendar`.
 * No era la misma cosa con distinto nombre, era **la misma cosa con distinta
 * suerte**: la copia del instalador se quedó sin teclado —ni flechas, ni Enter,
 * ni `aria-activedescendant`— y sin cierre al hacer clic afuera, así que la
 * única salida era Escape con el foco adentro. Se toma la del calendario, que
 * es la que las tiene, y el instalador gana las dos al adoptarla.
 *
 * El campo de arriba es el `SearchField` del sistema, así que la búsqueda de
 * acá adentro se ve y se comporta como cualquier otra búsqueda de cualquier
 * otra ventana. Qué opciones hay, de dónde salen y qué pasa al elegir siguen
 * siendo de la aplicación.
 *
 * # La forma (vue-libvasak#74)
 *
 * Cerrado es un campo: 32 de alto, `rounded-corner-m` y el borde de 3:1
 * (decisión 5). Abierto, su lista es el panel de un desplegable —`ui-float`,
 * canto `ui-line`, `rounded-corner-l`, `shadow-surface-m`— con opciones de
 * `rounded-corner-m`: la que se recorre lleva el velo `ui-hover` y la elegida
 * el de acento (decisión 4). La flecha es `pan-down-symbolic`, la misma de
 * `SelectField`.
 *
 * # Sin búsqueda (2.4.0)
 *
 * `searchable` en `false` saca el campo de arriba y deja la lista sola: es el
 * desplegable dibujado por la página para una lista corta —la sesión y el
 * idioma del inicio de sesión—, donde lo que importa no es buscar sino que la
 * lista no la dibuje el sistema. El inicio de sesión corre antes de que haya
 * un tema de GTK puesto, y la lista nativa de un `<select>` salía blanca sobre
 * blanco encima de un fondo oscuro (vasak-session-manager se había hecho la
 * suya por eso). Abierta, el foco va a la lista, que anuncia la opción
 * recorrida con `aria-activedescendant`, y las teclas son las mismas.
 */
import { computed, nextTick, ref, watch } from 'vue';
import ThemeIcon from '../icons/ThemeIcon.vue';
import { buscarOpciones, type OpcionDeBusqueda } from './buscar';
import { siguienteIdDeLista } from './ids';
import SearchField from './SearchField.vue';

const props = withDefaults(
	defineProps<{
		modelValue: string;
		options: OpcionDeBusqueda[];
		/** Lo que oye un lector de pantalla en el botón cerrado. */
		label?: string;
		/** El marcador del campo de búsqueda de adentro. */
		searchPlaceholder?: string;
		/** Lo que se dice cuando no coincide nada. */
		emptyText?: string;
		/** Lo que se muestra cuando no hay nada elegido. */
		placeholder?: string;
		disabled?: boolean;
		/**
		 * Cuántas opciones se dibujan como máximo.
		 *
		 * Sin recorte, con la búsqueda vacía se dibujan cuatrocientos nodos, y
		 * como el cálculo corre en cada tecla, cada letra recrea la lista entera.
		 * El recorte es seguro **porque la lista viene ordenada por qué tan bien
		 * coincide**: recortar una lista alfabética esconde justo lo que se busca.
		 */
		limit?: number;
		/**
		 * Si el menú se abre hacia arriba.
		 *
		 * Hace falta cuando el control vive al pie de un panel: hacia abajo, el
		 * menú se sale de la ventana y no hay forma de llegar al final de la lista.
		 */
		up?: boolean;
		/** El campo de búsqueda arriba de la lista. En `false`, la lista sola. */
		searchable?: boolean;
	}>(),
	{
		label: '',
		searchPlaceholder: '',
		emptyText: '',
		placeholder: '—',
		disabled: false,
		limit: 60,
		up: false,
		searchable: true,
	}
);

const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

const query = ref('');
const isOpen = ref(false);
const active = ref(0);
const list = ref<HTMLElement | null>(null);
const button = ref<HTMLButtonElement | null>(null);
const field = ref<InstanceType<typeof SearchField> | null>(null);

/**
 * Único por instancia, para que `aria-activedescendant` apunte a lo suyo.
 *
 * Con un contador y no con azar: dos desplegables sorteando el mismo número es
 * improbable pero posible, y si pasa el fallo es invisible —un lector de
 * pantalla anuncia la opción del otro—. Es además el mismo mecanismo que usan
 * los títulos de los diálogos.
 */
const listId = siguienteIdDeLista();

const selected = computed(
	() => props.options.find((o) => o.valor === props.modelValue) ?? null
);

const ranked = computed(() => buscarOpciones(props.options, query.value));
const matches = computed(() => ranked.value.slice(0, props.limit));

/** Cuántas quedaron afuera del recorte, para poder decirlo en vez de esconderlas. */
const leftover = computed(() => Math.max(0, ranked.value.length - props.limit));

const activeId = computed(() =>
	matches.value.length > 0 ? `${listId}-${active.value}` : undefined
);

function choose(value: string) {
	emit('update:modelValue', value);
	close();
}

async function open() {
	isOpen.value = true;
	// Arranca sobre la que está elegida, no sobre la primera: así bajar una vez
	// lleva a la siguiente de la que se tiene, que es lo que se espera.
	const where = matches.value.findIndex((o) => o.valor === props.modelValue);
	active.value = where >= 0 ? where : 0;

	await nextTick();
	if (props.searchable) field.value?.focus();
	else list.value?.focus();
	scrollToActive();
}

function close(returnFocus = true) {
	if (!isOpen.value) return;
	isOpen.value = false;
	query.value = '';
	// El foco vuelve al botón: si se quedara en un campo que ya no existe, el
	// navegador lo manda al principio del documento y quien usa teclado pierde
	// el lugar.
	if (returnFocus) nextTick(() => button.value?.focus());
}

function move(step: number) {
	const total = matches.value.length;
	if (total === 0) return;
	// Da la vuelta: bajar desde la última lleva a la primera, que es lo que hace
	// cualquier menú.
	active.value = (active.value + step + total) % total;
	scrollToActive();
}

function goTo(index: number) {
	active.value = index;
	scrollToActive();
}

/**
 * Qué opción hay debajo de un evento del ratón.
 *
 * El ratón se atiende en el panel y no opción por opción, que es donde ya vive
 * el teclado: la interacción queda en un solo lugar en vez de repartida entre
 * el contenedor y sesenta hijos, y son dos oyentes en vez de ciento veinte. Las
 * opciones son marcado; no escuchan nada.
 */
function indexUnderPointer(event: Event): number | null {
	const row = (event.target as HTMLElement | null)?.closest?.('[data-index]');
	if (!row) return null;
	const index = Number(row.getAttribute('data-index'));
	return Number.isInteger(index) ? index : null;
}

function onClick(event: MouseEvent) {
	const index = indexUnderPointer(event);
	const option = index === null ? undefined : matches.value[index];
	if (option) choose(option.valor);
}

function onPointerMove(event: MouseEvent) {
	const index = indexUnderPointer(event);
	if (index !== null) active.value = index;
}

function scrollToActive() {
	nextTick(() => {
		list.value
			?.querySelector(`[data-index="${active.value}"]`)
			?.scrollIntoView({ block: 'nearest' });
	});
}

function chooseActive() {
	const option = matches.value[active.value];
	if (option) choose(option.valor);
}

/**
 * Apagarlo con la lista abierta la cierra.
 *
 * Quien lo apaga es la aplicación —porque lo que hay que elegir dejó de tener
 * sentido, o porque se está guardando—, y una lista que sigue abierta y
 * elegible encima de un control apagado es justo lo que no tiene que pasar.
 *
 * No hay guarda en `abrir` porque el botón apagado no recibe ni el clic ni el
 * teclado: la guarda sería código inalcanzable que aparenta estar cubierto. Se
 * vio saboteando —sacarla no rompía ninguna prueba—.
 */
watch(
	() => props.disabled,
	(off) => {
		if (off) close(false);
	}
);

// Escribir mueve la lista bajo el cursor, así que la marca vuelve arriba. Sin
// esto, `Enter` después de escribir elegía una opción que ya no estaba a la vista.
watch(query, () => {
	active.value = 0;
	scrollToActive();
});

/**
 * Cerrar al hacer clic afuera.
 *
 * En `focusout` y no en un oyente de `click` en el documento: `focusout` no
 * necesita registrar nada global —que después hay que acordarse de sacar— y
 * cubre además el caso de salir con `Tab`, que un oyente de clic no ve.
 *
 * `relatedTarget` es a dónde se fue el foco; si sigue adentro, no se cierra.
 */
function onFocusout(event: FocusEvent) {
	const target = event.relatedTarget as Node | null;
	if (target && (event.currentTarget as HTMLElement).contains(target)) return;
	close(false);
}
</script>

<template>
  <div class="relative" @focusout="onFocusout">
    <button
      ref="button"
      type="button"
      :disabled="disabled"
      class="flex h-8 w-full min-w-0 items-center justify-between gap-2 rounded-corner-m border border-ui-border-strong bg-ui-surface/70 px-3 text-left text-label-m text-tx-main transition-colors duration-200 ease-ui hover:border-tx-main focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-focus disabled:cursor-not-allowed disabled:opacity-50"
      :aria-label="label || undefined"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
      @click="isOpen ? close() : open()"
      @keydown.down.prevent="isOpen ? move(1) : open()"
      @keydown.up.prevent="isOpen ? move(-1) : open()">
      <span class="min-w-0 flex-1 truncate">
        {{ selected?.etiqueta ?? placeholder }}
        <span v-if="selected?.detalle" class="ml-2 text-body-xs text-tx-muted">
          {{ selected.detalle }}
        </span>
      </span>
      <ThemeIcon name="pan-down-symbolic" type="symbol" :size="16" class="shrink-0 opacity-60" />
    </button>

    <!-- Dibujado acá y no por el sistema: ése es el punto de este componente.
         `min-w-64` porque el botón puede vivir en un panel angosto y los nombres
         quedaban cortados: un desplegable donde no se lee qué dice cada opción no
         sirve de nada. Se pasa de ancho por encima de lo que tenga al lado, que
         es lo que hace cualquier menú. El mínimo se topa a la ventana menos
         16 px (2.4.0): a 240, los 256 de antes salían cortados por la derecha
         (se vio en el banco con la ventana de verdad en 240). -->
    <div
      v-if="isOpen"
      class="absolute z-20 w-full min-w-[min(16rem,calc(100vw-16px))] max-w-[calc(100vw-16px)] rounded-corner-l border border-ui-line bg-ui-float text-tx-main shadow-surface-m"
      :class="up ? 'bottom-full mb-1' : 'mt-1'"
      @keydown.escape.prevent="close()"
      @keydown.down.prevent="move(1)"
      @keydown.up.prevent="move(-1)"
      @keydown.home.prevent="goTo(0)"
      @keydown.end.prevent="goTo(matches.length - 1)"
      @keydown.enter.prevent="chooseActive()"
      @keydown.tab="close(false)"
      @click="onClick"
      @mousemove="onPointerMove">
      <div v-if="searchable" class="border-ui-line-weak border-b p-2">
        <SearchField
          ref="field"
          v-model="query"
          :label="label"
          :placeholder="searchPlaceholder"
          :listbox-id="listId"
          :active-option-id="activeId"
          :expanded="isOpen" />
      </div>

      <ul
        :id="listId"
        ref="list"
        role="listbox"
        class="max-h-56 overflow-y-auto p-1 focus:outline-none"
        :tabindex="searchable ? undefined : -1"
        :aria-label="searchable ? undefined : label || undefined"
        :aria-activedescendant="searchable ? undefined : activeId">
        <li v-if="matches.length === 0" class="p-3 text-center text-body-xs text-tx-muted">
          {{ emptyText }}
        </li>
        <li
          v-for="(option, index) in matches"
          :id="`${listId}-${index}`"
          :key="option.valor"
          :data-index="index"
          role="option"
          :aria-selected="option.valor === modelValue"
          class="flex min-h-8 cursor-pointer items-center gap-2 rounded-corner-m px-3 py-1 text-label-m text-tx-main transition-colors duration-200 ease-ui"
          :class="[
            option.valor === modelValue ? 'bg-ui-selected-accent font-semibold' : index === active ? 'bg-ui-hover' : '',
            (option.valor === modelValue || !searchable) && index === active ? 'outline-2 -outline-offset-2 outline-ui-focus' : '',
          ]">
          <span class="min-w-0 flex-1 truncate">{{ option.etiqueta }}</span>
          <span v-if="option.detalle" class="shrink-0 text-body-xs text-tx-muted">
            {{ option.detalle }}
          </span>
        </li>
        <!-- Lo que quedó afuera del recorte se dice. Que desaparezcan en silencio
             hace creer que la opción que se busca no existe. -->
        <li v-if="leftover > 0" class="px-3 py-1 text-body-xs text-tx-muted">+{{ leftover }}</li>
      </ul>
    </div>
  </div>
</template>
