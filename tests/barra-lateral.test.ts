/**
 * La barra lateral, montada.
 *
 * Esta librería existe para que seis ventanas se lean como partes del mismo
 * escritorio. Lo que eso significa en concreto es la forma —el ancho plegado,
 * el borde, los grupos— y el comportamiento del plegado, que es lo que se
 * rompe al tocarla. Acá se comprueban las dos cosas: la forma porque es el
 * punto, y el comportamiento porque es lo que se pierde callado.
 */

import { beforeEach, describe, expect, test } from 'bun:test';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import SideBar from '../src/sidebar/SideBar.vue';
import SideButton from '../src/sidebar/SideButton.vue';
import SideGroup from '../src/sidebar/SideGroup.vue';
import { emitir, olvidarTodo, ponerEnElTema } from './dobles';

const CATEGORIAS = [
	{
		id: 'sistema',
		title: 'Sistema',
		items: [
			{ id: 'recursos', label: 'Recursos', icon: 'utilities-system-monitor' },
			{ id: 'servicios', label: 'Servicios', icon: 'system-run', badge: 3 },
		],
	},
	{
		id: 'otros',
		title: 'Otros',
		items: [{ id: 'registros', label: 'Registros', disabled: true }],
	},
];

/** Deja que terminen las promesas del montaje. */
async function asentar(vueltas = 4) {
	for (let i = 0; i < vueltas; i++) {
		await nextTick();
	}
}

beforeEach(() => {
	olvidarTodo();
});

describe('la forma, que es el punto de compartirla', () => {
	test('lleva las clases con las que se reconoce al escritorio', async () => {
		// Si estas cambian, cambian para todas las ventanas a la vez: es
		// exactamente lo que se venía a ganar al dejar de copiar el componente.
		const barra = mount(SideBar, { props: { title: 'Monitor' } });

		const clases = barra.get('aside').classes().join(' ');
		for (const clase of ['rounded-corner', 'border-ui-border', 'bg-ui-bg/80', 'w-[84px]']) {
			expect(clases).toContain(clase);
		}
	});

	test('desplegada mide 72 y plegada 84 píxeles', async () => {
		const barra = mount(SideBar, { props: { title: 'Monitor' } });
		expect(barra.get('aside').classes()).toContain('md:w-72');

		await barra.get('aside button').trigger('click');

		expect(barra.get('aside').classes()).toContain('md:w-[84px]');
		expect(barra.get('aside').classes()).not.toContain('md:w-72');
	});
});

describe('el área de título', () => {
	test('está cuando hay algo que poner', async () => {
		const barra = mount(SideBar, { props: { title: 'Monitor', subtitle: 'VasakOS' } });

		expect(barra.text()).toContain('Monitor');
		expect(barra.text()).toContain('VasakOS');
	});

	test('y no está cuando no lo hay, sin llevarse el botón de plegar', async () => {
		// El gestor de archivos no la necesita: el nombre ya está en la barra
		// superior y repetirlo acá gasta la mitad del alto. Pero sin cabecera el
		// botón de plegar se quedaba sin lugar y la barra dejaba de plegarse.
		const barra = mount(SideBar);

		expect(barra.find('p').exists()).toBe(false);
		const plegar = barra.get('aside button');
		expect(plegar.attributes('aria-expanded')).toBe('true');

		await plegar.trigger('click');

		expect(barra.get('aside').classes()).toContain('md:w-[84px]');
	});
});

describe('los elementos', () => {
	test('cada categoría es un grupo con sus botones', async () => {
		const barra = mount(SideBar, { props: { categories: CATEGORIAS, modelValue: 'recursos' } });

		expect(barra.findAllComponents(SideGroup)).toHaveLength(2);
		expect(barra.findAllComponents(SideButton)).toHaveLength(3);
		expect(barra.text()).toContain('Sistema');
		expect(barra.text()).toContain('Recursos');
	});

	test('el activo se marca para quien no ve el color', async () => {
		// Un borde distinto no lo anuncia un lector de pantalla.
		const barra = mount(SideBar, { props: { categories: CATEGORIAS, modelValue: 'servicios' } });

		const activos = barra
			.findAll('button[aria-current="page"]')
			.map((boton) => boton.text());
		expect(activos).toHaveLength(1);
		expect(activos[0]).toContain('Servicios');
	});

	test('elegir uno avisa por las dos vías', async () => {
		// `update:modelValue` para el `v-model` y `change` para quien quiera
		// enterarse sin atarse al valor.
		const barra = mount(SideBar, { props: { categories: CATEGORIAS, modelValue: 'recursos' } });

		const servicios = barra
			.findAll('button')
			.find((boton) => boton.text().includes('Servicios'));
		await servicios?.trigger('click');

		expect(barra.emitted('update:modelValue')).toEqual([['servicios']]);
		expect(barra.emitted('change')).toEqual([['servicios']]);
	});

	test('uno deshabilitado no elige nada', async () => {
		const barra = mount(SideBar, { props: { categories: CATEGORIAS } });

		const registros = barra
			.findAll('button')
			.find((boton) => boton.text().includes('Registros'));
		expect((registros?.element as HTMLButtonElement).disabled).toBe(true);
		await registros?.trigger('click');

		expect(barra.emitted('update:modelValue')).toBeUndefined();
	});
});

describe('plegada', () => {
	test('el nombre se va y queda en el globo', async () => {
		// Plegada, una barra sin `title` es una columna de dibujos sin
		// explicación.
		const barra = mount(SideBar, { props: { categories: CATEGORIAS, title: 'Monitor' } });
		await barra.get('aside > header button').trigger('click');
		await asentar();

		const recursos = barra.findAllComponents(SideButton)[0];
		expect(recursos?.text()).not.toContain('Recursos');
		expect(recursos?.attributes('title')).toBe('Recursos');
	});

	test('los títulos de los grupos se van, y el grupo queda abierto', async () => {
		// Un grupo cerrado sin título visible sería contenido escondido detrás
		// de nada.
		const barra = mount(SideBar, { props: { categories: CATEGORIAS, title: 'Monitor' } });
		await barra.get('aside > header button').trigger('click');
		await asentar();

		expect(barra.text()).not.toContain('Sistema');
		expect(barra.findAllComponents(SideButton)).toHaveLength(3);
	});

	test('y la ranura de la cabecera se esconde, que ahí no entra un campo', async () => {
		// 84 píxeles es el ancho del icono: un campo de texto ahí no se podría
		// ni leer ni escribir.
		const barra = mount(SideBar, {
			props: { title: 'Tienda' },
			slots: { header: '<input name="busqueda">' },
		});
		expect(barra.find('input[name="busqueda"]').exists()).toBe(true);

		await barra.get('aside > header button').trigger('click');

		expect(barra.find('input[name="busqueda"]').exists()).toBe(false);
	});
});

describe('el contenido libre', () => {
	test('la ranura recibe si está plegada', async () => {
		// Lo que se dibuja adentro casi siempre tiene que saberlo: el gestor de
		// archivos esconde los nombres de los discos, el instalador los pasos.
		const barra = mount(SideBar, {
			props: { title: 'Archivos' },
			slots: { default: '<p id="adentro">{{ params.collapsed ? "si" : "no" }}</p>' },
		});
		expect(barra.get('#adentro').text()).toBe('no');

		await barra.get('aside > header button').trigger('click');

		expect(barra.get('#adentro').text()).toBe('si');
	});

	test('convive con las categorías', async () => {
		const barra = mount(SideBar, {
			props: { categories: CATEGORIAS },
			slots: { default: '<p id="propio">discos</p>' },
		});

		expect(barra.findAllComponents(SideButton)).toHaveLength(3);
		expect(barra.get('#propio').text()).toBe('discos');
	});
});

describe('quién manda sobre el plegado', () => {
	test('se puede plegar desde afuera', async () => {
		const barra = mount(SideBar, { props: { title: 'Monitor', collapsed: false } });
		expect(barra.get('aside').classes()).toContain('md:w-72');

		await barra.setProps({ collapsed: true });

		expect(barra.get('aside').classes()).toContain('md:w-[84px]');
	});

	test('y la barra avisa cuando la pliega la persona', async () => {
		// Es lo que deja recordarlo entre sesiones sin que la barra sepa dónde
		// se guarda.
		const barra = mount(SideBar, { props: { title: 'Monitor', collapsed: false } });

		await barra.get('aside > header button').trigger('click');

		expect(barra.emitted('update:collapsed')).toEqual([[true]]);
	});
});

describe('los iconos', () => {
	test('salen del tema del escritorio', async () => {
		ponerEnElTema('utilities-system-monitor', 'data:image/png;base64,MONITOR');
		const barra = mount(SideBar, { props: { categories: CATEGORIAS } });

		await asentar();

		expect(barra.get('img').attributes('src')).toBe('data:image/png;base64,MONITOR');
	});

	test('y se vuelven a resolver cuando la persona cambia de tema', async () => {
		// Es la mitad de para qué se pide el icono por nombre y no por ruta.
		ponerEnElTema('utilities-system-monitor', 'data:image/png;base64,CLARO');
		const barra = mount(SideBar, { props: { categories: CATEGORIAS } });
		await asentar();
		expect(barra.get('img').attributes('src')).toBe('data:image/png;base64,CLARO');

		ponerEnElTema('utilities-system-monitor', 'data:image/png;base64,OSCURO');
		await emitir('vicons:theme-changed');
		await asentar();

		expect(barra.get('img').attributes('src')).toBe('data:image/png;base64,OSCURO');
	});

	test('sin icono queda la inicial y no un hueco', async () => {
		// Un hueco vacío del mismo tamaño deja la fila desalineada contra las
		// que sí lo tienen.
		const barra = mount(SideButton, { props: { label: 'Registros' } });

		await asentar();

		expect(barra.find('img').exists()).toBe(false);
		expect(barra.text()).toContain('R');
	});
});
