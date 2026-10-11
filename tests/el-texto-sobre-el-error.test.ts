/**
 * El botón de peligro se lee: su texto sale del rojo del esquema.
 *
 * `danger` pinta `bg-status-error` y hasta la 2.17.0 escribía encima con
 * `text-tx-on-primary`. Con el esquema por omisión eso es `#1e1e2e` sobre
 * `#d20f39`: 3,02:1 en claro, por debajo del 4,5:1 de WCAG 1.4.3. Desde la
 * 2.9.0 el config-manager calcula `--text-on-error` / `--text-on-error-dark`
 * con `textOn(rojo, undefined, ui)`, y la librería lo toma en
 * `--use-text-on-error`, con el texto del primario de respaldo para quien
 * todavía tenga un config-manager anterior.
 *
 * La prueba no repite la cadena a mano: lee la clase de `ActionButton.vue`,
 * sigue sus `var()` por el `@theme` y los `:root` / `.dark` de
 * `src/styles/tokens.css` y del piso de una aplicación (`playground/main.css`,
 * el mismo que se le pide a cada una), y termina en lo que el config-manager
 * escribe en `:root` con cada esquema del sistema. Si alguien vuelve a poner
 * otro texto en el botón, o rompe el token, mide otra cosa y se pone roja.
 */

import { describe, expect, test } from 'bun:test';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { contrast, rootProperties, type SchemeDocument, TEXT_MINIMUM } from './scheme';

const FIXTURES = fileURLToPath(new URL('./fixtures/schemes/', import.meta.url));
const TOKENS_CSS = fileURLToPath(new URL('../src/styles/tokens.css', import.meta.url));
const APP_FLOOR_CSS = fileURLToPath(new URL('../playground/main.css', import.meta.url));
const ACTION_BUTTON = fileURLToPath(new URL('../src/controls/ActionButton.vue', import.meta.url));

type Declarations = Map<string, string>;

/** Los bloques de primer nivel de una hoja, sin comentarios: selector → cuerpo. */
function topLevelBlocks(css: string): Array<[string, string]> {
	const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
	const blocks: Array<[string, string]> = [];
	let index = 0;
	while (index < clean.length) {
		const open = clean.indexOf('{', index);
		if (open === -1) break;
		const selector = clean.slice(clean.lastIndexOf('}', open) + 1, open).replace(/^[\s\S]*;/, '').trim();
		let depth = 1;
		let close = open + 1;
		while (close < clean.length && depth > 0) {
			if (clean[close] === '{') depth++;
			if (clean[close] === '}') depth--;
			close++;
		}
		blocks.push([selector, clean.slice(open + 1, close - 1)]);
		index = close;
	}
	return blocks;
}

/** Las propiedades `--x: valor;` de un cuerpo, cortando por `;` fuera de paréntesis. */
function declarationsOf(body: string, into: Declarations) {
	let depth = 0;
	let current = '';
	for (const char of body) {
		if (char === '(') depth++;
		if (char === ')') depth--;
		if (char === ';' && depth === 0) {
			const match = current.trim().match(/^(--[a-z0-9-]+)\s*:\s*([\s\S]+)$/);
			if (match) into.set(match[1] as string, (match[2] as string).replace(/\s+/g, ' ').trim());
			current = '';
		} else {
			current += char;
		}
	}
}

/** Lo que vale en claro y en oscuro: `:root` y `@theme`, y encima `.dark`. */
async function readCascade(): Promise<{ light: Declarations; dark: Declarations }> {
	const light: Declarations = new Map();
	const darkOnly: Declarations = new Map();
	for (const file of [APP_FLOOR_CSS, TOKENS_CSS]) {
		for (const [selector, body] of topLevelBlocks(await Bun.file(file).text())) {
			if (selector === ':root' || selector === '@theme') declarationsOf(body, light);
			if (selector === '.dark') declarationsOf(body, darkOnly);
		}
	}
	return { light, dark: new Map([...light, ...darkOnly]) };
}

/** Separa `var(--x, resto)` en el nombre y el respaldo, respetando paréntesis. */
function splitVar(value: string): { name: string; fallback: string | null } | null {
	const match = value.match(/^var\(\s*(--[a-z0-9-]+)\s*(,([\s\S]*))?\)$/);
	if (!match) return null;
	return { name: match[1] as string, fallback: match[3]?.trim() ?? null };
}

/**
 * Lo que computa el navegador para una propiedad: primero lo que el
 * config-manager puso en el estilo de `:root` (gana sobre cualquier regla),
 * después la hoja, y si nada la define, el respaldo del `var()`.
 */
function resolve(value: string, inline: Record<string, string>, sheet: Declarations, seen: string[] = []): string {
	if (/^#[0-9a-f]{3,8}$/i.test(value)) return value.toLowerCase();
	const parts = splitVar(value);
	if (!parts) throw new Error(`no sé resolver «${value}» (${seen.join(' → ')})`);
	if (seen.includes(parts.name)) throw new Error(`ciclo en ${seen.join(' → ')}`);
	const defined = inline[parts.name] ?? sheet.get(parts.name);
	if (defined !== undefined) return resolve(defined, inline, sheet, [...seen, parts.name]);
	if (parts.fallback !== null) return resolve(parts.fallback, inline, sheet, [...seen, `${parts.name} (respaldo)`]);
	throw new Error(`${parts.name} no está definida (${seen.join(' → ')})`);
}

/** Las clases en reposo del tono `danger`, leídas del componente. */
async function dangerClasses(): Promise<string[]> {
	const source = await Bun.file(ACTION_BUTTON).text();
	const line = source.match(/^\s*danger:\s*'([^']+)'/m)?.[1] ?? '';
	return line.split(/\s+/).filter((c) => c && !c.includes(':'));
}

const schemes: SchemeDocument[] = await Promise.all(
	readdirSync(FIXTURES)
		.filter((file) => file.endsWith('.json'))
		.sort()
		.map((file) => Bun.file(FIXTURES + file).json() as Promise<SchemeDocument>)
);
const cascade = await readCascade();
const classes = await dangerClasses();
const textClass = classes.find((c) => c.startsWith('text-')) ?? '';
const backgroundClass = classes.find((c) => c.startsWith('bg-')) ?? '';
/** `text-tx-on-x` → `var(--color-tx-on-x)`, que es lo que emite Tailwind. */
const asColor = (utility: string, prefix: string) => `var(--color-${utility.slice(prefix.length)})`;

describe('el token del texto sobre el error', () => {
	test('tokens.css lo toma del config-manager en claro, con el texto del primario de respaldo', async () => {
		const css = (await Bun.file(TOKENS_CSS).text()).replace(/\s+/g, ' ');

		expect(cascade.light.get('--use-text-on-error')).toBe('var(--text-on-error, var(--use-text-on-primary))');
		expect(css).toContain('--use-text-on-error: var(--text-on-error, var(--use-text-on-primary));');
	});

	test('y en oscuro lee la variante -dark, con el mismo respaldo', () => {
		expect(cascade.dark.get('--use-text-on-error')).toBe('var(--text-on-error-dark, var(--use-text-on-primary))');
	});

	test('el @theme lo publica como la utilidad tx-on-status-error', async () => {
		const theme = topLevelBlocks(await Bun.file(TOKENS_CSS).text()).find(([selector]) => selector === '@theme');
		const declared: Declarations = new Map();
		declarationsOf(theme?.[1] ?? '', declared);

		expect(declared.get('--color-tx-on-status-error')).toBe('var(--use-text-on-error)');
	});

	test('sin un config-manager que lo escriba, cae en el texto del primario', () => {
		// Un config-manager anterior a la 2.9.0 no escribe `--text-on-error`: el
		// botón tiene que quedar como estaba, no sin color.
		const scheme = schemes.find((each) => each.id === 'vasak-default') as SchemeDocument;
		const inline = rootProperties(scheme);
		delete inline['--text-on-error'];
		delete inline['--text-on-error-dark'];

		expect(resolve('var(--color-tx-on-status-error)', inline, cascade.light)).toBe(inline['--text-on-primary'] as string);
		expect(resolve('var(--color-tx-on-status-error)', inline, cascade.dark)).toBe(
			inline['--text-on-primary-dark'] as string
		);
	});
});

describe('el botón de peligro llega a 4,5:1', () => {
	test('lee el fondo y el texto del componente', () => {
		// Sin esto, un cambio de forma en `variantClasses` deja la prueba
		// midiendo `undefined`.
		expect(backgroundClass).toBe('bg-status-error');
		expect(textClass).toMatch(/^text-/);
	});

	for (const scheme of schemes) {
		for (const mode of ['light', 'dark'] as const) {
			const label = `${scheme.id}, ${mode === 'light' ? 'claro' : 'oscuro'}`;

			test(`${label}: el texto de danger se lee sobre su rojo`, () => {
				const inline = rootProperties(scheme);
				const sheet = cascade[mode];
				const background = resolve(asColor(backgroundClass, 'bg-'), inline, sheet);
				const text = resolve(asColor(textClass, 'text-'), inline, sheet);

				const ratio = contrast(text, background);
				const short = ratio < TEXT_MINIMUM ? [`${textClass} ${text} sobre ${background}: ${ratio.toFixed(2)}`] : [];

				expect(short).toEqual([]);
			});
		}
	}

	test('el respaldo no alcanza con el esquema por omisión en claro: por eso hace falta el token', () => {
		// `#1e1e2e` sobre `#d20f39`, lo que el botón mostraba antes.
		const scheme = schemes.find((each) => each.id === 'vasak-default') as SchemeDocument;
		const inline = rootProperties(scheme);

		expect(inline['--status-error']).toBe('#d20f39');
		expect(contrast(inline['--text-on-primary'] as string, '#d20f39')).toBeCloseTo(3.02, 2);
	});
});
