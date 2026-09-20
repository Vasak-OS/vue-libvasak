/**
 * Que la librería publique tipos de verdad.
 *
 * Es un paquete cuya razón de ser es que dieciséis aplicaciones lo usen, así
 * que lo que publica en `exports.types` es parte de su interfaz: si ahí no hay
 * propiedades ni ranuras, el chequeo de tipos de las dieciséis pasa cualquier
 * cosa sin avisar. Ya pasó: hasta la 0.2 la entrada apuntaba a una declaración
 * escrita a mano que se quedó quieta mientras los componentes seguían.
 *
 * Acá había además un `declare module '*.vue'` en `src/shims-vue.d.ts`, del que
 * su propio comentario decía que reemplazaba a un `declare module '*'` —que no
 * es un shim, es apagar el chequeo de todos los imports—. `vue-tsc` entiende
 * los `.vue` de forma nativa y no necesita ninguno de los dos: se comprobó
 * borrándolo, y el chequeo sigue en cero y los tipos se generan igual.
 */

import { describe, expect, test } from 'bun:test';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('..', import.meta.url));

const fuentes = await Array.fromAsync(new Bun.Glob('src/**/*.{ts,d.ts,vue}').scan({ cwd: raiz }));

async function conteniendo(patron: RegExp): Promise<string[]> {
	const hallados: string[] = [];
	for (const ruta of fuentes) {
		if (patron.test(await Bun.file(`${raiz}${ruta}`).text())) hallados.push(ruta);
	}
	return hallados.sort();
}

describe('lo que la librería publica', () => {
	test('y las pruebas que siguen miran archivos de verdad', () => {
		expect(fuentes).toContain('src/index.ts');
		expect(fuentes.length).toBeGreaterThan(10);
	});

	test('no hay ningún comodín que aplane los componentes', async () => {
		// Ni el de los `.vue` ni, peor, el de todos los imports.
		expect(await conteniendo(/declare\s+module\s+['"]\*(\.vue)?['"]/)).toEqual([]);
	});

	test('`types` apunta a lo que genera `vue-tsc`, no a un archivo a mano', async () => {
		const manifiesto = (await Bun.file(`${raiz}package.json`).json()) as {
			types: string;
			exports: Record<string, { types?: string }>;
			scripts: Record<string, string>;
		};

		expect(manifiesto.types).toBe('./dist/types/index.d.ts');
		expect(manifiesto.exports['.'].types).toBe('./dist/types/index.d.ts');
		// Y que esa carpeta la escriba el generador, no una mano. El `build` lo
		// hace a través de `tipos`, así que se mira ése y que el `build` lo
		// llame: con sólo mirar `tipos`, sacarlo del `build` pasaría la prueba
		// y dejaría de generarse.
		expect(manifiesto.scripts.tipos).toContain('--declaration');
		expect(manifiesto.scripts.build).toContain('run tipos');
	});
});
