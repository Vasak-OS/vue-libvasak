/**
 * Filas, listas, cabeceras, superficies e insignias de la 2.1.0.
 *
 * Lo que más se comprueba es lo que las copias escritas a mano hacían mal sin
 * que se viera: la etiqueta de la fila de ajuste que no estaba atada a nada,
 * la fila de lista que imponía un alto dentro de un desplazador virtual, el
 * texto de la insignia en el color del tono, el icono de `ConfigSection` que
 * salía escrito como texto.
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mount, type VueWrapper } from '@vue/test-utils';
import { h } from 'vue';
import Badge from '../src/indicators/Badge.vue';
import StatusDot from '../src/indicators/StatusDot.vue';
import ConfigSection from '../src/layout/ConfigSection.vue';
import PageHeader from '../src/layout/PageHeader.vue';
import Panel from '../src/layout/Panel.vue';
import SectionHeading from '../src/layout/SectionHeading.vue';
import SettingRow from '../src/layout/SettingRow.vue';
import ListGroup from '../src/list/ListGroup.vue';
import ListRow from '../src/list/ListRow.vue';
import { olvidarTodo, pedidosDeIcono } from './dobles';

const vistas: VueWrapper[] = [];
function montar<T>(componente: T, opciones: Record<string, unknown> = {}) {
	// biome-ignore lint/suspicious/noExplicitAny: el tipo del componente lo decide quien llama.
	const vista = mount(componente as any, opciones);
	vistas.push(vista);
	return vista;
}

beforeEach(() => olvidarTodo());

afterEach(() => {
	for (const vista of vistas.splice(0)) vista.unmount();
	document.body.innerHTML = '';
});

const esperarIconos = () => new Promise((listo) => setTimeout(listo, 0));

describe('la fila de ajuste', () => {
	test('con controlId, la etiqueta nombra al control', () => {
		const vista = montar(SettingRow, {
			props: { label: 'Mostrar el clima', controlId: 'weather' },
			slots: { default: () => h('button', { id: 'weather', type: 'button' }) },
		});

		expect(vista.get('label').attributes('for')).toBe('weather');
	});

	test('la ranura recibe los id de la etiqueta y la descripción', () => {
		const vista = montar(SettingRow, {
			props: { label: 'Brillo', description: 'Se ajusta solo con la luz' },
			slots: {
				default: ({ labelId, descriptionId }: { labelId: string; descriptionId: string }) =>
					h('input', { 'aria-labelledby': labelId, 'aria-describedby': descriptionId }),
			},
		});
		const input = vista.get('input');

		expect(vista.find(`#${input.attributes('aria-labelledby')}`).text()).toBe('Brillo');
		expect(vista.find(`#${input.attributes('aria-describedby')}`).text()).toBe('Se ajusta solo con la luz');
	});

	test('se acomoda por su ancho, no por la pantalla', () => {
		const vista = montar(SettingRow, { props: { label: 'x' } });

		expect(vista.classes()).toContain('@container');
		// Desde 256 px (`@3xs`) y no desde 320: el centro de control mide 350
		// con su relleno y la fila quedaba apilada (desktop#147).
		expect(vista.html()).toContain('@3xs:flex-row');
		expect(vista.html()).not.toContain('@xs:flex-row');
		expect(vista.html()).not.toMatch(/\s(sm|md):/);
	});

	test('el icono va adelante y el pie debajo', () => {
		const vista = montar(SettingRow, {
			props: { label: 'x' },
			slots: { leading: '<i class="icono" />', footer: '<p class="pie">nota</p>' },
		});

		expect(vista.find('.icono').exists()).toBe(true);
		expect(vista.find('.pie').text()).toBe('nota');
	});
});

describe('la fila de lista', () => {
	test('sin rol sólo muestra: ni tabulable ni rol de botón', () => {
		const vista = montar(ListRow, { props: { title: 'Firefox' } });

		expect(vista.attributes('role')).toBeUndefined();
		expect(vista.attributes('tabindex')).toBeUndefined();
		expect(vista.classes().join(' ')).not.toContain('hover:');
	});

	test('como botón se activa con Enter y Espacio', async () => {
		const vista = montar(ListRow, { props: { title: 'Firefox', role: 'button' } });

		expect(vista.attributes('tabindex')).toBe('0');
		await vista.trigger('keydown', { key: 'Enter' });
		await vista.trigger('keydown', { key: ' ' });
		await vista.trigger('click');
		expect(vista.emitted('click')).toHaveLength(3);
	});

	test('una tecla en un botón de adentro no activa la fila', async () => {
		const vista = montar(ListRow, {
			props: { title: 'Adjunto', role: 'button' },
			slots: { trailing: '<button class="quitar">Quitar</button>' },
		});
		await vista.get('.quitar').trigger('keydown', { key: 'Enter' });

		expect(vista.emitted('click')).toBeUndefined();
	});

	test('elegida: el velo de acento, y lo dice como corresponde a su rol', () => {
		const boton = montar(ListRow, { props: { title: 'x', role: 'button', selected: true } });
		const opcion = montar(ListRow, { props: { title: 'x', role: 'option', selected: true } });

		expect(boton.classes()).toContain('bg-ui-selected-accent');
		expect(boton.attributes('aria-current')).toBe('true');
		expect(opcion.attributes('aria-selected')).toBe('true');
		// Una opción la maneja la lista: no es una parada de Tab.
		expect(opcion.attributes('tabindex')).toBeUndefined();
	});

	test('apagada no responde', async () => {
		const vista = montar(ListRow, { props: { title: 'x', role: 'button', disabled: true } });
		await vista.trigger('click');

		expect(vista.emitted('click')).toBeUndefined();
		expect(vista.attributes('aria-disabled')).toBe('true');
	});

	test('con href es un enlace de verdad', () => {
		const vista = montar(ListRow, { props: { title: 'Sitio', role: 'link', href: 'https://vasak.net.ar' } });

		expect(vista.element.tagName).toBe('A');
		expect(vista.attributes('href')).toBe('https://vasak.net.ar');
	});

	test('un enlace apagado pierde el href pero sigue siendo un enlace', () => {
		const vista = montar(ListRow, { props: { title: 'Sitio', role: 'link', href: '/x', disabled: true } });

		expect(vista.attributes('href')).toBeUndefined();
		expect(vista.attributes('role')).toBe('link');
		expect(vista.attributes('aria-disabled')).toBe('true');
	});

	test('no impone su alto: lo decide el desplazador virtual', () => {
		expect(montar(ListRow, { props: { title: 'x' } }).classes().join(' ')).not.toMatch(/(^|\s)(min-)?h-\d/);
	});

	test('cortada, el texto entero queda en el globo', () => {
		const vista = montar(ListRow, { props: { title: 'Un nombre largo', description: 'y su detalle', truncate: true } });

		expect(vista.attributes('title')).toBe('Un nombre largo — y su detalle');
		expect(vista.find('.truncate').exists()).toBe(true);
	});

	test('sin cortar, el texto se parte y no hay globo', () => {
		const vista = montar(ListRow, { props: { title: 'x' } });

		expect(vista.attributes('title')).toBeUndefined();
		expect(vista.find('.break-words').exists()).toBe(true);
	});

	test('el icono es del tema', async () => {
		montar(ListRow, { props: { title: 'x', icon: 'firefox' } });
		await esperarIconos();

		expect(pedidosDeIcono.map((p) => p.nombre)).toContain('firefox');
	});

	test('dentro de un grupo con divisores va a ras; sin divisores, con su radio', () => {
		const conDivisores = montar(ListGroup, { slots: { default: () => h(ListRow, { title: 'x' }) } });
		const sinDivisores = montar(ListGroup, {
			props: { divided: false },
			slots: { default: () => h(ListRow, { title: 'x' }) },
		});

		expect(conDivisores.classes()).toEqual(expect.arrayContaining(['divide-y', 'divide-ui-line-weak', 'rounded-corner-l']));
		expect(conDivisores.findComponent(ListRow).classes()).not.toContain('rounded-corner-m');
		expect(sinDivisores.classes()).toContain('p-1');
		expect(sinDivisores.findComponent(ListRow).classes()).toContain('rounded-corner-m');
	});

	test('el grupo como lista de opciones tiene nombre', () => {
		const vista = montar(ListGroup, { props: { role: 'listbox', label: 'Resultados' } });

		expect(vista.attributes('role')).toBe('listbox');
		expect(vista.attributes('aria-label')).toBe('Resultados');
	});
});

describe('el título de un tramo', () => {
	test('eyebrow: chico, en mayúsculas y atenuado', () => {
		const titulo = montar(SectionHeading, { props: { title: 'Cuentas' } }).get('h3');

		expect(titulo.classes()).toEqual(expect.arrayContaining(['uppercase', 'text-label-xs', 'text-tx-muted']));
	});

	test('group: con el contador en una insignia y la línea hasta el canto', () => {
		const vista = montar(SectionHeading, { props: { title: 'Hoy', variant: 'group', count: 214, divider: true } });

		expect(vista.get('h3').classes()).toContain('text-label-m');
		expect(vista.findComponent(Badge).text()).toBe('214');
		expect(vista.find('.bg-ui-line-weak').exists()).toBe(true);
	});

	test('pegado arriba, con fondo opaco y sin desenfoque', () => {
		const ventana = montar(SectionHeading, { props: { title: 'x', sticky: true } });
		const panel = montar(SectionHeading, { props: { title: 'x', sticky: true, surface: 'panel' } });

		expect(ventana.classes()).toEqual(expect.arrayContaining(['sticky', 'top-0', 'bg-ui-bg']));
		expect(panel.classes()).toEqual(expect.arrayContaining(['bg-ui-bg', 'from-ui-surface/70']));
		expect(ventana.html()).not.toContain('backdrop-blur');
	});

	test('el nivel lo elige quien lo pone', () => {
		expect(montar(SectionHeading, { props: { title: 'x', as: 'h2' } }).find('h2').exists()).toBe(true);
	});
});

describe('la cabecera de una página', () => {
	test('la sección arriba, el título y la descripción', () => {
		const vista = montar(PageHeader, { props: { title: 'Red', eyebrow: 'Sistema', description: 'Wi-Fi y cable' } });

		expect(vista.get('h1').text()).toBe('Red');
		expect(vista.text()).toContain('Sistema');
		expect(vista.text()).toContain('Wi-Fi y cable');
	});

	test('los dos tamaños de título, para que ninguna pantalla cambie', () => {
		expect(montar(PageHeader, { props: { title: 'x' } }).get('h1').classes()).toContain('text-heading-m');
		expect(montar(PageHeader, { props: { title: 'x', size: 'lg' } }).get('h1').classes()).toContain('text-heading-l');
	});

	test('las acciones se acomodan por el ancho de la cabecera', () => {
		const vista = montar(PageHeader, { props: { title: 'x' }, slots: { actions: '<button>Agregar</button>' } });

		expect(vista.classes()).toContain('@container');
		expect(vista.html()).toContain('@md:flex-row');
		expect(vista.text()).toContain('Agregar');
	});

	test('el icono del instalador va en su recuadro', async () => {
		const vista = montar(PageHeader, { props: { title: 'Disco', icon: 'drive-harddisk' } });
		await esperarIconos();

		expect(pedidosDeIcono.map((p) => p.nombre)).toContain('drive-harddisk');
		expect(vista.find('.size-10.rounded-corner-m').exists()).toBe(true);
	});
});

describe('la superficie de columna', () => {
	test('la tarjeta de Once UI sobre la ventana', () => {
		expect(montar(Panel).classes()).toEqual(
			expect.arrayContaining(['rounded-corner-l', 'border-ui-line', 'bg-ui-surface/70', 'p-4'])
		);
	});

	test('con scroll desplaza adentro', () => {
		expect(montar(Panel, { props: { scroll: true, padding: 'none' } }).classes()).toEqual(
			expect.arrayContaining(['overflow-y-auto', 'min-h-0'])
		);
	});

	test('el elemento lo elige quien lo pone', () => {
		expect(montar(Panel, { props: { as: 'aside' } }).element.tagName).toBe('ASIDE');
	});
});

describe('la sección de Configuración', () => {
	test('el icono es un icono del tema, no su nombre escrito delante del título', async () => {
		const vista = montar(ConfigSection, { props: { title: 'Red', icon: 'network-wired' } });
		await esperarIconos();

		expect(vista.get('h3').text()).toBe('Red');
		expect(vista.text()).not.toContain('network-wired');
		expect(pedidosDeIcono.map((p) => p.nombre)).toContain('network-wired');
	});

	test('la descripción, el costado y las acciones', () => {
		const vista = montar(ConfigSection, {
			props: { title: 'Procesador', description: 'Uso de los últimos minutos' },
			slots: { aside: '<b class="metrica">34 %</b>', actions: '<button>Detalles</button>', default: '<p>contenido</p>' },
		});

		expect(vista.text()).toContain('Uso de los últimos minutos');
		expect(vista.find('.metrica').text()).toBe('34 %');
		expect(vista.text()).toContain('Detalles');
	});

	test('la cabecera propia reemplaza al título', () => {
		const vista = montar(ConfigSection, { props: { title: 'x' }, slots: { header: '<h2 class="propia">Otra</h2>' } });

		expect(vista.find('.propia').exists()).toBe(true);
		expect(vista.find('h3').exists()).toBe(false);
	});
});

describe('la insignia', () => {
	test('el texto es siempre el principal: el tono va en el relleno', () => {
		for (const tone of ['neutral', 'success', 'warning', 'error'] as const) {
			const clases = montar(Badge, { props: { tone, label: 'x' } }).classes();
			expect(clases).toContain('text-tx-main');
			expect(clases.join(' ')).not.toMatch(/text-status-/);
		}
	});

	test('con contorno, el canto del tono y sin relleno', () => {
		const clases = montar(Badge, { props: { tone: 'warning', variant: 'outline', label: 'AUR' } }).classes();

		expect(clases).toEqual(expect.arrayContaining(['border-status-warning', 'bg-transparent']));
	});

	test('sólida de acento, el primario con su texto', () => {
		const clases = montar(Badge, { props: { tone: 'accent', variant: 'solid', label: '3' } }).classes();

		expect(clases).toEqual(expect.arrayContaining(['bg-primary', 'text-tx-on-primary']));
		expect(clases).not.toContain('text-tx-main');
	});

	test('un color de dato tiñe el punto y el canto, nunca el texto', () => {
		const vista = montar(Badge, { props: { color: '#40a02b', label: 'Trabajo' } });

		expect((vista.element as HTMLElement).style.getPropertyValue('--badge-color')).toBe('#40a02b');
		expect(vista.classes()).toContain('border-(--badge-color)');
		expect(vista.find('.bg-\\(--badge-color\\)').exists()).toBe(true);
		expect(vista.classes()).toContain('text-tx-main');
	});

	test('un texto que no entra se parte en vez de cortarse', () => {
		const clases = montar(Badge, { props: { label: 'x' } }).classes();

		expect(clases).toContain('min-h-5');
		expect(clases).not.toContain('truncate');
	});

	test('sobre una imagen, el velo de medios', () => {
		expect(montar(Badge, { props: { variant: 'overlay', label: '0:42' } }).classes()).toContain('bg-ui-overlay');
	});
});

describe('el punto de estado', () => {
	test('sin nombre es decoración y no se anuncia', () => {
		const vista = montar(StatusDot);

		expect(vista.attributes('aria-hidden')).toBe('true');
		expect(vista.attributes('role')).toBeUndefined();
	});

	test('con nombre es una imagen que lo dice', () => {
		const vista = montar(StatusDot, { props: { label: 'Sin leer', tone: 'accent' } });

		expect(vista.attributes('role')).toBe('img');
		expect(vista.attributes('aria-label')).toBe('Sin leer');
		expect(vista.attributes('aria-hidden')).toBeUndefined();
	});

	test('lleva el contorno de 3:1, porque el verde y el amarillo solos no llegan', () => {
		expect(montar(StatusDot, { props: { tone: 'warning' } }).classes()).toEqual(
			expect.arrayContaining(['bg-status-warning', 'ring-1', 'ring-ui-border-strong'])
		);
		expect(montar(StatusDot, { props: { outlined: false } }).classes()).not.toContain('ring-1');
	});

	test('el color de dato va por estilo, y late quieto con menos movimiento', () => {
		const vista = montar(StatusDot, { props: { color: '#1e66f5', pulse: true } });

		expect((vista.element as HTMLElement).style.getPropertyValue('--dot-color')).toBe('#1e66f5');
		expect(vista.classes()).toEqual(expect.arrayContaining(['animate-pulse', 'motion-reduce:animate-none']));
	});
});
