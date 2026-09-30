import { createApp } from 'vue';
import { rootProperties, type SchemeDocument } from '../tests/scheme';
import defaultScheme from '../tests/fixtures/schemes/vasak-default.json';
import lightAccent from '../tests/fixtures/schemes/light-accent.json';
import Bench from './Bench.vue';
import './main.css';

/**
 * `?theme=dark&scheme=light-accent&width=360&radius=6`.
 *
 * El tema va en `<html>` y no en un contenedor: las variables del `@theme` se
 * resuelven en `:root`, así que un `.dark` más abajo no cambiaría los tokens
 * derivados. Es lo mismo que hacen las aplicaciones. Por eso claro y oscuro
 * son dos páginas y no dos mitades de una.
 */
const query = new URLSearchParams(location.search);
const schemes: Record<string, SchemeDocument> = {
	'vasak-default': defaultScheme as SchemeDocument,
	'light-accent': lightAccent as SchemeDocument,
};
const scheme = schemes[query.get('scheme') ?? 'vasak-default'] ?? schemes['vasak-default'];

for (const [name, value] of Object.entries(rootProperties(scheme))) {
	document.documentElement.style.setProperty(name, value);
}
if (query.get('radius')) {
	document.documentElement.style.setProperty('--corner-radius', `${query.get('radius')}px`);
}
document.documentElement.classList.toggle('dark', query.get('theme') === 'dark');

createApp(Bench, {
	widths: (query.get('width') ?? '240,360,600,1200').split(',').map(Number),
	only: query.get('only') ?? '',
}).mount('#app');
