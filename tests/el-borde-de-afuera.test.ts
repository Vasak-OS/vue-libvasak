/**
 * La utilidad `window-border` y sus tokens (2.16.0).
 *
 * El canto de afuera —la ventana entera, el panel, el centro de control, los
 * emergentes del escritorio— sigue el grosor y el color que se eligen en
 * Configuración. El config-manager los escribe en `--window-border-width` y
 * `--ui-window-border`; sin config-manager (pruebas, vista previa, un plugin
 * viejo) tiene que quedar el de siempre: 1 px de `ui-line`.
 *
 * Se lee `src/styles/tokens.css`, el archivo que se publica: una utilidad que
 * no está ahí no emite ninguna regla y la ventana se queda sin borde sin que
 * nada avise.
 */

import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const TOKENS = readFileSync(fileURLToPath(new URL('../src/styles/tokens.css', import.meta.url)), 'utf8');

/** El archivo sin comentarios: lo que se explica no es lo que se declara. */
const CSS = TOKENS.replace(/\/\*[\s\S]*?\*\//g, '');

/** El cuerpo del primer bloque que abre con `cabecera {`. */
function bloque(cabecera: RegExp): string {
	const inicio = CSS.search(cabecera);
	expect(inicio).toBeGreaterThanOrEqual(0);
	const abre = CSS.indexOf('{', inicio);
	let profundidad = 0;
	for (let i = abre; i < CSS.length; i++) {
		if (CSS[i] === '{') profundidad++;
		if (CSS[i] === '}' && --profundidad === 0) return CSS.slice(abre + 1, i);
	}
	throw new Error(`bloque sin cerrar: ${cabecera}`);
}

/** El valor de una propiedad en un bloque, con los espacios aplastados. */
function valor(cuerpo: string, propiedad: string): string | null {
	const encontrado = cuerpo.match(new RegExp(`${propiedad}\\s*:\\s*([^;]+);`));
	return encontrado ? encontrado[1].replace(/\s+/g, ' ').trim() : null;
}

/** Un color escrito a mano: hexadecimal, una función de color con números, o un nombre. */
const COLOR_LITERAL = /#[0-9a-f]{3,8}\b|\b(rgba?|hsla?|oklch|oklab|lab|lch|hwb)\(\s*[\d.]|\b(red|white|black|gray|grey)\b/i;

const LA_LINEA_DE_SIEMPRE = 'color-mix(in srgb, var(--use-text-main) 16%, transparent)';

describe('la utilidad `window-border`', () => {
	test('existe en el archivo que se publica', () => {
		expect(/@utility\s+window-border\s*\{/.test(CSS)).toBe(true);
	});

	test('pinta un borde sólido con el grosor y el color que elige la persona', () => {
		const cuerpo = bloque(/@utility\s+window-border\s*\{/);

		expect(valor(cuerpo, 'border-style')).toBe('solid');
		expect(valor(cuerpo, 'border-width')).toBe('var(--window-border-width, 1px)');
		expect(valor(cuerpo, 'border-color')).toBe('var(--color-ui-window-border)');
	});

	test('no lleva ningún color escrito a mano', () => {
		expect(bloque(/@utility\s+window-border\s*\{/)).not.toMatch(COLOR_LITERAL);
	});
});

describe('el color del borde de afuera', () => {
	test('es un color de tema, así que también hay `border-ui-window-border`', () => {
		expect(valor(bloque(/@theme\s*\{/), '--color-ui-window-border')).toBe('var(--use-ui-window-border)');
	});

	test('en claro y en oscuro sigue a `--ui-window-border` y si no está es la línea de siempre', () => {
		// Sin config-manager la ventana tiene que verse como antes del cambio:
		// el mismo `ui-line` que llevaba con `border border-ui-line`.
		const esperado = `var( --ui-window-border, ${LA_LINEA_DE_SIEMPRE} )`;
		const claro = valor(bloque(/(^|\n):root\s*\{/), '--use-ui-window-border');
		const oscuro = valor(bloque(/(^|\n)\.dark\s*\{/), '--use-ui-window-border');

		expect(claro?.replace(/\(\s+/g, '( ').replace(/\s+\)/g, ' )')).toBe(esperado);
		expect(oscuro?.replace(/\(\s+/g, '( ').replace(/\s+\)/g, ' )')).toBe(esperado);
		expect(valor(bloque(/@theme\s*\{/), '--color-ui-line')).toBe(LA_LINEA_DE_SIEMPRE);
	});

	test('ni el borde ni el signo de los círculos llevan colores escritos a mano', () => {
		const tema = bloque(/@theme\s*\{/);
		for (const [cuerpo, propiedad] of [
			[bloque(/(^|\n):root\s*\{/), '--use-ui-window-border'],
			[bloque(/(^|\n)\.dark\s*\{/), '--use-ui-window-border'],
			[tema, '--color-ui-window-border'],
			[tema, '--color-ui-control-glyph'],
		] as const) {
			const declarado = valor(cuerpo, propiedad);
			expect(declarado).not.toBeNull();
			expect(declarado as string).not.toMatch(COLOR_LITERAL);
		}
	});

	test('el signo de los círculos sale de la tinta de las sombras del esquema', () => {
		// Oscura en los dos modos: sobre el rojo, el amarillo y el verde del
		// esquema se tiene que leer igual en claro que en oscuro.
		expect(valor(bloque(/@theme\s*\{/), '--color-ui-control-glyph') ?? '').toContain('var(--use-shadow-ink)');
	});
});
