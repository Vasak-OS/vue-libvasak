import { rootProperties, type SchemeDocument } from '../tests/scheme';

/**
 * Lo que el banco hace con la dirección: `?theme=dark&scheme=light-accent&
 * width=360&radius=6&only=forms`.
 *
 * El tema va en `<html>` y no en un contenedor: las variables del `@theme` se
 * resuelven en `:root`, así que un `.dark` más abajo no cambiaría los tokens
 * derivados. Es lo mismo que hacen las aplicaciones. Por eso claro y oscuro
 * son dos páginas y no dos mitades de una.
 */
export function applyBenchQuery(
	root: HTMLElement,
	search: string,
	schemes: Record<string, SchemeDocument>
): { widths: number[]; only: string } {
	const query = new URLSearchParams(search);
	const scheme = schemes[query.get('scheme') ?? ''] ?? schemes['vasak-default'];
	if (scheme) {
		for (const [name, value] of Object.entries(rootProperties(scheme))) {
			root.style.setProperty(name, value);
		}
	}
	const radius = query.get('radius');
	if (radius) root.style.setProperty('--corner-radius', `${radius}px`);
	root.classList.toggle('dark', query.get('theme') === 'dark');
	return {
		widths: (query.get('width') ?? '240,360,600,1200').split(',').map(Number),
		only: query.get('only') ?? '',
	};
}
