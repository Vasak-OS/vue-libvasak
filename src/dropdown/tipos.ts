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
 */

import { inject, type InjectionKey, ref, type Ref } from 'vue';

/**
 * Qué se enfoca al abrir.
 *
 * `primero` y `ultimo` los pide el teclado —flecha abajo y flecha arriba—;
 * `ninguno` es lo que pasa con el ratón, y ahí el foco va al propio menú, que
 * es lo que deja andar las flechas y el Escape sin haber elegido nada todavía.
 */
export type FocoAlAbrir = 'primero' | 'ultimo' | 'ninguno';

export interface ContextoDelMenu {
	abierto: Ref<boolean>;
	/** El `id` del `role="menu"`, que es lo que apunta el `aria-controls`. */
	idDelMenu: string;
	/** El `id` de la etiqueta del menú, si hay una, para su `aria-labelledby`. */
	idDeLaEtiqueta: Ref<string | null>;
	ponerLaEtiqueta: (id: string | null) => void;
	disparador: Ref<HTMLElement | null>;
	ponerElDisparador: (elemento: HTMLElement | null) => void;
	focoAlAbrir: Ref<FocoAlAbrir>;
	abrir: (foco?: FocoAlAbrir) => void;
	/** Cerrar devolviendo el foco es lo que corresponde al Escape y a elegir. */
	cerrar: (opciones?: { devolverElFoco?: boolean }) => void;
	alternar: (foco?: FocoAlAbrir) => void;
}

export const CLAVE_DEL_MENU: InjectionKey<ContextoDelMenu> = Symbol('menú de vasak');

/**
 * El menú que envuelve a este componente.
 *
 * Fuera de un `DropdownMenu` devuelve un contexto suelto en vez de reventar: un
 * ítem montado solo —en una prueba, en una vista previa— tiene que dibujarse
 * igual, con su `role` y su teclado, aunque no haya nada que abrir ni cerrar.
 */
export function usarElMenu(): ContextoDelMenu {
	const contexto = inject(CLAVE_DEL_MENU, null);
	if (contexto) return contexto;

	const abierto = ref(false);
	return {
		abierto,
		idDelMenu: 'vsk-menu-suelto',
		idDeLaEtiqueta: ref(null),
		ponerLaEtiqueta: () => {},
		disparador: ref(null),
		ponerElDisparador: () => {},
		focoAlAbrir: ref<FocoAlAbrir>('ninguno'),
		abrir: () => {
			abierto.value = true;
		},
		cerrar: () => {
			abierto.value = false;
		},
		alternar: () => {
			abierto.value = !abierto.value;
		},
	};
}

/**
 * Un identificador por menú montado.
 *
 * Tiene que ser único en el documento —dos menús con el mismo `id` rompen el
 * `aria-controls` de los dos— y estable mientras el menú viva.
 */
let contador = 0;
export function siguienteIdDeMenu(): string {
	contador += 1;
	return `vsk-menu-${contador}`;
}
