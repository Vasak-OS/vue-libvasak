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
	}>(),
	{
		label: '',
		searchPlaceholder: '',
		emptyText: '',
		placeholder: '—',
		disabled: false,
		limit: 60,
		up: false,
	}
);

const emit = defineEmits<{ 'update:modelValue': [valor: string] }>();

const busqueda = ref('');
const abierto = ref(false);
const activa = ref(0);
const lista = ref<HTMLElement | null>(null);
const boton = ref<HTMLButtonElement | null>(null);
const campo = ref<InstanceType<typeof SearchField> | null>(null);

/**
 * Único por instancia, para que `aria-activedescendant` apunte a lo suyo.
 *
 * Con un contador y no con azar: dos desplegables sorteando el mismo número es
 * improbable pero posible, y si pasa el fallo es invisible —un lector de
 * pantalla anuncia la opción del otro—. Es además el mismo mecanismo que usan
 * los títulos de los diálogos.
 */
const idLista = siguienteIdDeLista();

const seleccionada = computed(
	() => props.options.find((o) => o.valor === props.modelValue) ?? null
);

const ordenadas = computed(() => buscarOpciones(props.options, busqueda.value));
const coincidencias = computed(() => ordenadas.value.slice(0, props.limit));

/** Cuántas quedaron afuera del recorte, para poder decirlo en vez de esconderlas. */
const sobrantes = computed(() => Math.max(0, ordenadas.value.length - props.limit));

const idDeLaActiva = computed(() =>
	coincidencias.value.length > 0 ? `${idLista}-${activa.value}` : undefined
);

function elegir(valor: string) {
	emit('update:modelValue', valor);
	cerrar();
}

async function abrir() {
	abierto.value = true;
	// Arranca sobre la que está elegida, no sobre la primera: así bajar una vez
	// lleva a la siguiente de la que se tiene, que es lo que se espera.
	const donde = coincidencias.value.findIndex((o) => o.valor === props.modelValue);
	activa.value = donde >= 0 ? donde : 0;

	await nextTick();
	campo.value?.enfocar();
	desplazarALaActiva();
}

function cerrar(devolverElFoco = true) {
	if (!abierto.value) return;
	abierto.value = false;
	busqueda.value = '';
	// El foco vuelve al botón: si se quedara en un campo que ya no existe, el
	// navegador lo manda al principio del documento y quien usa teclado pierde
	// el lugar.
	if (devolverElFoco) nextTick(() => boton.value?.focus());
}

function mover(paso: number) {
	const total = coincidencias.value.length;
	if (total === 0) return;
	// Da la vuelta: bajar desde la última lleva a la primera, que es lo que hace
	// cualquier menú.
	activa.value = (activa.value + paso + total) % total;
	desplazarALaActiva();
}

function irA(indice: number) {
	activa.value = indice;
	desplazarALaActiva();
}

/**
 * Qué opción hay debajo de un evento del ratón.
 *
 * El ratón se atiende en el panel y no opción por opción, que es donde ya vive
 * el teclado: la interacción queda en un solo lugar en vez de repartida entre
 * el contenedor y sesenta hijos, y son dos oyentes en vez de ciento veinte. Las
 * opciones son marcado; no escuchan nada.
 */
function indiceBajoElRaton(evento: Event): number | null {
	const fila = (evento.target as HTMLElement | null)?.closest?.('[data-indice]');
	if (!fila) return null;
	const indice = Number(fila.getAttribute('data-indice'));
	return Number.isInteger(indice) ? indice : null;
}

function alClic(evento: MouseEvent) {
	const indice = indiceBajoElRaton(evento);
	const opcion = indice === null ? undefined : coincidencias.value[indice];
	if (opcion) elegir(opcion.valor);
}

function alPasarElRaton(evento: MouseEvent) {
	const indice = indiceBajoElRaton(evento);
	if (indice !== null) activa.value = indice;
}

function desplazarALaActiva() {
	nextTick(() => {
		lista.value
			?.querySelector(`[data-indice="${activa.value}"]`)
			?.scrollIntoView({ block: 'nearest' });
	});
}

function elegirLaActiva() {
	const opcion = coincidencias.value[activa.value];
	if (opcion) elegir(opcion.valor);
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
	(apagado) => {
		if (apagado) cerrar(false);
	}
);

// Escribir mueve la lista bajo el cursor, así que la marca vuelve arriba. Sin
// esto, `Enter` después de escribir elegía una opción que ya no estaba a la vista.
watch(busqueda, () => {
	activa.value = 0;
	desplazarALaActiva();
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
function alPerderElFoco(evento: FocusEvent) {
	const destino = evento.relatedTarget as Node | null;
	if (destino && (evento.currentTarget as HTMLElement).contains(destino)) return;
	cerrar(false);
}
</script>

<template>
  <div class="relative" @focusout="alPerderElFoco">
    <button
      ref="boton"
      type="button"
      :disabled="disabled"
      class="flex w-full items-center justify-between gap-2 rounded-corner border border-ui-border-strong bg-ui-surface px-2 py-1 text-left text-sm text-tx-main transition-colors hover:bg-ui-bg/60 disabled:cursor-not-allowed disabled:opacity-50"
      :aria-label="label || undefined"
      :aria-expanded="abierto"
      aria-haspopup="listbox"
      @click="abierto ? cerrar() : abrir()"
      @keydown.down.prevent="abierto ? mover(1) : abrir()"
      @keydown.up.prevent="abierto ? mover(-1) : abrir()">
      <span class="min-w-0 flex-1 truncate">
        {{ seleccionada?.etiqueta ?? placeholder }}
        <span v-if="seleccionada?.detalle" class="ml-2 text-tx-muted text-xs">
          {{ seleccionada.detalle }}
        </span>
      </span>
      <ThemeIcon name="go-down" type="symbol" :size="12" class="shrink-0 opacity-60" />
    </button>

    <!-- Dibujado acá y no por el sistema: ése es el punto de este componente.
         `min-w-64` porque el botón puede vivir en un panel angosto y los nombres
         quedaban cortados: un desplegable donde no se lee qué dice cada opción no
         sirve de nada. Se pasa de ancho por encima de lo que tenga al lado, que
         es lo que hace cualquier menú. -->
    <div
      v-if="abierto"
      class="absolute z-20 w-full min-w-64 rounded-corner border border-ui-border-strong bg-ui-bg shadow-lg"
      :class="up ? 'bottom-full mb-1' : 'mt-1'"
      @keydown.escape.prevent="cerrar()"
      @keydown.down.prevent="mover(1)"
      @keydown.up.prevent="mover(-1)"
      @keydown.home.prevent="irA(0)"
      @keydown.end.prevent="irA(coincidencias.length - 1)"
      @keydown.enter.prevent="elegirLaActiva()"
      @keydown.tab="cerrar(false)"
      @click="alClic"
      @mousemove="alPasarElRaton">
      <div class="border-ui-border border-b p-2">
        <SearchField
          ref="campo"
          v-model="busqueda"
          :label="label"
          :placeholder="searchPlaceholder"
          :listbox-id="idLista"
          :active-option-id="idDeLaActiva"
          :expanded="abierto" />
      </div>

      <ul :id="idLista" ref="lista" role="listbox" class="max-h-56 overflow-y-auto p-1">
        <li v-if="coincidencias.length === 0" class="p-3 text-center text-tx-muted text-xs">
          {{ emptyText }}
        </li>
        <li
          v-for="(opcion, indice) in coincidencias"
          :id="`${idLista}-${indice}`"
          :key="opcion.valor"
          :data-indice="indice"
          role="option"
          :aria-selected="opcion.valor === modelValue"
          class="flex cursor-pointer items-baseline gap-2 rounded-corner px-2 py-1 text-sm"
          :class="[
            indice === activa ? 'bg-ui-surface' : '',
            opcion.valor === modelValue ? 'font-medium text-primary' : 'text-tx-main',
          ]">
          <span class="min-w-0 flex-1 truncate">{{ opcion.etiqueta }}</span>
          <span v-if="opcion.detalle" class="shrink-0 text-tx-muted text-xs">
            {{ opcion.detalle }}
          </span>
        </li>
        <!-- Lo que quedó afuera del recorte se dice. Que desaparezcan en silencio
             hace creer que la opción que se busca no existe. -->
        <li v-if="sobrantes > 0" class="px-2 py-1 text-tx-muted text-xs">+{{ sobrantes }}</li>
      </ul>
    </div>
  </div>
</template>
