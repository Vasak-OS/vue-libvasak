/**
 * El desplegable que reemplaza al `<select>` nativo (vue-libvasak#103, 2.19.0).
 *
 * `SelectField` pasó a ser `SearchSelect` sin búsqueda, y para eso el
 * desplegable tuvo que aprender lo que el `<select>` hacía solo: opciones que
 * se ven pero no se eligen, un `id` en el botón para que una `<label for>` lo
 * nombre, saltar a una opción escribiendo su letra inicial, y abrirse hacia
 * arriba cuando abajo no entra.
 *
 * Al final, la guarda: ningún componente de la librería vuelve a dibujar un
 * `<select>`, porque su lista abierta la pinta el sistema y no el tema.
 */

import { afterEach, beforeEach, describe, expect, setSystemTime, test } from 'bun:test';
import { mount, type VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import type { OpcionDeBusqueda } from '../src/search/buscar';
import SearchSelect from '../src/search/SearchSelect.vue';
import { olvidarTodo } from './dobles';

const vistas: VueWrapper[] = [];
function armar(props: Record<string, unknown>) {
	const vista = mount(SearchSelect, {
		props: { modelValue: '', options: [], label: 'Posición', ...props },
		attachTo: document.body,
	});
	vistas.push(vista);
	return vista;
}

async function abrir(vista: VueWrapper) {
	await vista.get('button').trigger('click');
	await nextTick();
}

const panel = (vista: VueWrapper) => vista.get('[role="listbox"]').element.parentElement as HTMLElement;
const opciones = (vista: VueWrapper) => vista.findAll('[role="option"]');
/** La opción recorrida, por el `aria-activedescendant` de la lista. */
function recorrida(vista: VueWrapper) {
	const id = vista.get('[role="listbox"]').attributes('aria-activedescendant');
	return vista.find(`[id="${id}"]`).text();
}

beforeEach(() => olvidarTodo());
afterEach(() => {
	for (const vista of vistas.splice(0)) vista.unmount();
	document.body.innerHTML = '';
});

describe('las opciones deshabilitadas', () => {
	const CON_UNA_APAGADA: OpcionDeBusqueda[] = [
		{ valor: 'a', etiqueta: 'Abajo' },
		{ valor: 'b', etiqueta: 'Borde', disabled: true },
		{ valor: 'c', etiqueta: 'Centro' },
	];

	test('se ven, apagadas y anunciadas como tales', async () => {
		const vista = armar({ options: CON_UNA_APAGADA, searchable: false });
		await abrir(vista);

		const [a, b] = opciones(vista);
		expect(b?.text()).toBe('Borde');
		expect(b?.attributes('aria-disabled')).toBe('true');
		expect(b?.classes()).toContain('opacity-50');
		expect(b?.classes()).toContain('cursor-not-allowed');
		expect(a?.attributes('aria-disabled')).toBeUndefined();
	});

	test('el teclado las saltea, para abajo y para arriba', async () => {
		const vista = armar({ modelValue: 'a', options: CON_UNA_APAGADA, searchable: false });
		await abrir(vista);
		const lista = vista.get('[role="listbox"]');

		await lista.trigger('keydown', { key: 'ArrowDown' });
		expect(recorrida(vista)).toBe('Centro');

		await lista.trigger('keydown', { key: 'ArrowUp' });
		expect(recorrida(vista)).toBe('Abajo');

		await lista.trigger('keydown', { key: 'ArrowDown' });
		await lista.trigger('keydown', { key: 'Enter' });
		expect(vista.emitted('update:modelValue')).toEqual([['c']]);
	});

	test('Inicio y Fin van a la primera y la última que se pueden elegir', async () => {
		const vista = armar({
			modelValue: 'b',
			options: [
				{ valor: 'x', etiqueta: 'Primera', disabled: true },
				{ valor: 'b', etiqueta: 'Medio' },
				{ valor: 'c', etiqueta: 'Otra' },
				{ valor: 'z', etiqueta: 'Última', disabled: true },
			],
			searchable: false,
		});
		await abrir(vista);
		const lista = vista.get('[role="listbox"]');

		await lista.trigger('keydown', { key: 'End' });
		expect(recorrida(vista)).toBe('Otra');
		await lista.trigger('keydown', { key: 'Home' });
		expect(recorrida(vista)).toBe('Medio');
	});

	test('sin nada elegido, abre sobre la primera que se puede elegir', async () => {
		const vista = armar({
			options: [
				{ valor: 'x', etiqueta: 'Apagada', disabled: true },
				{ valor: 'y', etiqueta: 'Prendida' },
			],
			searchable: false,
		});
		await abrir(vista);

		await vista.get('[role="listbox"]').trigger('keydown', { key: 'Enter' });

		expect(vista.emitted('update:modelValue')).toEqual([['y']]);
	});

	test('el clic sobre una no la elige, y la lista sigue abierta', async () => {
		const vista = armar({ modelValue: 'a', options: CON_UNA_APAGADA, searchable: false });
		await abrir(vista);

		await opciones(vista)[1]?.find('span').trigger('click');

		expect(vista.emitted('update:modelValue')).toBeUndefined();
		expect(vista.find('[role="listbox"]').exists()).toBe(true);
	});

	test('pasar el ratón por encima no le lleva la marca', async () => {
		// Si la marca quedara sobre una apagada, Enter no haría nada y no se
		// sabría por qué.
		const vista = armar({ modelValue: 'a', options: CON_UNA_APAGADA, searchable: false });
		await abrir(vista);

		await opciones(vista)[1]?.trigger('mousemove');

		expect(recorrida(vista)).toBe('Abajo');
	});

	test('también con búsqueda: el clic no la elige', async () => {
		const vista = armar({ options: CON_UNA_APAGADA });
		await abrir(vista);

		await opciones(vista)[1]?.trigger('click');

		expect(vista.emitted('update:modelValue')).toBeUndefined();
	});
});

describe('el id del botón', () => {
	test('`buttonId` llega al botón, que es lo que una `<label for>` puede nombrar', () => {
		const vista = armar({ buttonId: 'posicion-de-la-barra' });

		expect(vista.get('button').attributes('id')).toBe('posicion-de-la-barra');
		expect(vista.attributes('id')).toBeUndefined();
	});

	test('`buttonAttrs` llega al botón y no pisa lo que el botón ya dice de sí', () => {
		const vista = armar({ buttonAttrs: { 'aria-describedby': 'ayuda', 'data-x': '1' } });
		const boton = vista.get('button');

		expect(boton.attributes('aria-describedby')).toBe('ayuda');
		expect(boton.attributes('data-x')).toBe('1');
		expect(boton.attributes('aria-haspopup')).toBe('listbox');
		expect(vista.attributes('aria-describedby')).toBeUndefined();
	});

	test('sin pedirlo, el botón no lleva `id`', () => {
		expect(armar({}).get('button').attributes('id')).toBeUndefined();
	});
});

describe('el salto por letra inicial', () => {
	const LADOS: OpcionDeBusqueda[] = [
		{ valor: 'abajo', etiqueta: 'Abajo' },
		{ valor: 'ancho', etiqueta: 'Ancho' },
		{ valor: 'arriba', etiqueta: 'Arriba' },
		{ valor: 'derecha', etiqueta: 'Derecha' },
		{ valor: 'izquierda', etiqueta: 'Izquierda' },
	];

	// El reloj lo maneja la prueba: las letras «seguidas» lo son por tiempo, y
	// esperar de verdad haría la prueba lenta y frágil.
	let ahora = 0;
	function escribir(vista: VueWrapper, tecla: string, despues = 100) {
		ahora += despues;
		setSystemTime(new Date(ahora));
		return vista.get('[role="listbox"]').trigger('keydown', { key: tecla });
	}

	beforeEach(() => {
		ahora = Date.UTC(2026, 9, 12);
		setSystemTime(new Date(ahora));
	});
	afterEach(() => setSystemTime());

	test('una letra lleva a la primera opción que empieza con ella', async () => {
		const vista = armar({ modelValue: 'abajo', options: LADOS, searchable: false });
		await abrir(vista);

		await escribir(vista, 'd');

		expect(recorrida(vista)).toBe('Derecha');
		await vista.get('[role="listbox"]').trigger('keydown', { key: 'Enter' });
		expect(vista.emitted('update:modelValue')).toEqual([['derecha']]);
	});

	test('sin importar mayúsculas', async () => {
		const vista = armar({ modelValue: 'abajo', options: LADOS, searchable: false });
		await abrir(vista);

		await escribir(vista, 'I');

		expect(recorrida(vista)).toBe('Izquierda');
	});

	test('las letras seguidas se juntan: «ar» va a Arriba', async () => {
		const vista = armar({ modelValue: 'abajo', options: LADOS, searchable: false });
		await abrir(vista);

		await escribir(vista, 'a');
		expect(recorrida(vista)).toBe('Ancho');
		await escribir(vista, 'r');

		expect(recorrida(vista)).toBe('Arriba');
	});

	test('pero pasado un rato, la letra nueva empieza de cero', async () => {
		const vista = armar({ modelValue: 'abajo', options: LADOS, searchable: false });
		await abrir(vista);

		await escribir(vista, 'a');
		await escribir(vista, 'i', 2000);

		expect(recorrida(vista)).toBe('Izquierda');
	});

	test('la misma letra repetida recorre las que empiezan con ella, y da la vuelta', async () => {
		const vista = armar({ modelValue: 'abajo', options: LADOS, searchable: false });
		await abrir(vista);

		await escribir(vista, 'a');
		expect(recorrida(vista)).toBe('Ancho');
		await escribir(vista, 'a');
		expect(recorrida(vista)).toBe('Arriba');
		await escribir(vista, 'a');
		expect(recorrida(vista)).toBe('Abajo');
	});

	test('saltea las deshabilitadas', async () => {
		const vista = armar({
			modelValue: 'abajo',
			options: LADOS.map((o) => (o.valor === 'ancho' ? { ...o, disabled: true } : o)),
			searchable: false,
		});
		await abrir(vista);

		await escribir(vista, 'a');

		expect(recorrida(vista)).toBe('Arriba');
	});
});

describe('hacia dónde se abre', () => {
	const UNA = [{ valor: 'a', etiqueta: 'A' }];
	const original = HTMLElement.prototype.getBoundingClientRect;
	const alto = window.innerHeight;

	/** Pone el botón a `top` px del borde de arriba de una ventana de `ventana` de alto. */
	function botonEn(top: number, ventana: number) {
		Object.defineProperty(window, 'innerHeight', { configurable: true, value: ventana });
		HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
			if (this.getAttribute('aria-haspopup') === 'listbox') {
				return { top, bottom: top + 32, left: 8, right: 208, width: 200, height: 32, x: 8, y: top, toJSON() {} } as DOMRect;
			}
			return original.call(this);
		};
	}

	afterEach(() => {
		HTMLElement.prototype.getBoundingClientRect = original;
		Object.defineProperty(window, 'innerHeight', { configurable: true, value: alto });
	});

	test('al pie de la ventana, hacia arriba aunque no se lo pida', async () => {
		// Abajo quedan 36 px y la lista mide hasta 240: hacia abajo se cortaría
		// contra el borde y no habría forma de llegar al final.
		botonEn(700, 768);
		const vista = armar({ options: UNA });
		await abrir(vista);

		expect(panel(vista).className).toContain('bottom-full');
		expect(panel(vista).className).not.toContain('mt-1');
	});

	test('arriba de la ventana, hacia abajo como siempre', async () => {
		botonEn(8, 768);
		const vista = armar({ options: UNA });
		await abrir(vista);

		expect(panel(vista).className).toContain('mt-1');
		expect(panel(vista).className).not.toContain('bottom-full');
	});

	test('si arriba hay menos lugar que abajo, no se da vuelta', async () => {
		// Ventana baja: abajo no entra, pero arriba entra menos todavía.
		botonEn(80, 200);
		const vista = armar({ options: UNA });
		await abrir(vista);

		expect(panel(vista).className).not.toContain('bottom-full');
	});

	test('con búsqueda, el encabezado cuenta: con 260 px abajo se abre hacia arriba', async () => {
		// El campo de búsqueda suma unos 52 px arriba de la lista: con 260 libres
		// entra la lista sola pero no la lista con su campo, y hacia abajo se
		// cortaría contra el borde (lo marcó la revisión de vue-libvasak#104).
		botonEn(476, 768);
		const vista = armar({ options: UNA, searchable: true });
		await abrir(vista);

		expect(panel(vista).className).toContain('bottom-full');
	});

	test('sin búsqueda, los mismos 260 px alcanzan y se abre hacia abajo', async () => {
		botonEn(476, 768);
		const vista = armar({ options: UNA, searchable: false });
		await abrir(vista);

		expect(panel(vista).className).toContain('mt-1');
		expect(panel(vista).className).not.toContain('bottom-full');
	});

	test('`up` la sigue forzando hacia arriba, aunque abajo sobre lugar', async () => {
		botonEn(8, 768);
		const vista = armar({ options: UNA, up: true });
		await abrir(vista);

		expect(panel(vista).className).toContain('bottom-full');
	});
});

describe('la guarda', () => {
	test('ningún componente de la librería dibuja un `<select>`', async () => {
		// La lista abierta de un `<select>` la dibuja el sistema: no toma el
		// tema, ni el radio, ni la tipografía. Se mira lo que se dibuja —las
		// plantillas sin sus comentarios y las funciones de dibujo—, no la
		// prosa, que puede nombrar al `<select>` para explicar por qué no está.
		const raiz = new URL('../src/', import.meta.url).pathname;
		const culpables: string[] = [];

		for await (const ruta of new Bun.Glob('**/*.{vue,ts}').scan(raiz)) {
			const fuente = await Bun.file(raiz + ruta).text();
			if (ruta.endsWith('.vue')) {
				const inicio = fuente.indexOf('<template');
				const fin = fuente.lastIndexOf('</template>');
				// Los comentarios se sacan hasta que no quede ninguno: una sola pasada
				// puede armar un `<!--` nuevo con los pedazos de alrededor.
				let plantilla = inicio >= 0 ? fuente.slice(inicio, fin) : '';
				let anterior: string;
				do {
					anterior = plantilla;
					plantilla = plantilla.replace(/<!--[\s\S]*?-->/g, '');
				} while (plantilla !== anterior);
				if (/<select[\s>/]/i.test(plantilla)) culpables.push(`${ruta} (plantilla)`);
			}
			if (/\b(?:h|createElement|createVNode)\(\s*['"]select['"]/.test(fuente)) culpables.push(`${ruta} (dibujo)`);
		}

		expect(culpables).toEqual([]);
	});
});
