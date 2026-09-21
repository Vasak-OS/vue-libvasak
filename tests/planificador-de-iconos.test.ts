/**
 * Cómo se recargan los iconos cuando la persona cambia de tema.
 *
 * La memoria evita **pedir dos veces lo mismo**. No evita **pedir cuarenta cosas
 * a la vez**, que es otro problema y aparece donde los nombres son todos
 * distintos: el menú del escritorio dibuja la lista entera de aplicaciones
 * instaladas, entre sesenta y ciento cincuenta iconos, casi todos fuera de
 * pantalla. Resolver todo de golpe es una llamada al backend por aplicación
 * disparada en el proceso que dibuja el panel.
 *
 * Esto venía de `vasak-desktop`, que lo escribió porque le hacía falta y lo tuvo
 * **sin una sola prueba**: trescientas sesenta y siete líneas de rebote,
 * cancelación, observador de visibilidad y tandas que no tocaba nadie. Acá es de
 * todos, así que acá se prueba.
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import ThemeIcon from '../src/icons/ThemeIcon.vue';
import {
	olvidarLosIconosDelTema,
	recargarLosIconosAhora,
} from '../src/internos/iconoDelTema';
import { emitir, olvidarTodo, pedidosDeIcono, ponerEnElTema } from './dobles';

async function asentar(vueltas = 8) {
	for (let i = 0; i < vueltas; i++) await nextTick();
}

const montados: { unmount: () => void }[] = [];

/** `cuantos` iconos con nombres todos distintos, como una lista de aplicaciones. */
function unaListaDe(cuantos: number) {
	for (let i = 0; i < cuantos; i++) ponerEnElTema(`app-${i}`, `data:${i}`);
	return Array.from({ length: cuantos }, (_, i) => {
		const vista = mount(ThemeIcon, { props: { name: `app-${i}` } });
		montados.push(vista);
		return vista;
	});
}

/** Cuántas veces se pidió un nombre al backend. */
const vecesQueSePidio = (nombre: string) =>
	pedidosDeIcono.filter((pedido) => pedido.nombre === nombre).length;

beforeEach(() => {
	olvidarTodo();
	olvidarLosIconosDelTema();
});

afterEach(() => {
	while (montados.length) montados.pop()?.unmount();
	olvidarLosIconosDelTema();
});

describe('la recarga no se dispara de una', () => {
	test('varios avisos seguidos son una sola recarga', async () => {
		// Cambiar de claro a oscuro toca más de una cosa y el escritorio avisa
		// varias veces. Sin el rebote, cada aviso arranca su propia vuelta sobre
		// la lista entera.
		unaListaDe(3);
		await asentar();
		const alMontar = vecesQueSePidio('app-0');

		await emitir('vicons:theme-changed');
		await emitir('vicons:theme-changed');
		await emitir('vicons:theme-changed');
		// Sin esperar los 100 ms: lo que importa es que **todavía** no pidió nada.
		await asentar();

		expect(vecesQueSePidio('app-0')).toBe(alMontar);
	});

	test('y cuando arranca, pide una vez por icono y no una por aviso', async () => {
		unaListaDe(3);
		await asentar();
		const alMontar = vecesQueSePidio('app-0');

		await emitir('vicons:theme-changed');
		await emitir('vicons:theme-changed');
		recargarLosIconosAhora();
		await asentar(40);

		expect(vecesQueSePidio('app-0')).toBe(alMontar + 1);
	});
});

describe('las tandas', () => {
	test('una lista larga no se resuelve toda junta', async () => {
		// Veinticinco iconos distintos son tres tandas de diez. Si salieran todas
		// juntas, después de un solo `await` estarían pedidos los veinticinco.
		unaListaDe(25);
		await asentar();
		pedidosDeIcono.length = 0;

		await emitir('vicons:theme-changed');
		recargarLosIconosAhora();
		// Una vuelta corta: alcanza para la primera tanda y no para las otras,
		// que esperan su pausa.
		await asentar(4);

		const pedidos = pedidosDeIcono.length;
		expect(pedidos).toBeGreaterThan(0);
		expect(pedidos).toBeLessThan(25);
	});

	test('pero terminan todas', async () => {
		// Que vayan por tandas no puede significar que alguna se quede afuera.
		unaListaDe(25);
		await asentar();
		pedidosDeIcono.length = 0;

		await emitir('vicons:theme-changed');
		recargarLosIconosAhora();
		await new Promise((listo) => setTimeout(listo, 300));
		await asentar();

		expect(pedidosDeIcono.length).toBe(25);
	});
});

describe('lo que se desmonta', () => {
	test('no se recarga', async () => {
		// El ciclo saca una foto de lo anotado y después va de a tandas: entre
		// una tanda y la otra la persona puede cerrar el menú. Pedir el icono de
		// algo que ya no está en pantalla es trabajo tirado.
		const iconos = unaListaDe(25);
		await asentar();
		pedidosDeIcono.length = 0;

		for (const icono of iconos) icono.unmount();
		montados.length = 0;

		await emitir('vicons:theme-changed');
		recargarLosIconosAhora();
		await new Promise((listo) => setTimeout(listo, 300));
		await asentar();

		expect(pedidosDeIcono.length).toBe(0);
	});
});
