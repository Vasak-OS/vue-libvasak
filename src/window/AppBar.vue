<script lang="ts" setup>
/**
 * La barra de la ventana, en cualquiera de los cuatro lados.
 *
 * Es lo que en cada aplicación se llamaba `TopBarComponent`: dieciséis copias,
 * cinco variantes distintas. Acá va una sola, y deja de llamarse «top» porque
 * puede no estarlo.
 *
 * # Las ranuras
 *
 * `identidad` es el icono o el logo, que queda pegado al principio.
 * `titulo` es el nombre de la ventana, que no todas muestran.
 * La ranura por omisión es el contenido —pestañas, selectores, lo que sea— y es
 * la única que crece.
 * `centro` va **encima** de la barra, centrado respecto de la ventana entera.
 * `acciones` es lo de la aplicación que va junto a los controles de ventana.
 *
 * Los controles van siempre y al final, que es donde la gente los busca.
 *
 * # `data-tauri-drag-region`
 *
 * En la barra y en el hueco del contenido: sin decoración del compositor, esto
 * es lo único que deja mover la ventana arrastrándola. Va en los contenedores y
 * no en los botones, que tienen que poder apretarse.
 *
 * La forma (vue-libvasak#74): el título va en `text-label-m`; los controles de
 * ventana son los botones sin borde de `WindowControls`.
 *
 * # El centro en ventana angosta (2.4.0)
 *
 * El centro absoluto no sabía de los costados: en una ventana angosta quedaba
 * encima de los botones (lo resolvió el correo en la aplicación, mail#61, y las
 * demás lo tenían igual). Ahora un `ResizeObserver` sobre la barra mide lo que
 * ocupan los costados —todo lo que hay antes y después de la zona del
 * contenido— y el centro:
 *
 * - centrado respecto de la ventana, con un **ancho máximo** que no llega a
 *   ningún costado, mientras entre;
 * - **en la zona libre** (dentro de la zona del contenido, centrado en lo que
 *   sobra) cuando centrado no entra;
 * - **en un renglón propio debajo** cuando ni en la zona libre queda lugar
 *   (96 px): a 240, con los controles, la zona libre es cero.
 *
 * Para volver a centrarse usa el ancho natural que midió la última vez que
 * estuvo centrado, con un margen para no ir y volver en cada píxel. La barra
 * vertical sigue como antes: ahí el centro va en la columna.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref, useSlots } from 'vue';
import {
	CLAVE_DE_LA_BARRA,
	type ControlDeVentana,
	LOS_TRES_CONTROLES,
	type PosicionDeLaBarra,
	usarLaBarra,
} from './tipos';
import { reenviarSiEscuchan } from './reenvio';
import WindowControls from './WindowControls.vue';

const props = withDefaults(
	defineProps<{
		/** Sin esto toma la del marco que la envuelve. */
		position?: PosicionDeLaBarra | null;
		title?: string;
		/** Los nombres de los controles de ventana, traducidos por la aplicación. */
		minimizeLabel?: string;
		maximizeLabel?: string;
		closeLabel?: string;
		/**
		 * Cuáles de los tres botones de ventana lleva.
		 *
		 * Vacío en un cuadro de diálogo y en el instalador; sólo `close` en el
		 * mini-reproductor. Ver `WindowControls`.
		 */
		controls?: ControlDeVentana[];
	}>(),
	{
		position: null,
		title: '',
		controls: () => LOS_TRES_CONTROLES,
	}
);

defineEmits<{
	minimize: [];
	maximize: [];
	close: [];
}>();

const fromFrame = usarLaBarra();
const barPosition = computed<PosicionDeLaBarra>(() => props.position ?? fromFrame.posicion.value);
const vertical = computed(() => barPosition.value === 'left' || barPosition.value === 'right');

// Puesta a mano, la barra manda sobre lo que diga el marco: así una ventana
// puede tener la barra fija aunque el resto del escritorio siga la preferencia.
//
// Se provee siempre y no sólo cuando viene por propiedad: lo que se provee es
// un `computed` que ya resuelve las dos fuentes, así que sin propiedad reexpone
// la del marco sin cambiarla. Con un `if` alrededor, el `provide` quedaba
// condicionado al orden de las llamadas de `setup`, que es justo lo que Vue
// pide no hacer.
provide(CLAVE_DE_LA_BARRA, {
	posicion: barPosition,
	orientacion: computed(() => (vertical.value ? 'vertical' : 'horizontal')),
	vertical,
});

/** El aire entre el centro y lo que tiene a los costados. */
const CENTER_GAP = 8;
/** Lo que tiene que sobrar para volver a centrarse, para no ir y volver. */
const CENTER_HYSTERESIS = 8;

const slots = useSlots();
const bar = ref<HTMLElement | null>(null);
const content = ref<HTMLElement | null>(null);
const centerBox = ref<HTMLElement | null>(null);
const inlineCenterBox = ref<HTMLElement | null>(null);
const belowCenterBox = ref<HTMLElement | null>(null);
/**
 * `overlay` es centrado sobre la barra; `inline`, en la zona libre; `below`,
 * en un renglón propio debajo, cuando ni en la zona libre queda lugar.
 */
const centerMode = ref<'overlay' | 'inline' | 'below'>('overlay');
/** Lo mínimo que tiene que tener la zona libre para que el centro vaya ahí. */
const MINIMUM_INLINE = 96;
/** El ancho máximo del centro centrado, o `null` mientras no se midió. */
const centerMaxWidth = ref<number | null>(null);
let observer: ResizeObserver | null = null;

/**
 * El ancho que querría tener el centro, esté donde esté.
 *
 * Se le saca el tope un instante y se lo mide a `max-content`: con el tope
 * puesto, lo que va adentro se recorta y el centro parecería entrar siempre.
 * Es sincrónico, así que no llega a dibujarse.
 */
function naturalWidth(element: HTMLElement): number {
	const { maxWidth, width } = element.style;
	element.style.maxWidth = 'none';
	element.style.width = 'max-content';
	const measured = element.offsetWidth;
	element.style.maxWidth = maxWidth;
	element.style.width = width;
	return measured;
}

/**
 * Dónde va el centro.
 *
 * Lo que ocupan los costados es lo que queda fuera de la zona del contenido:
 * el icono y el título de un lado, las acciones y los controles del otro. El
 * centro, centrado, tiene que caber en el doble de la mitad libre del lado más
 * ocupado. Si no, va a la zona libre —lo que la zona del contenido no usa—,
 * donde se recorta; y si ahí no quedan ni 96 px, a un renglón propio debajo
 * de la barra: a 240 px, con el icono, dos acciones y los tres controles, la
 * zona libre es cero y el centro desaparecía.
 */
function measureCenter() {
	if (vertical.value || !slots.centro || !bar.value || !content.value) return;
	const barBox = bar.value.getBoundingClientRect();
	// Sin maquetar todavía (el WebView sin tamaño, o las pruebas): no se decide nada.
	if (barBox.width === 0) return;
	const contentBox = content.value.getBoundingClientRect();
	const leading = contentBox.left - barBox.left;
	const trailing = barBox.right - contentBox.right;
	const room = Math.max(Math.floor(barBox.width - 2 * (Math.max(leading, trailing) + CENTER_GAP)), 0);

	const current = { overlay: centerBox.value, inline: inlineCenterBox.value, below: belowCenterBox.value }[centerMode.value];
	if (!current) return;
	const wanted = naturalWidth(current);
	const margin = centerMode.value === 'overlay' ? 0 : CENTER_HYSTERESIS;

	if (wanted + margin <= room) {
		centerMode.value = 'overlay';
		centerMaxWidth.value = room;
		return;
	}
	centerMaxWidth.value = null;

	// Lo que la zona del contenido no usa: su ancho menos lo de la ranura por
	// omisión (y sin contar al centro, si ya está ahí).
	const others = [...content.value.children].filter((child) => child !== inlineCenterBox.value) as HTMLElement[];
	const used = others.reduce((sum, child) => sum + child.offsetWidth + CENTER_GAP, 0);
	const free = contentBox.width - used - (centerMode.value === 'inline' ? 0 : CENTER_GAP);
	const inlineMargin = centerMode.value === 'inline' ? 0 : CENTER_HYSTERESIS;
	centerMode.value = free >= Math.min(wanted, MINIMUM_INLINE) + inlineMargin ? 'inline' : 'below';
}

onMounted(async () => {
	await nextTick();
	measureCenter();
	if (typeof ResizeObserver === 'undefined' || !bar.value) return;
	observer = new ResizeObserver(() => measureCenter());
	observer.observe(bar.value);
	// La zona del contenido también: crece o se achica cuando cambia lo de los
	// costados (un título nuevo, una acción que aparece) sin que la barra cambie.
	if (content.value) observer.observe(content.value);
});

onBeforeUnmount(() => {
	observer?.disconnect();
	observer = null;
});

defineExpose({ centerMode });
</script>

<template>
  <div
    ref="bar"
    class="relative flex shrink-0 items-center gap-2 p-1 font-title"
    :class="[vertical ? 'h-full flex-col' : 'w-full', centerMode === 'below' && !vertical ? 'flex-wrap' : '']"
    data-tauri-drag-region>
    <div v-if="$slots.identidad" class="flex shrink-0 items-center" data-tauri-drag-region>
      <slot name="identidad" />
    </div>

    <!-- El título, que se corta antes de empujar al resto. Vertical no entra
         escrito de costado sin volverse ilegible, así que ahí no se dibuja: lo
         dice el gestor de ventanas igual. -->
    <p
      v-if="($slots.titulo || title) && !vertical"
      class="min-w-0 shrink truncate text-label-m"
      data-tauri-drag-region>
      <slot name="titulo">{{ title }}</slot>
    </p>

    <!-- El contenido: lo único que crece, y lo que se desborda scrollea en el
         sentido de la barra en vez de empujar los controles fuera de la
         ventana. -->
    <div
      ref="content"
      class="flex min-h-0 min-w-0 flex-1 items-center gap-2 overflow-auto"
      :class="vertical ? 'flex-col' : ''"
      data-tauri-drag-region>
      <slot />
      <!-- El centro que centrado no entra: en lo que sobra entre los costados,
           centrado ahí y recortándose antes que empujar a nadie. -->
      <div
        v-if="$slots.centro && !vertical && centerMode === 'inline'"
        ref="inlineCenterBox"
        class="mx-auto flex min-w-0 items-center gap-2"
        data-app-bar-center="inline">
        <slot name="centro" />
      </div>
    </div>

    <div v-if="$slots.acciones" class="flex shrink-0 items-center gap-1" :class="vertical ? 'flex-col' : ''">
      <slot name="acciones" />
    </div>

    <WindowControls
      :controls="controls"
      :minimize-label="minimizeLabel"
      :maximize-label="maximizeLabel"
      :close-label="closeLabel"
      v-on="reenviarSiEscuchan(['minimize', 'maximize', 'close'])" />

    <!-- Cuando no queda lugar ni en la zona libre: un renglón propio debajo,
         que es la barra en «una columna por vez». -->
    <div
      v-if="$slots.centro && !vertical && centerMode === 'below'"
      class="flex min-w-0 basis-full items-center justify-center px-2 pb-1"
      data-app-bar-center="below"
      data-tauri-drag-region>
      <div ref="belowCenterBox" class="flex min-w-0 items-center gap-2"><slot name="centro" /></div>
    </div>

    <!-- `centro` va **encima** de la barra y no como una columna más.
         Centrado entre dos columnas queda centrado respecto de lo que sobra a
         los costados, no de la ventana: con el icono de un lado y tres
         controles del otro, eso lo corre visiblemente. Absoluto sobre la barra
         entera y centrado queda donde la gente espera; el tope de ancho
         (2.4.0) es lo que no lo deja llegar a los costados.

         `pointer-events-none` en el envoltorio para no tapar la zona de
         arrastre; lo que va adentro lo vuelve a encender. -->
    <div
      v-if="$slots.centro && (vertical || centerMode === 'overlay')"
      class="pointer-events-none absolute flex items-center justify-center"
      :class="vertical
        ? 'inset-x-0 top-1/2 -translate-y-1/2 flex-col'
        : 'inset-0'"
      data-app-bar-center="overlay">
      <div
        ref="centerBox"
        class="pointer-events-auto flex min-w-0 items-center gap-2"
        :class="vertical ? 'flex-col' : ''"
        :style="!vertical && centerMaxWidth !== null ? { maxWidth: `${centerMaxWidth}px` } : undefined">
        <slot name="centro" />
      </div>
    </div>
  </div>
</template>
