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
import WindowControls from '../src/window/WindowControls.vue';
import WindowFrame from '../src/window/WindowFrame.vue';
import { posicionDe, usarLaBarra } from '../src/index';
import { cerrosDeVentana, olvidarTodo } from './dobles';

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

	test('`centro` va absoluto y al medio de la ventana entera', async () => {
		// Centrado entre columnas queda centrado respecto de lo que sobra entre
		// el icono y los tres controles, que lo corre visiblemente. Es el mes
		// del calendario, el buscador de la agenda y la carpeta del correo.
		const vista = mount(WindowFrame, {
			props: { position: 'top' },
			slots: { centro: () => h('span', { class: 'medio' }, 'Septiembre') },
		});
		await nextTick();

		const medio = vista.find('.medio');
		expect(medio.exists()).toBe(true);
		const envoltorio = medio.element.parentElement?.parentElement as HTMLElement;
		expect(envoltorio.className).toContain('absolute');
		expect(envoltorio.className).toContain('left-1/2');
		expect(envoltorio.className).toContain('-translate-x-1/2');
	});

	test('con la barra al costado, `centro` se centra en el otro sentido', async () => {
		// Vertical, el medio de la barra es el medio de su alto. `left-1/2` ahí
		// la sacaría de la barra.
		const vista = mount(WindowFrame, {
			props: { position: 'left' },
			slots: { centro: () => h('span', { class: 'medio' }, 'Septiembre') },
		});
		await nextTick();

		const envoltorio = vista.find('.medio').element.parentElement?.parentElement as HTMLElement;
		expect(envoltorio.className).toContain('top-1/2');
		expect(envoltorio.className).toContain('-translate-y-1/2');
		expect(envoltorio.className).not.toContain('left-1/2');
	});

	test('sin `centro` no se dibuja el envoltorio', () => {
		// Un absoluto con `pointer-events-none` vacío no se ve, pero sí tapa: se
		// come el `data-tauri-drag-region` de media barra si alguien le saca el
		// `pointer-events-none` sin mirar.
		const vista = abrirLaVentana('top');

		expect(vista.findAll('.pointer-events-none').length).toBe(0);
	});

	test('la barra queda `relative`, que es de lo que cuelga `centro`', () => {
		// Sin esto el absoluto se cuelga de la ventana entera y el centrado se
		// mantiene por casualidad, hasta que la barra deja de ocupar todo el
		// ancho.
		const vista = abrirLaVentana('top');

		expect(vista.findComponent(AppBar).classes()).toContain('relative');
	});

	test('se puede arrastrar la ventana desde ella', () => {
		// Sin decoración del compositor, `data-tauri-drag-region` es lo único
		// que deja mover la ventana. Se perdió una vez al reacomodar la barra.
		const vista = abrirLaVentana('top');

		expect(vista.findComponent(AppBar).attributes('data-tauri-drag-region')).toBeDefined();
	});
});

describe('los botones de la ventana', () => {
	/** Los nombres accesibles de los botones que se dibujaron, en orden. */
	function botones(vista: ReturnType<typeof mount>) {
		return vista
			.findComponent(WindowControls)
			.findAll('button')
			.map((boton) => boton.attributes('aria-label'));
	}

	test('por omisión van los tres', () => {
		const vista = mount(WindowFrame, {
			props: { position: 'top', minimizeLabel: 'min', maximizeLabel: 'max', closeLabel: 'cerrar' },
		});

		expect(botones(vista)).toEqual(['min', 'max', 'cerrar']);
	});

	test('un cuadro de diálogo no lleva ninguno', () => {
		// El de polkit, el de permisos, el de mantener apretado: ahí la ventana
		// se responde, no se cierra. Un botón de cerrar es una salida que deja
		// al programa que preguntó esperando para siempre. El instalador
		// tampoco los lleva: cerrarlo mientras particiona deja el equipo a
		// medio instalar.
		const vista = mount(WindowFrame, { props: { position: 'top', controls: [] } });

		expect(botones(vista)).toEqual([]);
	});

	test('el mini-reproductor lleva sólo cerrar', () => {
		// Minimizar y maximizar no significan nada en trescientos píxeles.
		const vista = mount(WindowFrame, {
			props: { position: 'top', controls: ['close'], closeLabel: 'cerrar' },
		});

		expect(botones(vista)).toEqual(['cerrar']);
	});

	test('sin ninguno, tampoco queda el envoltorio vacío', () => {
		// Un `div` con `gap-1` y nada adentro igual mete separación entre lo que
		// tiene al lado y el borde de la ventana.
		const vista = mount(WindowFrame, { props: { position: 'top', controls: [] } });

		expect(vista.findComponent(WindowControls).find('div').exists()).toBe(false);
	});

	test('quien escucha `close` se queda con el botón', async () => {
		// El reproductor tiene que apagar el audio antes de irse, y el editor
		// con cambios sin guardar quiere preguntar primero.
		const cerrados: number[] = [];
		const vista = mount(WindowFrame, {
			props: { position: 'top', closeLabel: 'cerrar', onClose: () => cerrados.push(1) },
		});

		await vista.findComponent(WindowControls).find('button[aria-label="cerrar"]').trigger('click');

		expect(cerrados.length).toBe(1);
	});

	test('y sin nadie escuchando, el botón cierra la ventana', async () => {
		// Lo contrario también importa: si el marco reenviara los tres eventos
		// siempre, el botón vería un oyente puesto aunque la aplicación no haya
		// escuchado nada y ninguna ventana se cerraría nunca. No da ningún
		// error: el clic emite hacia arriba y se pierde.
		const vista = mount(WindowFrame, { props: { position: 'top', closeLabel: 'cerrar' } });

		const boton = vista.findComponent(WindowControls).find('button[aria-label="cerrar"]');
		await boton.trigger('click');

		expect(cerrosDeVentana()).toBe(1);
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
