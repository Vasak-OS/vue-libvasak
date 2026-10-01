/**
 * El contrato entre las cuatro piezas de un globo con contenido (`Popover`).
 *
 * Como el menú: la raíz provee el estado y el disparador, el ancla y el
 * contenido lo inyectan. A diferencia del menú, lo que se abre no es una lista
 * de opciones sino cualquier cosa —un formulario chico, un selector de
 * etiquetas, las opciones del editor—, así que no hay `role="menu"` ni flechas:
 * es un `dialog` no modal.
 *
 * El ancla es aparte del disparador porque a veces no son el mismo: el gestor
 * de archivos abre el selector de etiquetas desde un ítem del menú contextual,
 * pero el globo tiene que colgar de la fila, no del menú que ya se cerró.
 */
import { inject, type InjectionKey, ref, type Ref } from 'vue';

export interface PopoverContext {
	open: Ref<boolean>;
	/** El `id` del contenido, que es lo que apunta el `aria-controls`. */
	contentId: string;
	trigger: Ref<HTMLElement | null>;
	setTrigger: (element: HTMLElement | null) => void;
	/** Contra qué se ubica. Sin `PopoverAnchor`, el disparador. */
	anchor: Ref<HTMLElement | null>;
	setAnchor: (element: HTMLElement | null) => void;
	show: () => void;
	close: (options?: { returnFocus?: boolean }) => void;
	toggle: () => void;
}

export const POPOVER_KEY: InjectionKey<PopoverContext> = Symbol('globo de vasak');

/** El globo que envuelve a este componente, o uno suelto (para una prueba). */
export function usePopover(): PopoverContext {
	const context = inject(POPOVER_KEY, null);
	if (context) return context;

	const open = ref(false);
	return {
		open,
		contentId: 'vsk-popover-loose',
		trigger: ref(null),
		setTrigger: () => {},
		anchor: ref(null),
		setAnchor: () => {},
		show: () => {
			open.value = true;
		},
		close: () => {
			open.value = false;
		},
		toggle: () => {
			open.value = !open.value;
		},
	};
}

let counter = 0;
export function nextPopoverId(): string {
	counter += 1;
	return `vsk-popover-${counter}`;
}

/** Lo que se puede enfocar adentro, en orden de tabulación. */
export const FOCUSABLE =
	'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';
