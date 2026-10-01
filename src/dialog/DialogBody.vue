<script setup lang="ts">
/**
 * El cuerpo de un diálogo que desplaza solo, entre un encabezado y un pie que
 * se quedan quietos.
 *
 * Lo escribían a mano el `ModalBase` de la tienda (adentro va la receta de un
 * paquete y una captura) y el `ModalDialog` de Configuración: `DialogContent`
 * con `p-0`, el encabezado con su borde, el cuerpo con `overflow-auto` y el pie
 * con el suyo. Sin eso, lo que desplaza es el panel entero y los botones del
 * pie se van con el texto.
 *
 * Con esto adentro, `DialogContent` pasa a columna y deja de desplazar él (lo
 * reconoce con `:has()`, sin que haya que pasarle nada), y el que desplaza es
 * este cuerpo. Llega de canto a canto del panel para que la barra de
 * desplazamiento quede contra el borde y no en medio del texto.
 *
 * # El teclado
 *
 * Una zona que desplaza tiene que poder desplazarse sin ratón. WebKitGTK no le
 * da el foco sola, así que cuando el contenido no entra el cuerpo pasa a ser
 * tabulable (`tabindex="0"`) con nombre de región, y entonces las flechas lo
 * mueven. Cuando entra, no: una parada de Tab que no hace nada estorba. Se mide
 * con un `ResizeObserver`, que es lo que avisa en WebKitGTK (ni `resize` ni
 * `matchMedia` llegan).
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useLabels } from '../shared/labels';

const props = withDefaults(
	defineProps<{
		padding?: 'none' | 'sm' | 'md';
		/** El nombre de la región cuando desplaza. Sin esto, del catálogo (`dialog.body`) o «Contenido». */
		label?: string;
	}>(),
	{ padding: 'md' }
);

const translate = useLabels();
const body = ref<HTMLElement | null>(null);
/**
 * El envoltorio del contenido. Se observa éste y no los hijos de la ranura:
 * un párrafo que llega después no cambia el tamaño de los que ya estaban, y
 * `ResizeObserver` avisa de cambios de tamaño de lo observado, no del alto que
 * se puede desplazar. El envoltorio sí crece con todo lo que entra.
 */
const content = ref<HTMLElement | null>(null);
const overflows = ref(false);
let observer: ResizeObserver | null = null;

function measure() {
	const element = body.value;
	overflows.value = element !== null && element.scrollHeight > element.clientHeight + 1;
}

onMounted(() => {
	measure();
	if (typeof ResizeObserver === 'undefined' || !body.value) return;
	observer = new ResizeObserver(measure);
	observer.observe(body.value);
	if (content.value) observer.observe(content.value);
});

onBeforeUnmount(() => observer?.disconnect());

const PADDING = { none: '', sm: 'py-2', md: 'py-4' } as const;
const regionName = computed(() => props.label ?? translate('dialog.body', 'Contenido'));
</script>

<template>
  <div
    ref="body"
    data-dialog-body
    class="-mx-6 min-h-0 flex-1 overflow-y-auto px-6 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ui-focus"
    :class="PADDING[padding]"
    :tabindex="overflows ? 0 : undefined"
    :role="overflows ? 'region' : undefined"
    :aria-label="overflows ? regionName : undefined">
    <div ref="content"><slot /></div>
  </div>
</template>
