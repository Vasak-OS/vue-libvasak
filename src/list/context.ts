import type { InjectionKey } from 'vue';

/**
 * Lo que un `ListGroup` le dice a sus filas.
 *
 * Sólo una cosa: si el grupo dibuja divisores. Con divisores las filas van a
 * ras, de canto a canto, y un radio propio dejaría el velo de pasar por encima
 * con las esquinas redondeadas contra una línea recta. Va por inyección y no
 * por una clase que el grupo les ponga a sus hijos porque sacarle el radio a
 * algo con una clase es pelear contra otra clase en el mismo atributo.
 */
export interface ListGroupContext {
	divided: boolean;
}

export const LIST_GROUP_KEY: InjectionKey<ListGroupContext> = Symbol('vasak-list-group');
