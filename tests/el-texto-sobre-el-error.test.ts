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
import { contrast, parseHex, type Rgb, rootProperties, type SchemeDocument, TEXT_MINIMUM, toHex } from './scheme';

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

/*
 * Al pasar y al apretar.
 *
 * El texto se calcula contra el rojo lleno. Hasta la 2.18.0 el `danger`
 * pasaba a `bg-status-error/90` y `/80`: un rojo traslúcido que se mezcla con
 * lo que haya detrás del botón, y en claro se aclara hasta que el texto claro
 * deja de leerse (4,42:1 y 3,93:1 con el esquema por omisión). Ahora el rojo
 * queda opaco y encima va el velo de `overlay`, `from-ui-hover` /
 * `from-ui-pressed`, que es el texto principal al 7 % y al 12 %.
 *
 * Como el reposo, la prueba no escribe los estados a mano: lee las clases
 * `hover:` y `active:` del componente, sigue sus colores por la cascada
 * —incluidos los `color-mix(…, transparent)` y el `/NN` de Tailwind— y pinta
 * las capas como el navegador: lo de atrás del botón, el color de fondo, y
 * encima la imagen de fondo. Lo de atrás es el fondo de la ventana o una
 * superficie, que son las dos cosas sobre las que se dibuja un botón.
 */

type Rgba = [number, number, number, number];

const isTransparent = (value: string) => value.trim() === 'transparent';

/** Corta los argumentos de una función CSS por las comas de primer nivel. */
function splitArguments(inner: string): string[] {
	const parts: string[] = [];
	let depth = 0;
	let current = '';
	for (const char of inner) {
		if (char === '(') depth++;
		if (char === ')') depth--;
		if (char === ',' && depth === 0) {
			parts.push(current.trim());
			current = '';
		} else {
			current += char;
		}
	}
	parts.push(current.trim());
	return parts;
}

/**
 * Como `resolve`, pero hasta un color con alfa: entiende además `transparent`
 * y `color-mix(in <espacio>, a p%, b)`. La mezcla es premultiplicada, como la
 * pide CSS Color 5; con `transparent` de un lado el espacio no importa, y con
 * dos colores opacos sólo se acepta sRGB, que es lo único que sabe mezclar.
 */
function resolveRgba(value: string, inline: Record<string, string>, sheet: Declarations, seen: string[] = []): Rgba {
	const trimmed = value.trim();
	if (isTransparent(trimmed)) return [0, 0, 0, 0];
	if (/^#[0-9a-f]{6}$/i.test(trimmed) || /^#[0-9a-f]{3}$/i.test(trimmed)) return [...parseHex(trimmed), 1];
	const mixMatch = trimmed.match(/^color-mix\(([\s\S]*)\)$/);
	if (mixMatch) {
		const [space, first, second] = splitArguments(mixMatch[1] as string);
		const left = (first ?? '').match(/^([\s\S]+?)\s+([0-9.]+)%$/);
		if (!space || !left || second === undefined) throw new Error(`no sé mezclar «${trimmed}»`);
		const p = Number(left[2]) / 100;
		const a = resolveRgba(left[1] as string, inline, sheet, seen);
		const b = resolveRgba(second, inline, sheet, seen);
		if (space !== 'in srgb' && a[3] > 0 && b[3] > 0) throw new Error(`mezcla de dos colores ${space}: «${trimmed}»`);
		const alpha = a[3] * p + b[3] * (1 - p);
		if (alpha === 0) return [0, 0, 0, 0];
		const channel = (i: number) => ((a[i] as number) * a[3] * p + (b[i] as number) * b[3] * (1 - p)) / alpha;
		return [channel(0), channel(1), channel(2), alpha];
	}
	const parts = splitVar(trimmed);
	if (!parts) throw new Error(`no sé resolver «${trimmed}» (${seen.join(' → ')})`);
	if (seen.includes(parts.name)) throw new Error(`ciclo en ${seen.join(' → ')}`);
	const defined = inline[parts.name] ?? sheet.get(parts.name);
	if (defined !== undefined) return resolveRgba(defined, inline, sheet, [...seen, parts.name]);
	if (parts.fallback !== null) return resolveRgba(parts.fallback, inline, sheet, [...seen, `${parts.name} (respaldo)`]);
	throw new Error(`${parts.name} no está definida (${seen.join(' → ')})`);
}

/** Pinta `top` sobre `bottom`, que es opaco. */
function over(top: Rgba, bottom: Rgb): Rgb {
	return [0, 1, 2].map((i) => (top[i] as number) * top[3] + (bottom[i] as number) * (1 - top[3])) as Rgb;
}

/**
 * La utilidad de color de Tailwind a lo que emite: `bg-x` es
 * `var(--color-x)`, y `bg-x/90` es `color-mix(in oklab, var(--color-x) 90%,
 * transparent)`.
 */
function utilityColor(utility: string, prefix: string): string {
	const [name, opacity] = utility.slice(prefix.length).split('/');
	const color = `var(--color-${name})`;
	return opacity === undefined ? color : `color-mix(in oklab, ${color} ${opacity}%, transparent)`;
}

type State = 'hover' | 'active';

/**
 * Las clases que valen en un estado. Al apretar el puntero también está
 * encima, así que `active` suma lo de `hover` y lo pisa (Tailwind ordena
 * `active:` después de `hover:`).
 */
async function dangerClassesIn(state: State): Promise<string[]> {
	const source = await Bun.file(ACTION_BUTTON).text();
	const all = (source.match(/^\s*danger:\s*'([^']+)'/m)?.[1] ?? '').split(/\s+/).filter(Boolean);
	const variants = state === 'hover' ? ['hover:'] : ['hover:', 'active:'];
	const applied = all.filter((c) => !c.includes(':'));
	for (const variant of variants) {
		applied.push(...all.filter((c) => c.startsWith(variant)).map((c) => c.slice(variant.length)));
	}
	return applied;
}

/** La última clase que cae en un grupo: la que gana en la cascada. */
function last(classes: string[], belongs: (c: string) => boolean): string | undefined {
	return classes.filter(belongs).at(-1);
}

const isGradient = (c: string) => /^bg-(linear|radial|conic)-/.test(c);
const isBackgroundColor = (c: string) => c.startsWith('bg-') && !isGradient(c);

/** Lo que se ve detrás del texto en un estado, puesto sobre `backdrop`. */
function paintedBackground(classes: string[], backdrop: Rgb, inline: Record<string, string>, sheet: Declarations) {
	const colorClass = last(classes, isBackgroundColor);
	if (!colorClass) throw new Error('el botón no tiene color de fondo');
	let painted = over(resolveRgba(utilityColor(colorClass, 'bg-'), inline, sheet), backdrop);
	const layers = [colorClass];

	const gradient = last(classes, isGradient);
	if (gradient) {
		const from = last(classes, (c) => c.startsWith('from-'));
		const to = last(classes, (c) => c.startsWith('to-'));
		const via = last(classes, (c) => c.startsWith('via-'));
		if (!from || !to || via || from.slice(5) !== to.slice(3)) {
			throw new Error(`la prueba sólo sabe pintar un degradado parejo: ${gradient} ${from} ${via ?? ''} ${to}`);
		}
		painted = over(resolveRgba(utilityColor(from, 'from-'), inline, sheet), painted);
		layers.push(`${gradient} ${from} ${to}`);
	}
	return { painted, layers };
}

const STATES: Array<[State, string]> = [
	['hover', 'al pasar'],
	['active', 'al apretar'],
];
const BACKDROPS: Array<[string, string]> = [
	['var(--color-ui-bg)', 'el fondo de la ventana'],
	['var(--color-ui-surface)', 'una superficie'],
];
const statesClasses: Record<State, string[]> = {
	hover: await dangerClassesIn('hover'),
	active: await dangerClassesIn('active'),
};

describe('al pasar y al apretar, el botón de peligro sigue en 4,5:1', () => {
	test('lee los estados del componente', () => {
		// Si el componente deja de declarar estados, o cambia de forma la línea,
		// las pruebas de abajo medirían el reposo y pasarían sin mirar nada.
		for (const state of ['hover', 'active'] as const) {
			expect(statesClasses[state].length).toBeGreaterThan(classes.length);
			expect(last(statesClasses[state], isBackgroundColor)).toBeDefined();
			expect(last(statesClasses[state], (c) => c.startsWith('text-'))).toBeDefined();
		}
	});

	for (const scheme of schemes) {
		for (const mode of ['light', 'dark'] as const) {
			for (const [state, stateLabel] of STATES) {
				for (const [backdropColor, backdropLabel] of BACKDROPS) {
					const label = `${scheme.id}, ${mode === 'light' ? 'claro' : 'oscuro'}`;

					test(`${label}: ${stateLabel}, sobre ${backdropLabel}, el texto de danger se lee`, () => {
						const inline = rootProperties(scheme);
						const sheet = cascade[mode];
						const stateClasses = statesClasses[state];
						const backdrop = over(resolveRgba(backdropColor, inline, sheet), [1, 1, 1]);
						const { painted, layers } = paintedBackground(stateClasses, backdrop, inline, sheet);
						const textUtility = last(stateClasses, (c) => c.startsWith('text-')) ?? '';
						const text = resolveRgba(utilityColor(textUtility, 'text-'), inline, sheet);
						expect(text[3]).toBe(1);

						const ratio = contrast([text[0], text[1], text[2]], painted);
						const short =
							ratio < TEXT_MINIMUM
								? [`${textUtility} sobre ${layers.join(' + ')} (${toHex(painted)}): ${ratio.toFixed(2)}`]
								: [];

						expect(short).toEqual([]);
					});
				}
			}
		}
	}
});
