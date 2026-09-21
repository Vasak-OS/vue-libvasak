/**
 * Lo que cuesta dibujar un icono.
 *
 * Cada instancia resolvía por su cuenta y se suscribía por su cuenta al cambio
 * de tema: montar una fila eran **dos llamadas al backend**. En una ventana con
 * diez iconos no se nota; en una lista que se desplaza son dos por fila que
 * aparece, y las mismas dos otra vez cuando la fila vuelve a entrar.
 *
 * Estas pruebas cuidan las tres mitades del arreglo —la memoria, el oyente
 * compartido y el pedido en vuelo— y las dos cosas que no se pueden perder al
 * hacerlo: que el icono siga al tema, y que el oyente se suelte.
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mount } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import ThemeIcon from '../src/icons/ThemeIcon.vue';
import { usarLaVersionDelTema } from '../src/internos/iconoDelTema';
import { cuantosOyentes, emitir, olvidarTodo, ponerEnElTema } from './dobles';

async function asentar(vueltas = 8) {
	for (let i = 0; i < vueltas; i++) {
		await nextTick();
	}
}

/** Pone un icono en el tema y cuenta cuántas veces se lo piden. */
function contado(nombre: string, fuente: string) {
	const cuenta = { veces: 0 };
	ponerEnElTema(nombre, async () => {
		cuenta.veces++;
		return fuente;
	});
	return cuenta;
}

/**
 * Monta y anota, para desmontar al terminar.
 *
 * La memoria y la cuenta de suscriptores viven en el módulo, así que un
 * componente que queda montado sigue escuchando el cambio de tema en la prueba
 * siguiente y le come pedidos a la cuenta. Pasó: una prueba que sola pasa y en
 * la corrida entera falla, y el motivo estaba dos pruebas más arriba.
 */
const montados: { unmount: () => void }[] = [];

function montar(props: Record<string, unknown>) {
	const componente = mount(ThemeIcon, { props });
	montados.push(componente);
	return componente;
}

/**
 * Espera a que la recarga del cambio de tema haya pasado.
 *
 * Desde que la recarga va por tandas, el aviso del cambio de tema **no**
 * resuelve en el acto: espera 100 ms para que varios avisos seguidos sean uno
 * solo. Estas pruebas van por el camino de verdad —con la espera incluida— y no
 * lo saltean, porque lo que prometen es que el icono termina siguiendo al tema,
 * y eso ahora incluye el rebote.
 */
async function esperarLaRecarga() {
	await new Promise((listo) => setTimeout(listo, 150));
	await asentar();
}

beforeEach(() => {
	olvidarTodo();
});

afterEach(() => {
	while (montados.length) {
		montados.pop()?.unmount();
	}
});

describe('la memoria', () => {
	test('el mismo icono no se resuelve dos veces', async () => {
		// Diez filas con el mismo icono —una aplicación y sus acciones, cinco
		// archivos del mismo tipo— lo resolvían diez veces.
		const cuenta = contado('firefox', 'data:image/png;base64,FIREFOX');

		montar({ name: 'firefox' });
		await asentar();
		const segunda = montar({ name: 'firefox' });
		await asentar();

		expect(cuenta.veces).toBe(1);
		expect(segunda.get('img').attributes('src')).toBe('data:image/png;base64,FIREFOX');
	});

	test('y dos iconos distintos siguen siendo dos', async () => {
		const uno = contado('firefox', 'data:image/png;base64,UNO');
		const otro = contado('konsole', 'data:image/png;base64,OTRO');

		montar({ name: 'firefox' });
		montar({ name: 'konsole' });
		await asentar();

		expect(uno.veces).toBe(1);
		expect(otro.veces).toBe(1);
	});

	test('el icono y el símbolo del mismo nombre no se confunden', async () => {
		// Son dos imágenes distintas: la común en color y la monocroma. Con una
		// sola clave, la segunda en pedirse recibía la primera.
		ponerEnElTema('system-run', 'data:image/png;base64,COMUN');

		const comun = montar({ name: 'system-run', type: 'icon' });
		const simbolo = montar({ name: 'system-run', type: 'symbol' });
		await asentar();

		expect(comun.get('img').exists()).toBe(true);
		expect(simbolo.get('img').exists()).toBe(true);
	});

	test('los pedidos en vuelo se comparten', async () => {
		// Diez filas que piden lo mismo **a la vez**, antes de que vuelva la
		// primera respuesta, son una sola llamada y no diez.
		let contestar = () => {};
		let veces = 0;
		ponerEnElTema('lento', () => {
			veces++;
			return new Promise<string>((listo) => {
				contestar = () => listo('data:image/png;base64,LENTO');
			});
		});

		const filas = Array.from({ length: 5 }, () =>
			montar({ name: 'lento' })
		);
		await asentar();
		contestar();
		await asentar();

		expect(veces).toBe(1);
		for (const fila of filas) {
			expect(fila.get('img').attributes('src')).toBe('data:image/png;base64,LENTO');
		}
	});
});

describe('el oyente del tema', () => {
	test('es uno solo para todas las instancias', async () => {
		for (let i = 0; i < 4; i++) {
			montar({ name: 'firefox' });
		}
		await asentar();

		expect(cuantosOyentes('vicons:theme-changed')).toBe(1);
	});

	test('se suelta cuando se va la última', async () => {
		// Es lo que garantizaba el oyente por instancia y no se puede perder: un
		// oyente sobre un componente muerto resuelve iconos que nadie dibuja.
		const una = montar({ name: 'firefox' });
		const otra = montar({ name: 'firefox' });
		await asentar();
		expect(cuantosOyentes('vicons:theme-changed')).toBe(1);

		una.unmount();
		expect(cuantosOyentes('vicons:theme-changed')).toBe(1);

		otra.unmount();
		expect(cuantosOyentes('vicons:theme-changed')).toBe(0);
	});

	test('cambiar de tema vuelve a resolver, aunque estuviera memorizado', async () => {
		// Es la mitad de para qué se pide el icono por nombre y no por ruta. Y es
		// justo lo que una memoria sin invalidar rompe.
		ponerEnElTema('firefox', 'data:image/png;base64,CLARO');
		const icono = montar({ name: 'firefox' });
		await asentar();
		expect(icono.get('img').attributes('src')).toBe('data:image/png;base64,CLARO');

		ponerEnElTema('firefox', 'data:image/png;base64,OSCURO');
		await emitir('vicons:theme-changed');
		await esperarLaRecarga();

		expect(icono.get('img').attributes('src')).toBe('data:image/png;base64,OSCURO');
	});

	test('lo pedido contra el tema viejo no se memoriza', async () => {
		// Si la respuesta que estaba en vuelo al cambiar el tema se guardara, el
		// icono del tema anterior quedaría memorizado como si fuera del nuevo, y
		// la próxima fila lo recibiría sin volver a preguntar.
		// El primer pedido queda colgado y se contesta **después** del cambio de
		// tema; del segundo en adelante, el tema ya es el nuevo.
		let contestarElViejo = () => {};
		let pedidos = 0;
		ponerEnElTema('firefox', () => {
			pedidos++;
			if (pedidos === 1) {
				return new Promise<string>((listo) => {
					contestarElViejo = () => listo('data:image/png;base64,VIEJO');
				});
			}
			return Promise.resolve('data:image/png;base64,NUEVO');
		});

		montar({ name: 'firefox' });
		await asentar();

		await emitir('vicons:theme-changed');
		await asentar();
		// Llega tarde, con el tema ya cambiado.
		contestarElViejo();
		await asentar();

		const segunda = montar({ name: 'firefox' });
		await asentar();

		expect(segunda.get('img').attributes('src')).toBe('data:image/png;base64,NUEVO');
	});
});

/**
 * La versión del tema, para quien resuelve por su cuenta.
 *
 * `ThemeIcon` resuelve **un** nombre. La tienda no puede usarlo: prueba una
 * lista de nombres candidatos en orden —los temas no se ponen de acuerdo entre
 * el `Icon=` del `.desktop`, el identificador de AppStream y el nombre del
 * paquete— y si ninguno está, cae a un archivo del catálogo.
 *
 * Igual tiene que volver a resolver cuando cambia el tema, y sin esto la única
 * salida es su propio `listen`: un oyente más por instancia al lado del que la
 * librería ya tiene para todas. Que es exactamente el composable que se está
 * borrando de cada aplicación.
 */
describe('la versión del tema', () => {
	/** Un componente cualquiera que la mira, como la haría la tienda. */
	const QUIEN_RESUELVE_SOLO = {
		setup() {
			const version = usarLaVersionDelTema();
			return () => h('span', String(version.value));
		},
	};

	function montarLector() {
		const componente = mount(QUIEN_RESUELVE_SOLO);
		montados.push(componente);
		return componente;
	}

	test('sube al cambiar el tema', async () => {
		const lector = montarLector();
		await asentar();
		expect(lector.text()).toBe('0');

		await emitir('vicons:theme-changed');
		await asentar();

		expect(lector.text()).toBe('1');
	});

	test('y se cuelga del oyente que ya está, sin poner otro', async () => {
		// Es el punto entero: si cada uno registrara el suyo, esto sería el
		// composable por instancia con otro nombre.
		montar({ name: 'firefox' });
		await asentar();
		expect(cuantosOyentes('vicons:theme-changed')).toBe(1);

		montarLector();
		montarLector();
		await asentar();

		expect(cuantosOyentes('vicons:theme-changed')).toBe(1);
	});

	test('y el último que se va lo suelta', async () => {
		const lector = montarLector();
		await asentar();
		expect(cuantosOyentes('vicons:theme-changed')).toBe(1);

		lector.unmount();
		await asentar();

		expect(cuantosOyentes('vicons:theme-changed')).toBe(0);
	});
});
