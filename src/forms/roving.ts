/**
 * El teclado de un grupo de una sola elección, como lo pide la guía de
 * WAI-ARIA para `role="radiogroup"`.
 *
 * Lo usan `OptionGroup` y `SegmentedControl`. Sale de `src/utils/radio-group.ts`
 * de vasak-settings, que era la única de las copias del selector de audio que
 * lo tenía resuelto: las otras tres (dos en el escritorio, una más en
 * Configuración) eran una parada de Tab por opción, así que una lista de diez
 * salidas de audio eran diez Tab para pasar de largo.
 *
 * - **Tabulador móvil**: con Tab se entra y se sale del grupo de una vez. Sólo
 *   la opción elegida es tabulable, y si no hay ninguna elegida, la primera
 *   que se pueda elegir.
 * - **Flechas**: mueven la elección —y el foco con ella— y dan la vuelta en los
 *   extremos. Inicio y Fin van a la primera y a la última.
 *
 * Lo que se suma a la copia de Configuración: las opciones apagadas se saltean
 * (en el instalador hay discos que no se pueden elegir), e Inicio/Fin.
 */

/** Lo que el teclado necesita saber de una opción. */
export interface RovingOption<T> {
	value: T;
	disabled?: boolean;
}

/** El valor que recibe el foco del grupo: el elegido, o el primero que se pueda elegir. */
export function focusableValue<T>(options: readonly RovingOption<T>[], selected: T | null | undefined): T | undefined {
	const enabled = options.filter((option) => !option.disabled);
	const chosen = enabled.find((option) => option.value === selected);
	return (chosen ?? enabled[0])?.value;
}

const STEPS: Record<string, 1 | -1> = {
	ArrowDown: 1,
	ArrowRight: 1,
	ArrowUp: -1,
	ArrowLeft: -1,
};

/**
 * El índice al que lleva una tecla desde `from`, o `null` si la tecla no mueve.
 *
 * Saltea las apagadas. Si todas están apagadas no hay a dónde ir.
 */
export function rovingStep<T>(options: readonly RovingOption<T>[], from: number, key: string): number | null {
	const count = options.length;
	if (count === 0 || options.every((option) => option.disabled)) return null;

	if (key === 'Home' || key === 'End') {
		const order = key === 'Home' ? options.map((_, i) => i) : options.map((_, i) => count - 1 - i);
		return order.find((i) => !options[i]?.disabled) ?? null;
	}

	const step = STEPS[key];
	if (!step) return null;
	// Sin nada elegido, la flecha hacia adelante va a la primera y la de atrás
	// a la última.
	let index = from < 0 ? (step === 1 ? -1 : 0) : from;
	for (let tries = 0; tries < count; tries += 1) {
		index = (index + step + count) % count;
		if (!options[index]?.disabled) return index;
	}
	return null;
}
