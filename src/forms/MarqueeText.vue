<script setup lang="ts">
/**
 * Un texto en **una sola línea** que, si no entra, se desliza para leerse
 * entero en vez de cortarse (vue-libvasak#95).
 *
 * Lo pidió el centro de control: los mosaicos de ajuste rápido tenían el título
 * y el estado hasta en dos líneas para no cortar «Tiempo de pantalla» a 350 px,
 * y eso dejaba a las pastillas de una misma fila con alturas distintas. Con una
 * línea pareja vuelve el problema de siempre —un nombre largo no entra—, y la
 * respuesta no es la elipsis que lo esconde sino la marquesina: el texto va y
 * vuelve solo mientras no quepa, y para cuando entra.
 *
 * # Cuándo se mueve
 *
 * Sólo cuando sobra texto. Se mide el ancho del contenido contra el de la caja
 * —`scrollWidth` del interior contra `clientWidth` de la raíz— y, si el primero
 * es mayor, se enciende la animación con la distancia justa que falta correr.
 * La medida va por `ResizeObserver` y no por `matchMedia`/`resize`, que el
 * WebView de WebKitGTK no entrega (ver el barrido de ese composable en el
 * taller).
 *
 * # Accesibilidad
 *
 * El texto está **entero** en el DOM: la caja sólo lo recorta a la vista, así
 * que un lector de pantalla lo lee completo se mueva o no. Con
 * `prefers-reduced-motion` no se mueve nada: cae a una línea con elipsis, y el
 * texto sigue entero para quien lo oiga o pose el puntero (globo del título).
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = withDefaults(
	defineProps<{
		/** El texto, ya traducido. */
		text: string;
		/** Qué tan rápido se desliza, en píxeles por segundo. */
		speed?: number;
	}>(),
	{ speed: 36 }
);

const root = ref<HTMLElement | null>(null);
const inner = ref<HTMLElement | null>(null);

/** Cuántos píxeles de texto sobran de la caja; 0 si entra entero. */
const overflow = ref(0);
/** Quien pidió menos movimiento no lo tiene: la marquesina se apaga. */
const reduceMotion = ref(false);

let observer: ResizeObserver | null = null;
let motionQuery: MediaQueryList | null = null;

function onMotionChange(event: MediaQueryListEvent): void {
	reduceMotion.value = event.matches;
}

function measure(): void {
	const box = root.value;
	const content = inner.value;
	if (!box || !content) return;
	overflow.value = Math.max(0, content.scrollWidth - box.clientWidth);
}

/** Se desliza sólo si sobra texto y hay permiso de movimiento. */
const marquee = computed(() => overflow.value > 0 && !reduceMotion.value);

/**
 * La animación es `alternate`: va de 0 a `shift` y vuelve. Entre medio, el
 * recorrido (76 % del tiempo) corre la distancia que sobra a `speed`; el resto
 * son las pausas de los extremos para poder leer. Un piso de 1,2 s evita que un
 * sobrante chico pase como un pestañeo.
 */
const style = computed(() => {
	if (!marquee.value) return undefined;
	const travel = overflow.value / props.speed;
	const duration = Math.max(1.2, travel / 0.76);
	return {
		'--marquee-shift': `-${overflow.value}px`,
		'--marquee-duration': `${duration.toFixed(2)}s`,
	};
});

onMounted(() => {
	// Se sigue en vivo: si cambia la preferencia después del montaje, la
	// marquesina se enciende o se apaga —y con ella la elipsis— en el acto.
	if (typeof matchMedia === 'function') {
		motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
		reduceMotion.value = motionQuery.matches;
		motionQuery.addEventListener('change', onMotionChange);
	}
	measure();
	observer = new ResizeObserver(() => measure());
	if (root.value) observer.observe(root.value);
	if (inner.value) observer.observe(inner.value);
});

watch(
	() => props.text,
	() => queueMicrotask(measure)
);

onBeforeUnmount(() => {
	observer?.disconnect();
	observer = null;
	motionQuery?.removeEventListener('change', onMotionChange);
	motionQuery = null;
});
</script>

<template>
  <span ref="root" class="block min-w-0 overflow-hidden" :title="text">
    <span
      ref="inner"
      :class="marquee
        ? 'marquee inline-block whitespace-nowrap will-change-transform'
        : 'block max-w-full truncate'"
      :style="style"
    >{{ text }}</span>
  </span>
</template>

<style scoped>
@keyframes marquee {
  0%,
  12% {
    transform: translateX(0);
  }
  88%,
  100% {
    transform: translateX(var(--marquee-shift));
  }
}

.marquee {
  animation: marquee var(--marquee-duration) var(--ease-ui, ease-in-out) infinite alternate;
}

@media (prefers-reduced-motion: reduce) {
  .marquee {
    animation: none;
  }
}
</style>
