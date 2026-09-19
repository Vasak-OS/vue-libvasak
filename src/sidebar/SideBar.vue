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
 * # Por qué no hay traducciones acá
 *
 * Una librería de componentes que traduce obliga a todas las aplicaciones a
 * compartir sus claves. Los textos entran por propiedades; el `aria-label` del
 * botón de plegar también, que es el único que no se ve pero se oye.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import ThemeIcon from '../icons/ThemeIcon.vue';
import SideGroup from './SideGroup.vue';
import SideButton from './SideButton.vue';
import type { SidebarCategory } from './tipos';

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
		collapseLabel: 'Collapse',
		expandLabel: 'Expand',
	}
);

/**
 * El botón de plegar, que aparece en dos lugares de la plantilla —con cabecera y
 * sin ella— y tiene que verse igual en los dos.
 *
 * Escondido por debajo de 768: ahí la barra se pliega sola y ofrecer
 * desplegarla sería ofrecer algo que no entra.
 */
const CLASES_DEL_BOTON =
	'hidden h-8 w-8 shrink-0 items-center justify-center rounded-corner border border-ui-border bg-ui-surface/70 transition-colors hover:bg-ui-surface md:inline-flex';

const emit = defineEmits<{
	'update:modelValue': [value: string];
	'update:collapsed': [value: boolean];
	change: [value: string];
}>();

const plegadaAMano = ref(props.collapsed ?? false);
const esAngosta = ref(false);
let consulta: MediaQueryList | null = null;

/**
 * Plegada por decisión o por ancho.
 *
 * Por debajo de 768 píxeles no hay lugar para el texto de los botones, así que
 * la barra se pliega sola y el botón de plegar no se muestra: ofrecer
 * desplegarla ahí sería ofrecer algo que no entra.
 */
const plegada = computed(() => esAngosta.value || plegadaAMano.value);
const hayTitulo = computed(() => Boolean(props.title || props.subtitle));
const hayCategorias = computed(() => props.categories.length > 0);

function revisar() {
	esAngosta.value = consulta?.matches ?? false;
}

function alternar() {
	plegadaAMano.value = !plegadaAMano.value;
	emit('update:collapsed', plegadaAMano.value);
}

function elegir(id: string) {
	emit('update:modelValue', id);
	emit('change', id);
}

// Controlada desde afuera cuando la aplicación pasa `collapsed`: así dos
// ventanas de la misma aplicación pueden recordar cómo la dejó la persona.
watch(
	() => props.collapsed,
	(valor) => {
		if (valor !== undefined) {
			plegadaAMano.value = valor;
		}
	}
);

onMounted(() => {
	consulta = window.matchMedia('(max-width: 767px)');
	revisar();
	consulta.addEventListener('change', revisar);
});

onBeforeUnmount(() => consulta?.removeEventListener('change', revisar));

defineExpose({ collapsed: plegada });
</script>

<template>
  <aside
    class="relative z-30 flex h-full shrink-0 flex-col rounded-corner border border-ui-border bg-ui-surface/70 transition-all duration-300"
    :class="['w-[84px]', plegada ? 'md:w-[84px]' : 'md:w-72']">
    <header
      v-if="hayTitulo || $slots.header"
      class="flex flex-col gap-2 border-ui-border border-b p-2">
      <div class="flex items-center gap-2">
        <button
          type="button"
          :class="CLASES_DEL_BOTON"
          :aria-label="plegada ? expandLabel : collapseLabel"
          :aria-expanded="!plegada"
          @click="alternar">
          <ThemeIcon
            :name="plegada ? 'pan-end-symbolic' : 'pan-start-symbolic'"
            type="symbol"
            :size="16" />
        </button>
        <!-- El área de título es opcional: hay ventanas donde el nombre ya está
             en la barra superior y repetirlo acá gasta la mitad del alto. -->
        <div v-if="hayTitulo && !plegada" class="min-w-0 flex-1">
          <p v-if="title" class="truncate font-semibold text-sm">{{ title }}</p>
          <p v-if="subtitle" class="truncate text-tx-muted text-xs">{{ subtitle }}</p>
        </div>
      </div>

      <!-- Lo que va antes que cualquier categoría: la búsqueda de la tienda,
           por ejemplo. Plegada no entra un campo de texto —84 píxeles es el
           ancho del icono— así que se esconde en vez de quedar ilegible. -->
      <div v-if="$slots.header && !plegada">
        <slot name="header" :collapsed="plegada" />
      </div>
    </header>

    <!-- Sin área de título el botón de plegar necesita su propio lugar, o la
         barra deja de poder plegarse. Alineado a la izquierda y no centrado: es
         donde queda cuando **sí** hay título, y así no se corre de lugar entre
         una ventana y otra del escritorio. -->
    <div v-else class="flex border-ui-border border-b p-2">
      <button
        type="button"
        :class="CLASES_DEL_BOTON"
        :aria-label="plegada ? expandLabel : collapseLabel"
        :aria-expanded="!plegada"
        @click="alternar">
        <ThemeIcon
          :name="plegada ? 'pan-end-symbolic' : 'pan-start-symbolic'"
          type="symbol"
          :size="16" />
      </button>
    </div>

    <div class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-2">
      <SideGroup
        v-for="category in categories"
        :key="category.id"
        :title="category.title"
        :collapsed="plegada">
        <SideButton
          v-for="item in category.items"
          :key="item.id"
          :label="item.label"
          :icon="item.icon"
          :badge="item.badge"
          :disabled="item.disabled"
          :collapsed="plegada"
          :active="modelValue === item.id"
          @click="elegir(item.id)" />
      </SideGroup>

      <slot :collapsed="plegada" />
    </div>
  </aside>
</template>
