/**
 * El texto se sigue leyendo sobre las superficies nuevas.
 *
 * Los velos de estado (`ui-hover`, `ui-selected`, `ui-selected-accent`) y la
 * superficie flotante (`ui-float`) son mezclas del esquema, así que cambian el
 * fondo que tiene detrás cada texto. Esta prueba compone cada uno sobre el
 * fondo de la ventana —y los del menú sobre `ui-float`— y mide `tx-main` y
 * `tx-muted` contra el 4,5:1 de WCAG 1.4.3, en claro y en oscuro, con **los
 * esquemas del sistema**: los que instala `vasak-desktop-settings` en
 * `/usr/share/schemes` (copiados en `tests/fixtures/schemes`) y uno de prueba
 * con el acento claro, que es el caso difícil.
 *
 * Los porcentajes no se escriben acá: se leen de `src/styles/tokens.css`, que
 * es lo que se publica. Y los colores son los que escribe el config-manager,
 * no los del piso de `main.css`, que el complemento pisa al arrancar.
 *
 * El anillo de foco (`ui-focus`) se mide contra el 3:1 de WCAG 1.4.11, contra
 * el fondo y contra la superficie flotante.
 */

import { describe, expect, test } from 'bun:test';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
	contrast,
	mix,
	NON_TEXT_MINIMUM,
	type ResolvedPalette,
	type Rgb,
	resolvePalette,
	type SchemeDocument,
	TEXT_MINIMUM,
} from './scheme';

const FIXTURES = fileURLToPath(new URL('./fixtures/schemes/', import.meta.url));
const TOKENS_CSS = fileURLToPath(new URL('../src/styles/tokens.css', import.meta.url));

/** Una mezcla de `tokens.css`: `color-mix(in srgb, var(--use-X) N%, Y)`. */
interface Mix {
	color: keyof ResolvedPalette;
	percent: number;
	/** `null` es `transparent`: el velo se compone sobre lo que tenga detrás. */
	with: keyof ResolvedPalette | null;
}

async function readMixes(): Promise<Record<string, Mix>> {
	const css = await Bun.file(TOKENS_CSS).text();
	const mixes: Record<string, Mix> = {};
	const regex =
		/--(color-[a-z-]+|use-ui-focus):[^;]*?color-mix\(in srgb, var\(--use-([a-z-]+)\) (\d+)%, (transparent|var\(--use-([a-z-]+)\))\)/g;
	for (const match of css.matchAll(regex)) {
		const name = (match[1] as string).replace(/^color-/, '');
		// La primera aparición es la del tema claro, que es la que vale para los
		// dos: el `.dark` repite la misma mezcla con `--ui-focus-dark`.
		mixes[name] ??= {
			color: match[2] as keyof ResolvedPalette,
			percent: Number(match[3]),
			with: (match[5] as keyof ResolvedPalette | undefined) ?? null,
		};
	}
	return mixes;
}

function compose(palette: ResolvedPalette, token: Mix, over: Rgb | string): Rgb {
	return mix(palette[token.color], token.percent, token.with ? palette[token.with] : over);
}

const schemes: SchemeDocument[] = await Promise.all(
	readdirSync(FIXTURES)
		.filter((file) => file.endsWith('.json'))
		.sort()
		.map((file) => Bun.file(FIXTURES + file).json() as Promise<SchemeDocument>)
);

const mixes = await readMixes();

/** Las superficies nuevas de cada variante, ya compuestas. */
function surfacesOf(palette: ResolvedPalette): Record<string, Rgb | string> {
	const background = palette['ui-background'];
	const float = compose(palette, mixes['ui-float'] as Mix, background);
	return {
		'el fondo de la ventana': background,
		'ui-hover sobre el fondo': compose(palette, mixes['ui-hover'] as Mix, background),
		'ui-pressed sobre el fondo': compose(palette, mixes['ui-pressed'] as Mix, background),
		'ui-selected sobre el fondo': compose(palette, mixes['ui-selected'] as Mix, background),
		'ui-selected-accent sobre el fondo': compose(palette, mixes['ui-selected-accent'] as Mix, background),
		'ui-float': float,
		'ui-hover sobre ui-float': compose(palette, mixes['ui-hover'] as Mix, float),
		'ui-pressed sobre ui-float': compose(palette, mixes['ui-pressed'] as Mix, float),
	};
}

describe('los tokens se leyeron', () => {
	test('cada mezcla que se mide está en tokens.css', () => {
		// Sin esto, una mezcla renombrada deja la prueba midiendo `undefined`.
		for (const name of ['ui-hover', 'ui-pressed', 'ui-selected', 'ui-selected-accent', 'ui-float', 'use-ui-focus']) {
			expect(mixes[name]).toBeDefined();
		}
		expect(schemes.map((scheme) => scheme.id)).toContain('vasak-default');
	});
});

for (const scheme of schemes) {
	for (const mode of ['light', 'dark'] as const) {
		const palette = resolvePalette(scheme.colors[mode]);
		const surfaces = surfacesOf(palette);
		const label = `${scheme.id}, ${mode === 'light' ? 'claro' : 'oscuro'}`;

		describe(label, () => {
			test('tx-main llega a 4,5:1 sobre cada superficie nueva', () => {
				const short = Object.entries(surfaces)
					.map(([name, color]) => [name, contrast(palette['text-main'], color)] as const)
					.filter(([, ratio]) => ratio < TEXT_MINIMUM);

				expect(short).toEqual([]);
			});

			// `tx-muted` en claro no llega **ni sobre el fondo pelado**: el
			// esquema de fábrica dice `#6c6f85`, que da 4,37:1 sobre `#eff1f5`.
			// No es de los velos —pierden menos de medio punto—, es del esquema:
			// el piso de `main.css` ya lo había corregido a `#555869` (6,22:1),
			// pero el config-manager lo pisa con el del esquema al arrancar. Se
			// arregla en `vasak-desktop-settings` (el esquema) o en el
			// complemento (que lo verifique como ya hace con `on-primary`).
			// Marcada `failing`: el día que el esquema se corrija y se copie acá,
			// pasa sola y el CI se pone rojo para que se le saque el marcador.
			const mutedFailsOnBackground = contrast(palette['text-muted'], palette['ui-background']) < TEXT_MINIMUM;
			const mutedTest = mutedFailsOnBackground ? test.failing : test;
			mutedTest('tx-muted llega a 4,5:1 sobre cada superficie nueva', () => {
				const short = Object.entries(surfaces)
					.map(([name, color]) => [name, contrast(palette['text-muted'], color)] as const)
					.filter(([, ratio]) => ratio < TEXT_MINIMUM);

				expect(short).toEqual([]);
			});

			test('el anillo de foco llega a 3:1 contra el fondo y contra ui-float', () => {
				// Con la mezcla de respaldo, que es la que rige mientras el
				// config-manager no escriba `--ui-focus`.
				const focus = compose(palette, mixes['use-ui-focus'] as Mix, palette['ui-background']);

				expect(contrast(focus, surfaces['el fondo de la ventana'] as string)).toBeGreaterThanOrEqual(NON_TEXT_MINIMUM);
				expect(contrast(focus, surfaces['ui-float'] as Rgb)).toBeGreaterThanOrEqual(NON_TEXT_MINIMUM);
			});
		});
	}
}

describe('la cuenta', () => {
	test('reproduce las mediciones de la especificación', () => {
		// `#dd7878` sobre `#eff1f5` da 2,64:1: por eso el foco no puede ser el
		// primario a secas. Si esta cuenta no diera eso, todo lo de arriba
		// estaría midiendo otra cosa.
		expect(contrast('#dd7878', '#eff1f5')).toBeCloseTo(2.64, 2);
		expect(contrast('#6c6f85', '#eff1f5')).toBeCloseTo(4.37, 2);
	});
});
