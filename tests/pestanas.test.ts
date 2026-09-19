/**
 * Las pestañas, que eran tres implementaciones distintas.
 *
 * La terminal tenía vista previa y menú de «cerrar las demás»; el gestor de
 * archivos, casi lo mismo con otro menú; el editor, el punto de «sin guardar» y
 * ninguna de las dos cosas anteriores. Esto es la unión, para que una pestaña
 * se comporte igual en cualquier ventana del escritorio.
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mount } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import TabBar from '../src/tabs/TabBar.vue';
import TabItem from '../src/tabs/TabItem.vue';
import WindowFrame from '../src/window/WindowFrame.vue';
import type { ElementoDePestana } from '../src/index';
import { olvidarTodo } from './dobles';

const PESTANAS: ElementoDePestana[] = [
	{ id: 'a', label: 'Primera' },
	{ id: 'b', label: 'Segunda', dirty: true },
	{ id: 'c', label: 'Tercera', closable: false },
];

/**
 * Lo montado en la prueba en curso.
 *
 * El nombre desplegado de una pestaña se teletransporta al `body`, así que
 * sobrevive al final de la prueba y lo ve la siguiente: una que afirma que
 * **no** hay nada desplegado encontraba lo de la anterior.
 */
const montadas: Array<{ unmount: () => void }> = [];

function montarLaBarra(props: Record<string, unknown> = {}) {
	const vista = mount(TabBar, {
		props: { tabs: PESTANAS, modelValue: 'a', closeLabel: 'Cerrar', ...props },
	});
	montadas.push(vista);
	return vista;
}

/** La misma barra, pero dentro de un marco con la barra a un costado. */
function montarEnVertical() {
	const vista = mount(WindowFrame, {
		props: { position: 'left' },
		slots: {
			barra: () => h(TabBar, { tabs: PESTANAS, modelValue: 'a', closeLabel: 'Cerrar' }),
		},
	});
	montadas.push(vista);
	return vista;
}

beforeEach(() => {
	olvidarTodo();
});

afterEach(() => {
	while (montadas.length) montadas.pop()?.unmount();
	document.body.innerHTML = '';
});

describe('elegir y cerrar', () => {
	test('un clic elige, y lo dice de las dos maneras', async () => {
		// `update:modelValue` para el `v-model` y `select` para quien quiera
		// enterarse sin atar el estado.
		const vista = montarLaBarra();

		await vista.findAllComponents(TabItem)[1].trigger('click');

		expect(vista.emitted('update:modelValue')?.[0]).toEqual(['b']);
		expect(vista.emitted('select')?.[0]).toEqual(['b']);
	});

	test('el botón de cerrar cierra la suya y no la activa', async () => {
		const vista = montarLaBarra();

		await vista.findAllComponents(TabItem)[0].find('button').trigger('click');

		expect(vista.emitted('close')?.[0]).toEqual(['a']);
		// Y no la elige de paso: el clic no sube al contenedor.
		expect(vista.emitted('select')).toBeUndefined();
	});

	test('el clic del medio también cierra', async () => {
		// Es lo que espera quien viene de un navegador, y no lo tenía ninguna de
		// las tres barras del escritorio.
		const vista = montarLaBarra();

		await vista.findAllComponents(TabItem)[0].trigger('auxclick', { button: 1 });

		expect(vista.emitted('close')?.[0]).toEqual(['a']);
	});

	test('una que no se puede cerrar no ofrece cerrarla', () => {
		const vista = montarLaBarra();

		expect(vista.findAllComponents(TabItem)[2].find('button').exists()).toBe(false);
	});
});

describe('los cambios sin guardar', () => {
	test('se ven como un punto', () => {
		// Sólo lo tenía el editor de texto.
		const vista = montarLaBarra();

		expect(vista.findAllComponents(TabItem)[1].find('.rounded-full').exists()).toBe(true);
	});

	test('y el punto deja su lugar al botón cuando se lo va a usar', async () => {
		// En ciento treinta y seis píxeles no entran el punto y la cruz.
		const pestana = montarLaBarra().findAllComponents(TabItem)[1];
		expect(pestana.find('button').exists()).toBe(false);

		await pestana.trigger('mouseenter');

		expect(pestana.find('.rounded-full').exists()).toBe(false);
		expect(pestana.find('button').exists()).toBe(true);
	});
});

describe('el menú', () => {
	test('se abre con el clic derecho, con la posición del puntero', async () => {
		const vista = montarLaBarra();

		await vista.findAllComponents(TabItem)[0].trigger('contextmenu', { clientX: 40, clientY: 12 });

		expect(vista.emitted('menu')?.[0]).toEqual([{ id: 'a', x: 40, y: 12 }]);
	});
});

describe('reordenar', () => {
	test('lo que se emite es la lista nueva, no un par de índices', async () => {
		// Quien la recibe la guarda tal cual: con índices, cada aplicación
		// tendría que reimplementar el movimiento, que es donde se cuelan los
		// errores de uno.
		const vista = montarLaBarra();
		const envoltorios = vista.findAll('[draggable="true"]');

		await envoltorios[0].trigger('dragstart', { dataTransfer: { setData() {}, effectAllowed: '' } });
		await envoltorios[2].trigger('dragover', { dataTransfer: {} });
		await envoltorios[2].trigger('drop');

		expect(vista.emitted('reorder')?.[0]?.[0]).toEqual([PESTANAS[1], PESTANAS[2], PESTANAS[0]]);
	});

	test('y una barra de orden fijo no deja arrastrar', () => {
		const vista = montarLaBarra({ fixedOrder: true });

		expect(vista.findAll('[draggable="true"]')).toHaveLength(0);
	});
});

describe('con la barra a un costado', () => {
	test('las pestañas se apilan sin que nadie se lo pida', async () => {
		// La orientación llega por inyección desde el marco: el gestor de
		// archivos no le pasa nada a su barra de pestañas.
		const vista = montarEnVertical();
		await nextTick();

		// El carril es el hijo con el desplazamiento, no la raíz de la barra.
		const carril = vista.findComponent(TabBar).findAll('div')[1];
		expect(carril.classes()).toContain('flex-col');
		expect(carril.classes()).toContain('overflow-y-auto');
	});

	test('se encogen al tamaño de un botón', async () => {
		// Ocupando el ancho de la columna, una barra vertical se come la
		// ventana: con cuatro pestañas abiertas quedaba menos de la mitad para
		// el contenido.
		const vista = montarEnVertical();
		await nextTick();

		const clases = vista.findComponent(TabItem).find('div').classes();
		expect(clases).toContain('size-8');
		expect(clases).not.toContain('w-34');
		expect(clases).not.toContain('w-full');
	});

	test('y muestran la inicial, no un cuadrado vacío', async () => {
		// Sin icono no hay con qué distinguir una de otra.
		const vista = montarEnVertical();
		await nextTick();

		expect(vista.findComponent(TabItem).text()).toBe('P');
	});
});

describe('el nombre desplegado', () => {
	/** Lo desplegado vive en el `body`, no adentro del envoltorio. */
	function desplegados() {
		return [...document.body.querySelectorAll('.whitespace-nowrap')].map((uno) => uno.textContent);
	}

	test('aparece al pasar el puntero y se va al salir', async () => {
		const vista = montarEnVertical();
		await nextTick();
		const pestana = vista.findComponent(TabItem);

		await pestana.trigger('mouseenter');
		expect(desplegados()).toContain('Primera');

		await pestana.trigger('mouseleave');
		await nextTick();
		expect(desplegados()).not.toContain('Primera');
	});

	test('y también al enfocar, que si no el teclado queda a ciegas', async () => {
		// Sólo con el puntero, quien navega con el tabulador tendría una
		// columna de iniciales sin manera de saber qué son.
		const vista = montarEnVertical();
		await nextTick();

		await vista.findComponent(TabItem).trigger('focus');

		expect(desplegados()).toContain('Primera');
	});

	test('con la barra arriba no se despliega nada', async () => {
		// Ahí el nombre ya está escrito en la pestaña.
		const vista = montarLaBarra();

		await vista.findAllComponents(TabItem)[0].trigger('mouseenter');
		await nextTick();

		expect(desplegados()).not.toContain('Primera');
	});

	test('el botón de cerrar vive en el desplegado', async () => {
		// Compacta no entra, y sin él no habría forma de cerrar una pestaña con
		// la barra a un costado salvo el clic del medio.
		const vista = montarEnVertical();
		await nextTick();
		await vista.findComponent(TabItem).trigger('mouseenter');

		const boton = document.body.querySelector<HTMLElement>('button[aria-label*="Primera"]');
		expect(boton).not.toBeNull();

		boton?.click();
		await nextTick();

		expect(vista.findComponent(TabBar).emitted('close')?.[0]).toEqual(['a']);
	});
});

describe('el teclado', () => {
	test('sólo una pestaña entra en el orden de tabulación', () => {
		// El patrón de una lista de pestañas es «foco itinerante». Con las nueve
		// alcanzables con Tab, salir de la barra cuesta nueve pulsaciones.
		const vista = montarLaBarra();

		const indices = vista.findAll('[role="tab"]').map((uno) => uno.attributes('tabindex'));
		expect(indices).toEqual(['0', '-1', '-1']);
	});

	test('las flechas mueven el foco y dan la vuelta', async () => {
		const vista = montarLaBarra();
		const pestanas = () => vista.findAll('[role="tab"]');

		await pestanas()[0].trigger('keydown', { key: 'ArrowRight' });
		expect(pestanas().map((uno) => uno.attributes('tabindex'))).toEqual(['-1', '0', '-1']);

		// Y desde la primera hacia atrás se va a la última.
		await pestanas()[1].trigger('keydown', { key: 'ArrowLeft' });
		await pestanas()[0].trigger('keydown', { key: 'ArrowLeft' });
		expect(pestanas().map((uno) => uno.attributes('tabindex'))).toEqual(['-1', '-1', '0']);
	});

	test('Inicio y Fin van a los extremos', async () => {
		const vista = montarLaBarra();

		await vista.findAll('[role="tab"]')[0].trigger('keydown', { key: 'End' });
		expect(vista.findAll('[role="tab"]')[2].attributes('tabindex')).toBe('0');

		await vista.findAll('[role="tab"]')[2].trigger('keydown', { key: 'Home' });
		expect(vista.findAll('[role="tab"]')[0].attributes('tabindex')).toBe('0');
	});

	test('Alt y una flecha reordenan sin mouse', async () => {
		// El arrastre nativo es de puntero y nada más: sin esto, reordenar no se
		// puede hacer con teclado.
		const vista = montarLaBarra();

		await vista.findAll('[role="tab"]')[0].trigger('keydown', { key: 'ArrowRight', altKey: true });

		expect(vista.emitted('reorder')?.[0]?.[0]).toEqual([PESTANAS[1], PESTANAS[0], PESTANAS[2]]);
	});

	test('y no en una barra de orden fijo', async () => {
		const vista = montarLaBarra({ fixedOrder: true });

		await vista.findAll('[role="tab"]')[0].trigger('keydown', { key: 'ArrowRight', altKey: true });

		expect(vista.emitted('reorder')).toBeUndefined();
	});

	test('la lista dice para qué lado va', async () => {
		expect(montarLaBarra().find('[role="tablist"]').attributes('aria-orientation')).toBe(
			'horizontal'
		);

		const vertical = montarEnVertical();
		await nextTick();
		expect(vertical.find('[role="tablist"]').attributes('aria-orientation')).toBe('vertical');
	});
});

describe('lo que se oye', () => {
	test('una pestaña con cambios lo dice, y no sólo con el punto', () => {
		// El punto va `aria-hidden`: sin esto, quien usa un lector de pantalla
		// podía cerrar una pestaña modificada sin enterarse.
		const vista = montarLaBarra({ dirtyLabel: 'sin guardar' });

		expect(vista.findAll('[role="tab"]')[1].attributes('aria-label')).toBe(
			'Segunda · sin guardar'
		);
		expect(vista.findAll('[role="tab"]')[0].attributes('aria-label')).toBe('Primera');
	});

	test('y el botón de cerrar dice cuál cierra', () => {
		// «Cerrar» tres veces seguidas no distingue nada.
		const vista = montarLaBarra();

		expect(vista.findAllComponents(TabItem)[0].find('button').attributes('aria-label')).toBe(
			'Cerrar: Primera'
		);
	});

	test('el texto de ayuda sale de `tooltip` cuando la pestaña lo trae', () => {
		// Está en el contrato desde el primer día y se ignoraba: lo que se
		// mostraba era siempre el `label`.
		const vista = mount(TabBar, {
			props: {
				tabs: [{ id: 'a', label: 'ruta.txt', tooltip: '/home/pato/ruta.txt' }],
				modelValue: 'a',
			},
		});

		expect(vista.find('[role="tab"]').attributes('title')).toBe('/home/pato/ruta.txt');
	});
});

describe('la rueda', () => {
	/**
	 * Un carril que se comporta como el de un navegador.
	 *
	 * `happy-dom` guarda el `scrollLeft` que se le asigne aunque no haya nada
	 * que desplazar; un navegador lo acota al desbordamiento. Sin acotarlo acá,
	 * la prueba no distingue el caso que importa —una barra corta que se comía
	 * el desplazamiento de lo que hay debajo—.
	 */
	function acotarElCarril(nodo: HTMLElement, desbordamiento: number) {
		let valor = 0;
		Object.defineProperty(nodo, 'scrollLeft', {
			configurable: true,
			get: () => valor,
			set: (nuevo: number) => {
				valor = Math.max(0, Math.min(nuevo, desbordamiento));
			},
		});
	}

	function rodar(vista: ReturnType<typeof montarLaBarra>, desbordamiento: number) {
		const carril = vista.findAll('div')[1].element as HTMLElement;
		acotarElCarril(carril, desbordamiento);
		const evento = new WheelEvent('wheel', { deltaY: 120, cancelable: true, bubbles: true });
		carril.dispatchEvent(evento);
		return evento;
	}

	test('no se queda el evento cuando el carril no se movió', () => {
		// Una barra con dos pestañas no tiene nada que desplazar: comerse la
		// rueda ahí deja sin desplazar a lo que haya debajo.
		expect(rodar(montarLaBarra(), 0).defaultPrevented).toBe(false);
	});

	test('y sí cuando lo desplazó', () => {
		// Con pestañas de más, la rueda es lo único que las alcanza sin un mouse
		// con rueda horizontal.
		expect(rodar(montarLaBarra(), 400).defaultPrevented).toBe(true);
	});
});
