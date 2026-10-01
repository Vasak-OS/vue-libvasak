/**
 * Lo que necesita un disparador con `as-child`: encontrar el único hijo de
 * verdad y llegar a su elemento del DOM.
 *
 * Lo escribió `DropdownMenuTrigger` y lo usan igual `PopoverTrigger` y
 * `PopoverAnchor` (2.2.0).
 */
import { Comment, Fragment, Text, type VNode } from 'vue';

/** El único hijo de verdad, saltando comentarios, huecos y fragmentos. */
export function onlyChild(children: VNode[]): VNode | null {
	const real = children.filter(
		(node) =>
			node.type !== Comment &&
			!(node.type === Text && typeof node.children === 'string' && !node.children.trim())
	);
	if (real.length !== 1) return null;

	const one = real[0] as VNode;
	if (one.type === Fragment && Array.isArray(one.children)) {
		return onlyChild(one.children as VNode[]);
	}
	return one;
}

/**
 * El elemento del DOM detrás de una referencia.
 *
 * Con `as-child` el hijo puede ser otro componente —un disparador de tooltip,
 * por ejemplo—, y ahí la referencia es su instancia y no un elemento. Lo que
 * flota necesita el elemento: es lo que mide para ubicarse.
 */
export function elementOf(value: unknown): HTMLElement | null {
	if (value instanceof HTMLElement) return value;
	const root = (value as { $el?: unknown } | null)?.$el;
	return root instanceof HTMLElement ? root : null;
}
