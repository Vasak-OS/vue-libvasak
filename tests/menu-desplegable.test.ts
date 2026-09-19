/**
 * El menú desplegable, que hasta ahora no era un menú.
 *
 * Los `div` con un `@click` encima se ven bien y se usan bien con el ratón,
 * pero no tienen nada que decirle a un lector de pantalla ni al teclado: sin
 * `role` no hay menú ni opciones, y sin estar en el orden de tabulación no hay
 * forma de llegar. Lo que se comprueba acá es eso —la semántica y el teclado—,
 * que es justamente lo que no se ve en una captura de pantalla.
 *
 * El contenido se teletransporta al `body`, así que se busca en el documento y
 * no en el envoltorio de la prueba. Que eso **se pueda** buscar por `role` es,
 * de hecho, parte de lo que se arregló.
 */

import { afterEach, describe, expect, test } from 'bun:test';
import { mount, type VueWrapper } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import DropdownMenu from '../src/dropdown/DropdownMenu.vue';
import DropdownMenuContent from '../src/dropdown/DropdownMenuContent.vue';
import DropdownMenuItem from '../src/dropdown/DropdownMenuItem.vue';
import DropdownMenuLabel from '../src/dropdown/DropdownMenuLabel.vue';
import DropdownMenuSeparator from '../src/dropdown/DropdownMenuSeparator.vue';
import DropdownMenuTrigger from '../src/dropdown/DropdownMenuTrigger.vue';

interface Opcion {
	texto: string;
	disabled?: boolean;
}

const TRES: Opcion[] = [{ texto: 'Uno' }, { texto: 'Dos' }, { texto: 'Tres' }];

let montado: VueWrapper | null = null;

/** Lo elegido, en orden, por los dos eventos que emite un ítem. */
const elegidos: string[] = [];
const clicados: string[] = [];

function montarElMenu(
	opciones: {
		items?: Opcion[];
		conEtiqueta?: boolean;
		conSeparador?: boolean;
		disparadorSuelto?: boolean;
	} = {}
) {
	const items = opciones.items ?? TRES;
	elegidos.length = 0;
	clicados.length = 0;

	montado = mount(DropdownMenu, {
		attachTo: document.body,
		slots: {
			default: () => [
				h(
					DropdownMenuTrigger,
					{ asChild: !opciones.disparadorSuelto },
					() => h('button', { type: 'button' }, 'Abrir')
				),
				h(DropdownMenuContent, null, () => [
					...(opciones.conEtiqueta ? [h(DropdownMenuLabel, null, () => 'Acciones')] : []),
					...items.map((opcion, indice) => [
						...(opciones.conSeparador && indice === 1 ? [h(DropdownMenuSeparator)] : []),
						h(
							DropdownMenuItem,
							{
								disabled: opcion.disabled,
								onSelect: () => elegidos.push(opcion.texto),
								onClick: () => clicados.push(opcion.texto),
							},
							() => opcion.texto
						),
					]),
				]),
			],
		},
	});

	return montado;
}

/** El botón que abre, que con `as-child` es el `<button>` del hueco. */
function elDisparador(): HTMLElement {
	const boton = document.querySelector<HTMLElement>('button');
	if (!boton) throw new Error('el disparador no está en el documento');
	return boton;
}

function elMenu(): HTMLElement {
	const menu = document.querySelector<HTMLElement>('[role="menu"]');
	if (!menu) throw new Error('el menú no está en el documento');
	return menu;
}

function losItems(): HTMLElement[] {
	return Array.from(document.querySelectorAll<HTMLElement>('[role="menuitem"]'));
}

function teclear(elemento: Element, key: string) {
	elemento.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

function clicar(elemento: Element) {
	elemento.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
}

/** Abierto con el teclado, que es lo que deja el foco en el primer ítem. */
async function abrirConElTeclado() {
	const boton = elDisparador();
	boton.focus();
	teclear(boton, 'ArrowDown');
	await nextTick();
	await nextTick();
}

/** Abierto con el ratón, que es lo que deja el foco en el propio menú. */
async function abrirConElRaton() {
	clicar(elDisparador());
	await nextTick();
	await nextTick();
}

afterEach(() => {
	montado?.unmount();
	montado = null;
	document.body.innerHTML = '';
});

describe('la semántica', () => {
	test('el contenido es un menú y sus opciones son opciones', async () => {
		// Sin esto no hay nada que un lector de pantalla pueda llamar menú: lo
		// que había era un `div` teletransportado al `body` con tres `div`
		// adentro, indistinguible de cualquier otro pedazo de la página.
		montarElMenu();
		await abrirConElRaton();

		const menu = elMenu();
		expect(menu.getAttribute('role')).toBe('menu');
		expect(menu.getAttribute('aria-orientation')).toBe('vertical');

		const items = losItems();
		expect(items).toHaveLength(3);
		for (const item of items) {
			expect(item.getAttribute('role')).toBe('menuitem');
			expect(item.getAttribute('tabindex')).toBe('0');
		}
	});

	test('el menú cerrado no existe para quien no lo ve', async () => {
		// Está en el DOM —la animación lo necesita—, así que hay que decir que
		// no cuenta: si no, el lector anuncia tres opciones de un menú que en la
		// pantalla no está.
		montarElMenu();
		await nextTick();

		expect(elMenu().hasAttribute('inert')).toBe(true);

		await abrirConElRaton();
		expect(elMenu().hasAttribute('inert')).toBe(false);
	});

	test('una opción apagada lo dice, y sigue estando', async () => {
		// Apagada, no escondida: sacarla del recorrido la vuelve imposible de
		// descubrir, y «pegar» que no está se confunde con «pegar» que no
		// existe en este menú.
		montarElMenu({ items: [{ texto: 'Uno' }, { texto: 'Dos', disabled: true }] });
		await abrirConElRaton();

		const [, dos] = losItems();
		expect(dos?.getAttribute('aria-disabled')).toBe('true');
		expect(dos?.getAttribute('tabindex')).toBe('0');
	});

	test('el separador separa de verdad', async () => {
		montarElMenu({ conSeparador: true });
		await abrirConElRaton();

		expect(document.querySelector('[role="separator"]')).not.toBeNull();
	});

	test('el título nombra al menú', async () => {
		// Sin el `aria-labelledby`, al abrirlo se oye «menú, tres elementos» y
		// nada más: el título está escrito en la pantalla pero no lo dice nadie.
		montarElMenu({ conEtiqueta: true });
		await abrirConElRaton();

		const titulo = document.querySelector('[role="presentation"]');
		expect(titulo?.textContent).toBe('Acciones');
		expect(elMenu().getAttribute('aria-labelledby')).toBe(titulo?.id);
	});
});

describe('el disparador', () => {
	test('dice que abre un menú, y si está abierto', async () => {
		montarElMenu();
		await nextTick();

		const boton = elDisparador();
		expect(boton.getAttribute('aria-haspopup')).toBe('menu');
		expect(boton.getAttribute('aria-expanded')).toBe('false');
		expect(boton.hasAttribute('aria-controls')).toBe(false);

		await abrirConElRaton();
		expect(boton.getAttribute('aria-expanded')).toBe('true');
		expect(boton.getAttribute('aria-controls')).toBe(elMenu().id);
	});

	test('con `as-child` los atributos van sobre el botón y no sobre un envoltorio', async () => {
		// Es la diferencia entre oír «botón, menú, contraído» y oír «botón»: el
		// envoltorio no recibe el foco, así que lo que le cuelgue no se anuncia.
		montarElMenu();
		await nextTick();

		expect(elDisparador().tagName).toBe('BUTTON');
		expect(document.querySelector('.dropdown-menu-trigger')).toBeNull();
	});

	test('sin `as-child` envuelve, que es lo que necesita un menú contextual', async () => {
		montarElMenu({ disparadorSuelto: true });
		await nextTick();

		const envoltorio = document.querySelector('.dropdown-menu-trigger');
		expect(envoltorio?.getAttribute('aria-haspopup')).toBe('menu');
	});
});

describe('el teclado', () => {
	test('Enter elige, avisa de las dos maneras y cierra', async () => {
		montarElMenu();
		await abrirConElTeclado();

		teclear(losItems()[1] as HTMLElement, 'Enter');
		await nextTick();

		expect(elegidos).toEqual(['Dos']);
		expect(clicados).toEqual(['Dos']);
		expect(elMenu().hasAttribute('inert')).toBe(true);
	});

	test('Espacio también, que es la otra tecla que activa', async () => {
		montarElMenu();
		await abrirConElTeclado();

		teclear(losItems()[0] as HTMLElement, ' ');
		await nextTick();

		expect(elegidos).toEqual(['Uno']);
	});

	test('una opción apagada no hace nada, ni con el teclado ni con el ratón', async () => {
		// Con el `@click` nativo del `div` esto pasaba igual: el manejador de
		// adentro comprobaba `disabled` y el de afuera no se enteraba.
		montarElMenu({ items: [{ texto: 'Uno', disabled: true }] });
		await abrirConElTeclado();

		const uno = losItems()[0] as HTMLElement;
		teclear(uno, 'Enter');
		clicar(uno);
		await nextTick();

		expect(elegidos).toEqual([]);
		expect(clicados).toEqual([]);
	});

	test('las flechas recorren y dan la vuelta', async () => {
		montarElMenu();
		await abrirConElTeclado();

		const [uno, dos, tres] = losItems();
		expect(document.activeElement).toBe(uno as HTMLElement);

		teclear(document.activeElement as Element, 'ArrowDown');
		expect(document.activeElement).toBe(dos as HTMLElement);

		teclear(document.activeElement as Element, 'ArrowDown');
		teclear(document.activeElement as Element, 'ArrowDown');
		expect(document.activeElement).toBe(uno as HTMLElement);

		teclear(document.activeElement as Element, 'ArrowUp');
		expect(document.activeElement).toBe(tres as HTMLElement);
	});

	test('Inicio y Fin van a las puntas', async () => {
		montarElMenu();
		await abrirConElTeclado();

		teclear(document.activeElement as Element, 'End');
		expect(document.activeElement).toBe(losItems()[2] as HTMLElement);

		teclear(document.activeElement as Element, 'Home');
		expect(document.activeElement).toBe(losItems()[0] as HTMLElement);
	});

	test('la flecha de arriba abre por el final', async () => {
		montarElMenu();
		const boton = elDisparador();
		boton.focus();
		teclear(boton, 'ArrowUp');
		await nextTick();
		await nextTick();

		expect(document.activeElement).toBe(losItems()[2] as HTMLElement);
	});

	test('abierto con el ratón el foco va al menú, no a una opción', async () => {
		// No hay ninguna elegida todavía, y enfocar la primera la anuncia como
		// si lo estuviera. Con el foco en el menú las flechas y el Escape andan
		// igual.
		montarElMenu();
		await abrirConElRaton();

		expect(document.activeElement).toBe(elMenu());
	});

	test('Escape cierra y el foco vuelve a quien lo abrió', async () => {
		montarElMenu();
		const boton = elDisparador();
		await abrirConElTeclado();

		teclear(document.activeElement as Element, 'Escape');
		await nextTick();

		expect(elMenu().hasAttribute('inert')).toBe(true);
		expect(document.activeElement).toBe(boton);
	});

	test('el Tabulador cierra en vez de irse al final de la página', async () => {
		// El menú vive al final del `body`: dejar que el foco siga su curso
		// desde acá lo saca del sitio donde el usuario cree que está parado.
		montarElMenu();
		const boton = elDisparador();
		await abrirConElTeclado();

		teclear(document.activeElement as Element, 'Tab');
		await nextTick();

		expect(elMenu().hasAttribute('inert')).toBe(true);
		expect(document.activeElement).toBe(boton);
	});

	test('elegir devuelve el foco al disparador', async () => {
		montarElMenu();
		const boton = elDisparador();
		await abrirConElTeclado();

		clicar(losItems()[0] as HTMLElement);
		await nextTick();

		expect(document.activeElement).toBe(boton);
	});
});

describe('atado desde afuera', () => {
	test('lo abre la aplicación y el menú avisa cuando se cierra', async () => {
		// La forma del menú contextual: quien decide abrirlo es la aplicación
		// —el botón derecho sobre una pestaña— y el disparador es un ancla
		// invisible puesta donde se apretó. Acá no hay clic sobre el disparador
		// que valga, así que el menú tiene que enfocarse igual y avisar por
		// `update:open` al cerrarse solo.
		const vista = mount(DropdownMenu, {
			attachTo: document.body,
			props: { open: false },
			slots: {
				default: () => [
					h(DropdownMenuTrigger, null, () => h('span', { 'aria-hidden': 'true' })),
					h(DropdownMenuContent, null, () => [h(DropdownMenuItem, null, () => 'Uno')]),
				],
			},
		});
		montado = vista;

		await vista.setProps({ open: true });
		await nextTick();
		expect(document.activeElement).toBe(elMenu());

		clicar(losItems()[0] as HTMLElement);
		await nextTick();

		expect(vista.emitted('update:open')?.at(-1)).toEqual([false]);
	});

	test('sin atar se abre y se cierra solo', async () => {
		// Una propiedad `boolean` que no se pasa vale `false` y no `undefined`:
		// con el `??` mirando eso, el estado interno no se usaba nunca y un
		// menú sin `v-model` no se abría. No se veía porque las dos
		// aplicaciones que lo usan lo atan.
		montarElMenu();
		await abrirConElRaton();

		expect(elMenu().hasAttribute('inert')).toBe(false);
	});
});

describe('cerrar con el ratón', () => {
	test('un clic afuera cierra y deja el foco donde el usuario lo puso', async () => {
		// Lo contrario del Escape: quien hizo clic afuera ya eligió dónde está
		// parado, y traérselo de vuelta al disparador es sacárselo de las manos.
		montarElMenu();
		await abrirConElTeclado();

		clicar(document.body);
		await nextTick();

		expect(elMenu().hasAttribute('inert')).toBe(true);
		expect(document.activeElement).not.toBe(elDisparador());
	});
});
