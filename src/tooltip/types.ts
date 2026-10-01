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
 *
 * Hasta la 1.x los nombres estaban en castellano (`ContextoDelTooltip`,
 * `usarElTooltip`…). Siguen exportados como alias obsoletos desde `index.ts`.
 */

import { computed, inject, type InjectionKey, ref, type Ref } from 'vue';

export interface TooltipContext {
	open: Ref<boolean>;
	/** El elemento que lo disparó, que es contra el que se mide la posición. */
	trigger: Ref<HTMLElement | null>;
	setTrigger: (element: HTMLElement | null) => void;
	/** Abre tras el retardo. Sin retardo el tooltip parpadea al pasar de largo. */
	show: () => void;
	hide: () => void;
}

export const TOOLTIP_KEY: InjectionKey<TooltipContext> = Symbol('tooltip de vasak');

/**
 * El tooltip que envuelve a este componente.
 *
 * Fuera de un `Tooltip` devuelve un contexto suelto en vez de reventar: un
 * disparador montado solo —en una prueba, en una vista previa— tiene que
 * dibujarse igual aunque no haya nada que abrir.
 */
export function useTooltip(): TooltipContext {
	const context = inject(TOOLTIP_KEY, null);
	if (context) return context;

	const open = ref(false);
	return {
		open: computed(() => open.value) as Ref<boolean>,
		trigger: ref(null),
		setTrigger: () => {},
		show: () => {
			open.value = true;
		},
		hide: () => {
			open.value = false;
		},
	};
}
