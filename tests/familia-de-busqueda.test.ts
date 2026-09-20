/**
 * La familia de búsqueda: el campo y el desplegable.
 *
 * Había tres contratos para el mismo campo de texto —`modelValue`, `valor` con
 * `buscar`, y `filter` con `update:filter`— y dos copias del mismo desplegable
 * que ya habían divergido: 145 líneas contra 268.
 *
 * Lo que se comprueba acá es lo que separa un campo de búsqueda de un `<input>`
 * cualquiera: que el rebote exista y que Enter lo cancele, que la cruz no se
 * lleve el foco puesto, y que el desplegable se pueda usar entero sin tocar el
 * ratón — que es justo lo que la copia del instalador había perdido.
 */

import { afterEach, describe, expect, test } from 'bun:test';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import SearchField from '../src/search/SearchField.vue';
import SearchSelect from '../src/search/SearchSelect.vue';
import { olvidarTodo, ponerEnElTema } from './dobles';

const TECLADOS = [
	{ valor: 'be-latin1', etiqueta: 'be-latin1' },
	{ valor: 'de-latin1', etiqueta: 'de-latin1' },
	{ valor: 'la-latin1', etiqueta: 'la-latin1' },
	{ valor: 'us', etiqueta: 'us', detalle: 'inglés' },
];

function esperar(ms: number) {
	return new Promise((listo) => setTimeout(listo, ms));
}

afterEach(() => {
	olvidarTodo();
});

describe('el campo', () => {
	test('el texto sale en cada tecla', async () => {
		const vista = mount(SearchField, { props: { modelValue: '' } });

		await vista.find('input').setValue('ho');

		expect(vista.emitted('update:modelValue')?.[0]).toEqual(['ho']);
	});

	test('y sin rebote no busca sola: para eso está Enter', async () => {
		// Es lo normal. Filtrar una lista que ya está en memoria no necesita
		// esperar a nada, y esperar se notaría.
		const vista = mount(SearchField, { props: { modelValue: 'ho' } });

		await vista.find('input').setValue('hol');
		await esperar(60);
		expect(vista.emitted('search')).toBeUndefined();

		await vista.find('input').trigger('keydown.enter');
		expect(vista.emitted('search')?.[0]).toEqual(['ho']);
	});

	test('con rebote busca sola cuando se deja de escribir', async () => {
		// La tienda recorre quince mil paquetes y consulta al AUR por búsqueda:
		// una por tecla no sólo cuesta, además deja que el resultado de la
		// penúltima llegue después que el de la última y la pise.
		const vista = mount(SearchField, { props: { modelValue: '', debounce: 40 } });

		await vista.find('input').setValue('fire');
		expect(vista.emitted('search')).toBeUndefined();

		await esperar(70);
		expect(vista.emitted('search')?.[0]).toEqual(['fire']);
	});

	test('y escribir de nuevo reinicia la espera en vez de sumar búsquedas', async () => {
		const vista = mount(SearchField, { props: { modelValue: '', debounce: 40 } });
		const campo = vista.find('input');

		await campo.setValue('fi');
		await esperar(25);
		await campo.setValue('fire');
		await esperar(25);
		expect(vista.emitted('search')).toBeUndefined();

		await esperar(40);
		expect(vista.emitted('search')).toHaveLength(1);
	});

	test('Enter cancela el rebote pendiente', async () => {
		// Sin esto, Enter busca y el temporizador busca **otra vez** con el mismo
		// texto un rato después. Estaba escrito como advertencia en la copia de
		// la tienda, que es de donde sale el rebote.
		const vista = mount(SearchField, { props: { modelValue: 'fire', debounce: 40 } });

		await vista.find('input').setValue('fire');
		await vista.find('input').trigger('keydown.enter');
		await esperar(70);

		expect(vista.emitted('search')).toHaveLength(1);
	});

	test('la cruz vacía, avisa, y no se lleva el foco', async () => {
		// El `mousedown.prevent` es lo que la hace usable dentro de la búsqueda
		// de la barra: sin él, apretarla saca el foco del campo y la barra se
		// pliega en el medio del gesto.
		const vista = mount(SearchField, { props: { modelValue: 'algo' } });
		const cruz = vista.find('button');

		const apretar = new MouseEvent('mousedown', { cancelable: true, bubbles: true });
		cruz.element.dispatchEvent(apretar);
		expect(apretar.defaultPrevented).toBe(true);

		await cruz.trigger('click');
		expect(vista.emitted('update:modelValue')?.[0]).toEqual(['']);
		expect(vista.emitted('clear')).toHaveLength(1);
	});

	test('y no está cuando no hay nada que vaciar', () => {
		const vacio = mount(SearchField, { props: { modelValue: '' } });
		const conTexto = mount(SearchField, { props: { modelValue: 'algo' } });

		expect(vacio.find('button').exists()).toBe(false);
		expect(conTexto.find('button').exists()).toBe(true);
	});

	test('Escape no lo decide el campo', async () => {
		// Qué significa Escape depende de dónde viva la caja: en el desplegable
		// cierra la lista, en la barra la pliega, en una vista la cierra. Si el
		// campo lo tomara para vaciarse, se comería el de todos los demás.
		const vista = mount(SearchField, { props: { modelValue: 'algo' } });

		await vista.find('input').trigger('keydown.esc');

		expect(vista.emitted('update:modelValue')).toBeUndefined();
	});

	test('sin lista no se anuncia como combobox', () => {
		const vista = mount(SearchField, { props: { modelValue: '' } });

		expect(vista.find('input').attributes('role')).toBeUndefined();
	});

	test('y con lista sí, con la opción marcada', () => {
		// Es lo que hace que un lector de pantalla diga por cuál opción se está
		// pasando sin mover el foco del campo, que es lo que deja seguir
		// escribiendo mientras se recorre con las flechas.
		const vista = mount(SearchField, {
			props: { modelValue: '', listboxId: 'lista-1', activeOptionId: 'lista-1-2', expanded: true },
		});
		const campo = vista.find('input');

		expect(campo.attributes('role')).toBe('combobox');
		expect(campo.attributes('aria-controls')).toBe('lista-1');
		expect(campo.attributes('aria-activedescendant')).toBe('lista-1-2');
	});

	test('el foco al montar, para el que aparece dentro de un menú', async () => {
		// El atributo `autofocus` del HTML no sirve: el navegador sólo lo atiende
		// al cargar el documento, y un campo que aparece después no lo recibe
		// nunca. El escritorio lo había resuelto con una directiva propia.
		const vista = mount(SearchField, { props: { modelValue: '', autofocus: true }, attachTo: document.body });
		await nextTick();
		await nextTick();

		expect(document.activeElement).toBe(vista.find('input').element);
		vista.unmount();
	});
});

describe('el desplegable', () => {
	function armar(props: Record<string, unknown> = {}) {
		ponerEnElTema('go-down', 'datos-de-la-flecha');
		return mount(SearchSelect, {
			props: { modelValue: '', options: TECLADOS, label: 'Teclado', emptyText: 'Nada', ...props },
			attachTo: document.body,
		});
	}

	const opciones = (vista: ReturnType<typeof armar>) => vista.findAll('[role="option"]');

	test('cerrado muestra lo elegido, y el hueco cuando no hay nada', () => {
		const sin = armar();
		const con = armar({ modelValue: 'us' });

		expect(sin.find('button').text()).toContain('—');
		expect(con.find('button').text()).toContain('us');
		expect(con.find('button').text()).toContain('inglés');
	});

	test('se abre y filtra al escribir, ordenando por cuánto coincide', async () => {
		// `la` tiene que traer `la-latin1` primero aunque `be-latin1` y
		// `de-latin1` también contengan «la» y vayan antes por alfabeto.
		const vista = armar();
		await vista.find('button').trigger('click');
		await nextTick();

		expect(opciones(vista)).toHaveLength(4);

		await vista.find('input').setValue('la');
		await nextTick();

		expect(opciones(vista)[0].text()).toContain('la-latin1');
	});

	test('las flechas recorren y Enter elige, sin tocar el ratón', async () => {
		// Es lo que la copia del instalador había perdido: ahí no había flechas,
		// ni Enter, ni `aria-activedescendant`.
		const vista = armar();
		await vista.find('button').trigger('click');
		await nextTick();

		const panel = vista.find('.z-20');
		await panel.trigger('keydown.down');
		await panel.trigger('keydown.enter');

		expect(vista.emitted('update:modelValue')?.[0]).toEqual(['de-latin1']);
	});

	test('y la lista da la vuelta', async () => {
		const vista = armar();
		await vista.find('button').trigger('click');
		await nextTick();

		const panel = vista.find('.z-20');
		await panel.trigger('keydown.up');
		await panel.trigger('keydown.enter');

		expect(vista.emitted('update:modelValue')?.[0]).toEqual(['us']);
	});

	test('abre parado sobre lo que ya estaba elegido', async () => {
		// Así bajar una vez lleva a la siguiente de la que se tiene, que es lo
		// que se espera de cualquier desplegable.
		const vista = armar({ modelValue: 'de-latin1' });
		await vista.find('button').trigger('click');
		await nextTick();

		await vista.find('.z-20').trigger('keydown.enter');

		expect(vista.emitted('update:modelValue')?.[0]).toEqual(['de-latin1']);
	});

	test('escribir devuelve la marca al principio', async () => {
		// La lista se mueve bajo el cursor: sin esto, Enter después de escribir
		// elegía una opción que ya no estaba a la vista.
		const vista = armar();
		await vista.find('button').trigger('click');
		await nextTick();

		const panel = vista.find('.z-20');
		await panel.trigger('keydown.down');
		await panel.trigger('keydown.down');
		await vista.find('input').setValue('latin');
		await nextTick();
		await panel.trigger('keydown.enter');

		expect(vista.emitted('update:modelValue')?.[0]).toEqual(['be-latin1']);
	});

	test('Escape cierra sin elegir y devuelve el foco al botón', async () => {
		const vista = armar();
		const boton = vista.find('button').element as HTMLElement;
		await vista.find('button').trigger('click');
		await nextTick();

		await vista.find('.z-20').trigger('keydown.escape');
		await nextTick();
		await nextTick();

		expect(vista.find('[role="listbox"]').exists()).toBe(false);
		expect(vista.emitted('update:modelValue')).toBeUndefined();
		expect(document.activeElement).toBe(boton);
	});

	test('y el foco que se va afuera también lo cierra', async () => {
		// Sin esto, la única salida es Escape con el foco adentro. Es lo otro que
		// le faltaba a la copia del instalador.
		const vista = armar();
		await vista.find('button').trigger('click');
		await nextTick();

		await vista.trigger('focusout', { relatedTarget: document.body });
		await nextTick();

		expect(vista.find('[role="listbox"]').exists()).toBe(false);
	});

	test('pero moverse por dentro no lo cierra', async () => {
		const vista = armar();
		await vista.find('button').trigger('click');
		await nextTick();

		await vista.trigger('focusout', { relatedTarget: vista.find('input').element });
		await nextTick();

		expect(vista.find('[role="listbox"]').exists()).toBe(true);
	});

	test('lo que no entra en el recorte se dice en vez de desaparecer', async () => {
		// Que las de más abajo desaparezcan en silencio hace creer que la opción
		// que se busca no existe.
		const vista = armar({ limit: 2 });
		await vista.find('button').trigger('click');
		await nextTick();

		expect(opciones(vista)).toHaveLength(2);
		expect(vista.find('[role="listbox"]').text()).toContain('+2');
	});

	test('sin coincidencias lo dice', async () => {
		const vista = armar();
		await vista.find('button').trigger('click');
		await nextTick();

		await vista.find('input').setValue('zzz');
		await nextTick();

		expect(opciones(vista)).toHaveLength(0);
		expect(vista.find('[role="listbox"]').text()).toContain('Nada');
	});

	test('apagado no abre, y quien lo impide es el botón', async () => {
		// Se comprueba el mecanismo y no sólo el resultado: un botón con
		// `disabled` no recibe ni el clic ni el teclado, así que una guarda
		// dentro de `abrir` sería código inalcanzable que aparenta estar
		// cubierto. Sacarla no rompía ninguna prueba; se vio saboteando.
		const vista = armar({ disabled: true });

		expect(vista.find('button').attributes('disabled')).toBeDefined();
		await vista.find('button').trigger('click');
		await nextTick();

		expect(vista.find('[role="listbox"]').exists()).toBe(false);
	});

	test('y apagarlo con la lista abierta la cierra', async () => {
		// El otro medio camino, que no cubre la prueba de arriba: aquélla evita
		// que se abra, y ésta apaga uno que ya estaba desplegado. Una lista
		// elegible encima de un control apagado es lo que no tiene que pasar.
		const vista = armar();
		await vista.find('button').trigger('click');
		await nextTick();
		expect(vista.find('[role="listbox"]').exists()).toBe(true);

		await vista.setProps({ disabled: true });
		await nextTick();

		expect(vista.find('[role="listbox"]').exists()).toBe(false);
	});
});
