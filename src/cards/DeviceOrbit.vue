<script setup lang="ts">
/**
 * Un dispositivo en el centro y sus datos alrededor, unidos por líneas.
 *
 * Es la vista radial del Bluetooth y de la red del escritorio
 * (vasak-desktop#132): el auricular conectado o la red en uso al centro, en un
 * círculo de acento con su halo, y la MAC, la batería, la señal o la IP como
 * **satélites**. No sabe nada de Bluetooth ni de redes: quien la usa le pasa el
 * centro y los satélites ya armados. Es la otra forma de mostrar lo que muestra
 * `DeviceCard` en una lista, y no la reemplaza: la lista sirve para elegir, la
 * órbita para ver de un vistazo lo que está conectado.
 *
 * # Lo que no se dibuja
 *
 * Un satélite sin dato —`value` vacío, `null` o `undefined`— **no se dibuja**,
 * salvo que sea una acción. Una batería que el dispositivo no publica es «no
 * lo sé», no «0 %», y un hueco en la órbita tampoco dice nada: los que quedan
 * se reparten parejo.
 *
 * Sin centro (`center` en `null`) queda el círculo vacío con `emptyLabel`, y lo
 * que se pase alrededor —lo normal es una sola acción, «buscar»—. No hay una
 * órbita de datos de nada.
 *
 * # Las líneas son SVG
 *
 * Son geometría de datos: dependen de dónde quedó cada pastilla, que depende
 * del ancho. Es la **única excepción** a «nada de SVG» de la librería y está
 * nombrada en la guardia (`tests/tokens-exist.test.ts`): un `<svg>` con
 * `aria-hidden`, sólo `<path>`, y el trazo en `currentColor`, que es el token
 * `ui-line` de la clase. Ni iconos ni colores.
 *
 * Las líneas salen del canto del círculo y llegan al canto de la pastilla
 * (`orbit-layout.ts`): la pastilla es translúcida y una línea que la cruzara
 * se vería a través.
 *
 * # Teclado y lector
 *
 * La posición es decoración: el dato no puede vivir sólo en dónde está. Los
 * satélites son una lista en el orden de la órbita (desde arriba, en el sentido
 * del reloj), cada uno se lee «etiqueta, valor» y el que es acción es un botón
 * de verdad, que se alcanza con Tab.
 *
 * # Adaptable
 *
 * Un `ResizeObserver` sobre la raíz —en WebKitGTK no llega ni `resize` ni
 * `matchMedia`— mide la caja y las pastillas. Si la órbita entra, reparte; si
 * el satélite de un costado pisaría el círculo, **apila**: el círculo arriba y
 * los satélites debajo, uno por renglón, como una pantalla de celular. Nada se
 * corta ni se pisa a 240 px. `layout="stacked"` apila siempre.
 *
 * # Movimiento
 *
 * Al cambiar `orbitKey` (otra pestaña, otro dispositivo) los satélites se
 * contraen hacia el centro y salen los nuevos, en 200 ms. `pulsing` hace latir
 * el halo, mientras se buscan dispositivos. Con `prefers-reduced-motion`, sólo
 * opacidad.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import ThemeIcon from '../icons/ThemeIcon.vue';
import { centerRadius, elbowPath, orbitPositions, orbitRadii, type OrbitPoint } from './orbit-layout';

/** El dispositivo o la red del centro. */
export interface OrbitCenter {
	/** El nombre del icono en el tema del escritorio. */
	icon?: string;
	iconType?: 'icon' | 'symbol';
	/** El nombre, en negrita. */
	title: string;
	/** Debajo, chico: «Conectado». */
	subtitle?: string;
}

/** Un dato alrededor del centro. */
export interface OrbitSatellite {
	/** Único dentro de la órbita. */
	id: string;
	/** El nombre del icono en el tema del escritorio. */
	icon?: string;
	/** El dato: «70 %», la MAC. Vacío, el satélite no se dibuja (salvo una acción). */
	value?: string | null;
	/** Qué es el dato, ya traducido: «Batería». */
	label: string;
	/** Una acción: es un botón, con el canto de acento, y emite `select`. */
	action?: boolean;
	/** `accent` pinta el valor de primario: una batería por debajo del 20 %. */
	tone?: 'default' | 'accent';
	disabled?: boolean;
}

const props = withDefaults(
	defineProps<{
		/** El nombre del grupo, ya traducido. */
		label: string;
		center: OrbitCenter | null;
		satellites?: OrbitSatellite[];
		/** Lo que dice el círculo vacío, ya traducido. */
		emptyLabel?: string;
		emptyIcon?: string;
		/** El halo late: se está buscando. */
		pulsing?: boolean;
		/**
		 * Cambiarla es «otra órbita»: los satélites viejos se contraen al centro
		 * y salen los nuevos. Sin cambiarla, un satélite que cambia de valor se
		 * queda donde está.
		 */
		orbitKey?: string | number;
		/**
		 * `auto` reparte si entra y apila si no; `stacked` apila siempre. No hay
		 * «radial siempre»: una órbita que no entra pisa el círculo.
		 */
		layout?: 'auto' | 'stacked';
	}>(),
	{
		satellites: () => [],
		emptyLabel: '',
		emptyIcon: '',
		pulsing: false,
		orbitKey: '',
		layout: 'auto',
	}
);

const emit = defineEmits<{
	select: [id: string];
}>();

/** Los que se dibujan: con dato, o acciones. */
const visible = computed(() =>
	props.satellites.filter(
		(satellite) => satellite.action || (satellite.value !== undefined && satellite.value !== null && satellite.value !== '')
	)
);

const root = ref<HTMLElement | null>(null);
const width = ref(0);
const height = ref(0);
/** El tamaño de cada pastilla, por id: la línea llega a su canto. */
const sizes = ref<Record<string, { width: number; height: number }>>({});

/**
 * Lo más que ocupa una pastilla en la órbita: `max-w-48` y dos renglones.
 *
 * Si entra se reparte, y eso se decide con este tope y no con lo que mide cada
 * pastilla: apiladas miden el ancho entero, y decidir con eso dejaría la vista
 * apilada para siempre aunque la caja vuelva a crecer.
 */
const SATELLITE_WIDTH = 192;
const SATELLITE_HEIGHT = 56;

const radius = computed(() => centerRadius(width.value, height.value));
const radii = computed(() =>
	orbitRadii({
		width: width.value,
		height: height.value,
		radius: radius.value,
		satelliteWidth: SATELLITE_WIDTH,
		satelliteHeight: SATELLITE_HEIGHT,
	})
);

const radial = computed(() => {
	if (props.layout === 'stacked') return false;
	return radii.value !== null;
});

const middle = computed<OrbitPoint>(() => ({ x: width.value / 2, y: height.value / 2 }));

const positions = computed(() =>
	radii.value ? orbitPositions(visible.value.length, middle.value, radii.value) : visible.value.map(() => middle.value)
);

const lines = computed(() => {
	if (!radial.value || !radii.value) return [];
	return visible.value
		.map((satellite, index) => {
			const at = positions.value[index] as OrbitPoint;
			const size = sizes.value[satellite.id] ?? { width: SATELLITE_WIDTH, height: SATELLITE_HEIGHT };
			return {
				id: satellite.id,
				d: elbowPath({ ...middle.value, radius: radius.value }, { ...at, ...size }),
			};
		})
		.filter((line) => line.d !== '');
});

/** Los anillos tenues de fondo, en múltiplos del radio. */
const rings = computed(() => (radial.value ? [2.1, 3.1].map((factor) => Math.round(radius.value * factor * 2)) : []));

function satelliteStyle(index: number) {
	if (!radial.value) return undefined;
	const at = positions.value[index] as OrbitPoint;
	return {
		left: `${at.x}px`,
		top: `${at.y}px`,
		'--orbit-dx': `${middle.value.x - at.x}px`,
		'--orbit-dy': `${middle.value.y - at.y}px`,
	};
}

const centerStyle = computed(() => {
	const side = radial.value ? radius.value * 2 : 120;
	return { width: `${side}px`, height: `${side}px` };
});

let observer: ResizeObserver | null = null;

function measure() {
	const element = root.value;
	if (!element) return;
	width.value = element.clientWidth;
	height.value = element.clientHeight;
	const next: Record<string, { width: number; height: number }> = {};
	for (const item of element.querySelectorAll<HTMLElement>('[data-orbit-satellite]')) {
		next[item.dataset.orbitSatellite as string] = { width: item.offsetWidth, height: item.offsetHeight };
	}
	sizes.value = next;
}

function observeSatellites() {
	if (!observer || !root.value) return;
	observer.disconnect();
	observer.observe(root.value);
	for (const item of root.value.querySelectorAll<HTMLElement>('[data-orbit-satellite]')) observer.observe(item);
}

onMounted(() => {
	measure();
	if (typeof ResizeObserver === 'undefined') return;
	observer = new ResizeObserver(() => measure());
	observeSatellites();
});

watch(
	() => visible.value.map((satellite) => `${satellite.id}:${satellite.value ?? ''}`).join('|') + String(props.orbitKey),
	async () => {
		await nextTick();
		measure();
		observeSatellites();
	}
);

onBeforeUnmount(() => {
	observer?.disconnect();
	observer = null;
});

function choose(satellite: OrbitSatellite) {
	if (!satellite.action || satellite.disabled) return;
	emit('select', satellite.id);
}

defineExpose({ measure });
</script>

<template>
  <section
    ref="root"
    :aria-label="label"
    class="device-orbit relative flex size-full min-h-0 min-w-0 flex-col items-center gap-4 text-tx-main"
    :class="radial ? 'device-orbit-radial overflow-hidden' : 'device-orbit-stacked overflow-y-auto py-2'"
    :data-layout="radial ? 'radial' : 'stacked'"
  >
    <!-- Los anillos de fondo y las líneas: decoración, fuera del lector. -->
    <template v-if="radial">
      <span
        v-for="ring in rings"
        :key="ring"
        aria-hidden="true"
        data-orbit-ring
        class="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-corner-full border border-ui-line-weak"
        :style="{ width: `${ring}px`, height: `${ring}px` }"
      />
      <svg
        aria-hidden="true"
        focusable="false"
        class="pointer-events-none absolute inset-0 size-full text-ui-line"
        :viewBox="`0 0 ${Math.max(width, 1)} ${Math.max(height, 1)}`"
        fill="none"
      >
        <path v-for="line in lines" :key="`${orbitKey}:${line.id}`" :d="line.d" stroke="currentColor" stroke-width="1" />
      </svg>
    </template>

    <!-- El centro. -->
    <div
      class="z-10 flex shrink-0 items-center justify-center"
      :class="radial ? 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' : 'relative mt-3'"
      :style="centerStyle"
    >
      <span
        aria-hidden="true"
        data-orbit-halo
        class="orbit-halo pointer-events-none absolute -inset-3 rounded-corner-full"
        :class="[center ? 'bg-primary/20' : 'border border-dashed border-ui-line', { 'orbit-halo-pulsing': pulsing }]"
      />
      <div
        v-if="center"
        data-orbit-center
        class="relative flex size-full flex-col items-center justify-center gap-1 rounded-corner-full bg-primary p-2 text-center text-tx-on-primary shadow-surface-m"
      >
        <ThemeIcon v-if="center.icon" :name="center.icon" :type="center.iconType ?? 'symbol'" :size="radial && radius >= 64 ? 32 : 24" />
        <span class="block max-w-full truncate font-semibold text-label-m" :title="center.title">{{ center.title }}</span>
        <span v-if="center.subtitle" class="block max-w-full truncate text-label-xs">{{ center.subtitle }}</span>
      </div>
      <div
        v-else
        data-orbit-center
        class="relative flex size-full flex-col items-center justify-center gap-1 rounded-corner-full border border-ui-line bg-ui-surface/50 p-2 text-center text-tx-muted"
      >
        <ThemeIcon v-if="emptyIcon" :name="emptyIcon" type="symbol" :size="24" />
        <span class="block max-w-full break-words text-label-s">{{ emptyLabel }}</span>
      </div>
    </div>

    <!-- Los satélites, en el orden de la órbita. -->
    <TransitionGroup
      tag="ul"
      name="orbit-satellite"
      class="m-0 list-none p-0"
      :class="radial ? 'absolute inset-0' : 'flex w-full min-w-0 flex-col gap-2'"
    >
      <li
        v-for="(satellite, index) in visible"
        :key="`${orbitKey}:${satellite.id}`"
        class="orbit-satellite min-w-0"
        :class="radial ? 'absolute z-10 -translate-x-1/2 -translate-y-1/2' : 'w-full'"
        :style="satelliteStyle(index)"
      >
        <component
          :is="satellite.action ? 'button' : 'div'"
          :type="satellite.action ? 'button' : undefined"
          :disabled="satellite.action ? satellite.disabled : undefined"
          :data-orbit-satellite="satellite.id"
          class="flex min-h-8 min-w-0 items-center gap-3 rounded-corner-l border bg-ui-surface/70 px-3 py-2 text-left text-tx-main transition-colors duration-200 ease-ui"
          :class="[
            radial ? 'max-w-48' : 'w-full',
            satellite.action
              ? 'cursor-pointer border-primary hover:bg-ui-hover active:bg-ui-pressed active:duration-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-focus disabled:cursor-not-allowed disabled:opacity-50'
              : 'border-ui-line',
          ]"
          @click="choose(satellite)"
        >
          <ThemeIcon v-if="satellite.icon" :name="satellite.icon" type="symbol" :size="20" class="shrink-0" />
          <!-- La etiqueta va primero en el DOM —se lee «Batería, 70 %»— y
               debajo en pantalla, con `flex-col-reverse`. -->
          <span v-if="satellite.value" class="flex min-w-0 flex-col-reverse">
            <span class="block truncate text-label-xs text-tx-muted">{{ satellite.label }}</span>
            <span
              class="block truncate font-semibold text-label-m tabular-nums"
              :class="satellite.tone === 'accent' ? 'text-primary' : 'text-tx-main'"
              :title="satellite.value"
            >{{ satellite.value }}</span>
          </span>
          <span v-else class="block min-w-0 truncate font-semibold text-label-m">{{ satellite.label }}</span>
        </component>
      </li>
    </TransitionGroup>
  </section>
</template>

<style scoped>
@keyframes orbit-halo-pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(1.08);
  }
}

@keyframes orbit-halo-fade {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

.orbit-halo-pulsing {
  animation: orbit-halo-pulse 1.6s var(--ease-ui) infinite;
}

/* Al cambiar de órbita, los satélites se contraen hacia el centro y salen los
   nuevos desde ahí. `--orbit-dx`/`--orbit-dy` es lo que separa a cada uno del
   centro; apilados valen cero y queda el fundido. */
.device-orbit-radial .orbit-satellite-enter-active,
.device-orbit-radial .orbit-satellite-leave-active {
  transition:
    opacity 200ms var(--ease-ui-out),
    transform 200ms var(--ease-ui-out);
}

.device-orbit-radial .orbit-satellite-enter-from,
.device-orbit-radial .orbit-satellite-leave-to {
  opacity: 0;
  /* El `-50%` del centrado va en `translate` (la utilidad de Tailwind), aparte
     de `transform`: acá sólo se suma lo que lo separa del centro. */
  transform: translate(var(--orbit-dx, 0px), var(--orbit-dy, 0px)) scale(0.5);
}

.device-orbit-stacked .orbit-satellite-enter-active,
.device-orbit-stacked .orbit-satellite-leave-active {
  transition: opacity 200ms var(--ease-ui-out);
}

.device-orbit-stacked .orbit-satellite-leave-active {
  display: none;
}

.device-orbit-stacked .orbit-satellite-enter-from {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .orbit-halo-pulsing {
    animation-name: orbit-halo-fade;
  }

  .device-orbit-radial .orbit-satellite-enter-active,
  .device-orbit-radial .orbit-satellite-leave-active {
    transition: opacity 200ms var(--ease-ui-out);
  }

  .device-orbit-radial .orbit-satellite-enter-from,
  .device-orbit-radial .orbit-satellite-leave-to {
    transform: none;
  }
}
</style>
