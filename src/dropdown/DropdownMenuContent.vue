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
 *
 * # Dónde entra
 *
 * `side` es una **preferencia**, no una orden: si por el lado pedido no entra y
 * por el de enfrente hay más lugar, el menú se da vuelta. Y lo que sobra
 * después de eso se corta con un techo calculado contra el espacio que queda de
 * verdad —no un número fijo, que se equivoca en los dos sentidos: de más contra
 * el borde de abajo, de menos cuando hay pantalla de sobra— y se desplaza
 * adentro.
 *
 * Sin esto, un menú más alto que la pantalla se cortaba en el borde y lo que
 * quedaba abajo era inalcanzable: no había barra de desplazamiento, y la rueda
 * tampoco hacía nada porque no había nada que desplazar.
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
/** Dónde va y hasta dónde puede crecer. Sin techo mientras no haga falta. */
const posicion = ref<{ top: number; left: number; techo: number | null }>({
	top: 0,
	left: 0,
	techo: null,
});

/** El aire que se le deja al borde de la ventana. */
const MARGEN = 8;

type Lado = 'top' | 'bottom' | 'left' | 'right';

const DE_ENFRENTE: Record<Lado, Lado> = {
	top: 'bottom',
	bottom: 'top',
	left: 'right',
	right: 'left',
};

/** Lo que hay entre el disparador y el borde de la ventana, de ese lado. */
function espacioDe(lado: Lado, desde: DOMRect): number {
	const aire = props.sideOffset + MARGEN;
	switch (lado) {
		case 'bottom':
			return window.innerHeight - desde.bottom - aire;
		case 'top':
			return desde.top - aire;
		case 'right':
			return window.innerWidth - desde.right - aire;
		case 'left':
			return desde.left - aire;
	}
}

function acotar(valor: number, minimo: number, maximo: number): number {
	if (maximo < minimo) return minimo;
	return Math.min(Math.max(valor, minimo), maximo);
}

function calcularPosicion() {
	if (!disparador.value || !contenido.value) return;

	const desde = disparador.value.getBoundingClientRect();
	// `scrollHeight` y no el rectángulo: el rectángulo ya viene con el techo de
	// la vez anterior puesto, así que un menú topado se creería de ese tamaño y
	// no volvería a crecer nunca aunque le sobrara lugar.
	const altoQueQuiere = contenido.value.scrollHeight;
	const anchoQueQuiere = contenido.value.offsetWidth;

	// `side` es una preferencia: si no entra de ese lado y del otro hay más
	// lugar, se da vuelta. Con «más» y no con «entra» alcanza: si no entra en
	// ninguno de los dos, va al que menos lo corta.
	const vertical = props.side === 'top' || props.side === 'bottom';
	const queNecesita = vertical ? altoQueQuiere : anchoQueQuiere;

	let lado: Lado = props.side;
	const deEsteLado = espacioDe(lado, desde);
	if (deEsteLado < queNecesita) {
		const deEnfrente = espacioDe(DE_ENFRENTE[lado], desde);
		if (deEnfrente > deEsteLado) lado = DE_ENFRENTE[lado];
	}

	let top = 0;
	let left = 0;
	let techo: number | null = null;

	switch (lado) {
		case 'bottom': {
			top = desde.bottom + props.sideOffset;
			techo = Math.max(window.innerHeight - top - MARGEN, 0);
			break;
		}
		case 'top': {
			// Crece para arriba: el borde de abajo queda clavado contra el
			// disparador, así que lo que se mueve al toparlo es el `top`.
			techo = Math.max(espacioDe('top', desde), 0);
			top = desde.top - props.sideOffset - Math.min(altoQueQuiere, techo);
			break;
		}
		case 'left':
		case 'right': {
			left =
				lado === 'right'
					? desde.right + props.sideOffset
					: desde.left - anchoQueQuiere - props.sideOffset;
			// A un costado el alto no lo limita el costado sino la ventana. El
			// menú arranca a la altura del disparador, y si desde ahí no entra
			// se sube lo que haga falta antes de toparlo.
			const enLaVentana = window.innerHeight - 2 * MARGEN;
			top = acotar(desde.top, MARGEN, window.innerHeight - Math.min(altoQueQuiere, enLaVentana) - MARGEN);
			techo = Math.max(window.innerHeight - top - MARGEN, 0);
			break;
		}
	}

	if (vertical) {
		switch (props.align) {
			case 'start':
				left = desde.left;
				break;
			case 'center':
				left = desde.left + desde.width / 2 - anchoQueQuiere / 2;
				break;
			case 'end':
				left = desde.right - anchoQueQuiere;
				break;
		}
	}

	// Y que no se vaya por el costado. Alinear contra el disparador es lo que se
	// pidió, pero un disparador pegado al borde derecho manda medio menú afuera
	// de la ventana, donde no hay forma de leerlo.
	left = acotar(left, MARGEN, window.innerWidth - anchoQueQuiere - MARGEN);

	posicion.value = { top, left, techo };
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

function recalcularSiEstaAbierto(evento?: Event) {
	if (!abierto.value) return;
	// Desplazarse **adentro** del menú no lo mueve: el disparador sigue donde
	// estaba. El oyente de `scroll` es de captura y con el techo puesto el menú
	// pasó a ser él mismo un contenedor desplazable, así que ahora sus propios
	// desplazamientos también llegan hasta acá.
	if (evento && contenido.value?.contains(evento.target as Node)) return;
	calcularPosicion();
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
        :style="{
          position: 'fixed',
          top: `${posicion.top}px`,
          left: `${posicion.left}px`,
          maxHeight: posicion.techo === null ? undefined : `${posicion.techo}px`,
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          zIndex: 50,
        }"
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
