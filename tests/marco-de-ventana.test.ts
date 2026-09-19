/**
 * El marco de la ventana y su barra, en los cuatro lados.
 *
 * Dieciocho repositorios tenían su propio marco con catorce formas distintas, y
 * dieciséis su propia barra superior. Esto existe para que dos ventanas del
 * mismo escritorio se parezcan porque **son** lo mismo.
 *
 * Lo que se comprueba acá es lo que se rompe al tocarlo: que la barra quede del
 * lado que corresponde, que lo de adentro se entere de la orientación, y que la
 * preferencia del escritorio mande.
 */

import { beforeEach, describe, expect, test } from 'bun:test';
import { mount } from '@vue/test-utils';
import { defineComponent, h, nextTick } from 'vue';
import AppBar from '../src/window/AppBar.vue';
import WindowFrame from '../src/window/WindowFrame.vue';
import { posicionDe, usarLaBarra } from '../src/index';
import { olvidarTodo } from './dobles';

/** Un testigo que dice qué orientación le llegó por inyección. */
const Testigo = defineComponent({
	name: 'Testigo',
	setup() {
		const { orientacion, posicion } = usarLaBarra();
		return () => h('span', { class: 'testigo' }, `${posicion.value}/${orientacion.value}`);
	},
});

function abrirLaVentana(position: 'top' | 'bottom' | 'left' | 'right') {
	return mount(WindowFrame, {
		props: { position, title: 'Ventana' },
		slots: {
			barra: () => h(Testigo),
			// Un segundo testigo **fuera** de la barra: el contenido de la
			// ventana también tiene que poder amoldarse, y ahí no llega el
			// `provide` de la barra sino el del marco.
			default: () => h('div', { class: 'contenido' }, [h(Testigo)]),
		},
	});
}

beforeEach(() => {
	olvidarTodo();
});

describe('el marco', () => {
	test('la barra queda del lado que se le pide', () => {
		// La dirección del `flex` es lo que pone la barra arriba, abajo o a un
		// costado: la plantilla es una sola, y de eso depende que no haya que
		// escribir cuatro.
		const esperado = {
			top: 'flex-col',
			bottom: 'flex-col-reverse',
			left: 'flex-row',
			right: 'flex-row-reverse',
		} as const;

		for (const [posicion, clase] of Object.entries(esperado)) {
			const vista = abrirLaVentana(posicion as keyof typeof esperado);
			expect(vista.find('div').classes()).toContain(clase);
			vista.unmount();
		}
	});

	test('y lo de adentro se entera sin que nadie se lo pase', () => {
		// Éste es el punto del contrato: una barra de pestañas escrita en otro
		// repositorio se amolda sola. Con la orientación bajando por
		// propiedades, cada aplicación tendría que encadenarla hasta el último
		// nieto.
		for (const [posicion, orientacion] of [
			['top', 'horizontal'],
			['bottom', 'horizontal'],
			['left', 'vertical'],
			['right', 'vertical'],
		] as const) {
			const vista = abrirLaVentana(posicion);
			const testigos = vista.findAll('.testigo');
			// Los dos: el de la barra y el del contenido.
			expect(testigos).toHaveLength(2);
			for (const testigo of testigos) {
				expect(testigo.text()).toBe(`${posicion}/${orientacion}`);
			}
			vista.unmount();
		}
	});

	test('el marco es el único que pinta el fondo de ventana', () => {
		// `--ui-background` es el token de la ventana; lo que se apoya encima va
		// en superficie. Que lo pinte el marco es lo que evita que cada
		// aplicación elija su propio tono.
		const vista = abrirLaVentana('top');

		const clases = vista.find('div').classes();
		expect(clases).toContain('bg-ui-bg/80');
		expect(clases).toContain('rounded-corner-window');
		expect(clases).toContain('overflow-hidden');
	});

	test('una ventana puede no llevar barra', () => {
		// Un diálogo o un asistente dibujan la suya, o no llevan ninguna.
		const vista = mount(WindowFrame, { props: { hideBar: true } });

		expect(vista.findComponent(AppBar).exists()).toBe(false);
	});
});

describe('la barra', () => {
	test('vertical se apila y no escribe el título de costado', async () => {
		// Un título girado noventa grados no se lee. El nombre de la ventana lo
		// dice el gestor de ventanas igual.
		const vista = abrirLaVentana('left');
		await nextTick();

		const barra = vista.findComponent(AppBar).find('div');
		expect(barra.classes()).toContain('flex-col');
		expect(vista.text()).not.toContain('Ventana');
	});

	test('horizontal sí lo escribe', async () => {
		const vista = abrirLaVentana('top');
		await nextTick();

		expect(vista.text()).toContain('Ventana');
	});

	test('se puede arrastrar la ventana desde ella', () => {
		// Sin decoración del compositor, `data-tauri-drag-region` es lo único
		// que deja mover la ventana. Se perdió una vez al reacomodar la barra.
		const vista = abrirLaVentana('top');

		expect(vista.findComponent(AppBar).attributes('data-tauri-drag-region')).toBeDefined();
	});
});

describe('la preferencia del escritorio', () => {
	test('sale de `window.barPosition`', () => {
		expect(posicionDe({ window: { barPosition: 'left' } })).toBe('left');
		expect(posicionDe({ window: { barPosition: 'bottom' } })).toBe('bottom');
	});

	test('y lo que no es una posición no se usa', () => {
		// El archivo lo puede editar cualquiera a mano. Un valor inventado no
		// puede dejar la ventana sin barra.
		for (const basura of [{}, null, { window: {} }, { window: { barPosition: 'arriba' } }]) {
			expect(posicionDe(basura)).toBeNull();
		}
	});
});
