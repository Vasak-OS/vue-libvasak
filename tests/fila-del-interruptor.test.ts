/**
 * La fila entera como interruptor.
 *
 * `SwitchTrack` salió a la luz porque hay dos formas legítimas de usar un
 * interruptor —el control solo y la fila completa apretable— y las dos tienen
 * que verse igual. La primera quedó escrita en `SwitchToggle`; la segunda
 * seguía armada a mano en el instalador, que es el estado del que vino todo
 * esto: la copia local sabe algo que la librería no.
 *
 * Lo que se comprueba es lo que se pierde callado al rearmarla: que sea un
 * botón de verdad y no un `div` que se puede tocar, que su nombre sea el texto
 * que se ve y no una etiqueta paralela, y que el dibujo salga de la misma pieza
 * que el control suelto.
 */

import { beforeEach, describe, expect, test } from 'bun:test';
import { mount } from '@vue/test-utils';
import { h } from 'vue';
import SwitchRow from '../src/forms/SwitchRow.vue';
import SwitchToggle from '../src/forms/SwitchToggle.vue';
import SwitchTrack from '../src/forms/SwitchTrack.vue';
import { olvidarTodo, ponerEnElTema } from './dobles';

/** Deja que terminen las resoluciones de iconos del montaje. */
async function asentar() {
	for (let i = 0; i < 4; i++) {
		await Promise.resolve();
		await new Promise((sigue) => setTimeout(sigue, 0));
	}
}

beforeEach(() => {
	olvidarTodo();
});

describe('la fila', () => {
	test('es un botón de verdad y se anuncia como interruptor', () => {
		// Es lo que hace que reciba el foco con Tab y responda a la barra
		// espaciadora sin `tabindex` a mano. Un `div` con `@click` se ve igual y
		// no lo alcanza el teclado.
		const vista = mount(SwitchRow, {
			props: { modelValue: false, label: 'Instalar controladores' },
		});

		expect(vista.element.tagName).toBe('BUTTON');
		expect(vista.attributes('type')).toBe('button');
		expect(vista.attributes('role')).toBe('switch');
		expect(vista.attributes('aria-checked')).toBe('false');
	});

	test('y dice en qué estado está', () => {
		const vista = mount(SwitchRow, { props: { modelValue: true, label: 'x' } });

		expect(vista.attributes('aria-checked')).toBe('true');
	});

	test('el clic avisa del valor contrario', async () => {
		const vista = mount(SwitchRow, { props: { modelValue: false, label: 'x' } });

		await vista.trigger('click');

		expect(vista.emitted('update:modelValue')?.[0]).toEqual([true]);
	});

	test('y apagada no contesta', async () => {
		const vista = mount(SwitchRow, {
			props: { modelValue: false, label: 'x', disabled: true },
		});

		await vista.trigger('click');

		expect(vista.emitted('update:modelValue')).toBeUndefined();
	});
});

describe('su nombre', () => {
	test('es el texto que se ve, sin una etiqueta paralela', () => {
		// El texto está adentro del botón, así que ya **es** el nombre
		// accesible. Un `aria-label` encima lo taparía: el lector diría una cosa
		// y la pantalla otra, y quien maneja la interfaz por voz nombra lo que
		// ve. Es la diferencia con el control suelto, donde el label va por
		// propiedad porque adentro no hay ningún texto.
		const vista = mount(SwitchRow, {
			props: { modelValue: false, label: 'Instalar controladores', description: 'NVIDIA' },
		});

		expect(vista.attributes('aria-label')).toBeUndefined();
		expect(vista.text()).toContain('Instalar controladores');
		expect(vista.text()).toContain('NVIDIA');
	});

	test('y el icono de la opción no se lee', async () => {
		// Es la marca de qué se está activando —una tarjeta de vídeo, una
		// impresora— y no dice nada del estado. Leerlo sólo alarga el anuncio.
		ponerEnElTema('video-display', '/iconos/pantalla.svg');
		const vista = mount(SwitchRow, {
			props: { modelValue: false, label: 'Controladores', icon: 'video-display' },
		});
		await asentar();

		expect(vista.find('img').attributes('src')).toBe('/iconos/pantalla.svg');
		expect(vista.find('img').attributes('alt')).toBe('');
		expect(vista.find('img').element.closest('[aria-hidden="true"]')).not.toBeNull();
	});

	test('sin icono no queda el hueco', () => {
		// Las opciones sin identidad propia no llevan, y un recuadro vacío de
		// cuarenta píxeles corre todo el texto sin motivo.
		const vista = mount(SwitchRow, { props: { modelValue: false, label: 'x' } });

		expect(vista.find('img').exists()).toBe(false);
	});
});

describe('el dibujo', () => {
	test('sale de la misma pieza que el control suelto', () => {
		// Es la razón de que `SwitchTrack` exista. Cuando cada uno se dibujaba
		// por su lado derivaban, y no se notaba porque nunca aparecen en la
		// misma pantalla.
		const fila = mount(SwitchRow, { props: { modelValue: true, label: 'x' } });
		const suelto = mount(SwitchToggle, { props: { modelValue: true, label: 'x' } });

		expect(fila.findComponent(SwitchTrack).exists()).toBe(true);
		expect(suelto.findComponent(SwitchTrack).exists()).toBe(true);
		expect(fila.findComponent(SwitchTrack).props('on')).toBe(true);
	});

	test('y la vía no se lee aparte del botón', () => {
		// Si se leyera, un lector anunciaría dos veces la misma cosa.
		const fila = mount(SwitchRow, { props: { modelValue: false, label: 'x' } });

		expect(fila.findComponent(SwitchTrack).attributes('aria-hidden')).toBe('true');
	});
});

describe('el pie', () => {
	test('cuelga en la columna del texto', () => {
		// En el instalador esto iba afuera, con un margen a mano calculado sobre
		// la estructura interna de la fila, y quedaba veinte píxeles a la
		// izquierda. Acá está adentro de la misma columna que la etiqueta, así
		// que sigue alineado aunque la fila cambie por dentro.
		const vista = mount(SwitchRow, {
			props: { modelValue: true, label: 'Cifrar el disco', description: 'Con una frase' },
			slots: { pie: () => h('span', { class: 'pie-de-prueba' }, 'Hace falta una frase') },
		});

		const pie = vista.find('.pie-de-prueba');
		const descripcion = vista.findAll('span').find((s) => s.text() === 'Con una frase');

		// Mismo padre que la descripción, y no «adentro del botón»: eso último
		// es cierto también cuando el pie cuelga al lado del interruptor, que es
		// justo el caso que hay que descartar. Se comprobó moviéndolo ahí.
		expect(pie.exists()).toBe(true);
		expect(pie.element.parentElement).toBe(descripcion?.element.parentElement ?? null);
	});

	test('y sin nada que colgar no dibuja nada', () => {
		const vista = mount(SwitchRow, { props: { modelValue: true, label: 'x' } });

		expect(vista.find('.pie-de-prueba').exists()).toBe(false);
	});
});
