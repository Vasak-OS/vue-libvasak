/**
 * El contrato entre las tres piezas de un tooltip.
 *
 * Como el menú desplegable, un tooltip es un componente repartido: el
 * disparador está donde lo escribieron y el contenido se teletransporta al
 * `body` para que no lo recorte ningún `overflow`. Nada de eso se coordina por
 * propiedades, así que la raíz lo **provee** y las otras dos lo inyectan.
 *
 * Lo que se coordina es si está abierto y **cuál** es el elemento que lo
 * disparó: el contenido lo necesita para medir dónde ponerse, y no puede ser
 * el `div` envoltorio del disparador sino el hijo de verdad, que es el que
 * tiene el tamaño del botón.
 */

import { computed, inject, type InjectionKey, ref, type Ref } from 'vue';

export interface ContextoDelTooltip {
	abierto: Ref<boolean>;
	/** El elemento que lo disparó, que es contra el que se mide la posición. */
	disparador: Ref<HTMLElement | null>;
	ponerElDisparador: (elemento: HTMLElement | null) => void;
	/** Abre tras el retardo. Sin retardo el tooltip parpadea al pasar de largo. */
	abrir: () => void;
	cerrar: () => void;
}

export const CLAVE_DEL_TOOLTIP: InjectionKey<ContextoDelTooltip> = Symbol('tooltip de vasak');

/**
 * El tooltip que envuelve a este componente.
 *
 * Fuera de un `Tooltip` devuelve un contexto suelto en vez de reventar: un
 * disparador montado solo —en una prueba, en una vista previa— tiene que
 * dibujarse igual aunque no haya nada que abrir.
 */
export function usarElTooltip(): ContextoDelTooltip {
	const contexto = inject(CLAVE_DEL_TOOLTIP, null);
	if (contexto) return contexto;

	const abierto = ref(false);
	return {
		abierto: computed(() => abierto.value) as Ref<boolean>,
		disparador: ref(null),
		ponerElDisparador: () => {},
		abrir: () => {
			abierto.value = true;
		},
		cerrar: () => {
			abierto.value = false;
		},
	};
}
