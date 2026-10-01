/**
 * La barra lateral, montada.
 *
 * Esta librería existe para que seis ventanas se lean como partes del mismo
 * escritorio. Lo que eso significa en concreto es la forma —el ancho plegado,
 * el borde, los grupos— y el comportamiento del plegado, que es lo que se
 * rompe al tocarla. Acá se comprueban las dos cosas: la forma porque es el
 * punto, y el comportamiento porque es lo que se pierde callado.
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import SideBar from '../src/sidebar/SideBar.vue';
import SideButton from '../src/sidebar/SideButton.vue';
import SideGroup from '../src/sidebar/SideGroup.vue';
import { reloadIconsNow } from '../src/internal/themeIcon';
import {
	cuantosOyentes,
	demorarElProximoRegistro,
	emitir,
	olvidarTodo,
	ponerEnElTema,
} from './dobles';

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

/**
 * Deja que terminen las promesas del montaje.
 *
 * Ocho vueltas y no cuatro desde que el oyente del tema es uno solo para todas
 * las instancias: el primero que monta espera a que el registro esté puesto
 * antes de resolver, y esa espera son dos eslabones más en la cadena.
 */
async function asentar(vueltas = 8) {
	for (let i = 0; i < vueltas; i++) {
		await nextTick();
	}
}

/**
 * Hace pasar la recarga del cambio de tema, sin esperar el reloj.
 *
 * Desde que la recarga va por tandas, el aviso **no** resuelve en el acto:
 * espera 100 ms para que varios avisos seguidos sean uno solo. Acá eso se
 * empuja en vez de dormirlo: una prueba que depende del reloj de pared falla
 * sola el día que la máquina esté cargada, y en esta misma suite ya hay una que
 * lo hace.
 *
 * Que el rebote **exista** se prueba aparte, en `planificador-de-iconos`. Lo de
 * acá es lo otro: que el icono termine siguiendo al tema.
 */
async function esperarLaRecarga() {
	reloadIconsNow();
	await asentar();
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
		for (const clase of ['rounded-corner-l', 'border-ui-line', 'w-72']) {
			expect(clases).toContain(clase);
		}
	});

	test('el fondo es de superficie y no el de la ventana', async () => {
		// `--ui-background` es el token de **la ventana**; lo que se apoya
		// encima va en superficie. Con el fondo de ventana, la barra se lee como
		// un rectángulo apenas más claro en vez de un panel, que es como venía
		// de la copia de Configuración.
		const barra = mount(SideBar, { props: { title: 'Monitor' } });

		// Con la opacidad fijada y no sólo el token: con `bg-ui-surface` a secas
		// cualquier valor pasaba, y el que vale es el mismo que el de las
		// tarjetas de contenido.
		const clases = barra.get('aside').classes().join(' ');
		expect(clases).toContain('bg-ui-surface/70');
		expect(clases).not.toContain('bg-ui-bg');
	});

	test('y un elemento en reposo no pinta fondo propio', async () => {
		// Sobre un panel de superficie, un botón con su propio fondo oscuro se
		// lee como apagado. El velo aparece al pasar por encima y al estar
		// activo, que es cuando significa algo.
		const boton = mount(SideButton, { props: { label: 'Recursos' } });

		const clases = boton.get('button').classes().join(' ');
		expect(clases).toContain('bg-transparent');
		expect(clases).toContain('hover:bg-ui-hover');
	});

	test('pasar por encima es un velo neutro, no el acento', () => {
		// vue-libvasak#74: el hover pinta `ui-hover`, un gris translúcido sobre
		// el texto de siempre. El acento queda para lo elegido.
		const clases = mount(SideButton, { props: { label: 'Recursos' } }).get('button').classes();

		expect(clases.filter((c) => c.startsWith('hover:'))).not.toContain('hover:bg-primary');
		expect(clases.join(' ')).not.toMatch(/hover:(bg|border)-(primary|secondary)/);
	});

	test('lo elegido se marca con el velo de acento y peso 600, sin borde ni sombra', () => {
		// Decisión 4 del 30/09/2026: lo elegido en una barra lateral lleva el
		// color de acento. Y en ningún estado aparece un borde: antes el activo
		// llevaba el canto secundario, el relleno del primario y una sombra.
		const clases = mount(SideButton, { props: { label: 'Recursos', active: true } })
			.get('button')
			.classes();

		expect(clases).toContain('bg-ui-selected-accent');
		expect(clases).toContain('font-semibold');
		expect(clases.join(' ')).not.toMatch(/(^|\s)(border|shadow)(-|\s|$)/);
	});

	test('anima los colores y nada más', async () => {
		// Lo único que cambia entre estados es el fondo y el peso: con
		// `transition-colors` no hay forma de que una clase nueva empiece a
		// interpolar el maquetado.
		const boton = mount(SideButton, { props: { label: 'Recursos' } });

		const clases = boton.get('button').classes();
		expect(clases).toContain('transition-colors');
		expect(clases).not.toContain('transition-all');
	});

	test('y no se mueve al apretarlo', async () => {
		// Once UI no escala los controles: apretar es el velo `ui-pressed`.
		const boton = mount(SideButton, { props: { label: 'Recursos' } });
		const clases = boton.get('button').classes();

		expect(clases.join(' ')).not.toMatch(/scale-/);
		expect(clases).toContain('active:bg-ui-pressed');
	});

	test('desplegada mide 72 y plegada 84 píxeles', async () => {
		const barra = mount(SideBar, { props: { title: 'Monitor' } });
		expect(barra.get('aside').classes()).toContain('w-72');

		await barra.get('aside button').trigger('click');

		expect(barra.get('aside').classes()).toContain('w-[84px]');
		expect(barra.get('aside').classes()).not.toContain('w-72');
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

		expect(barra.get('aside').classes()).toContain('w-[84px]');
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
		expect((registros?.element as HTMLButtonElement | undefined)?.disabled).toBe(true);
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
		expect(barra.get('aside').classes()).toContain('w-72');

		await barra.setProps({ collapsed: true });

		expect(barra.get('aside').classes()).toContain('w-[84px]');
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
		await esperarLaRecarga();

		expect(barra.get('img').attributes('src')).toBe('data:image/png;base64,OSCURO');
	});

	test('la resolución vieja no pisa a la nueva cuando llega tarde', async () => {
		// Cambiar de icono y cambiar de tema resuelven en paralelo, y el tema
		// tarda lo que tarde el backend. Sin el testigo, la vieja contesta última
		// y deja puesto el icono anterior: en una lista que se desplaza, la fila
		// nueva se queda con el dibujo de la que ocupaba ese lugar antes.
		let soltarLaVieja: (fuente: string) => void = () => {};
		ponerEnElTema(
			'system-run',
			() =>
				new Promise<string>((listo) => {
					soltarLaVieja = listo;
				})
		);
		ponerEnElTema('user-trash', 'data:image/png;base64,NUEVO');

		const boton = mount(SideButton, { props: { label: 'Servicios', icon: 'system-run' } });
		await nextTick();
		await boton.setProps({ icon: 'user-trash' });
		await asentar();
		expect(boton.get('img').attributes('src')).toBe('data:image/png;base64,NUEVO');

		soltarLaVieja('data:image/png;base64,VIEJO');
		await asentar();

		expect(boton.get('img').attributes('src')).toBe('data:image/png;base64,NUEVO');
	});

	test('un cambio de tema durante la primera resolución no se pierde', async () => {
		// Resolver el primer icono tarda, y el oyente se registraba después. Un
		// cambio de tema en esa ventana no lo escuchaba nadie: el botón se
		// quedaba con el icono del tema anterior hasta el cambio siguiente, que
		// puede no venir nunca.
		let soltarLaPrimera: (fuente: string) => void = () => {};
		ponerEnElTema(
			'system-run',
			() =>
				new Promise<string>((listo) => {
					soltarLaPrimera = listo;
				})
		);

		const boton = mount(SideButton, { props: { label: 'Servicios', icon: 'system-run' } });
		await nextTick();

		// El tema cambia mientras la primera resolución sigue esperando.
		ponerEnElTema('system-run', 'data:image/png;base64,OSCURO');
		await emitir('vicons:theme-changed');
		await asentar();

		// Y recién ahí contesta la primera, con el icono del tema viejo.
		soltarLaPrimera('data:image/png;base64,CLARO');
		await asentar();

		expect(boton.get('img').attributes('src')).toBe('data:image/png;base64,OSCURO');
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

describe('lo que el botón tiene que soltar', () => {
	test('el oyente del tema se va al desmontar', async () => {
		const boton = mount(SideButton, { props: { label: 'Recursos', icon: 'system-run' } });
		await asentar();
		expect(cuantosOyentes('vicons:theme-changed')).toBe(1);

		boton.unmount();

		expect(cuantosOyentes('vicons:theme-changed')).toBe(0);
	});

	test('y también si termina de registrarse después de que el botón se fue', async () => {
		// Registrarse tarda, y en una lista que se desplaza un botón puede irse
		// antes de que termine. Ahí `onUnmounted` ya pasó y no vio nada que
		// soltar: el oyente quedaba puesto para siempre sobre un componente
		// muerto, resolviendo iconos que nadie dibuja.
		const soltarElRegistro = demorarElProximoRegistro();
		const boton = mount(SideButton, { props: { label: 'Recursos', icon: 'system-run' } });
		await nextTick();

		boton.unmount();
		soltarElRegistro();
		await asentar();

		expect(cuantosOyentes('vicons:theme-changed')).toBe(0);
	});
});

describe('el nombre accesible', () => {
	test('plegado, el botón lo lleva encima', async () => {
		// Plegado queda sólo el icono, y el icono está marcado como decorativo.
		// El `title` es un globo del ratón, no un nombre accesible: sin
		// `aria-label`, un lector de pantalla anuncia un botón sin nombre.
		const boton = mount(SideButton, {
			props: { label: 'Servicios', icon: 'system-run', collapsed: true },
		});

		expect(boton.get('button').attributes('aria-label')).toBe('Servicios');
		expect(boton.get('button').attributes('title')).toBe('Servicios');
	});

	test('y desplegado no, que el nombre ya está escrito', async () => {
		// Con `aria-label` puesto igual, el lector diría el nombre dos veces.
		const boton = mount(SideButton, { props: { label: 'Servicios', icon: 'system-run' } });

		expect(boton.get('button').attributes('aria-label')).toBeUndefined();
		expect(boton.text()).toContain('Servicios');
	});
});

describe('el contenedor, que tiene que dejar empujar al pie', () => {
	test('es una columna, no una pila de márgenes', async () => {
		// Con `space-y` el contenido no es un contenedor flexible, y entonces un
		// `mt-auto` no empuja nada: el selector de intervalo del monitor quedaba
		// pegado a los botones en vez de irse al fondo de la barra. Es de las
		// cosas que sólo se ven con la ventana abierta.
		const barra = mount(SideBar, { props: { title: 'Monitor' } });

		const contenedor = barra.get('aside > div:last-child');
		const clases = contenedor.classes();
		expect(clases).toContain('flex');
		expect(clases).toContain('flex-col');
		expect(clases).toContain('flex-1');
		expect(clases.some((c) => c.startsWith('space-y'))).toBe(false);
	});
});

describe('los grupos', () => {
	test('el título se pliega y despliega', async () => {
		const barra = mount(SideBar, { props: { categories: CATEGORIAS, title: 'Monitor' } });
		const grupo = barra.findAllComponents(SideGroup)[0];
		const titulo = grupo?.get('button');
		expect(titulo?.attributes('aria-expanded')).toBe('true');
		expect(grupo?.findAllComponents(SideButton)).toHaveLength(2);

		await titulo?.trigger('click');

		expect(titulo?.attributes('aria-expanded')).toBe('false');
		expect(grupo?.findAllComponents(SideButton)).toHaveLength(0);
	});

	test('la flecha es un icono del tema y no un carácter', async () => {
		// Una `v` suelta se dibuja con la tipografía de la interfaz: queda de
		// otro tamaño que el resto de los símbolos de la ventana y no sigue al
		// tema. Es el mismo defecto que tenía el botón de plegar.
		ponerEnElTema('pan-down-symbolic', 'data:image/png;base64,FLECHA');
		const barra = mount(SideBar, { props: { categories: CATEGORIAS, title: 'Monitor' } });
		await asentar();

		const titulo = barra.findAllComponents(SideGroup)[0]?.get('button');
		expect(titulo?.find('img').exists()).toBe(true);
		expect(titulo?.text()).toBe('Sistema');
	});
});

describe('el ancho del lugar donde está', () => {
	/**
	 * Un `ResizeObserver` de mentira que se dispara a mano.
	 *
	 * En WebKitGTK ni el `change` de `matchMedia` ni el `resize` de la ventana
	 * llegan cuando la ventana cambia de tamaño; el observador sí. La barra ya no
	 * escucha a los otros dos, así que lo único que puede avisarle es esto.
	 */
	const observados: Array<{ callback: () => void; elementos: unknown[] }> = [];
	let desconectados = 0;
	const original = globalThis.ResizeObserver;

	beforeEach(() => {
		observados.length = 0;
		desconectados = 0;
		(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
			private mio: { callback: () => void; elementos: unknown[] };
			constructor(callback: () => void) {
				this.mio = { callback, elementos: [] };
				observados.push(this.mio);
			}
			observe(elemento: unknown) {
				this.mio.elementos.push(elemento);
			}
			disconnect() {
				desconectados++;
			}
			unobserve() {}
		};
		ponerAncho(document.documentElement, 1280);
	});

	afterEach(() => {
		(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = original;
	});

	/** `clientWidth` es de sólo lectura en happy-dom: se redefine. */
	function ponerAncho(elemento: Element, pixeles: number) {
		Object.defineProperty(elemento, 'clientWidth', { value: pixeles, configurable: true });
	}

	/**
	 * La barra dentro de un contenedor de ese ancho.
	 *
	 * El ancho se le pone al padre de verdad del `aside` —el que crea el
	 * montaje— y se avisa, como cuando el WebView maqueta la ventana.
	 */
	async function montarEn(pixeles: number, props: Record<string, unknown> = { title: 'Ventana' }) {
		const vista = mount(SideBar, { props, attachTo: document.body });
		const contenedor = vista.element.parentElement as HTMLElement;
		ponerAncho(contenedor, pixeles);
		await avisar();
		return { vista, contenedor };
	}

	/** Lo que haría el navegador al cambiar el tamaño: llamar a los observadores. */
	async function avisar() {
		for (const uno of observados) uno.callback();
		await nextTick();
	}

	test('un lugar angosto la pliega sola', async () => {
		// Por debajo de 768 no entra el texto de los botones: desplegada ahí
		// sería una columna de etiquetas cortadas encima del contenido.
		const { vista } = await montarEn(600);
		await nextTick();

		expect(vista.find('aside').classes()).toContain('w-[84px]');
	});

	test('se pliega por su contenedor y no por la pantalla', async () => {
		// La página mide 1280, pero la barra está en un panel de 500: ahí no
		// entra. Con el `md:` de antes se quedaba desplegada y cortada.
		ponerAncho(document.documentElement, 1280);
		const { vista } = await montarEn(500);
		await nextTick();

		expect(vista.find('aside').classes()).toContain('w-[84px]');
		expect(vista.find('aside').classes().join(' ')).not.toMatch(/(^|\s)(sm|md|lg|xl):/);
	});

	test('y angosta no ofrece desplegarse', async () => {
		const { vista } = await montarEn(600);
		await nextTick();

		expect(vista.get('aside button').classes()).toContain('hidden');
	});

	test('si el lugar crece después, se despliega', async () => {
		// El WebView arranca angosto y crece al terminar de abrirse: el único
		// aviso que llega es el del observador.
		const { vista, contenedor } = await montarEn(600);
		await nextTick();
		expect(vista.find('aside').classes()).toContain('w-[84px]');

		ponerAncho(contenedor, 1280);
		await avisar();

		expect(vista.find('aside').classes()).toContain('w-72');
	});

	test('un envoltorio que sólo la contiene a ella no la pliega: mide el lugar compartido', async () => {
		// Una aplicación que la envuelva en un `shrink-0` le pone un padre del
		// ancho de la barra. Medir ése es medirse a sí misma: angosta para
		// siempre, plegada y sin botón para desplegarla.
		const panel = document.createElement('div');
		const wrapper = document.createElement('div');
		panel.append(wrapper);
		document.body.append(panel);
		ponerAncho(panel, 1280);
		ponerAncho(wrapper, 288);
		const vista = mount(SideBar, { props: { title: 'Ventana' }, attachTo: wrapper });
		const aside = vista.find('aside').element as HTMLElement;
		Object.defineProperty(aside, 'offsetWidth', { value: 288, configurable: true });
		ponerAncho(aside.parentElement as HTMLElement, 288);
		await avisar();

		expect(vista.find('aside').classes()).toContain('w-72');
		vista.unmount();
		panel.remove();
	});

	test('un panel más angosto que la barra desplegada la pliega: no es un envoltorio', async () => {
		// Desplegada mide 288 y el panel 240. Antes se subía por cualquier
		// antepasado que no fuera más ancho que la barra, llegaba a la página
		// de 1280 y se quedaba desplegada, cortada por el panel.
		ponerAncho(document.documentElement, 1280);
		const panel = document.createElement('div');
		document.body.append(panel);
		ponerAncho(panel, 240);
		const vista = mount(SideBar, { props: { title: 'Ventana' }, attachTo: panel });
		const aside = vista.find('aside').element as HTMLElement;
		Object.defineProperty(aside, 'offsetWidth', { value: 288, configurable: true });
		ponerAncho(aside.parentElement as HTMLElement, 240);
		await avisar();

		expect(vista.find('aside').classes()).toContain('w-[84px]');
		vista.unmount();
		panel.remove();
	});

	test('un contenedor que todavía mide cero no la pliega: manda la página', async () => {
		// Montada antes de maquetarse, el contenedor dice cero. Plegarse por eso
		// sería plegarse por nada.
		ponerAncho(document.documentElement, 1280);
		const { vista } = await montarEn(0);
		await nextTick();

		expect(vista.find('aside').classes()).toContain('w-72');
	});

	test('plegada a mano sigue plegada aunque el lugar sea ancho', async () => {
		// Ensancharla no es desplegarla: lo que se plegó a propósito se queda
		// como lo dejaron.
		const { vista } = await montarEn(1280, { title: 'Ventana', collapsed: true });
		await avisar();

		expect(vista.find('aside').classes()).toContain('w-[84px]');
	});

	test('observa al contenedor y a la página', async () => {
		const { contenedor } = await montarEn(1280);
		await nextTick();

		expect(observados).toHaveLength(1);
		expect(observados[0]?.elementos).toContain(contenedor);
		expect(observados[0]?.elementos).toContain(document.documentElement);
	});

	test('y lo desconecta al desmontarse', async () => {
		// Un observador por cada ventana que se abrió y se cerró es una fuga
		// que además dibuja componentes muertos.
		const { vista } = await montarEn(1280);
		await nextTick();
		vista.unmount();

		expect(desconectados).toBe(1);
	});
});
