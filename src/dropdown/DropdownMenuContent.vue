<script lang="ts" setup>
/**
 * El cuerpo del menú: el `role="menu"` y el teclado que lo recorre.
 *
 * Se teletransporta al `body` para que no lo recorte el `overflow` de la barra
 * que lo contiene, y se ubica a mano contra el rectángulo del disparador. Eso
 * lo saca del orden del documento, así que **todo** lo que lo ata a quien lo
 * abrió es ARIA: el `id` de acá es el `aria-controls` de allá.
 *
 * # El teclado
 *
 * Las flechas mueven el foco y dan la vuelta en los extremos; Inicio y Fin van
 * a las puntas; Escape cierra y devuelve el foco. El Tabulador **también**
 * cierra: el menú vive al final del `body`, así que dejar que el foco siga su
 * curso desde acá lo manda a cualquier parte de la página. Cerrando y
 * devolviendo el foco, el siguiente Tabulador sale de donde el usuario cree
 * que está parado.
 *
 * Los ítems se buscan en el DOM por su `role` en vez de llevar un registro:
 * un menú se arma con `v-for`, con `v-if` y con ítems que vienen de otro
 * componente, y el documento es el único que sabe cuáles hay y en qué orden.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { usarElMenu } from './tipos';

const props = withDefaults(
	defineProps<{
		side?: 'top' | 'bottom' | 'left' | 'right';
		align?: 'start' | 'center' | 'end';
		sideOffset?: number;
	}>(),
	{
		side: 'bottom',
		align: 'start',
		sideOffset: 4,
	}
);

defineOptions({ inheritAttrs: false });

const menu = usarElMenu();
const { idDelMenu, idDeLaEtiqueta } = menu;
const disparador = computed(() => menu.disparador.value);
const abierto = computed(() => menu.abierto.value);

const contenido = ref<HTMLElement | null>(null);
const posicion = ref({ top: 0, left: 0 });

function calcularPosicion() {
	if (!disparador.value || !contenido.value) return;

	const desde = disparador.value.getBoundingClientRect();
	const propio = contenido.value.getBoundingClientRect();

	let top = 0;
	let left = 0;

	switch (props.side) {
		case 'bottom':
			top = desde.bottom + props.sideOffset;
			break;
		case 'top':
			top = desde.top - propio.height - props.sideOffset;
			break;
		case 'left':
			left = desde.left - propio.width - props.sideOffset;
			top = desde.top;
			break;
		case 'right':
			left = desde.right + props.sideOffset;
			top = desde.top;
			break;
	}

	switch (props.align) {
		case 'start':
			if (props.side === 'bottom' || props.side === 'top') {
				left = desde.left;
			}
			break;
		case 'center':
			if (props.side === 'bottom' || props.side === 'top') {
				left = desde.left + desde.width / 2 - propio.width / 2;
			}
			break;
		case 'end':
			if (props.side === 'bottom' || props.side === 'top') {
				left = desde.right - propio.width;
			}
			break;
	}

	posicion.value = { top, left };
}

/** Los ítems que hay ahora mismo, en el orden en que se leen. */
function items(): HTMLElement[] {
	if (!contenido.value) return [];
	return Array.from(contenido.value.querySelectorAll<HTMLElement>('[role="menuitem"]'));
}

/**
 * Enfoca por posición, dando la vuelta.
 *
 * Los índices negativos cuentan desde el final, así que `-1` es el último y no
 * hace falta pedirle la cantidad a nadie.
 */
function enfocar(indice: number) {
	const lista = items();
	if (!lista.length) return;
	const cuantos = lista.length;
	lista[((indice % cuantos) + cuantos) % cuantos]?.focus();
}

/** Dónde está el foco, o `-1` si está en el menú y no en un ítem. */
function dondeEstaElFoco(): number {
	const activo = document.activeElement;
	return activo instanceof HTMLElement ? items().indexOf(activo) : -1;
}

function alTeclear(evento: KeyboardEvent) {
	const actual = dondeEstaElFoco();

	switch (evento.key) {
		case 'ArrowDown':
			evento.preventDefault();
			enfocar(actual + 1);
			break;
		case 'ArrowUp':
			evento.preventDefault();
			// Sin ítem enfocado la flecha de arriba entra por el final, que es
			// lo mismo que `-1` pide.
			enfocar(actual <= 0 ? -1 : actual - 1);
			break;
		case 'Home':
			evento.preventDefault();
			enfocar(0);
			break;
		case 'End':
			evento.preventDefault();
			enfocar(-1);
			break;
		case 'Escape':
			evento.preventDefault();
			// Sin cortarlo acá, el Escape sigue subiendo hasta el oyente global
			// de la aplicación, que cierra además lo que haya detrás del menú.
			evento.stopPropagation();
			menu.cerrar({ devolverElFoco: true });
			break;
		case 'Tab':
			evento.preventDefault();
			menu.cerrar({ devolverElFoco: true });
			break;
	}
}

watch(abierto, async (esta) => {
	if (!esta) return;

	await nextTick();
	requestAnimationFrame(() => {
		calcularPosicion();
	});

	switch (menu.focoAlAbrir.value) {
		case 'primero':
			enfocar(0);
			break;
		case 'ultimo':
			enfocar(-1);
			break;
		// Abierto con el ratón: el foco va al menú y no a un ítem —no hay
		// ninguno elegido todavía—, que es lo que deja andar las flechas y el
		// Escape sin haber tocado nada.
		default:
			contenido.value?.focus();
	}
});

function recalcularSiEstaAbierto() {
	if (abierto.value) {
		calcularPosicion();
	}
}

function alHacerClicAfuera(evento: MouseEvent) {
	const destino = evento.target as HTMLElement;
	const adentro = !!destino.closest('[dropdown-content]');
	const enElDisparador = !!disparador.value?.contains(destino);

	if (!adentro && !enElDisparador) {
		// Sin devolver el foco: quien hizo clic afuera ya eligió dónde está
		// parado, y traérselo de vuelta al disparador es sacárselo de las manos.
		menu.cerrar();
	}
}

onMounted(() => {
	document.addEventListener('click', alHacerClicAfuera);
	window.addEventListener('resize', recalcularSiEstaAbierto);
	window.addEventListener('scroll', recalcularSiEstaAbierto, true);
});

onBeforeUnmount(() => {
	document.removeEventListener('click', alHacerClicAfuera);
	window.removeEventListener('resize', recalcularSiEstaAbierto);
	window.removeEventListener('scroll', recalcularSiEstaAbierto, true);
});
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-150 ease-in-out"
      leave-active-class="transition-all duration-150 ease-in-out"
      enter-from-class="opacity-0 scale-95"
      leave-to-class="opacity-0 scale-95"
      @enter="(el) => (el as HTMLElement).offsetHeight"
      @leave="(el) => (el as HTMLElement).offsetHeight">
      <div
        v-show="abierto"
        ref="contenido"
        v-bind="$attrs"
        :id="idDelMenu"
        role="menu"
        tabindex="-1"
        aria-orientation="vertical"
        :aria-labelledby="idDeLaEtiqueta ?? undefined"
        :inert="!abierto"
        :style="{ position: 'fixed', top: `${posicion.top}px`, left: `${posicion.left}px`, zIndex: 50 }"
        dropdown-content
        class="min-w-30 rounded-corner border border-primary bg-ui-bg/80 shadow-lg focus:outline-none"
        @click="(e) => e.stopPropagation()"
        @keydown="alTeclear">
        <div role="none" class="py-1">
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
