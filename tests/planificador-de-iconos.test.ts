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

import { afterEach, beforeEach, describe, expect, jest, test } from 'bun:test';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import ThemeIcon from '../src/icons/ThemeIcon.vue';
import {
	cuantosIconosAnotados,
	olvidarLosIconosDelTema,
	recargarLosIconosAhora,
} from '../src/internos/iconoDelTema';
import { emitir, olvidarTodo, pedidosDeIcono, ponerEnElTema } from './dobles';

async function asentar(vueltas = 8) {
	for (let i = 0; i < vueltas; i++) await nextTick();
}

/**
 * Corre el reloj sin esperarlo.
 *
 * Las esperas del planificador —los 100 ms del rebote, los 16 ms entre tandas—
 * se empujan con relojes falsos y no durmiendo. Una prueba que depende del reloj
 * de pared falla sola el día que la máquina esté cargada, y en esta misma suite
 * ya hay una que lo hace: se la vio tardar 8,7 segundos en algo que sola tarda
 * milisegundos.
 *
 * Entre tanda y tanda hay `await`, así que no alcanza con adelantar el reloj:
 * hay que dejar correr las microtareas también, y por eso va de a poco en vez de
 * un salto grande.
 */
async function correrElReloj(ms: number, paso = 20) {
	for (let pasado = 0; pasado < ms; pasado += paso) {
		jest.advanceTimersByTime(paso);
		await asentar(3);
	}
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
	jest.useFakeTimers();
	olvidarTodo();
	olvidarLosIconosDelTema();
});

afterEach(() => {
	while (montados.length) montados.pop()?.unmount();
	olvidarLosIconosDelTema();
	jest.useRealTimers();
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

		// Diez y no «menos de veinticinco»: con `POR_TANDA = 24` lo segundo
		// pasaría igual, y entonces la prueba no fija el tamaño de la tanda sino
		// que fija que haya alguna. Lo marcó CodeRabbit.
		const pedidos = pedidosDeIcono.length;
		expect(pedidos).toBeGreaterThan(0);
		expect(pedidos).toBeLessThanOrEqual(10);
	});

	test('pero terminan todas', async () => {
		// Que vayan por tandas no puede significar que alguna se quede afuera.
		unaListaDe(25);
		await asentar();
		pedidosDeIcono.length = 0;

		await emitir('vicons:theme-changed');
		recargarLosIconosAhora();
		await correrElReloj(300);

		expect(pedidosDeIcono).toHaveLength(25);
	});
});

describe('lo que se desmonta', () => {
	test('se da de baja del planificador', async () => {
		// El ciclo saca una foto de lo anotado y después va de a tandas: entre
		// una tanda y la otra la persona puede cerrar el menú, y lo que quedó
		// anotado se recorre igual.
		//
		// Esto mira el registro y **no** la cuenta de pedidos, que es lo que
		// tenía antes y no comprobaba nada: un componente desmontado que siguiera
		// anotado tampoco pediría, porque al desmontarse su nombre queda vacío y
		// la resolución sale antes de preguntar. Lo delató el sabotaje —sacar la
		// baja no movía ninguna prueba— después de que la revisión pidiera
		// apretar la de las tandas.
		const iconos = unaListaDe(25);
		await asentar();
		expect(cuantosIconosAnotados()).toBe(25);

		for (const icono of iconos) icono.unmount();
		montados.length = 0;
		await asentar();

		expect(cuantosIconosAnotados()).toBe(0);
	});
});

/**
 * El vigía de visibilidad, con un doble.
 *
 * `happy-dom` no trae `IntersectionObserver`, así que sin esto el planificador
 * sigue de largo sin vigía y todo cuenta como visible. Eso está bien para el
 * resto de las pruebas —el orden es el de siempre y nada se rompe— pero deja sin
 * cubrir justo la parte que lo usa.
 */
describe('a quién vigila', () => {
	type Doble = { observados: HTMLElement[]; soltados: HTMLElement[] };

	function ponerElVigia(): Doble {
		const registro: Doble = { observados: [], soltados: [] };
		class VigiaDeMentira {
			observe(elemento: HTMLElement) {
				registro.observados.push(elemento);
			}
			unobserve(elemento: HTMLElement) {
				registro.soltados.push(elemento);
			}
			disconnect() {}
		}
		(globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
			VigiaDeMentira;
		// El vigía se crea a la primera y queda guardado: sin esto, el doble
		// llegaría tarde.
		olvidarLosIconosDelTema();
		return registro;
	}

	test('suelta el hueco cuando lo reemplaza la imagen', async () => {
		// `ThemeIcon` dibuja un `span` mientras resuelve y un `img` cuando llega.
		// Son dos elementos distintos: si se vigilan los dos con el mismo
		// identificador, un aviso tardío del primero —que ya no está en el
		// documento, o sea nunca visible— saca de «en pantalla» a un icono que sí
		// lo está, y entonces se recarga último. Lo marcó CodeRabbit.
		const original = (globalThis as unknown as { IntersectionObserver: unknown })
			.IntersectionObserver;
		try {
			const registro = ponerElVigia();
			ponerEnElTema('firefox', 'data:image/png;base64,FIREFOX');

			const icono = mount(ThemeIcon, { props: { name: 'firefox' } });
			montados.push(icono);
			await asentar();

			// Dos elementos vigilados a lo largo de la vida del icono —el hueco y
			// la imagen— y el primero soltado: queda uno solo mirado.
			expect(registro.observados.length).toBe(2);
			expect(registro.soltados).toEqual([registro.observados[0]]);
		} finally {
			(globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
				original;
			olvidarLosIconosDelTema();
		}
	});
});
