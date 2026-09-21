import { describe, expect, test } from 'bun:test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * `transition-all` obliga al navegador a mirar **cada** propiedad animable del
 * elemento en cada cambio, incluidas las que nadie toca. Es la forma más fácil
 * de pagar layout sin querer: alcanza con que alguien agregue un `height` o un
 * `padding` a la clase para que empiece a interpolarse, y en una lista eso es
 * layout de la lista entera.
 *
 * No falla nunca, que es por qué hace falta esta prueba. Se ve como una
 * aplicación que va un poco pesada, meses después y en otro repositorio.
 */

/**
 * Las líneas de un componente donde `transition-all` no está permitido.
 *
 * Se permite dentro de un `<Transition>` o `<TransitionGroup>`: ahí el elemento
 * vive lo que dura la transición y sus propiedades cambian todas a la vez, así
 * que el argumento de arriba no aplica igual. Si alguna vez se tocan, es con
 * otro razonamiento y no por esta prueba.
 *
 * **La excepción mira el elemento que envuelve, no el atributo.** Un
 * `enter-active-class` suelto en un `div` cualquiera no hace nada —Vue lo pasa
 * como atributo del DOM y ahí muere—, pero alcanzaría para saltear este guardia
 * si la excepción se decidiera por el nombre del atributo. Un guardia que se
 * puede apagar escribiendo algo que no hace nada no es un guardia.
 */
export function marcasQueNoCorresponden(contenido: string): number[] {
	const encontradas: number[] = [];
	let profundidad = 0;

	contenido.split('\n').forEach((linea, i) => {
		const abre = (linea.match(/<Transition(Group)?(?=[\s>/]|$)/g) ?? []).length;
		const cierra = (linea.match(/<\/Transition(Group)?>/g) ?? []).length;

		// La apertura cuenta desde su propia línea: los atributos de entrada y
		// salida viven ahí adentro.
		profundidad += abre;

		const esMarcado = linea.includes('class=') && linea.includes('transition-all');
		if (esMarcado && profundidad === 0) {
			encontradas.push(i + 1);
		}

		profundidad = Math.max(0, profundidad - cierra);
	});

	return encontradas;
}

/** Las listas que nombran `transform`, que en Tailwind 4 no anima nada. */
export function listasConTransform(contenido: string): number[] {
	const encontradas: number[] = [];

	contenido.split('\n').forEach((linea, i) => {
		const lista = linea.match(/transition-\[([^\]]+)\]/);
		if (lista?.[1].split(',').includes('transform')) {
			encontradas.push(i + 1);
		}
	});

	return encontradas;
}

function componentes(directorio: string): string[] {
	const encontrados: string[] = [];
	for (const entrada of readdirSync(directorio)) {
		const ruta = join(directorio, entrada);
		if (statSync(ruta).isDirectory()) {
			encontrados.push(...componentes(ruta));
		} else if (entrada.endsWith('.vue')) {
			encontrados.push(ruta);
		}
	}
	return encontrados;
}

function recorrer(buscar: (contenido: string) => number[]): string[] {
	return componentes('src').flatMap((ruta) =>
		buscar(readFileSync(ruta, 'utf8')).map((linea) => `${ruta}:${linea}`),
	);
}

describe('dónde se permite transition-all', () => {
	test('adentro de un Transition sí', () => {
		const dentro = `<Transition
      enter-active-class="transition-all duration-150">
      <div v-if="abierto">hola</div>
    </Transition>`;

		expect(marcasQueNoCorresponden(dentro)).toEqual([]);
	});

	test('en un elemento común no', () => {
		const suelto = '<div class="p-2 transition-all duration-200">hola</div>';

		expect(marcasQueNoCorresponden(suelto)).toEqual([1]);
	});

	test('un enter-active-class fuera de un Transition no alcanza para saltearlo', () => {
		// El agujero que tenía la primera versión: decidía por el nombre del
		// atributo y no por el elemento que envuelve. `enter-active-class` en un
		// `div` no hace nada —Vue lo pasa como atributo del DOM— así que sería
		// una forma de apagar el guardia escribiendo algo inerte.
		const disfrazado = '<div enter-active-class="transition-all duration-200">hola</div>';

		expect(marcasQueNoCorresponden(disfrazado)).toEqual([1]);
	});

	test('después de cerrar el Transition vuelve a no permitirse', () => {
		const despues = `<Transition enter-active-class="transition-all"></Transition>
<div class="transition-all"></div>`;

		expect(marcasQueNoCorresponden(despues)).toEqual([2]);
	});

	test('el comentario que nombra la clase sin usarla no cuenta', () => {
		// `SideButton` explica en su comentario por qué no la usa. Se mira sólo
		// lo que es marcado.
		const comentario = ' * `transition-all` obliga al navegador a mirar cada propiedad.';

		expect(marcasQueNoCorresponden(comentario)).toEqual([]);
	});
});

describe('los componentes animan lo que cambia y no todo', () => {
	test('ninguno usa transition-all fuera de una transición', () => {
		expect(recorrer(marcasQueNoCorresponden)).toEqual([]);
	});

	test('las listas nombran `scale` y no `transform`', () => {
		// En Tailwind 4 las utilidades `scale-*`, `translate-*` y `rotate-*`
		// escriben las propiedades **nativas** `scale`, `translate` y `rotate`.
		// Comprobado contra el CSS que emite Tailwind 4.3.3: `.scale-105` emite
		// `scale: …`, no `transform: …`.
		//
		// Nombrar `transform` deja el movimiento sin animar, y eso no da error:
		// simplemente no transiciona. Es invisible mirando el código.
		expect(recorrer(listasConTransform)).toEqual([]);
	});
});
