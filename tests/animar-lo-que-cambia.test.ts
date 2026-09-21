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
 *
 * Lo que sí se permite son las clases de entrada y salida de un `<Transition>`:
 * ahí el elemento vive lo que dura la transición y sus propiedades cambian
 * todas a la vez, así que el argumento de arriba no aplica igual. Si alguna vez
 * se tocan, es con otro razonamiento y no por esta prueba.
 */
const PERMITIDO_EN_ENTRADA_Y_SALIDA = /(enter|leave)-active-class="[^"]*transition-all/;

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

describe('los componentes animan lo que cambia y no todo', () => {
	test('ninguno usa transition-all fuera de una entrada o salida', () => {
		const culpables: string[] = [];

		for (const ruta of componentes('src')) {
			const lineas = readFileSync(ruta, 'utf8').split('\n');
			lineas.forEach((linea, i) => {
				// El comentario de `SideButton` explica por qué no se usa, así que
				// nombra la clase sin usarla. Se mira sólo lo que es marcado.
				if (!linea.includes('transition-all')) return;
				if (PERMITIDO_EN_ENTRADA_Y_SALIDA.test(linea)) return;
				if (!linea.includes('class=')) return;
				culpables.push(`${ruta}:${i + 1}`);
			});
		}

		expect(culpables).toEqual([]);
	});

	test('las listas nombran `scale` y no `transform`', () => {
		// En Tailwind 4 las utilidades `scale-*`, `translate-*` y `rotate-*`
		// escriben las propiedades **nativas** `scale`, `translate` y `rotate`.
		// Comprobado contra el CSS que sale de Tailwind 4.3.3: `.scale-105`
		// emite `scale: …`, no `transform: …`.
		//
		// Así que nombrar `transform` en la lista deja el movimiento sin animar,
		// y eso no da error: simplemente no transiciona. Es el error que esta
		// prueba existe para atajar, porque es invisible mirando el código.
		const culpables: string[] = [];

		for (const ruta of componentes('src')) {
			const lineas = readFileSync(ruta, 'utf8').split('\n');
			lineas.forEach((linea, i) => {
				const lista = linea.match(/transition-\[([^\]]+)\]/);
				if (!lista) return;
				if (!lista[1].split(',').includes('transform')) return;
				culpables.push(`${ruta}:${i + 1}`);
			});
		}

		expect(culpables).toEqual([]);
	});
});
