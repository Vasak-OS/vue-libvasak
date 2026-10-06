<script setup lang="ts">
/**
 * El banco de estados de la primera tanda de vue-libvasak#74.
 *
 * Cada componente en todos sus estados y a cada ancho pedido. Los estados que
 * dependen del puntero o del teclado —pasar por encima, apretar, el foco— no se
 * pueden provocar en una captura sin interacción, así que se **fuerzan**: al
 * montar se copia cada regla `:hover`, `:active` y `:focus-visible` de la hoja
 * con una clase en su lugar (`is-hover`, `is-active`, `is-focus`), y el banco
 * se la pone al elemento. Es la misma regla que escribió el componente, no una
 * imitación.
 *
 * Está escrito contra la API pública que existe **antes y después** del cambio,
 * para que el mismo banco sirva para las dos capturas.
 */
import { computed, nextTick, onMounted, ref } from 'vue';
import {
	ActionButton,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	ListCard,
	SearchField,
	SideBar,
	TabBar,
	TextInput,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '../src';
import Bench24 from './Bench24.vue';
import BenchOrbit from './BenchOrbit.vue';
import Bench28 from './Bench28.vue';
import Bench213 from './Bench213.vue';
import BenchExtras from './BenchExtras.vue';
import BenchFeedback from './BenchFeedback.vue';
import BenchForms from './BenchForms.vue';
import BenchRows from './BenchRows.vue';
import BenchSelection from './BenchSelection.vue';
import BenchWindow from './BenchWindow.vue';
import VerticalTabs from './VerticalTabs.vue';

const props = defineProps<{ widths: number[]; only: string }>();

const sections = [
	'dropdown',
	'inputs',
	'buttons',
	'tooltip',
	'listcard',
	'tabs',
	'sidebar',
	'forms',
	'devices',
	'feedback',
	'dialog',
	'window',
	'media',
	'frame',
	'selection',
	'fields',
	'rows',
	'notices',
	'dialog-body',
	'dialog-sm',
	'popover',
	'menu-22',
	'identity',
	'media-22',
	'data',
	'tray-22',
	'badge-24',
	'appbar-24',
	'identity-24',
	'fields-24',
	'menu-24',
	'accounts-24',
	'session-24',
	'menu-end',
	'select-24',
	'dialog-wide',
	'dialog-lg',
	'toast-top',
	'orbit',
	'charts-28',
	'tiles-213',
] as const;
const WINDOW = ['window', 'media', 'frame'];
const FORMS = ['forms', 'devices'];
const FEEDBACK = ['feedback', 'dialog', 'dialog-body', 'dialog-sm'];
/** Lo de la 2.1.0. */
const SELECTION = ['selection', 'fields'];
const ROWS = ['rows', 'notices'];
/** Lo de la 2.2.0. */
const EXTRAS = ['popover', 'menu-22', 'identity', 'media-22', 'data', 'tray-22'];
/** Lo de la 2.4.0 que se dibuja contra la ventana: se captura solo, a cada ancho. */
const NEXT_WINDOW = ['menu-end', 'select-24', 'dialog-wide', 'dialog-lg', 'toast-top'];
/** Lo de la 2.4.0. */
const NEXT = [
	'badge-24',
	'appbar-24',
	'identity-24',
	'fields-24',
	'menu-24',
	'accounts-24',
	'session-24',
	'menu-end',
	'select-24',
	'dialog-wide',
	'dialog-lg',
	'toast-top',
];
const shown = computed(() =>
	props.only ? sections.filter((section) => props.only.split(',').includes(section)) : sections
);

const text = ref('Documentos');
const empty = ref('');
/**
 * Los menús se abren después de montar: la posición se calcula al abrir, y uno
 * que nace abierto se queda en la esquina de la página.
 */
const menusOpen = ref(false);

const tabs = [
	{ id: 'a', label: 'Inicio', icon: 'user-home' },
	{ id: 'b', label: 'notas-de-la-reunión.md', dirty: true },
	{ id: 'c', label: 'Terminal', icon: 'utilities-terminal' },
	{ id: 'd', label: 'Descargas', icon: 'folder-download' },
];

const categories = [
	{
		id: 'system',
		title: 'Sistema',
		items: [
			{ id: 'network', label: 'Red', icon: 'preferences-system-network' },
			{ id: 'bluetooth', label: 'Bluetooth', icon: 'bluetooth', badge: 3 },
			{ id: 'sound', label: 'Sonido', icon: 'audio-volume-high' },
			{ id: 'power', label: 'Energía', icon: 'battery', disabled: true },
		],
	},
	{
		id: 'look',
		title: 'Apariencia',
		items: [
			{ id: 'theme', label: 'Tema y colores', icon: 'preferences-desktop-theme' },
			{ id: 'fonts', label: 'Tipografías', icon: 'preferences-desktop-font' },
		],
	},
];

const buttonVariants = ['primary', 'secondary', 'ghost', 'danger'] as const;
const buttonStates = ['', 'is-hover', 'is-active', 'is-focus'] as const;

/**
 * Copia las reglas de estado con una clase en lugar de la seudoclase.
 *
 * Se trabaja sobre el texto de las hojas que inyecta Vite: con CSS anidado —el
 * que escribe Tailwind 4— recorrer `cssRules` obliga a bajar por capas, medios
 * y reglas anidadas, y el reemplazo de texto hace lo mismo en una línea. El
 * `@media (hover: hover)` se abre porque Chrome sin pantalla informa que no hay
 * puntero que pueda pasar por encima.
 */
function forceStates() {
	const source = Array.from(document.querySelectorAll('style'))
		.map((style) => style.textContent ?? '')
		.join('\n');
	const forced = source
		.replaceAll(':hover', '.is-hover')
		.replaceAll(':active', '.is-active')
		.replaceAll(':focus-visible', '.is-focus')
		.replaceAll(':focus-within', '.is-focus')
		.replaceAll(/:focus(?![-\w])/g, '.is-focus')
		.replaceAll('(hover: hover)', '(min-width: 0px)');
	const style = document.createElement('style');
	style.dataset.bench = 'forced-states';
	style.textContent = forced;
	document.head.append(style);
}

/** Los globos se abren como se abren de verdad: con el puntero encima. */
function openTooltips() {
	for (const trigger of document.querySelectorAll<HTMLElement>('[data-bench-tooltip] > div, [data-bench-enter]')) {
		trigger.dispatchEvent(new MouseEvent('mouseenter'));
	}
}

onMounted(async () => {
	await nextTick();
	forceStates();
	menusOpen.value = true;
	setTimeout(openTooltips, 50);
});

</script>

<template>
  <!-- El marco de la ventana es la ventana: se dibuja solo, sin el banco
       alrededor, y se captura con la ventana de cada ancho. -->
  <BenchWindow v-if="only === 'frame'" section="frame" :width="0" first />
  <!-- Lo de la 2.4.0 que se dibuja contra la ventana, también solo: dentro de
       la caja del banco la página se pasaría del ancho que se quiere medir. -->
  <main v-else-if="NEXT_WINDOW.includes(only)" class="min-h-screen p-4 text-tx-main">
    <Bench24 :section="only" :width="widths[0] ?? 0" first />
  </main>
  <main v-else class="flex flex-col gap-8 p-4 text-tx-main">
    <section v-for="section in shown" :key="section" class="flex flex-col gap-4">
      <h1 class="font-semibold text-lg">{{ section }}</h1>

      <div v-for="width in widths" :key="width" class="flex flex-col gap-2">
        <p class="text-tx-muted text-xs">{{ width }} px</p>
        <div
          class="overflow-hidden rounded-corner border border-dashed border-ui-border-strong/40 p-2"
          :style="{ width: `${width}px` }">
          <!-- Menú desplegable: abierto, con cada estado de ítem. -->
          <div v-if="section === 'dropdown'" class="h-80">
            <DropdownMenu :open="menusOpen">
              <DropdownMenuTrigger as-child>
                <ActionButton label="Acciones" variant="secondary" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Archivo</DropdownMenuLabel>
                <DropdownMenuItem>Reposo</DropdownMenuItem>
                <DropdownMenuItem class="is-hover">Encima</DropdownMenuItem>
                <DropdownMenuItem class="is-focus">Con el foco del teclado</DropdownMenuItem>
                <DropdownMenuItem class="is-active">Apretado</DropdownMenuItem>
                <DropdownMenuItem disabled>Apagado</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Un nombre de opción bastante más largo que el menú</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <!-- Campos. -->
          <div v-else-if="section === 'inputs'" class="grid gap-2" :class="width >= 600 ? 'grid-cols-2' : ''">
            <TextInput v-model="empty" placeholder="Reposo, vacío" aria-label="Reposo" />
            <TextInput v-model="text" aria-label="Con texto" />
            <TextInput v-model="text" class="is-hover" aria-label="Encima" />
            <TextInput v-model="text" class="is-focus" aria-label="Con el foco" />
            <TextInput v-model="text" invalid aria-label="Inválido" />
            <TextInput v-model="text" disabled aria-label="Apagado" />
            <SearchField v-model="empty" label="Buscar" />
            <SearchField v-model="text" label="Buscar" />
            <SearchField v-model="text" label="Buscar" busy />
            <SearchField v-model="empty" label="Buscar aplicaciones y archivos con un nombre largo" disabled />
          </div>

          <!-- Botones: cada variante en cada estado, y los tamaños. -->
          <div v-else-if="section === 'buttons'" class="flex flex-col gap-2">
            <div v-for="variant in buttonVariants" :key="variant" class="flex flex-wrap items-center gap-2">
              <ActionButton
                v-for="state in buttonStates"
                :key="state"
                :label="state ? state.replace('is-', '') : variant"
                :variant="variant as never"
                :class="state" />
              <ActionButton label="apagado" :variant="variant as never" disabled />
              <ActionButton label="cargando" :variant="variant as never" loading />
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <ActionButton label="sm" size="sm" />
              <ActionButton label="md" size="md" />
              <ActionButton label="lg" size="lg" />
              <ActionButton label="Un botón con una etiqueta larga que no entra" variant="secondary" />
            </div>
          </div>

          <!-- Globos, abiertos. -->
          <div v-else-if="section === 'tooltip'" class="flex h-24 flex-wrap items-start gap-8">
            <Tooltip :delay-duration="0" data-bench-tooltip>
              <TooltipTrigger>
                <ActionButton label="Guardar" variant="secondary" />
              </TooltipTrigger>
              <TooltipContent>Guarda el archivo (Ctrl+S)</TooltipContent>
            </Tooltip>
            <Tooltip :delay-duration="0" data-bench-tooltip>
              <TooltipTrigger>
                <ActionButton label="Compartir" variant="secondary" />
              </TooltipTrigger>
              <TooltipContent side="right">A la derecha</TooltipContent>
            </Tooltip>
          </div>

          <!-- Filas de lista. -->
          <div v-else-if="section === 'listcard'" class="flex flex-col gap-2">
            <ListCard><span class="min-w-0 truncate">Fija, sin acción</span><span class="text-tx-muted text-xs">12 MB</span></ListCard>
            <ListCard clickable><span class="min-w-0 truncate">Clicable, en reposo</span></ListCard>
            <ListCard clickable class="is-hover"><span>Clicable, encima</span></ListCard>
            <ListCard clickable class="is-focus"><span>Clicable, con el foco</span></ListCard>
            <ListCard clickable>
              <span class="min-w-0 truncate">Una fila con un nombre muy largo que tiene que cortarse sin empujar lo de al lado</span>
              <span class="shrink-0 text-tx-muted text-xs">3 KB</span>
            </ListCard>
          </div>

          <!-- Pestañas: horizontal, y vertical con el nombre desplegado. -->
          <div v-else-if="section === 'tabs'" class="flex flex-col gap-4">
            <div class="h-10">
              <TabBar :tabs="tabs" model-value="a" new-label="Pestaña nueva" />
            </div>
            <div class="flex h-48 gap-4">
              <VerticalTabs :tabs="tabs" />
            </div>
          </div>

          <BenchForms v-else-if="FORMS.includes(section)" :section="section" :width="width" />
          <BenchSelection v-else-if="SELECTION.includes(section)" :section="section" :width="width" />
          <BenchRows v-else-if="ROWS.includes(section)" :section="section" :width="width" />
          <BenchExtras v-else-if="EXTRAS.includes(section)" :section="section" :width="width" />
          <BenchOrbit v-else-if="section === 'orbit'" :section="section" :width="width" />
          <Bench28
            v-else-if="section === 'charts-28'"
            :section="section"
            :width="width"
            :first="width === widths[0]" />
          <Bench213
            v-else-if="section === 'tiles-213'"
            :section="section"
            :width="width"
            :first="width === widths[0]" />
          <Bench24
            v-else-if="NEXT.includes(section)"
            :section="section"
            :width="width"
            :first="width === widths[0]" />
          <BenchWindow
            v-else-if="WINDOW.includes(section)"
            :section="section"
            :width="width"
            :first="width === widths[0]" />
          <BenchFeedback
            v-else-if="FEEDBACK.includes(section)"
            :section="section"
            :width="width"
            :first="width === widths[0]" />

          <!-- Barra lateral: desplegada y plegada. -->
          <div v-else-if="section === 'sidebar'" class="flex h-120 gap-2">
            <SideBar
              :categories="categories"
              model-value="bluetooth"
              title="Configuración"
              subtitle="VasakOS" />
            <SideBar :categories="categories" model-value="bluetooth" :collapsed="true" />
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
