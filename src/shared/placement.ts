/**
 * Dónde va algo que flota junto a otra cosa: un menú, un globo con contenido.
 *
 * Lo escribió `DropdownMenuContent` y lo necesita igual `PopoverContent`
 * (2.2.0), así que vive acá y los dos lo usan: dos copias de la misma cuenta
 * son dos copias que se separan.
 *
 * `side` es una **preferencia**, no una orden: si por el lado pedido no entra y
 * por el de enfrente hay más lugar, se da vuelta. Lo que sobra después se corta
 * con un techo calculado contra el espacio que queda de verdad, y quien flota
 * desplaza adentro. Nunca se va por el costado de la ventana.
 *
 * Es una función pura —recibe los rectángulos y devuelve números— para poder
 * probarla sin maquetar nada.
 */

export type Side = 'top' | 'bottom' | 'left' | 'right';
export type Align = 'start' | 'center' | 'end';

export interface PlacementOptions {
	side: Side;
	align: Align;
	sideOffset: number;
}

export interface Placement {
	top: number;
	left: number;
	/** Hasta dónde puede crecer; `null` mientras no haga falta. */
	ceiling: number | null;
	/** El lado que resultó, que puede ser el de enfrente del pedido. */
	side: Side;
}

/** Lo mínimo de un rectángulo que hace falta para ubicarse. */
export interface Box {
	top: number;
	bottom: number;
	left: number;
	right: number;
	width: number;
}

/** El aire que se le deja al borde de la ventana. */
export const MARGIN = 8;

const OPPOSITE: Record<Side, Side> = {
	top: 'bottom',
	bottom: 'top',
	left: 'right',
	right: 'left',
};

function clamp(value: number, minimum: number, maximum: number): number {
	if (maximum < minimum) return minimum;
	return Math.min(Math.max(value, minimum), maximum);
}

/** Lo que hay entre el ancla y el borde de la ventana, de ese lado. */
function spaceOn(side: Side, from: Box, offset: number, viewport: { width: number; height: number }): number {
	const gap = offset + MARGIN;
	switch (side) {
		case 'bottom':
			return viewport.height - from.bottom - gap;
		case 'top':
			return from.top - gap;
		case 'right':
			return viewport.width - from.right - gap;
		case 'left':
			return from.left - gap;
	}
}

/**
 * La ubicación de algo de `wanted` de tamaño junto a `from`.
 *
 * `wanted.height` tiene que ser el alto que **querría** tener (`scrollHeight`)
 * y no el que tiene: con el techo de la vez anterior puesto, un panel topado se
 * creería de ese tamaño y no volvería a crecer nunca aunque le sobrara lugar.
 */
export function computePlacement(
	from: Box,
	wanted: { width: number; height: number },
	options: PlacementOptions,
	viewport: { width: number; height: number }
): Placement {
	const { sideOffset, align } = options;
	const vertical = options.side === 'top' || options.side === 'bottom';
	const needed = vertical ? wanted.height : wanted.width;

	let side: Side = options.side;
	const here = spaceOn(side, from, sideOffset, viewport);
	if (here < needed) {
		const across = spaceOn(OPPOSITE[side], from, sideOffset, viewport);
		if (across > here) side = OPPOSITE[side];
	}

	let top = 0;
	let left = 0;
	let ceiling: number | null = null;

	switch (side) {
		case 'bottom': {
			top = from.bottom + sideOffset;
			ceiling = Math.max(viewport.height - top - MARGIN, 0);
			break;
		}
		case 'top': {
			// Crece para arriba: el borde de abajo queda clavado contra el ancla,
			// así que lo que se mueve al toparlo es el `top`.
			ceiling = Math.max(spaceOn('top', from, sideOffset, viewport), 0);
			top = from.top - sideOffset - Math.min(wanted.height, ceiling);
			break;
		}
		case 'left':
		case 'right': {
			left = side === 'right' ? from.right + sideOffset : from.left - wanted.width - sideOffset;
			// A un costado el alto no lo limita el costado sino la ventana: se
			// arranca a la altura del ancla y se sube lo que haga falta.
			const inWindow = viewport.height - 2 * MARGIN;
			top = clamp(from.top, MARGIN, viewport.height - Math.min(wanted.height, inWindow) - MARGIN);
			ceiling = Math.max(viewport.height - top - MARGIN, 0);
			break;
		}
	}

	if (vertical) {
		switch (align) {
			case 'start':
				left = from.left;
				break;
			case 'center':
				left = from.left + from.width / 2 - wanted.width / 2;
				break;
			case 'end':
				left = from.right - wanted.width;
				break;
		}
	}

	// Y que no se vaya por el costado: un ancla pegada al borde derecho manda
	// medio panel afuera de la ventana, donde no hay forma de leerlo.
	left = clamp(left, MARGIN, viewport.width - wanted.width - MARGIN);

	return { top, left, ceiling, side };
}

/**
 * La esquina desde la que crece: la que toca al ancla.
 *
 * Abajo del ancla crece desde arriba; arriba, desde abajo; a un costado, desde
 * el borde que da al ancla. En el otro eje manda la alineación.
 */
export function transformOriginFor(side: Side, align: Align): string {
	const alongX = align === 'start' ? 'left' : align === 'end' ? 'right' : 'center';
	switch (side) {
		case 'bottom':
			return `top ${alongX}`;
		case 'top':
			return `bottom ${alongX}`;
		case 'right':
			return 'top left';
		case 'left':
			return 'top right';
	}
}
