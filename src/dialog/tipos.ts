/**
 * El contrato entre las piezas de un diálogo modal.
 *
 * Como el menú y el tooltip, un diálogo es un componente repartido: la raíz
 * sabe si está abierto, el contenido se teletransporta al `body` para que no lo
 * recorte nada, y el título vive dentro del contenido pero tiene que poder
 * nombrarlo desde afuera. Eso último es lo que no se puede pasar por
 * propiedades: el `aria-labelledby` del diálogo apunta al `id` de un título que
 * escribió quien lo usa, y que puede no existir.
 */

import { computed, inject, type InjectionKey, ref, type Ref } from 'vue';

export interface ContextoDelDialogo {
	abierto: Ref<boolean>;
	cerrar: () => void;
	/** El `id` del título, si hay uno, para el `aria-labelledby` del diálogo. */
	idDelTitulo: Ref<string | null>;
	ponerElTitulo: (id: string | null) => void;
}

export const CLAVE_DEL_DIALOGO: InjectionKey<ContextoDelDialogo> = Symbol('diálogo de vasak');

/**
 * El diálogo que envuelve a este componente.
 *
 * Fuera de un `Dialog` devuelve un contexto suelto en vez de reventar: un
 * título o un pie montados solos —en una prueba, en una vista previa— tienen
 * que dibujarse igual.
 */
export function usarElDialogo(): ContextoDelDialogo {
	const contexto = inject(CLAVE_DEL_DIALOGO, null);
	if (contexto) return contexto;

	const abierto = ref(false);
	return {
		abierto: computed(() => abierto.value) as Ref<boolean>,
		cerrar: () => {
			abierto.value = false;
		},
		idDelTitulo: ref(null),
		ponerElTitulo: () => {},
	};
}

/**
 * Un identificador por título montado.
 *
 * Tiene que ser único en el documento: dos diálogos con el mismo `id` rompen el
 * `aria-labelledby` de los dos.
 */
let contador = 0;
export function siguienteIdDeTitulo(): string {
	contador += 1;
	return `vsk-dialogo-titulo-${contador}`;
}
