/**
 * Las cinco piezas que cada aplicación se había hecho por su cuenta.
 *
 * Avisos —en línea y transitorios—, estado vacío, barra de progreso y campo de
 * texto. Entre las seis copias de aviso había seis nombres y tamaños de 23 a
 * 120 líneas; cada una decidió sola dónde aparece, de qué color es y qué oye
 * quien no ve la pantalla.
 *
 * Lo que se comprueba acá es justo eso último, que es lo que se pierde callado:
 * el color lo nota cualquiera, pero que un error **interrumpa** a un lector de
 * pantalla y un éxito **no**, no lo nota nadie hasta que hace falta.
 */

import { afterEach, describe, expect, test } from 'bun:test';
import { mount } from '@vue/test-utils';
import { h } from 'vue';
import AlertMessage from '../src/feedback/AlertMessage.vue';
import EmptyState from '../src/feedback/EmptyState.vue';
import FormGroup from '../src/forms/FormGroup.vue';
import ToastArea from '../src/feedback/ToastArea.vue';
import { rolDelTono } from '../src/feedback/tonos';
import ProgressBar from '../src/forms/ProgressBar.vue';
import TextInput from '../src/forms/TextInput.vue';
import { olvidarTodo, ponerEnElTema } from './dobles';

/** La pila de avisos se teletransporta al `body` y no la limpia el desmontaje. */
afterEach(() => {
	for (const suelto of document.body.querySelectorAll('[role="status"], [role="alert"]')) {
		suelto.closest('.fixed')?.remove();
	}
});

describe('el aviso en línea', () => {
	test('un error interrumpe y lo demás espera su turno', () => {
		// `alert` corta lo que el lector esté leyendo; `status` espera. Es la
		// diferencia entre enterarse de que algo falló y enterarse después.
		expect(rolDelTono('error')).toBe('alert');
		expect(rolDelTono('warning')).toBe('status');
		expect(rolDelTono('success')).toBe('status');
		expect(rolDelTono('info')).toBe('status');
	});

	test('y eso llega al elemento, no se queda en la función', () => {
		const error = mount(AlertMessage, { props: { tone: 'error' }, slots: { default: 'Falló' } });
		const exito = mount(AlertMessage, { props: { tone: 'success' }, slots: { default: 'Listo' } });

		expect(error.attributes('role')).toBe('alert');
		expect(exito.attributes('role')).toBe('status');
	});

	test('se lee entero y no sólo lo que cambió', () => {
		// Sin `aria-atomic`, cambiar «Copiando 3 de 9» a «4 de 9» hace que el
		// lector diga «4» y nada más.
		const vista = mount(AlertMessage, { slots: { default: 'Hace falta reiniciar' } });

		expect(vista.attributes('aria-atomic')).toBe('true');
	});

	test('cada tono trae su color y son distintos entre sí', () => {
		const clases = (tone: string) =>
			mount(AlertMessage, { props: { tone }, slots: { default: 'x' } }).classes().join(' ');

		expect(clases('error')).toContain('status-error');
		expect(clases('success')).toContain('status-success');
		expect(clases('warning')).toContain('status-warning');
		// `info` no tiene token `status-*`: no existe en el sistema.
		expect(clases('info')).toContain('ui-border');
	});
});

describe('la pila de avisos transitorios', () => {
	const avisos = [
		{ id: 1, message: 'Archivo copiado', tone: 'success' as const },
		{ id: 2, message: 'No se pudo leer', tone: 'error' as const },
	];

	test('dibuja uno por aviso, con el rol que le toca a cada uno', () => {
		const vista = mount(ToastArea, { props: { toasts: avisos } });

		expect(document.body.querySelectorAll('[role="status"]')).toHaveLength(1);
		expect(document.body.querySelectorAll('[role="alert"]')).toHaveLength(1);
		vista.unmount();
	});

	test('la pila no se come los clics de lo que hay debajo', () => {
		// La columna ocupa una franja de la ventana aunque esté casi vacía.
		const vista = mount(ToastArea, { props: { toasts: avisos } });

		const pila = document.body.querySelector('.fixed') as HTMLElement;
		expect(pila.className).toContain('pointer-events-none');
		// Y cada aviso sí es clickeable, que es lo que lo hace cerrable.
		expect(document.body.querySelector('[role="alert"]')?.className).toContain(
			'pointer-events-auto'
		);
		vista.unmount();
	});

	test('la posición por omisión es la esquina, y el centro es una opción', () => {
		const esquina = mount(ToastArea, { props: { toasts: avisos } });
		expect((document.body.querySelector('.fixed') as HTMLElement).className).toContain('right-4');
		esquina.unmount();
		document.body.querySelector('.fixed')?.remove();

		const centro = mount(ToastArea, { props: { toasts: avisos, position: 'bottom-center' } });
		expect((document.body.querySelector('.fixed') as HTMLElement).className).toContain('left-1/2');
		centro.unmount();
	});

	test('sin avisos no dibuja ninguno', () => {
		// La pila queda montada y vacía: es lo que deja que el primero entre
		// animado en vez de aparecer de golpe.
		const vista = mount(ToastArea, { props: { toasts: [] } });

		expect(document.body.querySelectorAll('[role="status"], [role="alert"]')).toHaveLength(0);
		vista.unmount();
	});
});

describe('el estado vacío', () => {
	test('el icono no se lee: el título ya dice lo mismo', async () => {
		// El icono lo resuelve el tema, así que hay que ponerlo antes: sin
		// fuente, `ThemeIcon` no dibuja el `img` y no habría qué mirar.
		olvidarTodo();
		ponerEnElTema('dialog-information', 'datos-del-icono');
		const vista = mount(EmptyState, { props: { title: 'No hay nada acá' } });
		await new Promise((listo) => setTimeout(listo, 0));

		expect(vista.find('img').attributes('alt')).toBe('');
	});

	test('la nota es opcional', () => {
		const sin = mount(EmptyState, { props: { title: 'Sin resultados' } });
		const con = mount(EmptyState, { props: { title: 'Sin resultados', note: 'Probá con menos filtros' } });

		expect(sin.findAll('p')).toHaveLength(1);
		expect(con.findAll('p')).toHaveLength(2);
	});
});

describe('la barra de progreso', () => {
	test('dice cuánto lleva, con el ARIA que hace falta', () => {
		// Sin esto es una caja de colores que no le dice nada a quien no la ve.
		const vista = mount(ProgressBar, { props: { value: 40, label: 'Copiando' } });

		expect(vista.attributes('role')).toBe('progressbar');
		expect(vista.attributes('aria-valuenow')).toBe('40');
		expect(vista.attributes('aria-label')).toBe('Copiando');
	});

	test('indeterminado no dice un número inventado', () => {
		// Poner 0 diría «no empezó», que es una cosa distinta de «no se sabe».
		const vista = mount(ProgressBar, { props: { value: null, label: 'Buscando' } });

		expect(vista.attributes('aria-valuenow')).toBeUndefined();
	});

	test('y un valor fuera de rango se acota en vez de desbordar', () => {
		const pasado = mount(ProgressBar, { props: { value: 140, label: 'x' } });
		const negativo = mount(ProgressBar, { props: { value: -20, label: 'x' } });

		expect(pasado.attributes('aria-valuenow')).toBe('100');
		expect(negativo.attributes('aria-valuenow')).toBe('0');
	});
});

describe('el campo de texto', () => {
	test('avisa en cada tecla', async () => {
		const vista = mount(TextInput, { props: { modelValue: '' } });

		await vista.find('input').setValue('ho');

		expect(vista.emitted('update:modelValue')?.[0]).toEqual(['ho']);
	});

	test('y con `lazy` recién al salir del campo', async () => {
		// Para lo que cuesta caro validar: escribir una ruta de treinta letras
		// no tiene que disparar treinta veces lo que haya del otro lado.
		const vista = mount(TextInput, { props: { modelValue: '', lazy: true } });
		const campo = vista.find('input');

		campo.element.value = '/usr/share';
		await campo.trigger('input');
		expect(vista.emitted('update:modelValue')).toBeUndefined();

		await campo.trigger('change');
		expect(vista.emitted('update:modelValue')?.[0]).toEqual(['/usr/share']);
	});

	test('`invalid` se ve y además se anuncia', () => {
		// El borde rojo no existe para quien no lo ve; `aria-invalid` sí.
		const mal = mount(TextInput, { props: { modelValue: 'x', invalid: true } });
		const bien = mount(TextInput, { props: { modelValue: 'x' } });

		expect(mal.attributes('aria-invalid')).toBe('true');
		expect(mal.classes().join(' ')).toContain('status-error');
		expect(bien.attributes('aria-invalid')).toBeUndefined();
	});

	test('`mono` para lo que se alinea', () => {
		const vista = mount(TextInput, { props: { modelValue: '/etc/fstab', mono: true } });

		expect(vista.classes().join(' ')).toContain('font-mono');
	});

	test('la etiqueta de `FormGroup` ata al campo, que era un contrato sin escribir', () => {
		// El campo no trae etiqueta a propósito, y hasta acá el `id` que las une
		// llegaba de rebote por el `fallthrough`: nada lo declaraba ni lo
		// comprobaba. Sin la atadura, el lector de pantalla lee la etiqueta y el
		// campo como dos cosas que no tienen nada que ver.
		const vista = mount(FormGroup, {
			props: { label: 'Ruta del tema', htmlFor: 'ruta' },
			slots: { default: h(TextInput, { id: 'ruta', modelValue: '/usr/share' }) },
		});

		const etiqueta = vista.find('label');
		expect(etiqueta.attributes('for')).toBe('ruta');
		expect(vista.find('input').attributes('id')).toBe(etiqueta.attributes('for'));
	});

	test('y suelto se lo nombra a mano', () => {
		// Una caja de búsqueda con lupa y sin etiqueta visible: sin esto un
		// lector de pantalla no dice más que «campo de texto».
		const vista = mount(TextInput, {
			props: { modelValue: '', type: 'search', ariaLabel: 'Buscar aplicaciones' },
		});

		expect(vista.attributes('aria-label')).toBe('Buscar aplicaciones');
	});
});
