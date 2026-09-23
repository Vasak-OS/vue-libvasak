/**
 * El icono que no sabe de antemano cuánto mide.
 *
 * `ThemeIcon` escribía siempre `width` y `height` en línea, a partir de `size`
 * en píxeles. Eso alcanza para casi todo el escritorio —un icono de barra mide
 * 14, uno de tarjeta 28— pero no para el widget del clima, que vive en una
 * celda de la cuadrícula y se mide en `cqmin`: pasarle un número fijo lo hacía
 * salirse de su caja y verse cortado (vasak-desktop#105).
 *
 * No se podía resolver del lado de quien lo usa. Un `style` en línea le gana a
 * cualquier clase, así que mientras el componente lo escribiera, el de afuera
 * no tenía forma de mandar. Por eso el arreglo va acá y no en el widget: hoy no
 * existe forma de pedirle a `ThemeIcon` un icono que se mida con su caja, y que
 * el clima sea el único que lo necesita es de ahora.
 *
 * Lo que se vigila:
 *
 * - que `size="auto"` **no escriba estilo**, que es lo único que devuelve el
 *   mando a las clases;
 * - que el número por omisión siga siendo 18, porque hay cuarenta y seis
 *   lugares en el taller que no pasan `size` y perderían su tamaño **sin que
 *   nada falle ni avise**;
 * - y que el hueco previo a resolver haga lo mismo que la imagen, porque si no
 *   la fila salta justo en el caso fluido.
 */

import { afterEach, describe, expect, test } from 'bun:test';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import ThemeIcon from '../src/icons/ThemeIcon.vue';
import { olvidarTodo, ponerEnElTema } from './dobles';

async function asentar(vueltas = 8) {
	for (let i = 0; i < vueltas; i++) await nextTick();
}

const montados: { unmount: () => void }[] = [];

function montar(props: Record<string, unknown>) {
	const vista = mount(ThemeIcon, { props });
	montados.push(vista);
	return vista;
}

afterEach(() => {
	for (const v of montados.splice(0)) v.unmount();
	olvidarTodo();
});

describe('cuando el tamaño lo pone quien lo usa', () => {
	test('con «auto» la imagen no escribe estilo', async () => {
		ponerEnElTema('weather-clear', 'data:image/png;base64,AAA');
		const vista = montar({ name: 'weather-clear', size: 'auto' });
		await asentar();

		const img = vista.find('img');
		expect(img.exists()).toBe(true);
		// `toBeUndefined` y no `toBe('')`: un `:style="{}"` igual escribe el
		// atributo vacío, y con el atributo puesto la regla en línea existe.
		expect(img.attributes('style')).toBeUndefined();
	});

	test('y el hueco previo tampoco', async () => {
		// Sin poner nada en el tema, la fuente nunca resuelve y queda el `span`.
		const vista = montar({ name: 'no-esta-en-el-tema', size: 'auto' });
		await asentar();

		const hueco = vista.find('span');
		expect(hueco.exists()).toBe(true);
		expect(hueco.attributes('style')).toBeUndefined();
	});

	test('las clases de quien lo usa llegan igual', async () => {
		ponerEnElTema('weather-clear', 'data:image/png;base64,AAA');
		const vista = mount(ThemeIcon, {
			props: { name: 'weather-clear', size: 'auto' },
			attrs: { class: 'size-full' },
		});
		montados.push(vista);
		await asentar();

		// Es lo que hace que «auto» sirva de algo: sin estilo en línea y con la
		// clase puesta, el tamaño sale de la caja.
		expect(vista.find('img').classes()).toContain('size-full');
	});
});

describe('lo que no cambia', () => {
	test('un número sigue escribiendo los dos lados en píxeles', async () => {
		ponerEnElTema('folder', 'data:image/png;base64,AAA');
		const vista = montar({ name: 'folder', size: 28 });
		await asentar();

		const estilo = vista.find('img').attributes('style');
		expect(estilo).toContain('width: 28px');
		expect(estilo).toContain('height: 28px');
	});

	test('sin «size» sigue midiendo 18', async () => {
		// Los cuarenta y seis lugares que no lo pasan. Si esto se rompe, se
		// rompen todos a la vez y ninguno avisa: el icono se dibuja en su
		// tamaño natural y sólo se ve mirando.
		ponerEnElTema('folder', 'data:image/png;base64,AAA');
		const vista = montar({ name: 'folder' });
		await asentar();

		expect(vista.find('img').attributes('style')).toContain('width: 18px');
	});

	test('el hueco de un tamaño en píxeles sigue reservando el lugar', async () => {
		const vista = montar({ name: 'no-esta-en-el-tema', size: 28 });
		await asentar();

		expect(vista.find('span').attributes('style')).toContain('width: 28px');
	});
});

describe('el hueco ocupa lugar de verdad', () => {
	/**
	 * Un `span` es inline, y el alto y el ancho **no aplican a un inline no
	 * reemplazado**. La imagen sí se mide, porque un `img` es reemplazado: o sea
	 * que el hueco podía no reservar nada mientras la imagen después ocupaba su
	 * tamaño, y la fila saltaba justo al aparecer el icono. Adentro de un
	 * contenedor flex no se notaba —ahí el hueco es un elemento flex y su
	 * `display` se convierte solo—, que es como pasó desapercibido: casi todos
	 * los iconos del escritorio viven en una fila flex.
	 *
	 * Se mira la clase y no el alto calculado porque `happy-dom` no hace
	 * maquetado: `getBoundingClientRect()` devuelve ceros para todo, así que una
	 * prueba que midiera pasaría siempre y no diría nada.
	 */
	test('el hueco no es un inline, con medida o sin ella', async () => {
		for (const size of [28, 'auto']) {
			const vista = montar({ name: 'no-esta-en-el-tema', size });
			await asentar();

			expect(vista.find('span').classes()).toContain('inline-block');
		}
	});
});
