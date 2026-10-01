/**
 * Cada tono del botón lleva el token de texto que corresponde a su fondo.
 *
 * El `secondary` se dibujaba con `text-tx-on-primary`, que es un casi negro, y
 * sobre el violeta `--secondary: #8839ef` eso da 3.03:1 —no llega al 4.5:1 que
 * WCAG 1.4.3 pide para texto normal—. Como el secundario es mucho más oscuro
 * que el `#dd7878` del primario, el casi negro que se lee bien sobre el uno no
 * se lee sobre el otro. Es un error que no se ve mirando la plantilla: las dos
 * clases son válidas, el color existe y el build pasa.
 *
 * La regla que lo evita es una sola, y por eso la prueba no mira contrastes sino
 * el emparejamiento: **el fondo `X` se pinta con `text-tx-on-X`**. Ningún otro
 * token sirve, porque el color de texto sobre una marca se deriva de esa marca —
 * lo hace `textoSobre` en `@vasakgroup/plugin-config-manager`—. Por eso el
 * `secondary` tiene el suyo aunque su valor actual coincida con el del
 * primario: lo que se compara es el color de fondo, no el tono.
 *
 * Desde la 2.0.0 el `secondary` ya no es un relleno: es el botón con contorno
 * de Once UI, transparente, y su texto es el de la superficie donde se apoya
 * (`text-tx-main`), igual que el `ghost` nuevo.
 */

import { beforeEach, describe, expect, test } from 'bun:test';
import { mount } from '@vue/test-utils';
import ActionButton from '../src/controls/ActionButton.vue';
import { olvidarTodo, ponerEnElTema } from './dobles';
import { nextTick } from 'vue';

beforeEach(() => {
	olvidarTodo();
});

/** El `bg-` de cada clase del botón, que es contra qué hay que leerlo. */
const fondos = (clases: string[]) =>
	clases.filter((c) => c.startsWith('bg-')).filter((c) => !c.includes(':'));

describe('el texto del botón se lee sobre su fondo', () => {
	for (const [tono, color] of [['primary', 'primary']] as const) {
		test(`el ${tono} se pinta con el token de su propio color`, () => {
			const boton = mount(ActionButton, {
				props: { label: 'Aceptar', variant: tono },
			});
			const clases = boton.get('button').classes();

			// El fondo que trae el tono, sin el modificador de opacidad del hover.
			const fondo = fondos(clases).find((c) => c.includes(color));
			expect(fondo).toBeDefined();

			// Y el texto tiene que ser el de ese mismo color.
			const texto = clases.find((c) => c.startsWith('text-tx-on-'));
			expect(texto).toBe(`text-tx-on-${color}`);
		});
	}
});

describe('las variantes sin relleno', () => {
	for (const variante of ['secondary', 'ghost'] as const) {
		test(`el ${variante} es transparente y lleva el texto de la superficie`, () => {
			const clases = mount(ActionButton, { props: { label: 'Cancelar', variant: variante } })
				.get('button')
				.classes();

			expect(clases).toContain('bg-transparent');
			expect(clases).toContain('text-tx-main');
			expect(clases).toContain('hover:bg-ui-hover');
			// Ningún color de marca, ni en reposo ni al pasar por encima.
			expect(clases.join(' ')).not.toMatch(/(bg|border|text)-(primary|secondary)\b/);
		});
	}

	test('el secondary tiene contorno fino y el ghost no', () => {
		const contorno = mount(ActionButton, { props: { label: 'a', variant: 'secondary' } })
			.get('button')
			.classes();
		const fantasma = mount(ActionButton, { props: { label: 'a', variant: 'ghost' } })
			.get('button')
			.classes();

		expect(contorno).toContain('border-ui-line');
		expect(fantasma).toContain('border-transparent');
	});
});

describe('la forma', () => {
	test('apretar no escala: cambia el fondo', () => {
		const clases = mount(ActionButton, { props: { label: 'a' } }).get('button').classes().join(' ');

		expect(clases).not.toMatch(/scale-/);
		expect(clases).toContain('active:bg-primary/80');
	});

	test('el de 24 se apunta en 32', () => {
		// Se ve de 24, pero el seudoelemento agranda cuatro píxeles arriba y
		// abajo la zona que recibe el clic.
		const clases = mount(ActionButton, { props: { label: 'a', size: 'sm' } }).get('button').classes();

		expect(clases).toContain('min-h-6');
		expect(clases).toContain('after:-inset-y-1');
	});

	test('el icono sale del tema del sistema por su nombre', async () => {
		ponerEnElTema('document-save-symbolic', 'data:image/png;base64,GUARDAR');
		ponerEnElTema('document-save', 'data:image/png;base64,GUARDAR');
		const vista = mount(ActionButton, { props: { label: 'Guardar', icon: 'document-save' } });
		await new Promise((listo) => setTimeout(listo, 0));
		await nextTick();

		expect(vista.find('img').attributes('src')).toBe('data:image/png;base64,GUARDAR');
	});

	test('cargando, la rueda ocupa el lugar del icono', async () => {
		const vista = mount(ActionButton, { props: { label: 'Guardar', icon: 'document-save', loading: true } });
		await nextTick();

		// Un solo dibujo: la rueda, no la rueda más el icono.
		expect(vista.findAll('.animate-spin')).toHaveLength(1);
		expect(vista.findAllComponents({ name: 'ThemeIcon' })).toHaveLength(1);
	});

	test('sólo icono, el nombre va al botón', () => {
		const vista = mount(ActionButton, { props: { label: '', icon: 'edit-delete', iconAlt: 'Borrar' } });

		expect(vista.get('button').attributes('aria-label')).toBe('Borrar');
	});
});

describe('lo que este archivo todavía no arregla', () => {
	// Marcada como `failing` a propósito, y no con una prueba que falla:
	// una prueba roja permanente entrena a ignorar el rojo y traba el CI de
	// todos los demás. `failing` dice lo mismo —esto está roto— y deja la suite
	// en verde. El día que exista `--text-on-danger` y se escriba el token, esta
	// prueba pasa sola y **el CI se pone rojo solo**, que es justo el aviso de
	// que hay que sacarle el marcador.
	test.failing('`danger` se lee mal en claro, y necesita un token que no existe', () => {
		// `#1e1e2e` sobre `#d20f39` da 3.02:1, así que el botón de peligro tampoco
		// llega. No se puede cambiar a `text-tx-on-secondary` aunque hoy dé 4.80:1
		// sobre `#d20f39`: funciona por casualidad, porque en el esquema por
		// omisión ese token vale `#eff1f5` en claro, y con un esquema donde el
		// error y el secundario tengan distinta claridad deja de funcionar sin
		// avisar. Lo que hace falta es `--text-on-danger`, y eso viene con el
		// trabajo de los esquemas: `--status-error` está a mano en cada
		// `main.css` y no sale de `vasak-default.json`, así que el config-manager
		// no tiene de dónde derivarlo.
		const clases = mount(ActionButton, {
			props: { label: 'Borrar', variant: 'danger' },
		})
			.get('button')
			.classes();

		expect(clases).toContain('text-tx-on-status-error');
	});
});
