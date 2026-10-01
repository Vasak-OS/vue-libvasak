/**
 * Las iniciales de un nombre: la primera letra de las dos primeras palabras.
 *
 * Por letra y no por código: «Ángela» empieza con «Á», no con medio carácter,
 * y un nombre con un emoji adelante no deja un cuadradito roto. Sin nombre, la
 * cadena vacía: quien dibuja pone el icono genérico.
 */
export function initialsOf(name: string | undefined | null): string {
	if (!name) return '';
	const words = name.trim().split(/\s+/).filter(Boolean);
	return words
		.slice(0, 2)
		.map((word) => Array.from(word)[0] ?? '')
		.join('')
		.toLocaleUpperCase();
}
