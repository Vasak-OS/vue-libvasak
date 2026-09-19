/**
 * El contrato entre el marco de la ventana y lo que vive en su barra.
 *
 * La barra puede quedar arriba, abajo, a la izquierda o a la derecha, y lo que
 * se pone adentro tiene que amoldarse: unas pestañas que se desbordan a lo
 * ancho no se desbordan igual a lo alto, y un campo de texto de doscientos
 * píxeles no entra en una barra de cuarenta y ocho.
 *
 * El marco lo **provee** y los componentes lo **inyectan**, en vez de que cada
 * aplicación baje la orientación por propiedades hasta el último nieto. Eso es
 * lo que permite que una barra de pestañas escrita en su repositorio se amolde
 * sin que nadie la toque.
 */

import { computed, inject, type InjectionKey, ref, type Ref } from 'vue';

/** Dónde queda la barra dentro de la ventana. */
export type PosicionDeLaBarra = 'top' | 'bottom' | 'left' | 'right';

/**
 * Cómo se acomoda lo que va adentro.
 *
 * Es lo que la mayoría de los componentes necesita saber: arriba y abajo se
 * comportan igual, y la izquierda y la derecha también.
 */
export type OrientacionDeLaBarra = 'horizontal' | 'vertical';

export interface ContextoDeLaBarra {
	posicion: Ref<PosicionDeLaBarra>;
	orientacion: Ref<OrientacionDeLaBarra>;
	/** `true` cuando la barra es vertical, que es lo que más se pregunta. */
	vertical: Ref<boolean>;
}

export const CLAVE_DE_LA_BARRA: InjectionKey<ContextoDeLaBarra> = Symbol('barra de vasak');

/** La orientación de las cuatro posiciones. */
export function orientacionDe(posicion: PosicionDeLaBarra): OrientacionDeLaBarra {
	return posicion === 'left' || posicion === 'right' ? 'vertical' : 'horizontal';
}

/** Las cuatro, para validar lo que venga de la configuración. */
export const POSICIONES: readonly PosicionDeLaBarra[] = ['top', 'bottom', 'left', 'right'];

export function esPosicion(valor: unknown): valor is PosicionDeLaBarra {
	return typeof valor === 'string' && (POSICIONES as readonly string[]).includes(valor);
}

/**
 * La orientación de la barra que envuelve a este componente.
 *
 * Fuera de un marco devuelve horizontal: un componente de barra montado suelto
 * —en una prueba, en una vista previa— tiene que dibujarse igual, no reventar.
 *
 * Los tres son `ref` de verdad y no objetos con una propiedad `value`. Vue
 * desenvuelve en la plantilla lo que **es** una ref; un objeto que se le
 * parece llega entero, y un objeto siempre es verdadero: con el respaldo
 * falsificado, `vertical` daba verdadero y todo lo que se montara fuera de un
 * marco se dibujaba de costado. Lo encontró una prueba de `aria-orientation`.
 */
export function usarLaBarra(): ContextoDeLaBarra {
	const contexto = inject(CLAVE_DE_LA_BARRA, null);
	if (contexto) return contexto;

	const posicion = ref<PosicionDeLaBarra>('top');
	return {
		posicion,
		orientacion: computed(() => orientacionDe(posicion.value)),
		vertical: computed(() => orientacionDe(posicion.value) === 'vertical'),
	};
}
