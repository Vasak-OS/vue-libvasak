/**
 * El tema de iconos del sistema, para el banco sin Tauri.
 *
 * El complemento de verdad le pide el icono al backend; acá lo busca el
 * servidor de Vite en `/usr/share/icons` (ver `vite.config.ts`). Así el banco
 * dibuja **los iconos del tema instalado**, los mismos que ve la persona, y no
 * unos dibujados a mano.
 */
export async function getIconSource(name: string): Promise<string> {
	return lookup(name, 'icon');
}

export async function getSymbolSource(name: string): Promise<string> {
	return lookup(name, 'symbol');
}

async function lookup(name: string, kind: 'icon' | 'symbol'): Promise<string> {
	const url = `/__icon/${encodeURIComponent(name)}?kind=${kind}`;
	const response = await fetch(url, { method: 'HEAD' });
	return response.ok ? url : '';
}
