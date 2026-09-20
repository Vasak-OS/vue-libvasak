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
/** Este mismo archivo, relativo a la raíz. */
const propio = fileURLToPath(import.meta.url).slice(raiz.length);

/**
 * Todo lo que el chequeo de tipos mira, no sólo `src`.
 *
 * Una declaración puesta en `tests/` o en un archivo de configuración suelto
 * aplana los tipos igual, y con un patrón más angosto las pruebas de abajo
 * pasarían sin haberla visto. Lo marcó la revisión en las aplicaciones.
 *
 * Menos este archivo: los patrones que busca los lleva escritos adentro, así
 * que al ampliar el escaneo empezaría a encontrarse a sí mismo.
 */
const fuentes = (
	await Promise.all(
		['src/**/*.{ts,tsx,mts,cts,vue}', 'tests/**/*.{ts,tsx,vue}', '*.{ts,mts,cts}'].map(
			async (patron) => await Array.fromAsync(new Bun.Glob(patron).scan({ cwd: raiz }))
		)
	)
)
	.flat()
	.filter((ruta) => ruta !== propio);

async function conteniendo(patron: RegExp): Promise<string[]> {
	const hallados: string[] = [];
	for (const ruta of fuentes) {
		if (patron.test(await Bun.file(`${raiz}${ruta}`).text())) hallados.push(ruta);
	}
	return hallados.sort();
}

describe('el chequeo de las plantillas', () => {
	test('mira cada atributo, no sólo los que reconoce', async () => {
		// Sin `strictTemplates`, `vue-tsc` comprueba el tipo de las propiedades
		// que sí existen y **no dice nada** de una que no existe, de un evento
		// que el componente no emite ni de un atributo inventado sobre un
		// elemento. Un `@click` sobre un componente sin `defineEmits` funciona
		// por caída de atributos, pero un `:size` sobre un `<img>` no hace nada
		// y nadie se entera.
		const tsconfig = (await Bun.file(`${raiz}tsconfig.json`).json()) as {
			vueCompilerOptions?: { strictTemplates?: boolean };
		};

		expect(tsconfig.vueCompilerOptions?.strictTemplates).toBe(true);
	});

	test('y los `data-*` siguen permitidos, que es la excepción legítima', async () => {
		// HTML los permite todos, y acá marcan nodos que después se buscan con
		// `closest()`. Declararlos uno por uno deja la lista vieja en cuanto
		// alguien marca un nodo nuevo, así que se declara la forma.
		const declaracion = await Bun.file(`${raiz}src/tipos-de-plantilla.d.ts`).text();

		expect(declaracion).toContain('data-${string}');
		expect(declaracion).toContain("declare module 'vue'");
	});
});

describe('lo que la librería publica', () => {
	test('y las pruebas que siguen miran archivos de verdad', () => {
		expect(fuentes).toContain('src/index.ts');
		expect(fuentes.some((ruta) => ruta.startsWith('tests/'))).toBe(true);
		expect(fuentes).toContain('vite.config.ts');
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
