/**
 * Las pestañas, que eran tres implementaciones distintas.
 *
 * La terminal tenía vista previa y menú de «cerrar las demás»; el gestor de
 * archivos, casi lo mismo con otro menú; el editor, el punto de «sin guardar» y
 * ninguna de las dos cosas anteriores. Esto es la unión, para que una pestaña
 * se comporte igual en cualquier ventana del escritorio.
 */

import { beforeEach, describe, expect, test } from 'bun:test';
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

function montarLaBarra(props: Record<string, unknown> = {}) {
	return mount(TabBar, {
		props: { tabs: PESTANAS, modelValue: 'a', closeLabel: 'Cerrar', ...props },
	});
}

/** La misma barra, pero dentro de un marco con la barra a un costado. */
function montarEnVertical() {
	return mount(WindowFrame, {
		props: { position: 'left' },
		slots: {
			barra: () => h(TabBar, { tabs: PESTANAS, modelValue: 'a', closeLabel: 'Cerrar' }),
		},
	});
}

beforeEach(() => {
	olvidarTodo();
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

	test('y ocupan el ancho en vez de los ciento treinta y seis píxeles', async () => {
		const vista = montarEnVertical();
		await nextTick();

		const clases = vista.findComponent(TabItem).find('div').classes();
		expect(clases).toContain('w-full');
		expect(clases).not.toContain('w-34');
	});
});
