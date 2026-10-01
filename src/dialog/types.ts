/**
 * El contrato entre las piezas de un diálogo modal.
 *
 * Como el menú y el tooltip, un diálogo es un componente repartido: la raíz
 * sabe si está abierto, el contenido se teletransporta al `body` para que no lo
 * recorte nada, y el título vive dentro del contenido pero tiene que poder
 * nombrarlo desde afuera. Eso último es lo que no se puede pasar por
 * propiedades: el `aria-labelledby` del diálogo apunta al `id` de un título que
 * escribió quien lo usa, y que puede no existir.
 *
 * Hasta la 1.x los nombres estaban en castellano (`ContextoDelDialogo`,
 * `usarElDialogo`…). Siguen exportados como alias obsoletos desde `index.ts`.
 */

import { computed, inject, type InjectionKey, ref, type Ref } from 'vue';

export interface DialogContext {
	open: Ref<boolean>;
	close: () => void;
	/** El `id` del título, si hay uno, para el `aria-labelledby` del diálogo. */
	titleId: Ref<string | null>;
	setTitle: (id: string | null) => void;
}

export const DIALOG_KEY: InjectionKey<DialogContext> = Symbol('diálogo de vasak');

/**
 * El diálogo que envuelve a este componente.
 *
 * Fuera de un `Dialog` devuelve un contexto suelto en vez de reventar: un
 * título o un pie montados solos —en una prueba, en una vista previa— tienen
 * que dibujarse igual.
 */
export function useDialog(): DialogContext {
	const context = inject(DIALOG_KEY, null);
	if (context) return context;

	const open = ref(false);
	return {
		open: computed(() => open.value) as Ref<boolean>,
		close: () => {
			open.value = false;
		},
		titleId: ref(null),
		setTitle: () => {},
	};
}

/**
 * Un `id` por título montado: dos diálogos con el mismo rompen el
 * `aria-labelledby` de los dos. Con un contador y no con azar.
 */
let counter = 0;
export function nextTitleId(): string {
	counter += 1;
	return `vsk-dialog-title-${counter}`;
}
