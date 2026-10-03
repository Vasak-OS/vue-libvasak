/**
 * Las cuentas de un grupo de botones que se recorre con las flechas: cuántos
 * hay, cuál es el actual dentro del rango y a cuál lleva cada tecla.
 *
 * Aparte para que `WorkspaceSwitcher` no las repita a mano, y para probarlas
 * sin montar nada.
 */

/** Cuántos hay, entero y nunca negativo. */
export function countOf(count: number): number {
	return Math.max(0, Math.floor(count));
}

/** El índice dentro de `[0, total)`; sin elementos, 0. */
export function clampIndex(index: number, total: number): number {
	return Math.min(Math.max(index, 0), Math.max(total - 1, 0));
}

/**
 * Adónde lleva una tecla desde `current`: las flechas de a uno sin dar la
 * vuelta, Inicio al primero y Fin al último. `undefined` si la tecla no mueve.
 */
export function arrowTarget(key: string, current: number, total: number): number | undefined {
	const last = Math.max(total - 1, 0);
	switch (key) {
		case 'ArrowRight':
		case 'ArrowDown':
			return Math.min(current + 1, last);
		case 'ArrowLeft':
		case 'ArrowUp':
			return Math.max(current - 1, 0);
		case 'Home':
			return 0;
		case 'End':
			return last;
		default:
			return undefined;
	}
}
