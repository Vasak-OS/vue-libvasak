/**
 * El tema de iconos del sistema, leído del disco para el banco.
 *
 * Es lo que en una ventana resuelve `tauri-plugin-vicons` con GTK: un nombre
 * se busca en el tema del modo y, si no está, en lo que ese tema hereda. Para
 * `symbol` se prueba primero `<nombre>-symbolic`, como `FORCE_SYMBOLIC` de GTK.
 */
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** El tema de cada modo y lo que hereda (`Inherits=hicolor,breeze`). */
export const THEMES = {
	light: ['VasakOS-light', 'VasakOS', 'hicolor', 'breeze'],
	dark: ['VasakOS-dark', 'VasakOS', 'hicolor', 'breeze'],
} as const;

export type Mode = keyof typeof THEMES;

/** Nombre → archivo, el primero que aparezca en el orden de los temas. */
export function indexIcons(root: string, themes: readonly string[]): Map<string, string> {
	const index = new Map<string, string>();
	for (const theme of themes) {
		const found = new Map<string, string>();
		walk(join(root, theme), 0, found);
		// Lo que ya dio un tema anterior no lo pisa uno posterior.
		for (const [name, path] of found) if (!index.has(name)) index.set(name, path);
	}
	return index;
}

function walk(dir: string, depth: number, found: Map<string, string>) {
	if (depth > 4 || !existsSync(dir)) return;
	for (const entry of readdirSync(dir).sort()) {
		const path = join(dir, entry);
		let stats: ReturnType<typeof statSync>;
		try {
			stats = statSync(path);
		} catch {
			// Un enlace roto: los temas de iconos los traen (VasakOS-dark tiene
			// varios del clima). Se saltea, como hace GTK.
			continue;
		}
		if (stats.isDirectory()) {
			walk(path, depth + 1, found);
			continue;
		}
		const match = /^(.+)\.(svg|png)$/.exec(entry);
		if (!match) continue;
		const name = match[1] as string;
		const known = found.get(name);
		// Dentro del mismo tema, el vectorial le gana al de mapa de bits.
		if (!known || (known.endsWith('.png') && path.endsWith('.svg'))) found.set(name, path);
	}
}

/** El archivo de un nombre, o `undefined` si el tema no lo tiene. */
export function resolveIcon(index: Map<string, string>, name: string, kind: 'icon' | 'symbol') {
	const candidates = kind === 'symbol' && !name.endsWith('-symbolic') ? [`${name}-symbolic`, name] : [name];
	return candidates.map((candidate) => index.get(candidate)).find(Boolean);
}

/**
 * Lo que pide el banco: `/<nombre>?kind=symbol&mode=dark`, ya sin el prefijo
 * de la ruta. Se parte a mano: no hace falta armar una URL entera para leer
 * dos parámetros.
 */
export function parseIconRequest(path: string): { name: string; kind: 'icon' | 'symbol'; mode: Mode } {
	const [pathname = '', search = ''] = path.split('?');
	const params = new URLSearchParams(search);
	return {
		name: decodeURIComponent(pathname.replace(/^\//, '')),
		kind: params.get('kind') === 'symbol' ? 'symbol' : 'icon',
		mode: params.get('mode') === 'dark' ? 'dark' : 'light',
	};
}
