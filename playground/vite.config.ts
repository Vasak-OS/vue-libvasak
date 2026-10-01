import { readFileSync } from 'node:fs';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import { defineConfig, type Plugin } from 'vite';
import { indexIcons, type Mode, parseIconRequest, resolveIcon, THEMES } from './icons';

/**
 * El banco de estados de la librería: `bun run bench`.
 *
 * Dibuja cada componente en todos sus estados, en claro y en oscuro y a varios
 * anchos, **sin Tauri**. Lo que en una ventana resuelve el backend —los iconos,
 * el catálogo, la ventana— va por dobles (`stubs/`), y los iconos salen del
 * tema instalado en `/usr/share/icons`, que es lo que ve la persona (ver
 * `icons.ts`).
 */
function systemIcons(): Plugin {
	const indexes = new Map<Mode, Map<string, string>>();
	return {
		name: 'vasak-bench-icons',
		configureServer(server) {
			server.middlewares.use('/__icon/', (request, response) => {
				const { name, kind, mode } = parseIconRequest(request.url ?? '/');
				if (!indexes.has(mode)) indexes.set(mode, indexIcons('/usr/share/icons', THEMES[mode]));
				const file = resolveIcon(indexes.get(mode) as Map<string, string>, name, kind);
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
