/**
 * El selector que respeta el tema.
 *
 * El `select` nativo de WebKit se dibuja solo —pinta su propio fondo blanco y
 * su propio texto— y las clases de color no lo tocan: en una ventana oscura eso
 * deja texto claro sobre blanco, ilegible. Estaba copiado en vasak-monitor y en
 * vasak-settings con dos nombres distintos.
 *
 * Desde la 2.19.0 (vue-libvasak#103) no hay `<select>` debajo: la lista abierta
 * de uno la dibuja el sistema, y era el único lugar de la librería donde el
 * escritorio dejaba de parecer VasakOS. Es `SearchSelect` sin búsqueda, y lo
 * que se comprueba acá es que la API de siempre —`v-model` con su tipo y
 * `.number`, `options` o los `<option>` en la ranura, `label`, `id`,
 * `disabled`, `change`— sigue haciendo lo mismo encima de la lista propia.
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mount, type VueWrapper } from '@vue/test-utils';
import { defineComponent, nextTick, ref } from 'vue';
import FormGroup from '../src/forms/FormGroup.vue';
import SelectField from '../src/forms/SelectField.vue';
import { olvidarTodo } from './dobles';

const vistas: VueWrapper[] = [];
function montar(opciones: Record<string, unknown>) {
	// biome-ignore lint/suspicious/noExplicitAny: el genérico del componente lo decide cada prueba.
	const vista = mount(SelectField as any, { attachTo: document.body, ...opciones });
	vistas.push(vista);
	return vista;
}

/** Abre la lista con un clic en el botón, como lo haría quien la usa. */
async function abrir(vista: VueWrapper) {
	await vista.get('button').trigger('click');
	await nextTick();
}

const opciones = (vista: VueWrapper) => vista.findAll('[role="option"]');

beforeEach(() => {
	olvidarTodo();
});

afterEach(() => {
	for (const vista of vistas.splice(0)) vista.unmount();
	document.body.innerHTML = '';
});

describe('el dibujo nativo', () => {
	test('no hay ningún `<select>`: la lista abierta es la de la librería', async () => {
		// Con un `<select>`, `appearance-none` arreglaba el control cerrado, pero
		// la lista que se abre la seguía dibujando GTK con sus colores. Ahora la
		// lista es el panel `ui-float` de la librería, con sus opciones.
		const campo = montar({
			props: { modelValue: 'a' },
			slots: { default: '<option value="a">A</option><option value="b">B</option>' },
		});
		await abrir(campo);

		expect(campo.find('select').exists()).toBe(false);
		expect(campo.find('option').exists()).toBe(false);
		const lista = campo.get('[role="listbox"]');
		expect((lista.element.parentElement as HTMLElement).className).toContain('bg-ui-float');
		expect(opciones(campo).map((o) => o.text())).toEqual(['A', 'B']);
	});

	test('cerrado sigue pareciendo un desplegable, con la flecha del tema', () => {
		const campo = montar({
			props: { modelValue: 'a' },
			slots: { default: '<option value="a">A</option>' },
		});

		const boton = campo.get('button');
		expect(boton.attributes('aria-haspopup')).toBe('listbox');
		expect(boton.text()).toContain('A');
		expect(boton.find('span.shrink-0').exists()).toBe(true);
	});

	test('usa los colores del tema y no los del sistema', () => {
		const campo = montar({ props: { modelValue: 'a' } });

		const clases = campo.get('button').classes().join(' ');
		expect(clases).toContain('bg-ui-surface');
		expect(clases).toContain('text-tx-main');
		expect(clases).toContain('border-ui-border');
	});
});

describe('lo que se elige', () => {
	test('sale como el valor elegido', async () => {
		const campo = montar({
			props: { modelValue: 'a' },
			slots: { default: '<option value="a">A</option><option value="b">B</option>' },
		});
		await abrir(campo);

		await opciones(campo)[1]?.trigger('click');

		expect(campo.emitted('update:modelValue')).toEqual([['b']]);
	});

	test('y con `.number` sale como número', async () => {
		// El contrato: quien escribe `v-model.number` recibe un número, aunque
		// los `<option value="…">` de la ranura sean cadenas.
		const campo = montar({
			props: { modelValue: 1000, modelModifiers: { number: true } },
			slots: { default: '<option value="1000">1 s</option><option value="5000">5 s</option>' },
		});
		await abrir(campo);

		await opciones(campo)[1]?.trigger('click');

		expect(campo.emitted('update:modelValue')).toEqual([[5000]]);
	});

	test('`v-model.number` desde una plantilla deja un número en el modelo', async () => {
		// Lo mismo, escrito como lo escribe una aplicación: el modificador lo
		// pone el compilador de la plantilla y el modelo del padre tiene que
		// quedar numérico, no `"5000"`.
		const intervalo = ref(1000);
		const Padre = defineComponent({
			components: { SelectField },
			setup: () => ({ intervalo }),
			template: `<SelectField v-model.number="intervalo" label="Cada cuánto">
				<option value="1000">1 s</option><option value="5000">5 s</option>
			</SelectField>`,
		});
		const vista = mount(Padre, { attachTo: document.body });
		vistas.push(vista);
		await abrir(vista);

		await opciones(vista)[1]?.trigger('click');

		expect(intervalo.value).toBe(5000);
		expect(typeof intervalo.value).toBe('number');
	});

	test('un modelo numérico con opciones numéricas vuelve numérico, sin `.number`', async () => {
		// `SearchSelect` trabaja con cadenas; si el valor viajara como texto,
		// `3` saldría como `"3"` y quien compara con `===` dejaría de encontrarlo.
		const campo = montar({
			props: { modelValue: 1, options: [{ label: 'Uno', value: 1 }, { label: 'Tres', value: 3 }] },
		});
		await abrir(campo);

		await opciones(campo)[1]?.trigger('click');

		expect(campo.emitted('update:modelValue')).toEqual([[3]]);
	});

	test('elegir emite `change`, como el `select` de antes', async () => {
		// Quien usaba `@change` para recargar algo tiene que seguir recibiéndolo.
		const campo = montar({
			props: { modelValue: 'a', options: ['a', 'b'] },
		});
		await abrir(campo);

		await opciones(campo)[1]?.trigger('click');

		const cambios = campo.emitted('change') as Event[][] | undefined;
		expect(cambios).toHaveLength(1);
		expect(cambios?.[0]?.[0]).toBeInstanceOf(Event);
		expect(cambios?.[0]?.[0]?.type).toBe('change');
	});

	test('el `@change` del padre ve el modelo ya cambiado', async () => {
		const posicion = ref('a');
		let vistoEnElChange = '';
		const Padre = defineComponent({
			components: { SelectField },
			setup: () => ({
				posicion,
				alCambiar: () => {
					vistoEnElChange = posicion.value;
				},
			}),
			template: `<SelectField v-model="posicion" :options="['a', 'b']" @change="alCambiar" />`,
		});
		const vista = mount(Padre, { attachTo: document.body });
		vistas.push(vista);
		await abrir(vista);

		await opciones(vista)[1]?.trigger('click');

		expect(vistoEnElChange).toBe('b');
	});
});

describe('elegir la que ya estaba', () => {
	test('no emite `change` ni `update:modelValue`, como el `select` nativo', async () => {
		// Quien recarga algo en `@change` lo haría de más con cada clic sobre la
		// opción que ya estaba elegida.
		const campo = montar({ props: { modelValue: 'a', options: ['a', 'b'] } });
		await abrir(campo);

		await opciones(campo)[0]?.trigger('click');

		expect(campo.emitted('change')).toBeUndefined();
		expect(campo.emitted('update:modelValue')).toBeUndefined();
	});

	test('tampoco con un modelo numérico y opciones de texto en la ranura', async () => {
		// `<option value="1000">` llega como `"1000"` y el modelo es `1000`: es
		// la misma opción aunque los tipos no coincidan.
		const campo = montar({
			props: { modelValue: 1000 },
			slots: { default: '<option value="1000">1 s</option><option value="5000">5 s</option>' },
		});
		await abrir(campo);

		await opciones(campo)[0]?.trigger('click');

		expect(campo.emitted('change')).toBeUndefined();
	});

	test('pero elegir otra sí, una sola vez', async () => {
		const campo = montar({ props: { modelValue: 'a', options: ['a', 'b'] } });
		await abrir(campo);

		await opciones(campo)[1]?.trigger('click');

		expect(campo.emitted('change')).toHaveLength(1);
		expect(campo.emitted('update:modelValue')).toEqual([['b']]);
	});
});

describe('las opciones de la ranura', () => {
	test('un `v-for` llega entero, en orden', async () => {
		// Un `v-for` en la ranura llega como un `Fragment` con los `<option>`
		// adentro: si no se aplanara, la lista saldría vacía.
		const Padre = defineComponent({
			components: { SelectField },
			setup: () => ({
				lados: [
					{ valor: 'top', nombre: 'Arriba' },
					{ valor: 'bottom', nombre: 'Abajo' },
					{ valor: 'left', nombre: 'Izquierda' },
				],
				lado: ref('bottom'),
			}),
			template: `<SelectField v-model="lado">
				<option v-for="l in lados" :key="l.valor" :value="l.valor">{{ l.nombre }}</option>
			</SelectField>`,
		});
		const vista = mount(Padre, { attachTo: document.body });
		vistas.push(vista);

		expect(vista.get('button').text()).toContain('Abajo');
		await abrir(vista);
		expect(opciones(vista).map((o) => o.text())).toEqual(['Arriba', 'Abajo', 'Izquierda']);
	});

	test('y si la lista del `v-for` cambia, la del desplegable también', async () => {
		const lados = ref([{ valor: 'top', nombre: 'Arriba' }]);
		const Padre = defineComponent({
			components: { SelectField },
			setup: () => ({ lados, lado: ref('top') }),
			template: `<SelectField v-model="lado">
				<option v-for="l in lados" :key="l.valor" :value="l.valor">{{ l.nombre }}</option>
			</SelectField>`,
		});
		const vista = mount(Padre, { attachTo: document.body });
		vistas.push(vista);

		lados.value.push({ valor: 'bottom', nombre: 'Abajo' });
		await nextTick();
		await abrir(vista);

		expect(opciones(vista).map((o) => o.text())).toEqual(['Arriba', 'Abajo']);
	});

	test('sin `value`, el valor es el texto, como en el `<option>` nativo', async () => {
		const campo = montar({
			props: { modelValue: 'Rojo' },
			slots: { default: '<option>Rojo</option><option> Verde </option>' },
		});
		expect(campo.get('button').text()).toContain('Rojo');
		await abrir(campo);

		await opciones(campo)[1]?.trigger('click');

		expect(campo.emitted('update:modelValue')).toEqual([['Verde']]);
	});

	test('una `<option disabled>` se ve pero no se elige', async () => {
		const campo = montar({
			props: { modelValue: 'a' },
			slots: {
				default: '<option value="a">A</option><option value="b" disabled>B</option><option value="c">C</option>',
			},
		});
		await abrir(campo);

		const b = opciones(campo)[1];
		expect(b?.text()).toBe('B');
		expect(b?.attributes('aria-disabled')).toBe('true');
		await b?.trigger('click');
		expect(campo.emitted('update:modelValue')).toBeUndefined();

		// Y el teclado la saltea: bajar desde A cae en C.
		const panel = campo.get('[role="listbox"]').element.parentElement as HTMLElement;
		panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
		panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
		expect(campo.emitted('update:modelValue')).toEqual([['c']]);
	});

	test('`:disabled="false"` no la apaga', async () => {
		const Padre = defineComponent({
			components: { SelectField },
			setup: () => ({ m: ref('a') }),
			template: `<SelectField v-model="m"><option value="a">A</option><option value="b" :disabled="false">B</option></SelectField>`,
		});
		const vista = mount(Padre, { attachTo: document.body });
		vistas.push(vista);
		await abrir(vista);

		expect(opciones(vista)[1]?.attributes('aria-disabled')).toBeUndefined();
	});

	test('con `options` y ranura a la vez, gana la lista', async () => {
		const campo = montar({
			props: { modelValue: 'x', options: ['x', 'y'] },
			slots: { default: '<option value="z">Z</option>' },
		});
		await abrir(campo);

		expect(opciones(campo).map((o) => o.text())).toEqual(['x', 'y']);
	});
});

describe('la etiqueta', () => {
	test('con `label`, queda atada al control', () => {
		// Un `<label>` suelto al lado no está asociado a nada: un lector de
		// pantalla anuncia un desplegable sin nombre, y hacer clic en el texto no
		// abre la lista. Es lo que hacía quien lo usaba antes de que el
		// componente trajera la suya.
		const campo = montar({
			props: { modelValue: 'a', label: 'Cada cuánto medir' },
		});

		const etiqueta = campo.get('label');
		const boton = campo.get('button');
		expect(etiqueta.text()).toBe('Cada cuánto medir');
		expect(etiqueta.attributes('for')).toBe(boton.attributes('id'));
		expect(boton.attributes('id')).toBeTruthy();
		expect(boton.attributes('aria-label')).toBe('Cada cuánto medir');
	});

	test('hacer clic en la etiqueta abre la lista', async () => {
		const campo = montar({
			props: { modelValue: 'a', label: 'Cada cuánto medir', options: ['a', 'b'] },
		});
		expect(campo.find('[role="listbox"]').exists()).toBe(false);

		(campo.get('label').element as HTMLLabelElement).click();
		await nextTick();

		expect(campo.find('[role="listbox"]').exists()).toBe(true);
	});

	test('sin `label` no dibuja ninguna', () => {
		// Envolverlo en un `<label>` de afuera también asocia, y ahí una etiqueta
		// propia sería el nombre dos veces.
		const campo = montar({ props: { modelValue: 'a' } });

		expect(campo.find('label').exists()).toBe(false);
	});

	test('y respeta el `id` que le pasen', () => {
		const campo = montar({
			props: { modelValue: 'a', label: 'Cada cuánto medir' },
			attrs: { id: 'intervalo' },
		});

		expect(campo.get('button').attributes('id')).toBe('intervalo');
		expect(campo.get('label').attributes('for')).toBe('intervalo');
	});
});

describe('los atributos', () => {
	test('`aria-label` nombra al control y no queda colgado del contenedor', () => {
		// Colgado de un `div`, un `aria-label` no nombra nada.
		const campo = montar({
			props: { modelValue: 'a' },
			attrs: { 'aria-label': 'Cada cuánto medir' },
		});

		expect(campo.get('button').attributes('aria-label')).toBe('Cada cuánto medir');
		expect(campo.attributes('aria-label')).toBeUndefined();
	});

	test('`aria-describedby`, `title` y `data-*` llegan al botón, no al contenedor', () => {
		// Con el `<select>` llegaban por `v-bind="attrs"`. Si se perdieran, la
		// ayuda y el error de un formulario dejarían de anunciarse.
		const campo = montar({
			props: { modelValue: 'a', options: ['a', 'b'] },
			attrs: { 'aria-describedby': 'ayuda-1', title: 'Lado de la barra', 'data-testid': 'lado', class: 'col-span-2' },
		});
		const boton = campo.get('button');

		expect(boton.attributes('aria-describedby')).toBe('ayuda-1');
		expect(boton.attributes('title')).toBe('Lado de la barra');
		expect(boton.attributes('data-testid')).toBe('lado');
		expect(boton.classes()).not.toContain('col-span-2');
		expect(campo.classes()).toContain('col-span-2');
		expect(campo.attributes('aria-describedby')).toBeUndefined();
		expect(campo.attributes('data-testid')).toBeUndefined();
	});

	test('dentro de un `FormGroup`, su `describedBy` ata la ayuda y el error al botón', async () => {
		const Formulario = defineComponent({
			components: { FormGroup, SelectField },
			setup: () => ({ lado: ref('a') }),
			template: `<FormGroup label="Lado" help="Dónde va la barra" error="No se pudo guardar" v-slot="{ id, describedBy }">
				<SelectField :id="id" v-model="lado" :options="['a', 'b']" :aria-describedby="describedBy" />
			</FormGroup>`,
		});
		const vista = mount(Formulario, { attachTo: document.body });
		vistas.push(vista);
		const boton = vista.get('button');

		const ids = boton.attributes('aria-describedby')?.split(' ') ?? [];
		expect(ids).toHaveLength(2);
		const textos = ids.map((id) => document.getElementById(id)?.textContent?.trim());
		expect(textos).toEqual(['Dónde va la barra', 'No se pudo guardar']);
		// Y la etiqueta del grupo nombra al botón, no a un elemento que no existe.
		expect(vista.get('label').attributes('for')).toBe(boton.attributes('id'));
	});

	test('`class` y `style` van al contenedor, que es lo que se acomoda en la grilla', () => {
		const campo = montar({
			props: { modelValue: 'a' },
			attrs: { class: 'col-span-2', style: 'max-width: 10rem' },
		});

		expect(campo.classes()).toContain('col-span-2');
		expect(campo.attributes('style')).toContain('max-width: 10rem');
		expect(campo.get('button').classes()).not.toContain('col-span-2');
	});
});

describe('el tipo del modelo', () => {
	test('es el de quien lo usa, no un `string | number` fijo', async () => {
		// Era fijo, y eso obliga a quien tiene un `ref<string>` —o algo más
		// estrecho, como los cuatro lados de la barra de la ventana— a aceptar
		// de vuelta un `number` que nunca va a llegar. Con `strictTemplates` en
		// las aplicaciones eso dejó de pasar en silencio.
		//
		// Se mira el fuente y no el tipo generado: comprobar el genérico de
		// verdad pide montar `vue-tsc` sobre un componente de prueba, y eso ya
		// lo hace cada aplicación con su propio guardia.
		const fuente = await Bun.file(new URL('../src/forms/SelectField.vue', import.meta.url)).text();

		expect(fuente).toContain('generic="T extends string | number"');
		expect(fuente).toContain('defineModel<T>');
	});

	test('y el `change` se declara en vez de caer por atributos', async () => {
		// Con `strictTemplates`, un `@change` sobre un componente que no lo
		// emite es un error, y quien lo escribía no tenía forma de saber si
		// llegaba a algún lado. Que llega lo comprueba «elegir emite `change`».
		const fuente = await Bun.file(new URL('../src/forms/SelectField.vue', import.meta.url)).text();

		expect(fuente).toContain('change: [event: Event]');
	});
});
