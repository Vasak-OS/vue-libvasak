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
 */
import { computed, nextTick, onUnmounted, ref, useAttrs, watch } from 'vue';
import { usarElDialogo } from './tipos';

/**
 * Los atributos de quien lo usa, puestos a mano sobre el panel.
 *
 * La raíz es un `Teleport`, que no es un elemento: lo que caería solo por
 * `fallthrough` caería en la nada. Por eso se apaga y se reparte acá — la
 * `class` con las del panel, y el resto (`aria-describedby`, `id`, `data-*`)
 * tal cual, que es lo único que le deja a quien lo usa nombrar el diálogo
 * cuando prefiere no poner un `DialogTitle` visible.
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
		 * `full` ocupa la ventana entera y no dibuja nada —ni borde, ni fondo,
		 * ni relleno—: lo pone quien lo usa. Es para lo que **es** la pantalla
		 * mientras está abierto, como el visor de fotos de la galería, donde la
		 * caja centrada no tiene sentido pero el foco encerrado y el Escape sí.
		 *
		 * El velo tampoco se tiñe en `full`: el panel lo tapa entero, y las dos
		 * capas de color se sumaban a un gris que nadie pidió.
		 */
		size?: 'md' | 'full';
	}>(),
	{ size: 'md' }
);

const atributos = useAttrs();
const claseDeQuienLoUsa = computed(() => (atributos.class as string | undefined) ?? '');
const restoDeLosAtributos = computed(() => {
	const { class: _clase, ...resto } = atributos;
	return resto;
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
const formaDelPanel = computed(() =>
	props.size === 'full'
		? 'relative z-10 h-full w-full text-tx-main'
		: 'relative z-10 w-full max-w-lg rounded-corner border border-ui-border bg-ui-bg/80 p-6 text-tx-main shadow-lg'
);

const dialogo = usarElDialogo();
const abierto = computed(() => dialogo.abierto.value);
const velo = ref<HTMLElement | null>(null);
const panel = ref<HTMLElement | null>(null);

/** Lo que estaba enfocado antes de abrir, para devolvérselo al cerrar. */
let enfocadoAntes: HTMLElement | null = null;

/** Lo que el Tab puede alcanzar dentro del panel, en el orden en que aparece. */
function alcanzables(): HTMLElement[] {
	if (!panel.value) return [];
	const selector =
		'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
	return [...panel.value.querySelectorAll<HTMLElement>(selector)];
}

function alTeclear(evento: KeyboardEvent) {
	if (evento.key === 'Escape') {
		dialogo.cerrar();
		return;
	}
	if (evento.key !== 'Tab') return;

	const elementos = alcanzables();
	// Sin nada alcanzable adentro, el Tab no tiene a dónde ir: se queda en el
	// panel en vez de escaparse a lo de atrás.
	if (elementos.length === 0) {
		evento.preventDefault();
		panel.value?.focus();
		return;
	}

	const primero = elementos[0];
	const ultimo = elementos[elementos.length - 1];
	const enfocado = document.activeElement;

	if (evento.shiftKey && (enfocado === primero || enfocado === panel.value)) {
		evento.preventDefault();
		ultimo.focus();
	} else if (!evento.shiftKey && enfocado === ultimo) {
		evento.preventDefault();
		primero.focus();
	}
}

function alVelo(evento: MouseEvent) {
	// Sólo el velo: un clic que empezó dentro del panel y terminó afuera no
	// tiene que cerrar —pasa al seleccionar texto y arrastrar de más—.
	if (evento.target === evento.currentTarget) dialogo.cerrar();
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
function alTeclearSuelto(evento: KeyboardEvent) {
	if (velo.value?.contains(evento.target as Node)) return;
	alTeclear(evento);
}

function soltarElTeclado() {
	document.removeEventListener('keydown', alTeclearSuelto);
}

/**
 * Devuelve el foco a lo que lo tenía antes de abrir.
 *
 * Sólo si sigue en el documento: el diálogo puede haberse abierto desde un
 * botón de una lista que el propio diálogo terminó borrando, y enfocar algo
 * desconectado no hace nada más que dejar el foco perdido en el `body`.
 */
function restaurarElFoco() {
	const destino = enfocadoAntes;
	enfocadoAntes = null;
	if (destino?.isConnected) destino.focus();
}

watch(
	abierto,
	async (seAbrio) => {
		if (seAbrio) {
			enfocadoAntes = document.activeElement as HTMLElement | null;
			document.addEventListener('keydown', alTeclearSuelto);
			await nextTick();
			// Al panel y no al primer botón: así un lector de pantalla lee el
			// título y la descripción antes que la primera acción.
			panel.value?.focus();
			return;
		}
		soltarElTeclado();
		restaurarElFoco();
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
	soltarElTeclado();
	restaurarElFoco();
});
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      leave-active-class="transition-opacity duration-150 ease-in"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0">
      <div
        v-if="abierto"
        ref="velo"
        class="fixed inset-0 z-50 flex items-center justify-center"
        @click="alVelo"
        @keydown="alTeclear">
        <div v-if="props.size === 'md'" class="absolute inset-0 bg-ui-border-dark/40"></div>
        <div
          ref="panel"
          tabindex="-1"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="dialogo.idDelTitulo.value ?? undefined"
          v-bind="restoDeLosAtributos"
          :class="[claseDeQuienLoUsa, formaDelPanel]">
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
