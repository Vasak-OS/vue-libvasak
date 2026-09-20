/**
 * El diálogo modal, montado.
 *
 * Venían tres bases distintas para lo mismo: el juego de seis piezas de
 * vasak-file-manager, el `ModalDialog` de vasak-settings y el `ModalBase` de
 * vasak-store. Un diálogo interrumpe lo que la persona está haciendo, así que
 * se abría, se cerraba y se enfocaba distinto según la aplicación.
 *
 * Lo que se comprueba acá es sobre todo **la promesa del `aria-modal`**. El
 * juego de seis piezas la declaraba sin cumplirla: el foco nunca entraba al
 * diálogo, el Tab seguía recorriendo lo que quedó detrás del velo —invisible
 * pero alcanzable— y al cerrar no volvía a ningún lado. `ModalBase` sí ponía el
 * foco adentro, y de ahí se tomó.
 */

import { afterEach, describe, expect, test } from 'bun:test';
import { mount } from '@vue/test-utils';
import { defineComponent, h, nextTick, ref } from 'vue';
import Dialog from '../src/dialog/Dialog.vue';
import DialogContent from '../src/dialog/DialogContent.vue';
import DialogDescription from '../src/dialog/DialogDescription.vue';
import DialogFooter from '../src/dialog/DialogFooter.vue';
import DialogTitle from '../src/dialog/DialogTitle.vue';

/**
 * Un diálogo con un botón de afuera —el que lo abre— y dos adentro.
 *
 * El de afuera importa: es a lo que el foco tiene que volver al cerrar, y sin
 * él la prueba no podría distinguir «volvió» de «se quedó en el `body`».
 */
function armar(opciones: { titulo?: boolean; clase?: string } = {}) {
	const abierto = ref(false);
	const vista = mount(
		defineComponent({
			setup() {
				return () => [
					h('button', { class: 'abridor', onClick: () => (abierto.value = true) }, 'Abrir'),
					h(
						Dialog,
						{ open: abierto.value, 'onUpdate:open': (v: boolean) => (abierto.value = v) },
						() =>
							h(DialogContent, { class: opciones.clase }, () => [
								opciones.titulo === false ? null : h(DialogTitle, () => 'Borrar el archivo'),
								h(DialogDescription, () => 'Esto no se puede deshacer'),
								h(DialogFooter, () => [
									h('button', { class: 'cancelar' }, 'Cancelar'),
									h('button', { class: 'borrar' }, 'Borrar'),
								]),
							])
					),
				];
			},
		}),
		{ attachTo: document.body }
	);
	return { vista, abierto };
}

const elPanel = () => document.body.querySelector<HTMLElement>('[role="dialog"]');

/**
 * El `body` queda limpio entre prueba y prueba.
 *
 * El diálogo se teletransporta al `body`, así que no lo limpia el desmontaje de
 * la vista. Sin esto, una prueba que falla deja su panel puesto y la siguiente
 * encuentra **ése** al preguntar por `[role="dialog"]`: falla también, por algo
 * que no tiene nada que ver. Se vio saboteando — un solo sabotaje hacía caer
 * tres pruebas, y dos de las tres no tenían nada roto.
 */
afterEach(() => {
	for (const suelto of document.body.querySelectorAll('[role="dialog"]')) {
		suelto.parentElement?.remove();
	}
});

async function abrir(vista: ReturnType<typeof armar>['vista']) {
	await vista.find('.abridor').trigger('click');
	await nextTick();
	await nextTick();
}

function teclear(key: string, extra: Partial<KeyboardEventInit> = {}) {
	document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...extra }));
}

describe('el diálogo', () => {
	test('no está en el documento hasta que se abre', async () => {
		const { vista } = armar();

		expect(elPanel()).toBeNull();
		await abrir(vista);
		expect(elPanel()).not.toBeNull();

		vista.unmount();
	});

	test('el foco entra al panel, no al primer botón', async () => {
		// Al panel para que un lector de pantalla lea el título y la
		// descripción antes que la primera acción.
		const { vista } = armar();
		await abrir(vista);

		expect(document.activeElement).toBe(elPanel());
		vista.unmount();
	});

	test('y al cerrar vuelve a lo que estaba enfocado antes', async () => {
		// Sin esto, cerrar deja el foco en el `body` y el teclado empieza de
		// nuevo desde arriba de la página.
		const { vista } = armar();
		const abridor = vista.find('.abridor').element as HTMLElement;
		abridor.focus();

		await abrir(vista);
		expect(document.activeElement).toBe(elPanel());

		teclear('Escape');
		await nextTick();
		await nextTick();

		expect(document.activeElement).toBe(abridor);
		vista.unmount();
	});

	test('Escape lo cierra', async () => {
		const { vista, abierto } = armar();
		await abrir(vista);

		teclear('Escape');
		await nextTick();

		expect(abierto.value).toBe(false);
		vista.unmount();
	});

	test('el clic en el velo lo cierra, y el de adentro no', async () => {
		const { vista, abierto } = armar();
		await abrir(vista);

		// El panel está dentro del velo: un clic ahí no tiene que cerrar.
		elPanel()?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await nextTick();
		expect(abierto.value).toBe(true);

		const velo = elPanel()?.parentElement as HTMLElement;
		velo.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await nextTick();
		expect(abierto.value).toBe(false);

		vista.unmount();
	});
});

describe('el teclado no se escapa del diálogo', () => {
	test('Tab desde el último vuelve al primero', async () => {
		// Es la promesa del `aria-modal`: lo de atrás no existe. Sin esto el Tab
		// sigue recorriendo lo que quedó detrás del velo.
		const { vista } = armar();
		await abrir(vista);

		const borrar = document.body.querySelector<HTMLElement>('.borrar');
		const cancelar = document.body.querySelector<HTMLElement>('.cancelar');
		borrar?.focus();

		teclear('Tab');
		await nextTick();

		expect(document.activeElement).toBe(cancelar);
		vista.unmount();
	});

	test('y Shift+Tab desde el primero va al último', async () => {
		const { vista } = armar();
		await abrir(vista);

		const borrar = document.body.querySelector<HTMLElement>('.borrar');
		const cancelar = document.body.querySelector<HTMLElement>('.cancelar');
		cancelar?.focus();

		teclear('Tab', { shiftKey: true });
		await nextTick();

		expect(document.activeElement).toBe(borrar);
		vista.unmount();
	});
});

describe('lo que un lector de pantalla oye', () => {
	test('el título nombra al diálogo', async () => {
		// Sin el `aria-labelledby` se anuncia «diálogo» y nada más: quien no ve
		// la pantalla no sabe qué le están preguntando.
		const { vista } = armar();
		await abrir(vista);

		const id = elPanel()?.getAttribute('aria-labelledby');
		expect(id).toBeTruthy();
		expect(document.getElementById(id as string)?.textContent).toBe('Borrar el archivo');

		vista.unmount();
	});

	test('y sin título no se inventa una referencia colgada', async () => {
		// Un `aria-labelledby` que apunta a un `id` inexistente es peor que no
		// tenerlo: el lector no dice nada y nadie se entera.
		const { vista } = armar({ titulo: false });
		await abrir(vista);

		expect(elPanel()?.hasAttribute('aria-labelledby')).toBe(false);
		vista.unmount();
	});

	test('la descripción usa un token que existe', async () => {
		// La copia de la que salió esto traía `text-[hsl(var(--muted-foreground))]`,
		// un resto de shadcn: esa variable no existe en ningún tema de VasakOS,
		// así que el color no se aplicaba.
		const { vista } = armar();
		await abrir(vista);

		const descripcion = document.body.querySelector('p');

		expect(descripcion?.className).toContain('text-tx-muted');
		expect(descripcion?.className).not.toContain('muted-foreground');
		vista.unmount();
	});
});

describe('la clase de quien lo usa', () => {
	test('llega al panel', async () => {
		// Mismo detalle que en el tooltip: la raíz es un `Teleport`, así que
		// `class` no puede caer sola.
		const { vista } = armar({ clase: 'max-w-3xl' });
		await abrir(vista);

		expect(elPanel()?.className).toContain('max-w-3xl');
		vista.unmount();
	});
});
