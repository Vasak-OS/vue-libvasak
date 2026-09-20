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
 * La clase de quien lo usa, leída del `attrs` y no de `props`.
 *
 * Vue no mete `class` en `props` aunque se declare: queda en `attrs` y cae sola
 * al nodo raíz. Acá la raíz es un `Teleport`, que no es un elemento, así que
 * caería en la nada — que es lo que le pasaba a la copia de la que salió esto.
 */
defineOptions({ inheritAttrs: false });
const atributos = useAttrs();
const claseDeQuienLoUsa = computed(() => (atributos.class as string | undefined) ?? '');

const dialogo = usarElDialogo();
const abierto = computed(() => dialogo.abierto.value);
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

function soltarElTeclado() {
	document.removeEventListener('keydown', alTeclear);
}

watch(abierto, async (seAbrio) => {
	if (seAbrio) {
		enfocadoAntes = document.activeElement as HTMLElement | null;
		document.addEventListener('keydown', alTeclear);
		await nextTick();
		// Al panel y no al primer botón: así un lector de pantalla lee el
		// título y la descripción antes que la primera acción.
		panel.value?.focus();
		return;
	}
	soltarElTeclado();
	enfocadoAntes?.focus();
	enfocadoAntes = null;
});

// Un diálogo abierto cuyo dueño se desmonta dejaría el oyente puesto para
// siempre, cerrando diálogos ajenos con cada Escape.
onUnmounted(soltarElTeclado);
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
        class="fixed inset-0 z-50 flex items-center justify-center"
        @click="alVelo">
        <div class="absolute inset-0 bg-ui-border-dark/40"></div>
        <div
          ref="panel"
          tabindex="-1"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="dialogo.idDelTitulo.value ?? undefined"
          :class="[
            claseDeQuienLoUsa,
            'relative z-10 w-full max-w-lg rounded-corner border border-ui-border bg-ui-bg/80 p-6 text-tx-main shadow-lg',
          ]">
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
