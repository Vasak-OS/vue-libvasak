/**
 * Vaciar la memoria de iconos, desde afuera del paquete.
 *
 * Lo resuelto se memoriza por nombre en el módulo, y un módulo se comparte
 * entre archivos de prueba. Eso hace que **el primero que pida un icono con el
 * tema sin preparar deje guardado que no hay ninguno**, y cualquier prueba
 * posterior que sí lo prepare ya no lo vea: su componente dibuja el hueco.
 *
 * Acá adentro no se notaba porque `tests/preparar.ts` alcanza el módulo por su
 * ruta. Quien usa el paquete no puede, y se lo encuentra de la peor forma: el
 * archivo de prueba pasa solo y falla en la suite. Pasó al adoptar la librería
 * en vasak-installer.
 *
 * Por eso la función sale del paquete, y esto lo comprueba entrando por la
 * misma puerta que una aplicación.
 */

import { describe, expect, test } from 'bun:test';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import ThemeIcon from '../src/icons/ThemeIcon.vue';
import { olvidarLosIconosDelTema } from '../src/index';
import { ponerEnElTema } from './dobles';

/** Un nombre que no use ninguna otra prueba, para que la memoria sea sólo de acá. */
const NOMBRE = 'icono-solo-de-esta-prueba';

async function dibujar() {
	const vista = mount(ThemeIcon, { props: { name: NOMBRE } });
	await nextTick();
	await new Promise((listo) => setTimeout(listo, 0));
	const fuente = vista.find('img').exists() ? vista.find('img').attributes('src') : '';
	vista.unmount();
	return fuente;
}

describe('la memoria de iconos', () => {
	test('sale del paquete, que es de donde una aplicación puede tomarla', () => {
		// Estaba en `src/internos`, alcanzable sólo por ruta desde adentro.
		expect(typeof olvidarLosIconosDelTema).toBe('function');
	});

	test('un icono pedido antes de prepararlo queda guardado como inexistente', async () => {
		// Éste es el problema, escrito: no es que falle: es que **acierta una
		// vez y se queda con esa respuesta**.
		expect(await dibujar()).toBe('');

		ponerEnElTema(NOMBRE, 'la-fuente-de-verdad');

		expect(await dibujar()).toBe('');
	});

	test('y vaciarla lo desatasca', async () => {
		olvidarLosIconosDelTema();

		expect(await dibujar()).toBe('la-fuente-de-verdad');
	});
});
