/**
 * La fila que se abre entera, y las clases que no existían.
 *
 * Dos cosas que venían mal y ninguna fallaba.
 *
 * **No se podía abrir con el teclado.** Un `<div>` con `@click` sirve con el
 * mouse y no existe para quien navega con Tab: no recibe foco, no se activa con
 * Enter ni con la barra y el lector de pantalla no lo anuncia. La copia de
 * `vasak-desktop` lo había arreglado; acá se sube, que es lo que el
 * Vasak-OS/vue-libvasak#22 pide hacer antes de borrar una copia.
 *
 * **Y dibujaba con clases que no existen.** `rounded-vsk` y
 * `border-vsk-primary/70` no están en el `@theme` de **ninguna** aplicación del
 * taller —sólo existen las tres fuentes `--vsk-font-*`—, así que Tailwind no
 * emite ninguna regla y tampoco avisa: la tarjeta salía con las esquinas
 * cuadradas mientras todo el resto del escritorio va redondeado, y el borde sin
 * color. Es el mismo modo de fallo que ya se había visto con `rounded-window`
 * en el lanzador.
 */

import { describe, expect, test } from 'bun:test';
import { mount } from '@vue/test-utils';
import { Glob } from 'bun';
import { fileURLToPath } from 'node:url';
import ListCard from '../src/cards/ListCard.vue';

describe('la fila de lista que se puede abrir', () => {
	test('dice que es un botón y se puede enfocar', () => {
		const vista = mount(ListCard, { props: { clickable: true } });

		expect(vista.attributes('role')).toBe('button');
		expect(vista.attributes('tabindex')).toBe('0');
	});

	test('se abre con Enter y con la barra', async () => {
		const vista = mount(ListCard, { props: { clickable: true } });

		await vista.trigger('keydown.enter');
		await vista.trigger('keydown.space');

		expect(vista.emitted('click')).toHaveLength(2);
	});

	test('pero no cuando la tecla viene de un control de adentro', async () => {
		// La tecla que alguien apreta sobre un botón de la ranura **burbujea**
		// hasta la fila. Sin `.self`, apretar Enter ahí dispararía además la
		// acción de la fila entera, y el `.prevent` le cancelaría al botón su
		// propia activación. Lo encontró CodeRabbit en el #62 y era real.
		const vista = mount(ListCard, {
			props: { clickable: true },
			slots: { default: '<button type="button" id="dentro">borrar</button>' },
		});

		await vista.find('#dentro').trigger('keydown.enter');

		expect(vista.emitted('click')).toBeUndefined();
	});

	test('y la que no se puede abrir no finge que sí', () => {
		// Anunciar un botón que no hace nada es el mismo problema al revés: se
		// promete algo que al apretarlo no pasa.
		const vista = mount(ListCard, { props: { clickable: false } });

		expect(vista.attributes('role')).toBeUndefined();
		expect(vista.attributes('tabindex')).toBeUndefined();
	});

	test('ni emite al hacerle clic', async () => {
		const vista = mount(ListCard, { props: { clickable: false } });

		await vista.trigger('click');

		expect(vista.emitted('click')).toBeUndefined();
	});
});

describe('las clases que la librería dibuja', () => {
	test('la fila usa los tokens que las aplicaciones definen', () => {
		const vista = mount(ListCard, { props: { clickable: false } });
		const clases = vista.classes();

		expect(clases).toContain('rounded-corner');
		expect(clases).toContain('border-ui-border');
		// El fondo se queda en `background`, que es lo que las dos versiones ya
		// decían —`.background` la definen las aplicaciones y vale
		// `bg-ui-bg/80`—. Cambiarlo sería colar una decisión de diseño sobre
		// seis aplicaciones adentro de un PR que vino a otra cosa.
		expect(clases).toContain('background');
	});

	test('y ningún componente de la librería usa una clase `vsk-`', async () => {
		// Ninguna aplicación define `--radius-vsk` ni `--color-vsk-primary`: lo
		// único que existe con ese prefijo son las tres fuentes, y ésas se usan
		// por `font-sans`, `font-title` y `font-mono`, no por `vsk-`. Una clase
		// `vsk-` en una plantilla es una regla que no se emite y no avisa.
		const raiz = fileURLToPath(new URL('../src/', import.meta.url));
		const culpables: string[] = [];

		for (const ruta of new Glob('**/*.vue').scanSync(raiz)) {
			const texto = await Bun.file(raiz + ruta).text();
			if (/\b[a-z-]*vsk-(?!font)/.test(texto)) culpables.push(ruta);
		}

		expect(culpables).toEqual([]);
	});
});
