/**
 * La geometría de `DeviceOrbit`: dónde va cada satélite y por dónde pasa la
 * línea que lo une al centro.
 *
 * Vive aparte del componente para poder probarla sin maquetar: el DOM de las
 * pruebas no mide nada, y lo que importa —que con uno a seis satélites queden
 * repartidos parejo y que la línea no se meta debajo de la pastilla— es
 * aritmética.
 *
 * Todo va en píxeles de la caja del componente, con el origen arriba a la
 * izquierda. Los ángulos van en grados, **0 arriba y en el sentido de las
 * agujas del reloj**: con cuatro, el primero va arriba, el segundo a la
 * derecha, el tercero abajo y el cuarto a la izquierda, que es el reparto de
 * referencia (buscar arriba, batería a la derecha, perfil abajo, MAC a la
 * izquierda).
 */

/** Un punto de la caja. */
export interface OrbitPoint {
	x: number;
	y: number;
}

/** La caja de un satélite, centrada en su punto. */
export interface OrbitBox extends OrbitPoint {
	width: number;
	height: number;
}

/** El círculo del centro. */
export interface OrbitCircle extends OrbitPoint {
	radius: number;
}

/** Lo que hace falta para repartir: la caja entera y lo que ocupa cada cosa. */
export interface OrbitFrame {
	width: number;
	height: number;
	/** El radio del círculo del centro. */
	radius: number;
	/** El satélite más ancho y el más alto: la órbita deja lugar para los dos. */
	satelliteWidth: number;
	satelliteHeight: number;
	/** Lo que se aparta todo del borde de la caja. */
	padding?: number;
	/** Lo mínimo entre el círculo y la pastilla más cercana. */
	gap?: number;
}

/** La órbita ya resuelta: los dos radios de la elipse sobre la que van. */
export interface OrbitRadii {
	radiusX: number;
	radiusY: number;
}

/** Redondea a centésimas y saca el `-0` que deja un seno de 180°. */
function tidy(value: number): number {
	const snapped = Math.round(value * 100) / 100;
	return snapped === 0 ? 0 : snapped;
}

/**
 * Los ángulos de `count` satélites, repartidos parejo desde arriba.
 *
 * Con cero no hay ninguno; con uno, va arriba.
 */
export function orbitAngles(count: number): number[] {
	if (!Number.isFinite(count) || count <= 0) return [];
	const total = Math.floor(count);
	return Array.from({ length: total }, (_, index) => tidy((index * 360) / total));
}

/**
 * Los radios de la órbita en esta caja, o `null` si no entra.
 *
 * La elipse se abre todo lo que deja el borde —los satélites de los costados
 * tocan casi el borde lateral y los de arriba y abajo el superior y el
 * inferior—, hasta `MAX_STRETCH` veces más ancha que alta, y nunca más alta
 * que ancha. «No entra» es que el satélite de un costado pisaría el círculo:
 * ahí el componente deja la órbita y apila, como una pantalla de celular.
 */
export function orbitRadii(frame: OrbitFrame): OrbitRadii | null {
	const padding = frame.padding ?? 8;
	const gap = frame.gap ?? 16;
	if (frame.width <= 0 || frame.height <= 0) return null;

	const radiusX = frame.width / 2 - frame.satelliteWidth / 2 - padding;
	const radiusY = frame.height / 2 - frame.satelliteHeight / 2 - padding;
	const fitsSideways = radiusX - frame.satelliteWidth / 2 >= frame.radius + gap;
	const fitsVertically = radiusY - frame.satelliteHeight / 2 >= frame.radius + gap;
	if (!fitsSideways || !fitsVertically) return null;

	// En una caja muy ancha o muy alta, la elipse no se estira hasta el borde:
	// los satélites quedarían lejos del centro que describen.
	return {
		radiusX: tidy(Math.min(radiusX, radiusY * MAX_STRETCH)),
		radiusY: tidy(Math.min(radiusY, radiusX)),
	};
}

/** Lo más que la órbita puede ser más ancha que alta. */
export const MAX_STRETCH = 1.6;

/** Dónde va cada uno de `count` satélites sobre la elipse, alrededor de `center`. */
export function orbitPositions(count: number, center: OrbitPoint, radii: OrbitRadii): OrbitPoint[] {
	return orbitAngles(count).map((angle) => {
		const radians = (angle * Math.PI) / 180;
		return {
			x: tidy(center.x + radii.radiusX * Math.sin(radians)),
			y: tidy(center.y - radii.radiusY * Math.cos(radians)),
		};
	});
}

/**
 * La línea del centro al satélite, en codo, como un `d` de `<path>`.
 *
 * Sale del canto del círculo y llega al canto de la pastilla, nunca al centro
 * de ninguno de los dos: la pastilla es translúcida y una línea que la cruce
 * se ve a través. El codo es horizontal primero y vertical después, salvo que
 * el satélite esté justo arriba o abajo (recta vertical) o a la altura del
 * centro (recta horizontal). Si las dos cosas se tocan, no hay línea: vuelve
 * la cadena vacía.
 */
export function elbowPath(circle: OrbitCircle, box: OrbitBox): string {
	const dx = box.x - circle.x;
	const dy = box.y - circle.y;
	const halfWidth = box.width / 2;
	const halfHeight = box.height / 2;
	const point = (x: number, y: number) => `${tidy(x)} ${tidy(y)}`;

	// A la altura del centro: recta horizontal hasta el costado de la pastilla.
	if (Math.abs(dy) <= halfHeight) {
		const start = circle.x + Math.sign(dx) * circle.radius;
		const end = box.x - Math.sign(dx) * halfWidth;
		if (dx === 0 || Math.sign(end - start) !== Math.sign(dx)) return '';
		return `M${point(start, circle.y)}L${point(end, circle.y)}`;
	}

	const end = box.y - Math.sign(dy) * halfHeight;

	// Más cerca del eje que el radio: la vertical sale del canto del círculo,
	// justo en esa x.
	if (Math.abs(dx) < circle.radius) {
		const rise = Math.sqrt(circle.radius ** 2 - dx ** 2);
		const start = circle.y + Math.sign(dy) * rise;
		if (Math.sign(end - start) !== Math.sign(dy)) return '';
		return `M${point(box.x, start)}L${point(box.x, end)}`;
	}

	const start = circle.x + Math.sign(dx) * circle.radius;
	return `M${point(start, circle.y)}L${point(box.x, circle.y)}L${point(box.x, end)}`;
}

/** El radio del círculo del centro para una caja: una sexta parte, entre 44 y 88. */
export function centerRadius(width: number, height: number): number {
	const side = Math.min(width, height);
	if (side <= 0) return 44;
	return Math.round(Math.min(88, Math.max(44, side * 0.17)));
}
