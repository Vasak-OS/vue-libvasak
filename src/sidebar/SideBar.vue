<script lang="ts" setup>
/**
 * La barra lateral de las aplicaciones de VasakOS.
 *
 * Es la de Configuración, que es la que todas las demás venían copiando: mismo
 * `aside` con borde y esquina redondeada, mismo plegado a 84 píxeles, mismos
 * grupos con título. Que estén acá y no copiadas en cada repositorio es lo que
 * hace que las ventanas se lean como partes del mismo escritorio en vez de
 * parecerse por casualidad.
 *
 * # Los dos caminos
 *
 * Con `categories` se arma sola: cada categoría es un grupo plegable y cada
 * elemento un botón, con el activo marcado contra `modelValue`. Es el camino de
 * Configuración y del monitor, donde la barra **es** la navegación.
 *
 * Con la ranura por omisión se pone cualquier cosa adentro —discos, pasos de un
 * asistente, una línea de tiempo— y la barra aporta nada más que el marco y el
 * plegado. La ranura recibe `collapsed`, porque lo que se dibuja adentro casi
 * siempre tiene que saberlo.
 *
 * Los dos caminos conviven: lo declarativo va primero y la ranura después.
 *
 * # El fondo
 *
 * `bg-ui-surface/70`, no `bg-ui-bg`. El token de fondo es el de **la ventana**;
 * lo que se apoya encima va en superficie. Venía de la copia de Configuración
 * con el fondo de ventana puesto, y sobre la ventana eso se lee como un
 * rectángulo apenas más claro en vez de un panel.
 *
 * `/70` es el valor del escritorio para un panel, y las tarjetas de contenido de
 * las aplicaciones van al mismo: la barra y las tarjetas están apoyadas en la
 * misma ventana y tienen que leerse como el mismo material. Las que todavía
 * estén en `/40` son las que faltan corregir.
 *
 * # Lo que tiene que poner quien la usa
 *
 * Aire alrededor. La barra es una tarjeta con borde y esquina redondeada, así
 * que pegada al borde de la ventana se le come el redondeo: el contenedor que
 * la envuelve lleva `p-1` y un `gap-1` contra el contenido, como en
 * Configuración y en la tienda.
 *
 * # Los textos
 *
 * Una librería de componentes que traduce obliga a todas las aplicaciones a
 * compartir sus claves, así que los textos entran por propiedades; el
 * `aria-label` del botón de plegar también, que es el único que no se ve pero se
 * oye. Sin pasarlo sale del catálogo de la aplicación (`sidebar.collapse`,
 * `sidebar.expand`) y, si tampoco está ahí, «Collapse» / «Expand».
 *
 * # Se pliega por el lugar que le dan, no por la pantalla
 *
 * Por debajo de 768 píxeles de **su contenedor** no entra el texto de los
 * botones y se pliega sola. Hasta la 1.x medía la página entera y usaba `md:`,
 * que es un punto de corte de la pantalla: la barra no sabe en qué ventana
 * está, y en un panel angosto dentro de una ventana ancha se quedaba
 * desplegada, cortada. Ahora un `ResizeObserver` mira al elemento que la
 * contiene —en WebKitGTK ni `matchMedia` ni `resize` avisan, el observador sí—
 * y las clases salen de ese estado, sin puntos de corte.
 *
 * # La forma (vue-libvasak#74)
 *
 * La barra es una tarjeta de Once UI: `rounded-corner-l`, canto `ui-line`,
 * superficie `/70`. El botón de plegar es un botón sin borde de 32. Los
 * botones, ver `SideButton`.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import ThemeIcon from '../icons/ThemeIcon.vue';
import { useLabels } from '../shared/labels';
import SideButton from './SideButton.vue';
import SideGroup from './SideGroup.vue';
import type { SidebarCategory } from './types';

const props = withDefaults(
	defineProps<{
		/** El nombre de la ventana. Sin él y sin `subtitle` no hay área de título. */
		title?: string;
		subtitle?: string;
		categories?: SidebarCategory[];
		/** El identificador del elemento activo. */
		modelValue?: string;
		/** Plegada desde afuera. Sin esto, la barra se maneja sola. */
		collapsed?: boolean;
		/** Lo que oye un lector de pantalla en el botón de plegar. */
		collapseLabel?: string;
		expandLabel?: string;
	}>(),
	{
		title: '',
		subtitle: '',
		categories: () => [],
		modelValue: '',
		collapsed: undefined,
		collapseLabel: undefined,
		expandLabel: undefined,
	}
);

const emit = defineEmits<{
	'update:modelValue': [value: string];
	'update:collapsed': [value: boolean];
	change: [value: string];
}>();

/** Por debajo de esto no entra el texto de los botones y la barra se pliega. */
const MINIMUM_WIDTH = 767;

const translate = useLabels();
const collapseText = computed(() => props.collapseLabel ?? translate('sidebar.collapse', 'Collapse'));
const expandText = computed(() => props.expandLabel ?? translate('sidebar.expand', 'Expand'));

const root = ref<HTMLElement | null>(null);
const collapsedByHand = ref(props.collapsed ?? false);
const narrow = ref(false);
let observer: ResizeObserver | null = null;

/**
 * Plegada por decisión o por ancho.
 *
 * Angosta, el botón de plegar no se muestra: ofrecer desplegarla ahí sería
 * ofrecer algo que no entra.
 */
const isCollapsed = computed(() => narrow.value || collapsedByHand.value);
const hasTitle = computed(() => Boolean(props.title || props.subtitle));

/**
 * El botón de plegar, que aparece en dos lugares de la plantilla —con cabecera y
 * sin ella— y tiene que verse igual en los dos.
 */
const toggleClasses = computed(() => [
	'h-8 w-8 shrink-0 items-center justify-center rounded-corner-m text-tx-main transition-colors duration-200 ease-ui hover:bg-ui-hover active:bg-ui-pressed active:duration-100',
	narrow.value ? 'hidden' : 'inline-flex',
]);

/**
 * Lo que mide el lugar donde está puesta.
 *
 * Un contenedor que mide cero todavía no se maquetó —el WebView sin tamaño, o
 * una vista que se monta antes de mostrarse—, y plegarse por eso sería plegarse
 * por nada: ahí se mira la página, que es lo que hacía la 1.x.
 */
function containerWidth(): number {
	const width = root.value?.parentElement?.clientWidth;
	if (width) return width;
	return document.documentElement?.clientWidth || window.innerWidth;
}

function check() {
	narrow.value = containerWidth() <= MINIMUM_WIDTH;
}

function toggle() {
	collapsedByHand.value = !collapsedByHand.value;
	emit('update:collapsed', collapsedByHand.value);
}

function choose(id: string) {
	emit('update:modelValue', id);
	emit('change', id);
}

// Controlada desde afuera cuando la aplicación pasa `collapsed`: así dos
// ventanas de la misma aplicación pueden recordar cómo la dejó la persona.
watch(
	() => props.collapsed,
	(value) => {
		if (value !== undefined) {
			collapsedByHand.value = value;
		}
	}
);

/**
 * El observador dispara también con la primera medición, así que cubre el caso
 * de montarse antes de que el WebView tenga tamaño —que era el fallo original de
 * la 0.x— y cada cambio del contenedor después.
 */
onMounted(() => {
	check();
	if (typeof ResizeObserver !== 'undefined') {
		observer = new ResizeObserver(check);
		const container = root.value?.parentElement;
		if (container) observer.observe(container);
		// La página también: mientras el contenedor mida cero es la que manda, y
		// tiene que poder avisar cuando el WebView recibe su tamaño.
		if (document.documentElement) observer.observe(document.documentElement);
	}
});

onBeforeUnmount(() => {
	observer?.disconnect();
	observer = null;
});

defineExpose({ collapsed: isCollapsed });
</script>

<template>
  <aside
    ref="root"
    class="relative z-30 flex h-full min-h-0 shrink-0 flex-col rounded-corner-l border border-ui-line bg-ui-surface/70 text-tx-main transition-[width] duration-300 ease-ui"
    :class="isCollapsed ? 'w-[84px]' : 'w-72'">
    <header
      v-if="hasTitle || $slots.header"
      class="flex flex-col gap-2 border-ui-line-weak border-b p-2">
      <div class="flex min-w-0 items-center gap-2">
        <button
          type="button"
          :class="toggleClasses"
          :aria-label="isCollapsed ? expandText : collapseText"
          :aria-expanded="!isCollapsed"
          @click="toggle">
          <ThemeIcon
            :name="isCollapsed ? 'pan-end-symbolic' : 'pan-start-symbolic'"
            type="symbol"
            :size="16" />
        </button>
        <!-- El área de título es opcional: hay ventanas donde el nombre ya está
             en la barra superior y repetirlo acá gasta la mitad del alto. -->
        <div v-if="hasTitle && !isCollapsed" class="min-w-0 flex-1">
          <p v-if="title" class="truncate font-semibold text-label-m">{{ title }}</p>
          <p v-if="subtitle" class="truncate text-body-xs text-tx-muted">{{ subtitle }}</p>
        </div>
      </div>

      <!-- Lo que va antes que cualquier categoría: la búsqueda de la tienda,
           por ejemplo. Plegada no entra un campo de texto —84 píxeles es el
           ancho del icono— así que se esconde en vez de quedar ilegible. -->
      <div v-if="$slots.header && !isCollapsed" class="min-w-0">
        <slot name="header" :collapsed="isCollapsed" />
      </div>
    </header>

    <!-- Sin área de título el botón de plegar necesita su propio lugar, o la
         barra deja de poder plegarse. Alineado a la izquierda y no centrado: es
         donde queda cuando **sí** hay título, y así no se corre de lugar entre
         una ventana y otra del escritorio. -->
    <div v-else class="flex border-ui-line-weak border-b p-2">
      <button
        type="button"
        :class="toggleClasses"
        :aria-label="isCollapsed ? expandText : collapseText"
        :aria-expanded="!isCollapsed"
        @click="toggle">
        <ThemeIcon
          :name="isCollapsed ? 'pan-end-symbolic' : 'pan-start-symbolic'"
          type="symbol"
          :size="16" />
      </button>
    </div>

    <div class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-2">
      <SideGroup
        v-for="category in categories"
        :key="category.id"
        :title="category.title"
        :collapsed="isCollapsed">
        <SideButton
          v-for="item in category.items"
          :key="item.id"
          :label="item.label"
          :icon="item.icon"
          :badge="item.badge"
          :disabled="item.disabled"
          :collapsed="isCollapsed"
          :active="modelValue === item.id"
          @click="choose(item.id)" />
      </SideGroup>

      <slot :collapsed="isCollapsed" />
    </div>
  </aside>
</template>
