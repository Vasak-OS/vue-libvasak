/**
 * Lo que el config-manager escribe en `:root` a partir de un esquema.
 *
 * Lo usan la prueba de contraste y el banco de estados, para medir y dibujar
 * con **los colores que ve la persona** y no con los del piso de `main.css`,
 * que el complemento pisa al arrancar. El piso claro dice `--text-muted:
 * #555869`; el esquema de fábrica dice `#6c6f85`, y es ése el que queda.
 *
 * `contrast`, `bestOn`, `textOn` y `strongBorderOn` son copia de
 * `luminancia`/`contraste`/`mejorSobre`/`textoSobre`/`bordeFuerteSobre` de
 * `tauri-plugin-config-manager` (`guest-js/index.ts`). No se importan porque el
 * módulo del complemento arrastra pinia al cargarse, y la librería no la usa.
 * Si el complemento cambia su criterio, esto tiene que cambiar con él.
 */

export const TEXT_MINIMUM = 4.5;
export const NON_TEXT_MINIMUM = 3;

export interface SchemeUi {
	color: { primary: string; secondary: string };
	text: { main: string; muted: string; 'on-primary': string; 'on-secondary'?: string };
	background: string;
	border: string;
	surface: string;
}

export interface SchemeVariant {
	ui: SchemeUi;
	terminal: { ansi: Record<string, string> };
}

export interface SchemeDocument {
	id: string;
	name: string;
	colors: { light: SchemeVariant; dark: SchemeVariant };
}

export type Rgb = [number, number, number];

export function parseHex(hex: string): Rgb {
	const clean = hex.trim().replace(/^#/, '');
	const full = clean.length === 3 ? [...clean].map((c) => c + c).join('') : clean;
	return [0, 2, 4].map((i) => Number.parseInt(full.slice(i, i + 2), 16) / 255) as Rgb;
}

export function toHex(rgb: Rgb): string {
	return `#${rgb
		.map((c) =>
			Math.round(Math.min(Math.max(c, 0), 1) * 255)
				.toString(16)
				.padStart(2, '0')
		)
		.join('')}`;
}

export function luminance(rgb: Rgb): number {
	const channel = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
	return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
}

export function contrast(a: Rgb | string, b: Rgb | string): number {
	const la = luminance(typeof a === 'string' ? parseHex(a) : a);
	const lb = luminance(typeof b === 'string' ? parseHex(b) : b);
	return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * `color-mix(in srgb, a p%, b)`, y también `color-mix(in srgb, a p%,
 * transparent)` pintado sobre `b`: en sRGB las dos cuentas son la misma.
 */
export function mix(a: Rgb | string, percent: number, b: Rgb | string): Rgb {
	const x = typeof a === 'string' ? parseHex(a) : a;
	const y = typeof b === 'string' ? parseHex(b) : b;
	const p = percent / 100;
	return [0, 1, 2].map((i) => x[i] * p + y[i] * (1 - p)) as Rgb;
}

function bestOn(background: string, candidates: Array<string | undefined>, minimum: number) {
	let chosen: string | null = null;
	let best = 0;
	for (const candidate of candidates) {
		if (!candidate) continue;
		const ratio = contrast(candidate, background);
		if (ratio >= minimum && ratio > best) {
			best = ratio;
			chosen = candidate;
		}
	}
	return chosen;
}

function textOn(background: string, preferred: string | undefined, ui: SchemeUi): string {
	if (preferred && contrast(preferred, background) >= TEXT_MINIMUM) return preferred;
	return (
		bestOn(background, [ui.background, ui.text.main, ui.surface], TEXT_MINIMUM) ??
		bestOn(background, ['#000000', '#ffffff'], TEXT_MINIMUM) ??
		'#000000'
	);
}

function strongBorderOn(ui: SchemeUi): string | null {
	return bestOn(ui.background, [ui.text.muted, ui.surface, ui.text.main], NON_TEXT_MINIMUM);
}

/** Los colores resueltos de una variante, con los nombres de las `--use-*`. */
export interface ResolvedPalette {
	primary: string;
	secondary: string;
	'ui-background': string;
	'ui-surface': string;
	'ui-border': string;
	'ui-border-strong': string;
	'text-main': string;
	'text-muted': string;
	'text-on-primary': string;
	'text-on-secondary': string;
	'status-error': string;
	'status-success': string;
	'status-warning': string;
}

export function resolvePalette(variant: SchemeVariant): ResolvedPalette {
	const ui = variant.ui;
	return {
		primary: ui.color.primary,
		secondary: ui.color.secondary,
		'ui-background': ui.background,
		'ui-surface': ui.surface,
		'ui-border': ui.border,
		// Sin borde fuerte que llegue, el complemento no escribe nada y queda el
		// del piso; acá se cae al texto principal, que es el candidato más fuerte.
		'ui-border-strong': strongBorderOn(ui) ?? ui.text.main,
		'text-main': ui.text.main,
		'text-muted': ui.text.muted,
		'text-on-primary': textOn(ui.color.primary, ui.text['on-primary'], ui),
		'text-on-secondary': textOn(ui.color.secondary, undefined, ui),
		'status-error': variant.terminal.ansi.red,
		'status-success': variant.terminal.ansi.green,
		'status-warning': variant.terminal.ansi.yellow,
	};
}

/**
 * Las propiedades que el complemento pone en `:root`: las claras sin sufijo y
 * las oscuras con `-dark`. Las `--use-*` las arma el piso de cada aplicación.
 */
export function rootProperties(scheme: SchemeDocument): Record<string, string> {
	const properties: Record<string, string> = {};
	for (const [variant, suffix] of [
		[scheme.colors.light, ''],
		[scheme.colors.dark, '-dark'],
	] as const) {
		for (const [name, value] of Object.entries(resolvePalette(variant))) {
			properties[`--${name}${suffix}`] = value;
		}
	}
	return properties;
}

/**
 * `oklch(from <color> min(l, max) c h)` y `max(l, min)`: la misma cuenta que
 * hace el navegador con el color relativo de `--use-ui-data` (2.8.0).
 *
 * De sRGB a OKLab y de vuelta con las matrices de Björn Ottosson, que son las
 * de CSS Color 4. Lo que queda fuera de sRGB al mover la luminosidad se recorta
 * por canal, que es lo que hace WebKitGTK al pintar; el recorte cambia un poco
 * la luminancia, y por eso se mide el color recortado y no el teórico.
 */
export function clampOklchLightness(color: Rgb | string, bounds: { min?: number; max?: number }): Rgb {
	const rgb = typeof color === 'string' ? parseHex(color) : color;
	const toLinear = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
	const toGamma = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
	const [r, g, b] = rgb.map(toLinear) as Rgb;

	const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
	const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
	const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
	let lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
	const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
	const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

	if (bounds.max !== undefined) lightness = Math.min(lightness, bounds.max);
	if (bounds.min !== undefined) lightness = Math.max(lightness, bounds.min);

	const l2 = (lightness + 0.3963377774 * a + 0.2158037573 * bb) ** 3;
	const m2 = (lightness - 0.1055613458 * a - 0.0638541728 * bb) ** 3;
	const s2 = (lightness - 0.0894841775 * a - 1.291485548 * bb) ** 3;
	const linear = [
		4.0767416621 * l2 - 3.3077115913 * m2 + 0.2309699292 * s2,
		-1.2684380046 * l2 + 2.6097574011 * m2 - 0.3413193965 * s2,
		-0.0041960863 * l2 - 0.7034186147 * m2 + 1.707614701 * s2,
	];
	return linear.map((v) => Math.min(Math.max(toGamma(Math.min(Math.max(v, 0), 1)), 0), 1)) as Rgb;
}
