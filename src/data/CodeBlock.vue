<script setup lang="ts">
/**
 * Texto de máquina: un registro que crece, un comando, un archivo de
 * configuración.
 *
 * Unos siete en cuatro aplicaciones —el registro del instalador, el del
 * monitor, la salida de pacman en la tienda (dos), los de Configuración—, todos
 * un `<pre>` con su propio fondo y casi todos con el color del texto puesto a
 * mano por línea.
 *
 * # `text` o `lines`
 *
 * `text` es un bloque; `lines`, una lista de líneas con `tone`. El tono **no
 * pinta el texto**: el amarillo sobre fondo claro da 2,3:1 y el verde 3:1, así
 * que se marca con un canto del color del tono a la izquierda de la línea y el
 * texto queda en `tx-main` (`muted` sí lo atenúa, que es lo que significa).
 *
 * # Partir o desplazar
 *
 * `wrap` (por omisión) parte las líneas largas: un componente no desplaza de
 * costado. Sin `wrap` las líneas quedan enteras y el bloque desplaza adentro,
 * para lo que no se puede partir (una tabla de columnas).
 *
 * # Seguir el final
 *
 * Con `maxHeight` el bloque desplaza adentro y es tabulable, para leerlo con el
 * teclado. Con `follow` se queda pegado al final mientras llegan líneas —el
 * registro de una instalación—, **salvo** que la persona haya subido a leer
 * algo: arrastrarla de vuelta abajo en cada línea nueva es sacarle lo que
 * estaba leyendo. Al volver al final, vuelve a seguir.
 *
 * `variant="log"` es un `role="log"`: lo nuevo se anuncia sin interrumpir.
 */
import { computed, nextTick, ref, watch } from 'vue';

export type CodeLineTone = 'neutral' | 'muted' | 'info' | 'success' | 'warning' | 'error';
export interface CodeLine {
	text: string;
	tone?: CodeLineTone;
}

const props = withDefaults(
	defineProps<{
		text?: string;
		lines?: readonly CodeLine[];
		wrap?: boolean;
		/** Un largo CSS o píxeles. Sin esto crece con el contenido. */
		maxHeight?: string | number;
		follow?: boolean;
		variant?: 'code' | 'log';
		/** El nombre de la región, para quien no la ve. */
		label?: string;
	}>(),
	{ text: '', lines: () => [], wrap: true, follow: false, variant: 'code' }
);

const TONE: Record<CodeLineTone, string> = {
	neutral: 'border-transparent text-tx-main',
	muted: 'border-transparent text-tx-muted',
	info: 'border-primary text-tx-main',
	success: 'border-status-success text-tx-main',
	warning: 'border-status-warning text-tx-main',
	error: 'border-status-error text-tx-main',
};

const root = ref<HTMLElement | null>(null);
/** Si está parado en el final: lo decide la persona al desplazar. */
const atEnd = ref(true);

const height = computed(() => {
	const value = props.maxHeight;
	if (value === undefined || value === '') return undefined;
	return typeof value === 'number' ? `${value}px` : value;
});
const scrolls = computed(() => height.value !== undefined);

/** Un par de píxeles de tolerancia: el redondeo del desplazamiento no es exacto. */
function onScroll() {
	const element = root.value;
	if (!element) return;
	atEnd.value = element.scrollHeight - element.scrollTop - element.clientHeight <= 2;
}

watch(
	() => [props.text, props.lines.length, props.lines[props.lines.length - 1]?.text],
	async () => {
		if (!props.follow) return;
		// Lo que importa es dónde estaba **antes** de que llegara lo nuevo. Y
		// después se vuelve a medir: un contenido que dejó de desbordar no
		// dispara `scroll`, y sin medir quedaría «subido» para siempre.
		const wasAtEnd = atEnd.value;
		await nextTick();
		const element = root.value;
		if (!element) return;
		if (wasAtEnd) {
			element.scrollTop = element.scrollHeight;
			atEnd.value = true;
		} else {
			onScroll();
		}
	},
	{ immediate: true, flush: 'post' }
);
</script>

<template>
  <pre
    ref="root"
    class="m-0 min-w-0 rounded-corner-m border border-ui-line bg-ui-surface/70 p-3 font-mono text-body-xs text-tx-main"
    :class="[
      wrap ? 'break-words whitespace-pre-wrap' : 'overflow-x-auto whitespace-pre',
      scrolls ? 'overflow-y-auto overscroll-contain focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ui-focus' : '',
    ]"
    :style="height ? { maxHeight: height } : undefined"
    :role="variant === 'log' ? 'log' : undefined"
    :aria-label="label"
    :tabindex="scrolls ? 0 : undefined"
    :data-variant="variant"
    data-code-block
    @scroll="onScroll"><template v-if="lines.length"><span
      v-for="(line, index) in lines"
      :key="index"
      class="block border-l-2 pl-2"
      :class="TONE[line.tone ?? 'neutral']"
      :data-tone="line.tone ?? 'neutral'">{{ line.text }}</span></template><template v-else>{{ text }}</template></pre>
</template>
