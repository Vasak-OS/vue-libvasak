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
import { defineComponent, h, nextTick } from 'vue';
import AlertMessage from '../src/feedback/AlertMessage.vue';
import EmptyState from '../src/feedback/EmptyState.vue';
import LoadingState from '../src/feedback/LoadingState.vue';
import FormGroup from '../src/forms/FormGroup.vue';
import Dialog from '../src/dialog/Dialog.vue';
import DialogContent from '../src/dialog/DialogContent.vue';
import ToastArea from '../src/feedback/ToastArea.vue';
import { rolDelTono } from '../src/feedback/tonos';
import ProgressBar from '../src/forms/ProgressBar.vue';
import SearchField from '../src/search/SearchField.vue';
import TextInput from '../src/forms/TextInput.vue';
import { olvidarTodo, ponerEnElTema, variantesPedidas } from './dobles';

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

	test('el título se puede poner, y sin él no queda una línea vacía', () => {
		// Un aviso de cinco líneas sin título obliga a leerlo entero para saber
		// si importa. Venía de la copia del instalador, la única que lo tenía.
		const con = mount(AlertMessage, { props: { title: 'No se pudo leer el disco' }, slots: { default: 'Detalle' } });
		const sin = mount(AlertMessage, { slots: { default: 'Detalle' } });

		expect(con.find('p').text()).toBe('No se pudo leer el disco');
		expect(sin.find('p').exists()).toBe(false);
	});

	test('el icono es opcional y no se lee en voz alta', async () => {
		// El texto del aviso ya dice lo mismo: un lector de pantalla que anuncie
		// «imagen, diálogo de error» antes del mensaje repite.
		olvidarTodo();
		ponerEnElTema('dialog-error', 'datos-del-icono');
		const con = mount(AlertMessage, { props: { icon: 'dialog-error' }, slots: { default: 'x' } });
		const sin = mount(AlertMessage, { slots: { default: 'x' } });
		await new Promise((listo) => setTimeout(listo, 0));

		expect(con.find('img').attributes('alt')).toBe('');
		expect(sin.find('img').exists()).toBe(false);
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

	test('el icono se puede pedir en la variante monocroma', async () => {
		// No todos los nombres existen en las dos: el gestor de archivos pide
		// `search` en la monocroma, y pedir la que no está deja un hueco del
		// tamaño del icono en vez de un icono.
		//
		// Se mira **qué variante se pidió** y no qué fuente volvió: el doble
		// devuelve lo mismo para las dos, así que mirar la fuente daba verde con
		// la variante equivocada. Se vio saboteando.
		olvidarTodo();
		ponerEnElTema('search', 'la-del-tema');
		const vista = mount(EmptyState, {
			props: { title: 'Sin resultados', icon: 'search', iconType: 'symbol' },
		});
		await new Promise((listo) => setTimeout(listo, 0));

		expect(variantesPedidas('search')).toEqual(['symbol']);
		vista.unmount();
	});

	test('y por omisión es la de color, que es la que casi todos tienen', async () => {
		olvidarTodo();
		ponerEnElTema('folder-open', 'la-del-tema');
		const vista = mount(EmptyState, { props: { title: 'Vacía', icon: 'folder-open' } });
		await new Promise((listo) => setTimeout(listo, 0));

		expect(variantesPedidas('folder-open')).toEqual(['icon']);
		vista.unmount();
	});

	test('la nota es opcional', () => {
		const sin = mount(EmptyState, { props: { title: 'Sin resultados' } });
		const con = mount(EmptyState, { props: { title: 'Sin resultados', note: 'Probá con menos filtros' } });

		expect(sin.findAll('p')).toHaveLength(1);
		expect(con.findAll('p')).toHaveLength(2);
	});
});

/** La franja de adentro, que es la que dice cuánto falta. */
function laBanda(vista: { element: Element }): string {
	return vista.element.firstElementChild?.className ?? '';
}

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

	test('la banda indeterminada ocupa todo, para no parecer una fracción', () => {
		// Una banda que ocupa un tercio se lee como «33% completado». Y se queda
		// quieta: la animación es infinita, así que `prefers-reduced-motion` la
		// detiene, y quien pidió menos movimiento terminaba viendo un progreso
		// inventado. Lo encontró el instalador.
		// La banda es el hijo, no la raíz: la raíz es la caja, que siempre ocupa
		// todo el ancho. Apuntarle a ella dejaba la prueba pasando sin mirar nada.
		const vista = mount(ProgressBar, { props: { value: null, label: 'Buscando' } });

		const banda = laBanda(vista);
		expect(banda).toContain('w-full');
		expect(banda).not.toContain('w-1/3');
	});

	test('y deja de latir si se pidió menos movimiento', () => {
		// Una barra que se mueve sin parar durante media hora es justo lo que
		// marea a alguien con trastorno vestibular.
		const vista = mount(ProgressBar, { props: { value: null, label: 'Buscando' } });

		expect(laBanda(vista)).toContain('motion-reduce:animate-none');
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

	test('el error se ve y además se puede atar a su explicación', () => {
		// `aria-invalid` dice que algo está mal; sin `aria-describedby`, quien no
		// mira la pantalla nunca se entera de **por qué**.
		const vista = mount(TextInput, {
			props: { modelValue: 'x', invalid: true, describedBy: 'ayuda-de-la-ruta' },
		});

		expect(vista.attributes('aria-describedby')).toBe('ayuda-de-la-ruta');
	});

	test('y el autocompletado va declarado', () => {
		// Con `strictTemplates`, lo que no está declarado no se puede pasar: sin
		// esto un campo de contraseña no tiene forma de decir qué es.
		const vista = mount(TextInput, {
			props: { modelValue: '', type: 'password', autocomplete: 'new-password' },
		});

		expect(vista.attributes('autocomplete')).toBe('new-password');
	});

	test('sirve para la fecha y la hora, que las dibuja el navegador', () => {
		// La configuración pone la fecha y la hora del sistema y programa la luz
		// nocturna: cuatro campos. El selector nativo entiende de formatos
		// locales, cosa que uno escrito a mano no.
		//
		// La línea de arriba es la que ataja de verdad: montar con un tipo
		// cualquiera dibuja el atributo igual, así que lo único que nota un
		// tipo que falte es el chequeo. Sin `date` en la unión, `vue-tsc` se
		// Esto comprueba que se dibujen, no que la unión los acepte: montar con
		// un tipo cualquiera dibuja el atributo igual, y sacarlos de la unión no
		// rompe esta prueba —se comprobó—. Lo que ataja un tipo que falte es el
		// chequeo de plantillas **de quien la usa**, que es donde apareció:
		// vasak-settings no compilaba sus cuatro campos de fecha y hora.
		const fecha = mount(TextInput, { props: { modelValue: '2026-09-20', type: 'date' } });
		const hora = mount(TextInput, { props: { modelValue: '21:30', type: 'time' } });

		expect(fecha.attributes('type')).toBe('date');
		expect(hora.attributes('type')).toBe('time');
	});

	test('la tecla llega a quien lo usa', async () => {
		// Es cómo la tienda confirma la búsqueda y cómo la configuración conecta
		// al Wi-Fi: con Enter sobre el campo.
		const vista = mount(TextInput, { props: { modelValue: '' } });

		await vista.find('input').trigger('keyup', { key: 'Enter' });
		await vista.find('input').trigger('keydown', { key: 'Enter' });

		expect(vista.emitted('keyup')).toHaveLength(1);
		expect(vista.emitted('keydown')).toHaveLength(1);
	});

	test('y declararlas no se lleva puesto lo que se escribe', async () => {
		// Vue saca de los atributos **todo** evento declarado, así que el
		// reenvío no es opcional y el `@input` convive con los otros dos en el
		// mismo elemento. Si uno se llevara al otro, el campo dejaría de avisar
		// lo que se escribe y el chequeo de tipos seguiría en cero.
		const vista = mount(TextInput, { props: { modelValue: '' } });

		await vista.find('input').setValue('hola');

		expect(vista.emitted('update:modelValue')?.[0]).toEqual(['hola']);
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

describe('el estado de carga', () => {
	test('se anuncia, que es lo que no hacía ninguna de las cuatro copias', () => {
		// Tres de las cuatro eran un `div` que gira. Para quien no ve la
		// pantalla, la vista quedaba en blanco y sin explicación hasta que
		// terminara: ni que se estaba esperando, ni qué.
		const vista = mount(LoadingState, { props: { label: 'Cargando fotos…' } });

		expect(vista.attributes('role')).toBe('status');
		expect(vista.attributes('aria-atomic')).toBe('true');
		expect(vista.text()).toContain('Cargando fotos…');
	});

	test('el anillo se queda quieto con el movimiento reducido', () => {
		// Girar sin parar es justo lo que esa preferencia pide que no pase, y
		// acá no se pierde nada: el texto de abajo ya dice qué se espera.
		const vista = mount(LoadingState, { props: { label: 'Cargando' } });
		const anillo = vista.find('span').classes();

		expect(anillo).toContain('animate-spin');
		expect(anillo).toContain('motion-reduce:animate-none');
	});

	test('el borde punteado es opcional', () => {
		const suelto = mount(LoadingState, { props: { label: 'Cargando' } });
		const encajado = mount(LoadingState, { props: { label: 'Cargando', bordered: true } });

		expect(suelto.classes()).not.toContain('border-dashed');
		expect(encajado.classes()).toContain('border-dashed');
	});
});

/** El número de la clase `z-N` de un elemento, o 0 si no lleva ninguna. */
function altura(clases: string): number {
	const encontrada = clases.split(/\s+/).find((clase) => /^z-\d+$/.test(clase));
	return encontrada ? Number(encontrada.slice(2)) : 0;
}

describe('quién queda encima de quién', () => {
	test('un aviso transitorio se ve por encima de un diálogo abierto', async () => {
		// Los dos se teletransportan al `body`, así que con el mismo `z-index`
		// el orden lo decide cuál se agregó último — y el diálogo se agrega al
		// abrirse, o sea siempre después. Un «se copió» disparado desde adentro
		// de un diálogo quedaba tapado por él.
		//
		// Se comparan los dos números y no se comprueba uno fijo: lo que
		// importa es el orden, y bajar cualquiera de los dos lo rompe igual.
		const pila = mount(ToastArea, {
			props: { toasts: [{ id: 1, message: 'Se copió' }] },
			attachTo: document.body,
		});
		const dialogo = mount(
			defineComponent({
				setup: () => () => h(Dialog, { open: true }, () => h(DialogContent, () => 'Borrar')),
			}),
			{ attachTo: document.body }
		);
		await nextTick();

		// El velo es el padre del panel: es el que lleva el `z-index` del
		// diálogo. Se lo busca así y no por su clase para que la prueba falle
		// si el diálogo no llegó a abrirse, en vez de comparar contra cero.
		const elVelo = document.body.querySelector('[role="dialog"]')?.parentElement;
		const laPila = document.body.querySelector('.pointer-events-none.fixed');

		expect(elVelo).toBeTruthy();
		expect(altura(elVelo?.className ?? '')).toBeGreaterThan(0);
		expect(altura(laPila?.className ?? '')).toBeGreaterThan(altura(elVelo?.className ?? ''));

		pila.unmount();
		dialogo.unmount();
		for (const suelto of document.body.querySelectorAll('[role="dialog"]')) {
			suelto.parentElement?.remove();
		}
	});
});

describe('enfocar un campo desde afuera', () => {
	test('el campo de texto expone cómo, sin llegar por `$el`', async () => {
		// La ventana de redacción del correo abre con el cursor en «Para». Sin
		// esto había que alcanzar el elemento por `$el`, que es `any`: deja de
		// andar sin avisar el día que el componente crezca una raíz distinta, y
		// no lo ataja el chequeo de tipos.
		const vista = mount(TextInput, { props: { modelValue: '' }, attachTo: document.body });

		expect(document.activeElement).not.toBe(vista.element);
		(vista.vm as unknown as { enfocar: () => void }).enfocar();

		expect(document.activeElement).toBe(vista.element);
		vista.unmount();
	});

	test('y dice que no cuando el foco no llega', () => {
		// `focus()` sobre algo que no puede recibirlo no hace nada **y no
		// falla**: la tecla que lleva al buscador parece rota. El caso real es
		// un panel `hidden` en una ventana angosta, pero `happy-dom` no modela
		// la visibilidad —ahí el foco entra igual—, así que se prueba con un
		// campo fuera del documento, que es la misma rama: `focus()` no hace
		// nada y `activeElement` no se mueve.
		const vista = mount(TextInput, { props: { modelValue: '' } });

		expect((vista.vm as unknown as { enfocar: () => boolean }).enfocar()).toBe(false);
		vista.unmount();
	});

	test('y sí llega cuando el campo está a la vista', () => {
		const vista = mount(TextInput, { props: { modelValue: '' }, attachTo: document.body });

		expect((vista.vm as unknown as { enfocar: () => boolean }).enfocar()).toBe(true);
		vista.unmount();
	});

	test('y la búsqueda lo usa para devolverse el foco al vaciarse', async () => {
		// La cruz vacía el campo y le devuelve el foco: si no, quien la aprieta
		// se queda con el foco en un botón que acaba de desaparecer.
		const vista = mount(SearchField, { props: { modelValue: 'hola' }, attachTo: document.body });

		await vista.find('button').trigger('mousedown');
		await vista.find('button').trigger('click');

		expect(document.activeElement).toBe(vista.find('input').element);
		vista.unmount();
	});
});
