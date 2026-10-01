/**
 * Lo que la 2.1.0 sumó a componentes que ya existían, sin romper la 2.0.0.
 *
 * Cada extensión tiene dos pruebas: la de lo nuevo y la de que, sin pedirlo,
 * todo sigue como estaba. La segunda es la que importa para las dieciséis
 * aplicaciones que suben sin tocar nada: un aviso que hoy sale sin icono no
 * puede ganar uno, ni un botón cualquiera empezar a anunciarse como «de
 * alternar».
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mount, type VueWrapper } from '@vue/test-utils';
import { defineComponent, h, nextTick, ref } from 'vue';
import ActionButton from '../src/controls/ActionButton.vue';
import Dialog from '../src/dialog/Dialog.vue';
import DialogBody from '../src/dialog/DialogBody.vue';
import DialogContent from '../src/dialog/DialogContent.vue';
import DialogHeader from '../src/dialog/DialogHeader.vue';
import DialogTitle from '../src/dialog/DialogTitle.vue';
import AlertMessage from '../src/feedback/AlertMessage.vue';
import EmptyState from '../src/feedback/EmptyState.vue';
import LoadingState from '../src/feedback/LoadingState.vue';
import ToastArea from '../src/feedback/ToastArea.vue';
import FormGroup from '../src/forms/FormGroup.vue';
import ProgressBar from '../src/forms/ProgressBar.vue';
import SelectField from '../src/forms/SelectField.vue';
import TextInput from '../src/forms/TextInput.vue';
import { olvidarTodo, pedidosDeIcono, traducir, vaciarElCatalogo } from './dobles';

const vistas: VueWrapper[] = [];
function montar<T>(componente: T, opciones: Record<string, unknown> = {}) {
	// biome-ignore lint/suspicious/noExplicitAny: el tipo del componente lo decide quien llama.
	const vista = mount(componente as any, opciones);
	vistas.push(vista);
	return vista;
}

beforeEach(() => {
	olvidarTodo();
	vaciarElCatalogo();
});

afterEach(() => {
	for (const vista of vistas.splice(0)) vista.unmount();
	document.body.innerHTML = '';
});

const esperarIconos = () => new Promise((listo) => setTimeout(listo, 0));

describe('el botón', () => {
	test('sin pressed no es de alternar: no lleva aria-pressed', () => {
		expect(montar(ActionButton, { props: { label: 'Guardar' } }).attributes('aria-pressed')).toBeUndefined();
	});

	test('con pressed lo dice y se ve con el velo de lo elegido', () => {
		const apretado = montar(ActionButton, { props: { label: 'Aleatorio', pressed: true, variant: 'ghost' } });
		const suelto = montar(ActionButton, { props: { label: 'Repetir', pressed: false, variant: 'ghost' } });

		expect(apretado.attributes('aria-pressed')).toBe('true');
		expect(apretado.classes()).toContain('from-ui-selected-accent');
		expect(suelto.attributes('aria-pressed')).toBe('false');
		expect(suelto.classes()).not.toContain('from-ui-selected-accent');
	});

	test('con href es un enlace de verdad, con la forma del botón', async () => {
		const vista = montar(ActionButton, {
			props: { label: 'Sitio del proyecto', href: 'https://vasak.net.ar', target: '_blank', variant: 'secondary' },
		});

		expect(vista.element.tagName).toBe('A');
		expect(vista.attributes('href')).toBe('https://vasak.net.ar');
		expect(vista.attributes('rel')).toBe('noopener noreferrer');
		expect(vista.attributes('type')).toBeUndefined();
		expect(vista.classes()).toContain('rounded-corner-m');
		await vista.trigger('click');
		expect(vista.emitted('click')).toHaveLength(1);
	});

	test('un enlace apagado no se sigue', async () => {
		const vista = montar(ActionButton, { props: { label: 'Sitio', href: '/x', disabled: true } });
		const evento = new MouseEvent('click', { cancelable: true });
		vista.element.dispatchEvent(evento);

		expect(vista.attributes('href')).toBeUndefined();
		expect(vista.attributes('aria-disabled')).toBe('true');
		expect(evento.defaultPrevented).toBe(true);
		expect(vista.emitted('click')).toBeUndefined();
	});

	test('sobre una imagen, el velo de medios y no negro escrito a mano', () => {
		const clases = montar(ActionButton, { props: { label: '', icon: 'go-next', iconAlt: 'Siguiente', variant: 'overlay' } }).classes();

		expect(clases).toContain('bg-ui-overlay');
		expect(clases.join(' ')).not.toMatch(/black|white/);
	});

	test('el globo nativo, para el que es sólo icono', () => {
		expect(montar(ActionButton, { props: { label: '', icon: 'x', iconAlt: 'Cerrar', title: 'Cerrar' } }).attributes('title')).toBe('Cerrar');
	});

	test('sigue siendo un button con su type', () => {
		const vista = montar(ActionButton, { props: { label: 'Enviar', type: 'submit' } });

		expect(vista.element.tagName).toBe('BUTTON');
		expect(vista.attributes('type')).toBe('submit');
	});
});

describe('el aviso en línea', () => {
	test('sin icono pedido, sin icono, como en la 2.0.0', async () => {
		montar(AlertMessage, { props: { tone: 'error' }, slots: { default: 'No se pudo' } });
		await esperarIconos();

		expect(pedidosDeIcono).toEqual([]);
	});

	test('con icon="auto", el del tono', async () => {
		for (const [tone, icono] of [
			['info', 'dialog-information'],
			['success', 'object-select'],
			['warning', 'dialog-warning'],
			['error', 'dialog-error'],
		] as const) {
			olvidarTodo();
			montar(AlertMessage, { props: { tone, icon: 'auto' }, slots: { default: 'x' } });
			await esperarIconos();
			expect(pedidosDeIcono.map((p) => p.nombre)).toContain(icono);
		}
	});

	test('las acciones van en su ranura', () => {
		const vista = montar(AlertMessage, { slots: { default: 'Cambió en disco', actions: '<button class="recargar">Recargar</button>' } });

		expect(vista.find('.recargar').exists()).toBe(true);
	});

	test('se cierra con su cruz, nombrada por la propiedad, el catálogo o el respaldo', async () => {
		const vista = montar(AlertMessage, { props: { dismissible: true, closeLabel: 'Descartar' }, slots: { default: 'x' } });
		const cruz = vista.get('button');
		expect(cruz.attributes('aria-label')).toBe('Descartar');
		await cruz.trigger('click');
		expect(vista.emitted('close')).toHaveLength(1);

		traducir('alert.close', 'Ocultar');
		expect(montar(AlertMessage, { props: { dismissible: true }, slots: { default: 'x' } }).get('button').attributes('aria-label')).toBe('Ocultar');
		vaciarElCatalogo();
		expect(montar(AlertMessage, { props: { dismissible: true }, slots: { default: 'x' } }).get('button').attributes('aria-label')).toBe('Cerrar');
	});

	test('la barra va de lado a lado: sin radio y con el canto sólo arriba', () => {
		const clases = montar(AlertMessage, { props: { variant: 'banner', tone: 'success' }, slots: { default: 'Guardado' } }).classes();

		expect(clases).toContain('border-t');
		expect(clases).not.toContain('rounded-corner-l');
		expect(clases).not.toContain('border');
	});

	test('la caja de siempre no cambió', () => {
		expect(montar(AlertMessage, { slots: { default: 'x' } }).classes()).toEqual(
			expect.arrayContaining(['flex', 'gap-3', 'rounded-corner-l', 'border', 'px-4', 'py-2'])
		);
	});
});

describe('el vacío y la espera', () => {
	test('icon="" no dibuja ningún icono ni deja el hueco', async () => {
		montar(EmptyState, { props: { title: 'Sin dispositivos', icon: '' } });
		await esperarIconos();

		expect(pedidosDeIcono).toEqual([]);
	});

	test('el chico es la caja de Configuración', () => {
		const vista = montar(EmptyState, { props: { title: 'Sin dispositivos', size: 'sm', icon: '', bordered: true } });

		expect(vista.classes()).toEqual(expect.arrayContaining(['px-4', 'py-6', 'border-dashed']));
		expect(vista.classes()).not.toContain('py-12');
	});

	test('la espera chica es una fila con el aro de 16', () => {
		const vista = montar(LoadingState, { props: { label: 'Cargando…', size: 'sm' } });

		expect(vista.classes()).toContain('flex-row');
		expect(vista.get('span').classes()).toEqual(expect.arrayContaining(['size-4', 'border-2']));
		expect(vista.attributes('role')).toBe('status');
	});

	test('y la de siempre sigue igual', () => {
		const vista = montar(LoadingState, { props: { label: 'Cargando…' } });

		expect(vista.classes()).toEqual(expect.arrayContaining(['flex-col', 'py-12']));
		expect(vista.get('span').classes()).toContain('size-10');
	});
});

describe('la barra de progreso', () => {
	test('los tres altos', () => {
		expect(montar(ProgressBar, { props: { value: 1, label: 'x', size: 'xs' } }).classes()).toContain('h-1');
		expect(montar(ProgressBar, { props: { value: 1, label: 'x', size: 'sm' } }).classes()).toContain('h-1.5');
		expect(montar(ProgressBar, { props: { value: 1, label: 'x' } }).classes()).toContain('h-2');
	});

	test('con showValue, la fila de Configuración: la etiqueta y el número recortado', () => {
		const vista = montar(ProgressBar, { props: { value: 140.04, label: 'Disco', showValue: true, decimals: 1 } });

		expect(vista.text()).toContain('Disco');
		expect(vista.text()).toContain('100.0%');
		expect(vista.get('[role="progressbar"]').attributes('aria-valuenow')).toBe('100');
		// La fila no se lee dos veces: la barra ya tiene nombre y valor.
		expect(vista.get('[aria-hidden="true"]').text()).toContain('Disco');
	});

	test('indeterminada no inventa un número', () => {
		const vista = montar(ProgressBar, { props: { value: null, label: 'Buscando', showValue: true } });

		expect(vista.text()).not.toContain('%');
	});
});

describe('el select', () => {
	test('las opciones como lista, en objetos o en cadenas', () => {
		const objetos = montar(SelectField, {
			props: { modelValue: 'es', options: [{ label: 'Español', value: 'es' }, { label: 'Inglés', value: 'en', disabled: true }] },
		});
		const cadenas = montar(SelectField, { props: { modelValue: 'top', options: ['top', 'bottom'] } });

		const opciones = objetos.findAll('option');
		expect(opciones.map((o) => o.text())).toEqual(['Español', 'Inglés']);
		expect(opciones[1]?.attributes('disabled')).toBeDefined();
		expect(cadenas.findAll('option').map((o) => o.attributes('value'))).toEqual(['top', 'bottom']);
	});

	test('sin lista, la ranura como siempre', () => {
		const vista = montar(SelectField, { props: { modelValue: 'a' }, slots: { default: '<option value="a">A</option>' } });

		expect(vista.findAll('option')).toHaveLength(1);
	});
});

describe('la etiqueta con su ayuda y su error', () => {
	function grupo(props: Record<string, unknown>) {
		return montar(FormGroup, {
			props: { label: 'Usuario', ...props },
			slots: {
				default: ({ id, describedBy, invalid }: { id: string; describedBy?: string; invalid: boolean }) =>
					h(TextInput, { id, modelValue: '', describedBy, invalid }),
			},
		});
	}

	test('la ranura recibe el id, la descripción y si es inválido', () => {
		const vista = grupo({ help: 'Sólo minúsculas', error: 'Ya existe' });
		const input = vista.get('input');

		expect(vista.get('label').attributes('for')).toBe(input.attributes('id'));
		const ids = input.attributes('aria-describedby')?.split(' ') ?? [];
		expect(ids).toHaveLength(2);
		expect(ids.map((id) => vista.find(`#${id}`).text())).toEqual(['Sólo minúsculas', 'Ya existe']);
		expect(input.attributes('aria-invalid')).toBe('true');
	});

	test('el error se anuncia al aparecer, en el texto principal y con su icono', async () => {
		const vista = grupo({ error: 'Ya existe' });
		await esperarIconos();
		const error = vista.get('[aria-live="polite"]');

		expect(error.classes()).toContain('text-tx-main');
		expect(error.classes().join(' ')).not.toContain('text-status-error');
		expect(pedidosDeIcono.map((p) => p.nombre)).toContain('dialog-error-symbolic');
	});

	test('sin error, la región existe pero no ocupa lugar', () => {
		const vista = grupo({});

		expect(vista.get('[aria-live="polite"]').classes()).toContain('sr-only');
		expect(vista.get('input').attributes('aria-describedby')).toBeUndefined();
		expect(vista.get('input').attributes('aria-invalid')).toBeUndefined();
	});

	test('htmlFor manda sobre el id generado', () => {
		const vista = montar(FormGroup, { props: { label: 'x', htmlFor: 'propio' } });

		expect(vista.get('label').attributes('for')).toBe('propio');
	});

	test('eyebrow: la etiqueta de resonance, chica, en mayúsculas y atenuada', () => {
		const etiqueta = montar(FormGroup, { props: { label: 'Género', variant: 'eyebrow' } }).get('label');

		expect(etiqueta.classes()).toEqual(expect.arrayContaining(['uppercase', 'text-label-xs', 'text-tx-muted']));
	});
});

describe('los avisos transitorios', () => {
	const ponerAvisos = (toasts: unknown[]) => montar(ToastArea, { props: { toasts }, attachTo: document.body });
	const aviso = () => document.body.querySelector<HTMLElement>('[role="status"], [role="alert"]');

	test('el de siempre es sólo el mensaje', async () => {
		ponerAvisos([{ id: 1, message: 'Se copió' }]);
		await nextTick();

		expect(aviso()?.textContent?.trim()).toBe('Se copió');
		expect(aviso()?.querySelector('button')).toBeNull();
	});

	test('con título, descripción, barra y acción', async () => {
		const vista = ponerAvisos([
			{ id: 1, title: 'Copiando 3 archivos', message: 'A Documentos', description: 'Quedan 2 minutos', progress: 40, action: { label: 'Cancelar' } },
		]);
		await nextTick();
		const caja = aviso() as HTMLElement;

		expect(caja.textContent).toContain('Copiando 3 archivos');
		expect(caja.textContent).toContain('Quedan 2 minutos');
		expect(caja.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('40');
		expect(caja.className).toContain('w-80');
		caja.querySelector('button')?.click();
		expect(vista.emitted('action')?.[0]?.[0]).toMatchObject({ id: 1 });
	});

	test('la ranura recibe el aviso como toast y como aviso', async () => {
		montar(ToastArea, {
			props: { toasts: [{ id: 1, message: 'x' }] },
			slots: { default: ({ toast, aviso: viejo }: { toast: { id: number }; aviso: { id: number } }) => `${toast.id}=${viejo.id}` },
			attachTo: document.body,
		});
		await nextTick();

		expect(aviso()?.textContent?.trim()).toBe('1=1');
	});
});

describe('el diálogo', () => {
	function armar(contenido: () => unknown, size?: string) {
		const abierto = ref(true);
		const vista = mount(
			defineComponent({
				setup: () => () =>
					h(Dialog, { open: abierto.value, 'onUpdate:open': (v: boolean) => (abierto.value = v) }, () =>
						h(DialogContent, { size }, contenido)
					),
			}),
			{ attachTo: document.body }
		);
		vistas.push(vista);
		return { abierto };
	}
	const panel = () => document.body.querySelector<HTMLElement>('[role="dialog"]');

	test('el encabezado con su cruz cierra el diálogo', async () => {
		const { abierto } = armar(() => [h(DialogHeader, { closable: true }, () => h(DialogTitle, () => 'Preferencias'))]);
		await nextTick();
		const cruz = panel()?.querySelector('button');

		expect(cruz?.getAttribute('aria-label')).toBe('Cerrar');
		cruz?.click();
		await nextTick();
		expect(abierto.value).toBe(false);
	});

	test('con closeLabel, la cruz se dibuja sola; con closeStyle="label", la palabra', async () => {
		armar(() => [h(DialogHeader, { closeLabel: 'Listo', closeStyle: 'label' }, () => h(DialogTitle, () => 'x'))]);
		await nextTick();

		expect(panel()?.querySelector('button')?.textContent?.trim()).toBe('Listo');
	});

	test('el nombre de la cruz sale del catálogo si nadie lo pasa', async () => {
		traducir('dialog.close', 'Salir');
		armar(() => [h(DialogHeader, { closable: true }, () => h(DialogTitle, () => 'x'))]);
		await nextTick();

		expect(panel()?.querySelector('button')?.getAttribute('aria-label')).toBe('Salir');
	});

	test('sin cruz, el encabezado de la 2.0.0', async () => {
		armar(() => [h(DialogHeader, null, () => h(DialogTitle, () => 'x'))]);
		await nextTick();

		expect(panel()?.querySelector('button')).toBeNull();
		expect(panel()?.querySelector('.text-center')).not.toBeNull();
	});

	test('el chico mide 420 y lleva velo', async () => {
		armar(() => [h(DialogTitle, () => 'Renombrar')], 'sm');
		await nextTick();

		expect(panel()?.className).toContain('max-w-[420px]');
		expect(document.body.querySelector('.bg-ui-scrim')).not.toBeNull();
	});

	test('con cuerpo, el panel pasa a columna y desplaza el cuerpo', async () => {
		armar(() => [h(DialogTitle, () => 'Receta'), h(DialogBody, () => 'texto largo')]);
		await nextTick();
		const cuerpo = panel()?.querySelector('[data-dialog-body]');

		expect(panel()?.className).toContain('has-[>[data-dialog-body]]:flex-col');
		expect(cuerpo?.className).toContain('overflow-y-auto');
		// Cabe: no es una parada de Tab.
		expect(cuerpo?.getAttribute('tabindex')).toBeNull();
	});
});

describe('el cuerpo del diálogo, solo', () => {
	test('observa el envoltorio del contenido, que crece con lo que llega después', () => {
		const observados: Element[] = [];
		const original = globalThis.ResizeObserver;
		globalThis.ResizeObserver = class {
			observe(elemento: Element) {
				observados.push(elemento);
			}
			unobserve() {}
			disconnect() {}
		} as unknown as typeof ResizeObserver;
		try {
			const vista = montar(DialogBody, { slots: { default: '<p>uno</p><p>dos</p>' } });
			const envoltorio = vista.element.firstElementChild;

			expect(observados).toContain(vista.element);
			expect(observados).toContain(envoltorio as Element);
			expect(envoltorio?.querySelectorAll('p')).toHaveLength(2);
		} finally {
			globalThis.ResizeObserver = original;
		}
	});

	test('cuando el contenido no entra, se puede alcanzar con el teclado', async () => {
		// Un `ResizeObserver` de mentira, para decidir desde acá cuándo avisa:
		// en happy-dom nada mide, así que el de verdad no avisaría nunca.
		const avisos: Array<() => void> = [];
		const original = globalThis.ResizeObserver;
		globalThis.ResizeObserver = class {
			constructor(avisar: () => void) {
				avisos.push(avisar);
			}
			observe() {}
			unobserve() {}
			disconnect() {}
		} as unknown as typeof ResizeObserver;
		try {
			const vista = montar(DialogBody, { props: { label: 'Receta' }, slots: { default: 'x' }, attachTo: document.body });
			expect(vista.attributes('tabindex')).toBeUndefined();

			const cuerpo = vista.element as HTMLElement;
			Object.defineProperty(cuerpo, 'scrollHeight', { value: 900, configurable: true });
			Object.defineProperty(cuerpo, 'clientHeight', { value: 300, configurable: true });
			for (const avisar of avisos) avisar();
			await nextTick();

			expect(vista.attributes('tabindex')).toBe('0');
			expect(vista.attributes('role')).toBe('region');
			expect(vista.attributes('aria-label')).toBe('Receta');
		} finally {
			globalThis.ResizeObserver = original;
		}
	});
});
