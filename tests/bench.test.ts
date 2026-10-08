/**
 * El banco de estados y lo que publica la compilación.
 *
 * El banco no es parte del paquete, pero es la vista «antes/después» con la que
 * se revisa cada cambio de forma: si busca mal los iconos o aplica mal el
 * esquema, las capturas mienten y la revisión se hace sobre otra cosa.
 */

import { afterEach, describe, expect, test } from 'bun:test';
import { fileURLToPath } from 'node:url';
import { indexIcons, parseIconRequest, resolveIcon, THEMES } from '../playground/icons';
import { applyBenchQuery } from '../playground/setup';
import { readConfig } from '../playground/stubs/config-manager';
import { useI18n } from '../playground/stubs/i18n';
import { emit, listen } from '../playground/stubs/tauri-event';
import { getCurrentWindow } from '../playground/stubs/tauri-window';
import { getIconSource, getSymbolSource } from '../playground/stubs/vicons';
import { publishTokens } from '../vite.config';
import lightAccent from './fixtures/schemes/light-accent.json';
import defaultScheme from './fixtures/schemes/vasak-default.json';
import type { SchemeDocument } from './scheme';

const ICONS = fileURLToPath(new URL('./fixtures/icons/', import.meta.url));
const SCHEMES = {
	'vasak-default': defaultScheme as SchemeDocument,
	'light-accent': lightAccent as SchemeDocument,
};

describe('los iconos del banco salen del tema instalado', () => {
	const index = indexIcons(ICONS, THEMES.light);

	test('el tema del modo le gana a lo que hereda', () => {
		expect(resolveIcon(index, 'edit-copy', 'icon')).toContain('VasakOS-light/');
	});

	test('y lo que el tema no trae llega heredado', () => {
		// `content-loading` no está en VasakOS-light: llega de Breeze, como en
		// una ventana de verdad.
		expect(resolveIcon(index, 'content-loading', 'symbol')).toContain('breeze/');
		expect(resolveIcon(index, 'process-working', 'symbol')).toContain('VasakOS/');
	});

	test('el simbólico prueba primero con «-symbolic», como GTK', () => {
		expect(resolveIcon(index, 'go-down', 'symbol')).toEndWith('go-down-symbolic.svg');
		expect(resolveIcon(index, 'go-down', 'icon')).toBeUndefined();
	});

	test('dentro de un tema, el vectorial le gana al mapa de bits', () => {
		expect(resolveIcon(index, 'edit-paste', 'icon')).toEndWith('.svg');
	});

	test('un enlace roto en el tema se saltea', () => {
		// VasakOS-dark trae enlaces a archivos que no están; el primero que se
		// encontró tiraba abajo el servidor del banco.
		expect(resolveIcon(index, 'broken-link', 'icon')).toBeUndefined();
		expect(resolveIcon(index, 'edit-copy', 'icon')).toBeDefined();
	});

	test('un tema que no existe no rompe nada', () => {
		expect(indexIcons(ICONS, ['NoExiste']).size).toBe(0);
	});

	test('la dirección se lee entera', () => {
		expect(parseIconRequest('/go%20down?kind=symbol&mode=dark')).toEqual({
			name: 'go down',
			kind: 'symbol',
			mode: 'dark',
		});
		expect(parseIconRequest('/edit-copy')).toEqual({ name: 'edit-copy', kind: 'icon', mode: 'light' });
	});
});

describe('el banco aplica el esquema como el config-manager', () => {
	afterEach(() => {
		document.documentElement.removeAttribute('style');
		document.documentElement.classList.remove('dark');
	});

	test('pone las variables del esquema y el modo en la raíz', () => {
		const root = document.documentElement;
		const result = applyBenchQuery(root, '?theme=dark&scheme=light-accent&radius=6', SCHEMES);

		expect(root.classList.contains('dark')).toBe(true);
		expect(root.style.getPropertyValue('--primary')).toBe('#e5c890');
		expect(root.style.getPropertyValue('--corner-radius')).toBe('6px');
		expect(result.widths).toEqual([240, 360, 600, 1200]);
	});

	test('sin esquema pedido, el de fábrica; y los anchos y la sección de la dirección', () => {
		const root = document.documentElement;
		const result = applyBenchQuery(root, '?width=360&only=forms', SCHEMES);

		expect(root.style.getPropertyValue('--primary')).toBe('#dd7878');
		expect(root.classList.contains('dark')).toBe(false);
		expect(result).toEqual({ widths: [360], only: 'forms' });
	});
});

describe('los dobles del banco', () => {
	const originalFetch = globalThis.fetch;

	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	test('el tema de iconos pide al servidor del banco, con el modo de la página', async () => {
		const asked: string[] = [];
		globalThis.fetch = (async (url: string) => {
			asked.push(url);
			return { ok: !url.includes('nada') } as Response;
		}) as typeof fetch;

		expect(await getSymbolSource('go-down')).toBe('/__icon/go-down?kind=symbol&mode=light');
		expect(await getIconSource('nada')).toBe('');
		expect(asked).toHaveLength(2);
	});

	test('el catálogo devuelve la clave, y lo demás no hace nada', async () => {
		expect(useI18n().t('media.play')).toBe('media.play');
		expect(await readConfig()).toBeNull();
		await emit();
		const release = await listen();
		release();
		const window = getCurrentWindow();
		await window.minimize();
		expect(await window.isMaximized()).toBe(false);
		(await window.onResized())();
	});
});

describe('la compilación publica tokens.css tal cual', () => {
	test('lo emite al lado del bundle, sin pasarlo por Tailwind', async () => {
		const emitted: Array<{ fileName: string; source: string }> = [];
		const plugin = publishTokens();
		const generate = plugin.generateBundle as (this: unknown) => void;
		generate.call({ emitFile: (file: { fileName: string; source: string }) => emitted.push(file) });

		const original = await Bun.file(new URL('../src/styles/tokens.css', import.meta.url)).text();
		const scrollbar = await Bun.file(new URL('../src/styles/scrollbar.css', import.meta.url)).text();
		expect(emitted.map((file) => file.fileName)).toEqual(['tokens.css', 'scrollbar.css']);
		expect(emitted[0]?.source).toBe(original);
		expect(emitted[1]?.source).toBe(scrollbar);
		// Las reglas globales de la barra no viajan con los tokens.
		expect(original).not.toContain('::-webkit-scrollbar');
	});

	test('y el manifiesto lo exporta', async () => {
		const manifest = await Bun.file(new URL('../package.json', import.meta.url)).json();

		expect(manifest.exports['./tokens.css']).toBe('./dist/tokens.css');
		expect(manifest.exports['./scrollbar.css']).toBe('./dist/scrollbar.css');
		expect(manifest.version).toBe('2.14.0');
	});
});
