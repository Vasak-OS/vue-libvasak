<script setup lang="ts">
/**
 * El velo y el panel, teletransportados al `body`.
 *
 * Van ahí y no donde se escribieron porque un diálogo dentro de una lista con
 * `overflow` se recorta, y porque su `z-index` tiene que competir con el de la
 * ventana, no con el del contenedor que le tocó.
 *
 * ── El foco, que es lo que hacía falta sumar ─────────────────────────────────
 *
 * `aria-modal="true"` le promete a un lector de pantalla que lo de atrás no
 * existe mientras esto esté abierto. La copia de la que salió esto lo declaraba
 * sin cumplirlo: el Tab seguía recorriendo lo que quedó detrás del velo
 * —invisible pero alcanzable— y el foco nunca entraba al diálogo.
 *
 * Acá se hacen las tres cosas que sostienen esa promesa: se mueve el foco
 * adentro al abrir, el Tab da la vuelta dentro del panel, y al cerrar se
 * devuelve a lo que estaba enfocado antes, que casi siempre es el botón que lo
 * abrió. Sin lo último, cerrar deja el foco en el `body` y el teclado empieza
 * de nuevo desde arriba de la página.
 *
 * ── La forma (vue-libvasak#74) ───────────────────────────────────────────────
 *
 * El diálogo de Once UI: superficie flotante opaca, canto `ui-line`,
 * `rounded-corner-xl` y `shadow-surface-xl`; el velo es `ui-scrim`, sin
 * desenfoque. Con dieciséis píxeles de aire contra el borde de la
 * ventana y el alto topado a lo que entra, con desplazamiento adentro: en una
 * ventana angosta o baja la caja ya no toca los bordes ni se sale. El panel
 * recibe el foco al abrir para que el lector de pantalla entre al diálogo, pero
 * no dibuja anillo: no es un control, y un anillo alrededor de la caja entera
 * no dice dónde está parado nadie.
 */
import { computed, nextTick, onUnmounted, ref, useAttrs, watch } from 'vue';
import { useDialog } from './types';

/**
 * Los atributos de quien lo usa, puestos a mano sobre el panel.
 *
 * La raíz es un `Teleport`, que no es un elemento: lo que caería solo por
 * `fallthrough` caería en la nada. Por eso se apaga y se reparte acá — la
 * `class` con las del panel, y el resto (`id`, `data-*`) tal cual.
 *
 * Nombrar el diálogo sin un `DialogTitle` visible **no** va por acá: eso es
 * `ariaLabel`, que es una propiedad declarada. Por este camino no se podía,
 * aunque el atributo llegara: con `strictTemplates`, un `aria-label` escrito
 * sobre el componente es un error de tipos, porque de un `Teleport` no se
 * deduce ningún elemento al que pudiera pertenecer.
 */
defineOptions({ inheritAttrs: false });

const props = withDefaults(
	defineProps<{
		/**
		 * La forma del panel.
		 *
		 * `md` es el diálogo de siempre: una caja centrada, con borde, fondo y
		 * un ancho máximo, que es lo que quiere una pregunta o un formulario.
		 *
		 * `lg` es la misma caja más ancha, para un formulario de verdad: la
		 * ventana de redacción del correo, el editor de atajos de Configuración.
		 * Existe como opción y no como clase que se pasa desde afuera porque
		 * pisar el ancho del sistema no es estable: las dos clases van en el
		 * mismo atributo y ahí gana la que Tailwind haya emitido después en la
		 * hoja. `max-w-2xl` le gana a `max-w-lg` por el orden de la escala, y
		 * `max-w-xs` **no**, así que ensanchar funcionaba y angostar no — sin
		 * error, y sin forma de saberlo salvo mirándolo.
		 *
		 * `full` ocupa la ventana entera y no dibuja nada —ni borde, ni fondo,
		 * ni relleno— salvo el redondeo de la ventana, que no es decoración:
		 * el panel tapa la pantalla entera y la ventana es transparente con las
		 * esquinas redondeadas, así que sin él el fondo que ponga quien lo usa
		 * asoma en cuadrado por fuera del marco. Lo demás lo pone quien lo usa. Es para lo que **es** la pantalla
		 * mientras está abierto, como el visor de fotos de la galería, donde la
		 * caja centrada no tiene sentido pero el foco encerrado y el Escape sí.
		 *
		 * El velo tampoco se tiñe en `full`: el panel lo tapa entero, y las dos
		 * capas de color se sumaban a un gris que nadie pidió.
		 *
		 * `sm` (2.1.0) es la caja angosta de 420 px de una pregunta corta:
		 * renombrar, crear una carpeta, comprimir. El gestor de archivos la
		 * conseguía pisando el ancho con `w-[420px]` en cuatro diálogos, que es
		 * justo lo que no es estable (ver arriba).
		 */
		size?: 'sm' | 'md' | 'lg' | 'full';
		/**
		 * Cómo se llama el diálogo cuando no hay un `DialogTitle` visible.
		 *
		 * Lo normal es el título: se registra solo y el `aria-labelledby` lo
		 * apunta. Esto es para cuando el nombre existe pero no como título —el
		 * visor de fotos de la galería lo dibuja en una píldora con su propia
		 * forma— y para cuando no hay ninguno.
		 *
		 * Es una **propiedad declarada** y no un atributo que cae: con
		 * `strictTemplates`, `aria-label` escrito a mano sobre el componente es
		 * un error de tipos, porque la raíz es un `Teleport` y de ahí no se
		 * deduce ningún elemento al que pudiera pertenecer. Lo que quedaba era
		 * `v-bind` de un objeto, que no se comprueba.
		 *
		 * Un `DialogTitle` montado gana: si los dos están, nombra el título.
		 *
		 * `aria-describedby` tiene el mismo problema y **no** se resuelve con
		 * otra propiedad: lo que corresponde es que `DialogDescription` se
		 * registre solo, como ya hace el título. Hoy no lo hace, y nadie lo
		 * pide todavía.
		 */
		ariaLabel?: string;
	}>(),
	{ size: 'md' }
);

const attrs = useAttrs();
const callerClass = computed(() => (attrs.class as string | undefined) ?? '');
const otherAttrs = computed(() => {
	const { class: _class, ...rest } = attrs;
	return rest;
});

/**
 * Las clases del panel, según la forma.
 *
 * `full` **no** pone lo que tendría que deshacer. Poner `max-w-lg` y dejar que
 * quien lo usa lo tape con `max-w-none` no funciona: las dos clases van en el
 * mismo atributo y ahí no gana la última escrita sino la que Tailwind haya
 * emitido después en la hoja, que no depende de esto. La única forma estable de
 * que quien lo usa mande es que acá no esté la clase que compite.
 */
/*
 * Con un `DialogBody` adentro, el panel pasa a columna y deja de desplazar él:
 * el que desplaza es el cuerpo, y el encabezado y el pie se quedan quietos. Se
 * reconoce con `:has()` sobre el atributo del cuerpo, así que quien lo usa no
 * tiene que pasar nada y los diálogos que no lo usan no cambian.
 */
const BOX =
	'relative z-10 max-h-full w-full overflow-y-auto rounded-corner-xl border border-ui-line bg-ui-float p-6 text-tx-main shadow-surface-xl outline-none has-[>[data-dialog-body]]:flex has-[>[data-dialog-body]]:flex-col has-[>[data-dialog-body]]:overflow-hidden';

const WIDTH = { sm: 'max-w-[420px]', md: 'max-w-lg', lg: 'max-w-2xl' } as const;

const panelShape = computed(() => {
	if (props.size === 'full') {
		// `overflow-hidden` además del redondeo: el radio recorta lo que pinta
		// **este** elemento —su fondo, su `backdrop-filter`— y no lo que pinten
		// sus descendientes. Un hijo con fondo propio volvería a dejar las
		// esquinas cuadradas. `WindowFrame` recorta igual, y lo de acá no
		// hereda ese recorte porque se teletransporta al `body`.
		return 'relative z-10 h-full w-full overflow-hidden rounded-corner-window text-tx-main';
	}
	return `${BOX} ${WIDTH[props.size]}`;
});

const dialog = useDialog();
const open = computed(() => dialog.open.value);
const scrim = ref<HTMLElement | null>(null);
const panel = ref<HTMLElement | null>(null);

/** Lo que estaba enfocado antes de abrir, para devolvérselo al cerrar. */
let focusedBefore: HTMLElement | null = null;

/** Lo que el Tab puede alcanzar dentro del panel, en el orden en que aparece. */
function reachable(): HTMLElement[] {
	if (!panel.value) return [];
	const selector =
		'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
	return [...panel.value.querySelectorAll<HTMLElement>(selector)];
}

function onKeydown(event: KeyboardEvent) {
	if (event.key === 'Escape') {
		dialog.close();
		return;
	}
	if (event.key !== 'Tab') return;

	const elements = reachable();
	// Sin nada alcanzable adentro, el Tab no tiene a dónde ir: se queda en el
	// panel en vez de escaparse a lo de atrás.
	if (elements.length === 0) {
		event.preventDefault();
		panel.value?.focus();
		return;
	}

	const first = elements[0];
	const last = elements[elements.length - 1];
	const focused = document.activeElement;

	if (event.shiftKey && (focused === first || focused === panel.value)) {
		event.preventDefault();
		last.focus();
	} else if (!event.shiftKey && focused === last) {
		event.preventDefault();
		first.focus();
	}
}

function onScrimClick(event: MouseEvent) {
	// Sólo el velo: un clic que empezó dentro del panel y terminó afuera no
	// tiene que cerrar —pasa al seleccionar texto y arrastrar de más—.
	if (event.target === event.currentTarget) dialog.close();
}

/**
 * La red de seguridad, para las teclas que el velo no llega a oír.
 *
 * Lo normal es que el foco esté adentro —se entra al panel al abrir y el Tab
 * no sale—, y entonces la tecla la oye el velo, que es de quien cuelga todo.
 * Pero el foco se puede escapar igual: un botón que se deshabilita a sí mismo
 * deja el foco en el `body`, y desde ahí nada llega al velo. Sin esto, Escape
 * dejaría de cerrar justo después de la acción que más suele deshabilitar algo.
 *
 * La guarda es lo que evita atender dos veces la misma tecla.
 */
function onDocumentKeydown(event: KeyboardEvent) {
	if (scrim.value?.contains(event.target as Node)) return;
	onKeydown(event);
}

function releaseKeyboard() {
	document.removeEventListener('keydown', onDocumentKeydown);
}

/**
 * Devuelve el foco a lo que lo tenía antes de abrir.
 *
 * Sólo si sigue en el documento: el diálogo puede haberse abierto desde un
 * botón de una lista que el propio diálogo terminó borrando, y enfocar algo
 * desconectado no hace nada más que dejar el foco perdido en el `body`.
 */
function restoreFocus() {
	const target = focusedBefore;
	focusedBefore = null;
	if (target?.isConnected) target.focus();
}

watch(
	open,
	async (opened) => {
		if (opened) {
			focusedBefore = document.activeElement as HTMLElement | null;
			document.addEventListener('keydown', onDocumentKeydown);
			await nextTick();
			// Al panel y no al primer botón: así un lector de pantalla lee el
			// título y la descripción antes que la primera acción.
			panel.value?.focus();
			return;
		}
		releaseKeyboard();
		restoreFocus();
	},
	// `watch` no corre para el valor inicial, y un diálogo se puede montar ya
	// abierto —una vista que arranca preguntando algo—. Sin esto, ése no recibe
	// el foco y ni Escape ni el Tab hacen nada: el `aria-modal` queda en promesa.
	{ immediate: true }
);

// Un diálogo abierto cuyo dueño se desmonta dejaría el oyente puesto para
// siempre, cerrando diálogos ajenos con cada Escape. Y su panel se va con él,
// así que el foco tiene que volver de donde salió o se queda en el `body`.
onUnmounted(() => {
	releaseKeyboard();
	restoreFocus();
});
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200 ease-ui-out"
      leave-active-class="transition-opacity duration-150 ease-ui"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0">
      <div
        v-if="open"
        ref="scrim"
        class="fixed inset-0 z-50 flex items-center justify-center"
        :class="props.size === 'full' ? '' : 'p-4'"
        @click="onScrimClick"
        @keydown="onKeydown">
        <!-- La tinta va redondeada como la ventana. El velo es `fixed inset-0`,
             o sea la pantalla entera, y la ventana es transparente con las
             esquinas redondeadas: un rectángulo recto asoma tres o cuatro
             píxeles de gris en cada esquina, fuera del marco y sobre lo que
             haya detrás. `WindowFrame` usa el mismo radio. -->
        <div
          v-if="props.size === 'md' || props.size === 'sm'"
          class="absolute inset-0 rounded-corner-window bg-ui-scrim"></div>
        <div
          ref="panel"
          tabindex="-1"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="dialog.titleId.value ?? undefined"
          :aria-label="dialog.titleId.value ? undefined : ariaLabel"
          v-bind="otherAttrs"
          :class="[callerClass, panelShape]">
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
