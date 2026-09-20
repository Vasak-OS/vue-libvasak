/**
 * Identificadores únicos para las listas de búsqueda.
 *
 * Tienen que ser únicos en el documento: dos listas con el mismo `id` rompen el
 * `aria-activedescendant` y el `aria-controls` de las dos, y el fallo es
 * invisible —un lector de pantalla anuncia la opción de la lista de al lado—.
 *
 * Con un contador y no con azar, igual que los títulos de los diálogos: sortear
 * no da ninguna garantía, sólo la hace improbable.
 */
let contador = 0;

export function siguienteIdDeLista(): string {
	contador += 1;
	return `vsk-lista-${contador}`;
}
