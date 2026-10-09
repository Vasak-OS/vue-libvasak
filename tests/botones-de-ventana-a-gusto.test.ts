/**
 * Los botones de ventana como los pide la persona, y el borde de afuera (2.16.0).
 *
 * En Configuración se elige entre los botones planos y los tres círculos de
 * macOS, y entre tenerlos al final o invertidos al principio. Se escribe en
 * `vasak.conf` y todas las ventanas lo siguen, también las que ya están
 * abiertas. Acá se comprueba eso de punta a punta: lo que devuelve `readConfig`
 * llega a los botones sin que la aplicación pase nada, cambia con
 * `config-changed`, y una ventana que fija el suyo a mano no lo sigue.
 *
 * Los círculos llevan los colores del esquema —`status-error`, `status-warning`
 * y `status-success`—, nunca un rojo escrito a mano: con otro esquema tienen que
 * cambiar con él.
 */

import { beforeEach, describe, expect, test } from 'bun:test';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import ThemeIcon from '../src/icons/ThemeIcon.vue';
import AppBar from '../src/window/AppBar.vue';
import WindowControls from '../src/window/WindowControls.vue';
import WindowFrame from '../src/window/WindowFrame.vue';
import { cerrosDeVentana, emitir, escribirLaConfiguracion, laVentanaRecibio, olvidarTodo, vaciarElCatalogo } from './dobles';

const ETIQUETAS = { minimizeLabel: 'min', maximizeLabel: 'max', closeLabel: 'cerrar' };

/** Deja que la ventana lea la configuración y registre su oyente. */
async function asentar() {
	for (let i = 0; i < 4; i++) {
		await flushPromises();
		await nextTick();
	}
}

function abrirLaVentana(props: Record<string, unknown> = {}) {
	return mount(WindowFrame, {
		props: { position: 'top', title: 'Ventana', ...ETIQUETAS, ...props },
		slots: { identidad: () => h('img', { class: 'icono-de-la-app', alt: '' }) },
	});
}

/** Los nombres accesibles de los botones, en el orden en que se dibujan. */
function botones(vista: VueWrapper) {
	return vista
		.findComponent(WindowControls)
		.findAll('button')
		.map((boton) => boton.attributes('aria-label'));
}

/** El relleno del círculo de un botón estilo macOS. */
function circulo(vista: VueWrapper, etiqueta: string) {
	return vista.find(`button[aria-label="${etiqueta}"] > span`);
}

beforeEach(() => {
	olvidarTodo();
	vaciarElCatalogo();
});

describe('sin preferencia', () => {
	test('quedan los botones planos de siempre, al final y en el orden de siempre', async () => {
		const vista = abrirLaVentana();
		await asentar();

		expect(botones(vista)).toEqual(['min', 'max', 'cerrar']);
		// Planos: el icono simbólico de 16 directo en el botón, sin círculo de
		// color detrás.
		const iconos = vista.findComponent(WindowControls).findAllComponents(ThemeIcon);
		expect(iconos.map((icono) => icono.props('size'))).toEqual([16, 16, 16]);
		expect(vista.find('.bg-status-error').exists()).toBe(false);

		// Y después del icono de la aplicación, no antes.
		const barra = vista.findComponent(AppBar).element;
		const icono = barra.querySelector('.icono-de-la-app') as Element;
		const primerBoton = barra.querySelector('button') as Element;
		expect(icono.compareDocumentPosition(primerBoton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

		vista.unmount();
	});
});

describe('el estilo macOS', () => {
	test('la preferencia llega desde `readConfig` sin que la aplicación pase nada', async () => {
		escribirLaConfiguracion({ window: { controlsStyle: 'macos' } });

		const vista = abrirLaVentana();
		await asentar();

		expect(vista.findComponent(WindowControls).find('[data-controls-style]').attributes('data-controls-style')).toBe(
			'macos'
		);
		// El orden no cambia por el estilo: eso lo decide la otra preferencia.
		expect(botones(vista)).toEqual(['min', 'max', 'cerrar']);

		vista.unmount();
	});

	test('cada círculo lleva su color del esquema: rojo cerrar, amarillo minimizar, verde maximizar', async () => {
		escribirLaConfiguracion({ window: { controlsStyle: 'macos' } });

		const vista = abrirLaVentana();
		await asentar();

		expect(circulo(vista, 'cerrar').classes()).toContain('bg-status-error');
		expect(circulo(vista, 'min').classes()).toContain('bg-status-warning');
		expect(circulo(vista, 'max').classes()).toContain('bg-status-success');
		// Redondos con el radio del sistema, no con uno suelto de Tailwind.
		for (const etiqueta of ['cerrar', 'min', 'max']) {
			expect(circulo(vista, etiqueta).classes()).toContain('rounded-corner-full');
		}

		vista.unmount();
	});

	test('los círculos no llevan ningún color escrito a mano', async () => {
		escribirLaConfiguracion({ window: { controlsStyle: 'macos' } });

		const vista = abrirLaVentana();
		await asentar();

		// Primero que haya círculos: sin ellos no hay nada que mirar y esto
		// pasaría en vacío.
		expect(vista.findAll('[data-control] > .bg-status-error')).toHaveLength(1);
		const html = vista.findComponent(WindowControls).html();
		// Ni hexadecimales, ni funciones de color, ni la paleta de Tailwind.
		expect(html).not.toMatch(/#[0-9a-f]{3,8}\b/i);
		expect(html).not.toMatch(/\b(rgb|rgba|hsl|hsla|oklch)\(/i);
		expect(html).not.toMatch(/\b(bg|text)-(red|yellow|amber|green|emerald)-\d{2,3}\b/);
		expect(html).not.toMatch(/style="[^"]*color/i);

		vista.unmount();
	});

	test('el signo es el icono simbólico del tema, teñido, y sólo se ve al pasar o con el teclado', async () => {
		escribirLaConfiguracion({ window: { controlsStyle: 'macos' } });

		const vista = abrirLaVentana();
		await asentar();

		const iconos = vista.findComponent(WindowControls).findAllComponents(ThemeIcon);
		expect(iconos.map((icono) => icono.props('name'))).toEqual(['window-minimize', 'window-maximize', 'window-close']);
		for (const icono of iconos) {
			expect(icono.props('type')).toBe('symbol');
			expect(icono.props('tint')).toBe(true);
			// Escondido en reposo, como en macOS; aparece al pasar por encima
			// del grupo o con el foco del teclado adentro.
			expect(icono.classes()).toContain('opacity-0');
			expect(icono.classes()).toContain('group-hover/controls:opacity-100');
			expect(icono.classes()).toContain('group-focus-within/controls:opacity-100');
		}

		vista.unmount();
	});

	test('sin nadie escuchando, el círculo rojo cierra la ventana', async () => {
		escribirLaConfiguracion({ window: { controlsStyle: 'macos' } });

		const vista = abrirLaVentana();
		await asentar();

		await vista.find('[data-control="close"]').trigger('click');
		await vista.find('[data-control="minimize"]').trigger('click');
		await vista.find('[data-control="maximize"]').trigger('click');
		await flushPromises();

		expect(cerrosDeVentana()).toBe(1);
		expect(laVentanaRecibio).toEqual(['close', 'minimize', 'toggleMaximize']);

		vista.unmount();
	});

	test('y quien escucha `close` se queda con el círculo rojo, igual que con el botón plano', async () => {
		escribirLaConfiguracion({ window: { controlsStyle: 'macos' } });
		const cerrados: number[] = [];

		const vista = abrirLaVentana({ onClose: () => cerrados.push(1) });
		await asentar();

		await vista.find('[data-control="close"]').trigger('click');
		await flushPromises();

		expect(cerrados).toHaveLength(1);
		expect(cerrosDeVentana()).toBe(0);

		vista.unmount();
	});
});

describe('el orden invertido', () => {
	test('va cerrar, minimizar, maximizar', async () => {
		escribirLaConfiguracion({ window: { controlsOrder: 'reversed' } });

		const vista = abrirLaVentana();
		await asentar();

		expect(botones(vista)).toEqual(['cerrar', 'min', 'max']);

		vista.unmount();
	});

	test('la barra pone los botones primero, antes del icono de la aplicación', async () => {
		escribirLaConfiguracion({ window: { controlsOrder: 'reversed' } });

		const vista = abrirLaVentana();
		await asentar();

		const barra = vista.findComponent(AppBar).element;
		const hijos = [...barra.children];
		const controles = vista.findComponent(WindowControls).element;
		const icono = barra.querySelector('.icono-de-la-app')?.parentElement as Element;
		// Los botones son lo primero de la barra, y una sola vez: no quedan
		// otros al final.
		expect(hijos.indexOf(controles)).toBe(0);
		expect(hijos.indexOf(icono)).toBeGreaterThan(0);
		expect(vista.findAllComponents(WindowControls)).toHaveLength(1);

		vista.unmount();
	});

	test('el mini-reproductor sigue llevando sólo cerrar', async () => {
		escribirLaConfiguracion({ window: { controlsStyle: 'macos', controlsOrder: 'reversed' } });

		const vista = abrirLaVentana({ controls: ['close'] });
		await asentar();

		expect(botones(vista)).toEqual(['cerrar']);

		vista.unmount();
	});
});

describe('las ventanas abiertas siguen a Configuración', () => {
	test('cambiar la preferencia con `config-changed` cambia los botones sin reabrir', async () => {
		const vista = abrirLaVentana();
		await asentar();
		expect(botones(vista)).toEqual(['min', 'max', 'cerrar']);
		expect(vista.find('.bg-status-error').exists()).toBe(false);

		escribirLaConfiguracion({ window: { controlsStyle: 'macos', controlsOrder: 'reversed' } });
		await emitir('config-changed');
		await asentar();

		expect(botones(vista)).toEqual(['cerrar', 'min', 'max']);
		expect(circulo(vista, 'cerrar').classes()).toContain('bg-status-error');
		const barra = [...vista.findComponent(AppBar).element.children];
		expect(barra.indexOf(vista.findComponent(WindowControls).element)).toBe(0);

		vista.unmount();
	});

	test('borrar la clave a mano devuelve lo de siempre, no lo anterior', async () => {
		escribirLaConfiguracion({ window: { controlsStyle: 'macos', controlsOrder: 'reversed' } });
		const vista = abrirLaVentana();
		await asentar();
		expect(botones(vista)).toEqual(['cerrar', 'min', 'max']);

		escribirLaConfiguracion({ window: {} });
		await emitir('config-changed');
		await asentar();

		expect(botones(vista)).toEqual(['min', 'max', 'cerrar']);
		expect(vista.find('.bg-status-error').exists()).toBe(false);

		vista.unmount();
	});

	test('y la barra sigue en su lado: las tres preferencias se leen juntas', async () => {
		escribirLaConfiguracion({ window: { barPosition: 'left', controlsStyle: 'macos' } });

		const vista = mount(WindowFrame, { props: ETIQUETAS });
		await asentar();

		expect(vista.find('div').classes()).toContain('flex-row');
		expect(circulo(vista, 'cerrar').classes()).toContain('bg-status-error');

		vista.unmount();
	});
});

describe('las propiedades ganan a la preferencia', () => {
	test('`variant` y `order` fijan el estilo y el orden aunque la configuración no diga nada', async () => {
		const vista = mount(WindowControls, {
			props: { ...ETIQUETAS, variant: 'macos', order: 'reversed' },
		});
		await asentar();

		expect(botones(vista)).toEqual(['cerrar', 'min', 'max']);
		expect(circulo(vista, 'cerrar').classes()).toContain('bg-status-error');

		vista.unmount();
	});

	test('una ventana que fija los planos no sigue a la preferencia macOS', async () => {
		escribirLaConfiguracion({ window: { controlsStyle: 'macos', controlsOrder: 'reversed' } });

		const vista = mount(WindowControls, {
			props: { ...ETIQUETAS, variant: 'default', order: 'default' },
		});
		await asentar();

		expect(botones(vista)).toEqual(['min', 'max', 'cerrar']);
		expect(vista.find('.bg-status-error').exists()).toBe(false);
		expect(vista.find('[data-controls-style]').attributes('data-controls-style')).toBe('default');

		vista.unmount();
	});

	test('fijar uno solo deja que el otro siga a la preferencia', async () => {
		escribirLaConfiguracion({ window: { controlsStyle: 'macos', controlsOrder: 'reversed' } });

		const vista = mount(WindowControls, { props: { ...ETIQUETAS, variant: 'default' } });
		await asentar();

		expect(botones(vista)).toEqual(['cerrar', 'min', 'max']);
		expect(vista.find('.bg-status-error').exists()).toBe(false);

		vista.unmount();
	});
});

describe('el borde de afuera', () => {
	test('el marco usa `window-border` y no el `border-ui-line` de las cajas de adentro', () => {
		// `window-border` es el que sigue al grosor y al color que se eligen en
		// Configuración. Con `border border-ui-line` la ventana se queda en 1 px
		// gris aunque la persona haya pedido el acento.
		const vista = abrirLaVentana();

		const clases = vista.find('div').classes();
		expect(clases).toContain('window-border');
		expect(clases).not.toContain('border-ui-line');
		expect(clases).not.toContain('border');

		vista.unmount();
	});
});
