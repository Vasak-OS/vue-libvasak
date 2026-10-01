import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import { defineConfig, type Plugin } from 'vite';

/**
 * El banco de estados de la librería: `bun run bench`.
 *
 * Dibuja cada componente en todos sus estados, en claro y en oscuro y a varios
 * anchos, **sin Tauri**. Lo que en una ventana resuelve el backend —los iconos,
 * el catálogo, la ventana— va por dobles (`stubs/`), y los iconos salen del
 * tema instalado en `/usr/share/icons`, que es lo que ve la persona.
 */

/** El tema de cada modo y lo que hereda (`Inherits=hicolor,breeze`). */
const THEMES = {
	light: ['VasakOS-light', 'VasakOS', 'hicolor', 'breeze'],
	dark: ['VasakOS-dark', 'VasakOS', 'hicolor', 'breeze'],
};
const ROOT = '/usr/share/icons';

/** Nombre → archivo, el primero que aparezca en el orden de los temas. */
function indexIcons(themes: string[]): Map<string, string> {
	const index = new Map<string, string>();
	const walk = (dir: string, depth: number) => {
		if (depth > 4 || !existsSync(dir)) return;
		for (const entry of readdirSync(dir)) {
			const path = join(dir, entry);
			let stats: ReturnType<typeof statSync>;
			try {
				stats = statSync(path);
			} catch {
				continue;
			}
			if (stats.isDirectory()) walk(path, depth + 1);
			else if (/\.(svg|png)$/.test(entry)) {
				const name = entry.replace(/\.(svg|png)$/, '');
				const known = index.get(name);
				// Se prefiere el vectorial, y dentro del mismo tema el `scalable`.
				if (!known || (known.endsWith('.png') && path.endsWith('.svg'))) index.set(name, path);
			}
		}
	};
	for (const theme of themes) {
		const before = new Map(index);
		walk(join(ROOT, theme), 0);
		// Lo que ya dio un tema anterior no lo pisa uno posterior.
		for (const [name, path] of before) index.set(name, path);
	}
	return index;
}

function systemIcons(): Plugin {
	const indexes = new Map<string, Map<string, string>>();
	return {
		name: 'vasak-bench-icons',
		configureServer(server) {
			server.middlewares.use('/__icon/', (request, response) => {
				const url = new URL(request.url ?? '/', 'http://bench');
				const mode = url.searchParams.get('mode') === 'dark' ? 'dark' : 'light';
				if (!indexes.has(mode)) indexes.set(mode, indexIcons(THEMES[mode]));
				const index = indexes.get(mode);
				const name = decodeURIComponent(url.pathname.slice(1));
				const symbol = url.searchParams.get('kind') === 'symbol';
				const candidates = symbol && !name.endsWith('-symbolic') ? [`${name}-symbolic`, name] : [name];
				const file = candidates.map((c) => index?.get(c)).find(Boolean);
				if (!file) {
					response.statusCode = 404;
					response.end();
					return;
				}
				response.setHeader('Content-Type', file.endsWith('.svg') ? 'image/svg+xml' : 'image/png');
				response.end(request.method === 'HEAD' ? undefined : readFileSync(file));
			});
		},
	};
}

const stub = (file: string) => new URL(`./stubs/${file}`, import.meta.url).pathname;

export default defineConfig({
	root: new URL('.', import.meta.url).pathname,
	plugins: [vue(), tailwindcss(), systemIcons()],
	resolve: {
		alias: {
			'@vasakgroup/plugin-vicons': stub('vicons.ts'),
			'@vasakgroup/tauri-plugin-i18n': stub('i18n.ts'),
			'@vasakgroup/plugin-config-manager': stub('config-manager.ts'),
			'@tauri-apps/api/event': stub('tauri-event.ts'),
			'@tauri-apps/api/window': stub('tauri-window.ts'),
		},
	},
	server: { port: 5174, strictPort: true, fs: { allow: ['..'] } },
});
