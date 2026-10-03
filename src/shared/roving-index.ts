import { computed } from 'vue';
import { useLabels } from './labels';

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

/** Lo que un grupo de índices lee de sus propiedades. */
export interface IndexGroupProps {
	count: number;
	modelValue?: number;
	label?: string;
}

/**
 * Cuántos hay, cuál es el actual y cómo se llama el grupo: lo mismo en
 * `PageDots` y en `WorkspaceSwitcher`, que lo calculaban cada uno a mano.
 * `labelKey` y `fallback` son la clave del catálogo y el texto de respaldo
 * para cuando no viene `label`.
 */
export function useIndexGroup(props: IndexGroupProps, labelKey: string, fallback: string) {
	const translate = useLabels();
	const total = computed(() => countOf(props.count));
	const active = computed(() => clampIndex(props.modelValue ?? 0, total.value));
	const groupName = computed(() => props.label ?? translate(labelKey, fallback));
	return { total, active, groupName, translate };
}
