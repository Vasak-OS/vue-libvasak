/**
 * El contrato entre las seis piezas de un menú desplegable.
 *
 * Un menú es un componente repartido: el disparador está en la barra, el
 * contenido se teletransporta al `body` y los ítems son hijos del contenido
 * pero nietos de quien los escribió. Nada de eso se puede coordinar por
 * propiedades, así que la raíz lo **provee** y las demás piezas lo inyectan.
 *
 * Lo que se coordina no es sólo «está abierto»: para que el menú se comporte
 * como un menú hace falta saber **con qué extremo** abrirlo —la flecha de
 * arriba abre por el último ítem— y **a quién** devolverle el foco al cerrar.
 * Eso último no es el disparador: en un menú contextual el disparador es un
 * ancla invisible de cero por cero, y devolverle el foco es perderlo.
 *
 * Hasta la 1.x los nombres estaban en castellano (`ContextoDelMenu`,
 * `usarElMenu`…). Siguen exportados como alias obsoletos desde `index.ts`.
 */

import { inject, type InjectionKey, ref, type Ref } from 'vue';

/**
 * Qué se enfoca al abrir.
 *
 * `first` y `last` los pide el teclado —flecha abajo y flecha arriba—; `none`
 * es lo que pasa con el ratón, y ahí el foco va al propio menú, que es lo que
 * deja andar las flechas y el Escape sin haber elegido nada todavía.
 */
export type FocusOnOpen = 'first' | 'last' | 'none';

export interface MenuContext {
	open: Ref<boolean>;
	/** El `id` del `role="menu"`, que es lo que apunta el `aria-controls`. */
	menuId: string;
	/** El `id` de la etiqueta del menú, si hay una, para su `aria-labelledby`. */
	labelId: Ref<string | null>;
	setLabel: (id: string | null) => void;
	trigger: Ref<HTMLElement | null>;
	setTrigger: (element: HTMLElement | null) => void;
	focusOnOpen: Ref<FocusOnOpen>;
	show: (focus?: FocusOnOpen) => void;
	/** Cerrar devolviendo el foco es lo que corresponde al Escape y a elegir. */
	close: (options?: { returnFocus?: boolean }) => void;
	toggle: (focus?: FocusOnOpen) => void;
}

export const MENU_KEY: InjectionKey<MenuContext> = Symbol('menú de vasak');

/**
 * El menú que envuelve a este componente.
 *
 * Fuera de un `DropdownMenu` devuelve un contexto suelto en vez de reventar: un
 * ítem montado solo —en una prueba, en una vista previa— tiene que dibujarse
 * igual, con su `role` y su teclado, aunque no haya nada que abrir ni cerrar.
 */
export function useMenu(): MenuContext {
	const context = inject(MENU_KEY, null);
	if (context) return context;

	const open = ref(false);
	return {
		open,
		menuId: 'vsk-menu-loose',
		labelId: ref(null),
		setLabel: () => {},
		trigger: ref(null),
		setTrigger: () => {},
		focusOnOpen: ref<FocusOnOpen>('none'),
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

/**
 * Un identificador por menú montado.
 *
 * Tiene que ser único en el documento —dos menús con el mismo `id` rompen el
 * `aria-controls` de los dos— y estable mientras el menú viva.
 */
let counter = 0;
export function nextMenuId(): string {
	counter += 1;
	return `vsk-menu-${counter}`;
}
