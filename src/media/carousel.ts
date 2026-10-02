/**
 * Las cuentas del carrusel de fondos, sin DOM.
 *
 * Aparte del componente para que las pruebas digan qué pasa en los bordes, con
 * una lista de uno y con una vacía, sin montar nada: son los casos donde un
 * carrusel se rompe, y en el componente quedan escondidos detrás de eventos.
 */

/** Un fondo, tal como lo muestra el carrusel. */
export interface WallpaperItem {
	/** Lo que lo identifica: la ruta del archivo, en el escritorio. */
	id: string;
	/** Su nombre, para quien no ve la miniatura. */
	label: string;
	/** La miniatura quieta: una imagen chica, nunca el original de 5K. */
	thumbnail: string | null;
	/** Si es un fondo en movimiento. Lleva ▶ y se previsualiza al enfocarlo. */
	video?: boolean;
	/**
	 * De dónde se reproduce la previsualización. Sólo hace falta en el que se
	 * está previsualizando: quien usa el carrusel la carga cuando `preview` lo
	 * nombra y la suelta cuando deja de nombrarlo.
	 */
	videoSrc?: string | null;
}

/** Hasta cuántas tarjetas a cada lado se dibujan. Las demás no existen en el DOM. */
export const VISIBLE_SIDE = 3;

/**
 * Cuánto desplazamiento de la rueda vale un paso.
 *
 * Una rueda con muescas manda 100 por muesca (WebKitGTK, Chrome); un panel
 * táctil manda de a poco. Acumular hasta 60 da un paso por muesca y uno cada
 * tanto deslizando, en lugar de cruzar la fila entera con un solo gesto.
 */
export const WHEEL_STEP = 60;

/** El índice dentro de la fila, o -1 si no hay nada que enfocar. */
export function clampIndex(index: number, count: number): number {
	if (count <= 0) return -1;
	return Math.min(Math.max(Math.trunc(index), 0), count - 1);
}

/**
 * Moverse `delta` tarjetas. **No da la vuelta**: en el último, seguir a la
 * derecha no hace nada. Dar la vuelta haría que el fondo aplicado, que abre al
 * centro, quede a un paso de cualquier punta y se pierda la idea de dónde se
 * está.
 */
export function stepIndex(index: number, delta: number, count: number): number {
	return clampIndex(index + delta, count);
}

/** Donde abre: centrado en el fondo aplicado, o en el primero si no está en la lista. */
export function initialIndex(items: readonly WallpaperItem[], current: string | null | undefined): number {
	if (items.length === 0) return -1;
	const found = current ? items.findIndex((item) => item.id === current) : -1;
	return found === -1 ? 0 : found;
}

/**
 * Lo que mueve la rueda: los pasos enteros que salen del acumulado, y lo que
 * sobra para el próximo evento. Mira el eje que más se movió, así sirve igual la
 * rueda vertical que el desplazamiento horizontal de un panel táctil.
 */
export function wheelSteps(accumulated: number, deltaX: number, deltaY: number): { steps: number; rest: number } {
	const delta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;
	const total = accumulated + delta;
	const steps = Math.trunc(total / WHEEL_STEP);
	return { steps, rest: total - steps * WHEEL_STEP };
}

/**
 * Cuál se previsualiza en movimiento: **uno solo, o ninguno**.
 *
 * El que tiene el puntero encima, si es un video; si no, el enfocado, si es un
 * video. Nunca dos: cada video que se reproduce es un decodificador de
 * GStreamer andando, y diez a la vez se comen la máquina por un efecto.
 */
export function previewId(
	items: readonly WallpaperItem[],
	focused: number,
	hovered: string | null | undefined
): string | null {
	const hoveredItem = hovered ? items.find((item) => item.id === hovered) : undefined;
	if (hoveredItem?.video) return hoveredItem.id;
	const focusedItem = focused >= 0 ? items[focused] : undefined;
	return focusedItem?.video ? focusedItem.id : null;
}

/** Dónde va y cómo se ve una tarjeta, según cuántas la separan de la del centro. */
export interface CardPlacement {
	/** Desplazamiento horizontal, en anchos de tarjeta. */
	shift: number;
	scale: number;
	/** Arriba la del centro; las demás, más atrás cuanto más lejos. */
	layer: number;
	/** La imagen de las de los costados va atenuada. */
	dimmed: boolean;
	visible: boolean;
}

/**
 * Se solapan: cada paso corre la tarjeta un 62 % de su ancho, así asoma lo
 * suficiente para reconocer el fondo y la del centro tapa los bordes de las de
 * al lado, como en la referencia. La del centro va a 1,1 y las demás bajan de a
 * poco hasta 0,8.
 */
export function placeCard(offset: number): CardPlacement {
	const distance = Math.abs(offset);
	return {
		shift: offset * 0.62,
		scale: distance === 0 ? 1.1 : Math.max(0.8, 0.92 - (distance - 1) * 0.06),
		layer: 100 - distance,
		dimmed: distance !== 0,
		visible: distance <= VISIBLE_SIDE,
	};
}
