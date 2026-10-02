/**
 * La órbita del dispositivo conectado (vasak-desktop#132).
 *
 * Lo que se mira: que con uno a seis satélites queden repartidos parejo desde
 * arriba y en el sentido del reloj; que la línea salga del canto del círculo y
 * llegue al canto de la pastilla, sin cruzarla; que un satélite sin dato no se
 * dibuje; que sin nada conectado quede el círculo vacío; que los datos se lean
 * en una lista, con la etiqueta antes del valor, y que la acción sea un botón;
 * y que en una caja angosta apile en vez de pisar el círculo.
 */

import { afterEach, describe, expect, test } from 'bun:test';
import { mount, type VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import DeviceOrbit from '../src/cards/DeviceOrbit.vue';
import { centerRadius, elbowPath, orbitAngles, orbitPositions, orbitRadii } from '../src/cards/orbit-layout';

const views: VueWrapper[] = [];
function render(props: Record<string, unknown>) {
	// biome-ignore lint/suspicious/noExplicitAny: las props las arma cada prueba.
	const view = mount(DeviceOrbit as any, { props, attachTo: document.body });
	views.push(view);
	return view;
}

afterEach(() => {
	for (const view of views.splice(0)) view.unmount();
});

/** Da medidas a la raíz: el DOM de las pruebas no maqueta nada. */
async function sized(view: VueWrapper, width: number, height: number) {
	const root = view.element as HTMLElement;
	Object.defineProperty(root, 'clientWidth', { configurable: true, value: width });
	Object.defineProperty(root, 'clientHeight', { configurable: true, value: height });
	(view.vm as unknown as { measure: () => void }).measure();
	await nextTick();
}

const HEADPHONES = { icon: 'audio-headphones', title: 'JBL Tune 720BT', subtitle: 'Conectado' };
const FOUR = [
	{ id: 'scan', icon: 'view-refresh', label: 'Buscar dispositivos', value: 'Buscar', action: true },
	{ id: 'battery', icon: 'battery-level-70', label: 'Batería', value: '70 %' },
	{ id: 'profile', icon: 'audio-speakers', label: 'Perfil de audio', value: 'A2DP · AAC' },
	{ id: 'mac', icon: 'network-wired', label: 'Dirección MAC', value: '08:92:CC:7C:37:A1' },
];

describe('el reparto alrededor del centro', () => {
	test('de uno a seis, parejos desde arriba y en el sentido del reloj', () => {
		expect(orbitAngles(0)).toEqual([]);
		expect(orbitAngles(1)).toEqual([0]);
		expect(orbitAngles(2)).toEqual([0, 180]);
		expect(orbitAngles(3)).toEqual([0, 120, 240]);
		expect(orbitAngles(4)).toEqual([0, 90, 180, 270]);
		expect(orbitAngles(5)).toEqual([0, 72, 144, 216, 288]);
		expect(orbitAngles(6)).toEqual([0, 60, 120, 180, 240, 300]);
	});

	test('con cuatro: arriba, derecha, abajo, izquierda, sobre la elipse', () => {
		const at = orbitPositions(4, { x: 300, y: 200 }, { radiusX: 200, radiusY: 120 });

		expect(at).toEqual([
			{ x: 300, y: 80 },
			{ x: 500, y: 200 },
			{ x: 300, y: 320 },
			{ x: 100, y: 200 },
		]);
	});

	test('con uno a seis, todos a la misma distancia «de elipse» del centro', () => {
		for (let count = 1; count <= 6; count++) {
			const at = orbitPositions(count, { x: 0, y: 0 }, { radiusX: 200, radiusY: 100 });
			expect(at).toHaveLength(count);
			for (const point of at) {
				// Sobre la elipse: (x/a)² + (y/b)² = 1.
				expect((point.x / 200) ** 2 + (point.y / 100) ** 2).toBeCloseTo(1, 3);
			}
		}
	});

	test('la órbita se abre hasta el borde y no entra si el costado pisa el círculo', () => {
		const frame = { width: 668, height: 460, radius: 78, satelliteWidth: 192, satelliteHeight: 56 };

		expect(orbitRadii(frame)).toEqual({ radiusX: 230, radiusY: 194 });
		expect(orbitRadii({ ...frame, width: 360 })).toBeNull();
		expect(orbitRadii({ ...frame, height: 260 })).toBeNull();
		expect(orbitRadii({ ...frame, width: 0, height: 0 })).toBeNull();
	});

	test('en una caja muy ancha o muy alta, la elipse no se estira hasta el borde', () => {
		const frame = { radius: 78, satelliteWidth: 192, satelliteHeight: 56 };

		// 1200 de ancho: la mitad libre es 496, pero se queda en 1,6 veces el alto.
		expect(orbitRadii({ ...frame, width: 1200, height: 460 })).toEqual({ radiusX: 310.4, radiusY: 194 });
		// Más alta que ancha: el radio vertical no pasa al horizontal.
		expect(orbitRadii({ ...frame, width: 668, height: 1000 })).toEqual({ radiusX: 230, radiusY: 230 });
	});

	test('el círculo del centro crece con la caja, entre 44 y 88', () => {
		expect(centerRadius(0, 0)).toBe(44);
		expect(centerRadius(200, 200)).toBe(44);
		expect(centerRadius(460, 668)).toBe(78);
		expect(centerRadius(2000, 2000)).toBe(88);
	});
});

describe('las líneas', () => {
	const circle = { x: 300, y: 200, radius: 50 };

	test('arriba, recta vertical del canto del círculo al canto de abajo de la pastilla', () => {
		expect(elbowPath(circle, { x: 300, y: 60, width: 160, height: 40 })).toBe('M300 150L300 80');
	});

	test('a un costado, recta horizontal al canto lateral', () => {
		expect(elbowPath(circle, { x: 520, y: 200, width: 160, height: 40 })).toBe('M350 200L440 200');
		expect(elbowPath(circle, { x: 80, y: 210, width: 120, height: 40 })).toBe('M250 200L140 200');
	});

	test('en diagonal, en codo: primero horizontal y después vertical', () => {
		expect(elbowPath(circle, { x: 480, y: 60, width: 120, height: 40 })).toBe('M350 200L480 200L480 80');
	});

	test('cerca del eje, la vertical sale del canto del círculo en esa x', () => {
		// x a 30 del centro: el canto está a √(50² − 30²) = 40 arriba.
		expect(elbowPath(circle, { x: 330, y: 60, width: 120, height: 40 })).toBe('M330 160L330 80');
	});

	test('si la pastilla toca el círculo, no hay línea', () => {
		expect(elbowPath(circle, { x: 300, y: 140, width: 120, height: 40 })).toBe('');
		expect(elbowPath(circle, { x: 380, y: 200, width: 120, height: 40 })).toBe('');
	});
});

describe('la órbita', () => {
	test('el centro: icono, nombre y «Conectado», en el círculo de acento', () => {
		const view = render({ label: 'Bluetooth', center: HEADPHONES, satellites: FOUR });
		const center = view.get('[data-orbit-center]');

		expect(center.classes()).toContain('bg-primary');
		expect(center.classes()).toContain('text-tx-on-primary');
		expect(center.text()).toContain('JBL Tune 720BT');
		expect(center.text()).toContain('Conectado');
		expect(center.findComponent({ name: 'ThemeIcon' }).props('name')).toBe('audio-headphones');
	});

	test('un satélite sin dato no se dibuja, y una acción sí aunque no traiga valor', () => {
		const view = render({
			label: 'Bluetooth',
			center: HEADPHONES,
			satellites: [
				{ id: 'scan', label: 'Buscar dispositivos', action: true },
				{ id: 'battery', label: 'Batería', value: undefined },
				{ id: 'profile', label: 'Perfil de audio', value: null },
				{ id: 'empty', label: 'Nada', value: '' },
				{ id: 'mac', label: 'Dirección MAC', value: '08:92:CC:7C:37:A1' },
			],
		});
		const drawn = view.findAll('[data-orbit-satellite]').map((item) => item.attributes('data-orbit-satellite'));

		expect(drawn).toEqual(['scan', 'mac']);
		expect(view.text()).not.toContain('Batería');
		expect(view.text()).not.toContain('0 %');
	});

	test('sin nada conectado: el círculo vacío con su texto y la acción alrededor', () => {
		const view = render({
			label: 'Bluetooth',
			center: null,
			emptyLabel: 'Ningún dispositivo conectado',
			emptyIcon: 'bluetooth-disabled',
			satellites: [{ id: 'scan', label: 'Buscar dispositivos', action: true }],
		});
		const center = view.get('[data-orbit-center]');

		expect(center.classes()).not.toContain('bg-primary');
		expect(center.text()).toBe('Ningún dispositivo conectado');
		expect(view.findAll('[data-orbit-satellite]')).toHaveLength(1);
	});

	test('los datos son una lista, en orden, y cada uno se lee «etiqueta, valor»', () => {
		const view = render({ label: 'Bluetooth', center: HEADPHONES, satellites: FOUR });

		expect(view.get('section').attributes('aria-label')).toBe('Bluetooth');
		const items = view.findAll('li');
		expect(items).toHaveLength(4);
		const battery = items[1]?.get('[data-orbit-satellite]');
		// En el DOM, la etiqueta primero; en pantalla va debajo.
		const texts = battery?.findAll('.flex-col-reverse > span').map((span) => span.text());
		expect(texts).toEqual(['Batería', '70 %']);
	});

	test('la acción es un botón con el canto de acento y avisa; los datos no son botones', async () => {
		const view = render({ label: 'Bluetooth', center: HEADPHONES, satellites: FOUR });
		const buttons = view.findAll('button');

		expect(buttons).toHaveLength(1);
		expect(buttons[0]?.attributes('type')).toBe('button');
		expect(buttons[0]?.classes()).toContain('border-primary');
		await buttons[0]?.trigger('click');
		expect(view.emitted('select')).toEqual([['scan']]);
	});

	test('una acción deshabilitada no avisa', async () => {
		const view = render({
			label: 'Bluetooth',
			center: HEADPHONES,
			satellites: [{ id: 'scan', label: 'Buscar', action: true, disabled: true }],
		});
		await view.get('button').trigger('click');

		expect(view.get('button').attributes('disabled')).toBeDefined();
		expect(view.emitted('select')).toBeUndefined();
	});

	test('el tono de acento pinta el valor, no la etiqueta', () => {
		const view = render({
			label: 'Bluetooth',
			center: HEADPHONES,
			satellites: [{ id: 'battery', label: 'Batería', value: '12 %', tone: 'accent' }],
		});
		const [label, value] = view.findAll('[data-orbit-satellite] .flex-col-reverse > span');

		expect(value?.classes()).toContain('text-primary');
		expect(label?.classes()).toContain('text-tx-muted');
	});

	test('las líneas y los anillos son decoración: fuera del lector, en el color de la clase', async () => {
		const view = render({ label: 'Bluetooth', center: HEADPHONES, satellites: FOUR });
		await sized(view, 668, 460);

		expect(view.get('section').attributes('data-layout')).toBe('radial');
		const svg = view.get('svg');
		expect(svg.attributes('aria-hidden')).toBe('true');
		expect(svg.classes()).toContain('text-ui-line');
		const paths = svg.findAll('path');
		expect(paths).toHaveLength(4);
		expect(paths.every((path) => path.attributes('stroke') === 'currentColor')).toBe(true);
		for (const ring of view.findAll('[data-orbit-ring]')) expect(ring.attributes('aria-hidden')).toBe('true');
	});

	test('en la órbita, cada satélite en su punto: arriba, derecha, abajo, izquierda', async () => {
		const view = render({ label: 'Bluetooth', center: HEADPHONES, satellites: FOUR });
		await sized(view, 668, 460);
		const at = view.findAll('li').map((item) => [item.element.style.left, item.element.style.top]);

		expect(at).toEqual([
			['334px', '36px'],
			['564px', '230px'],
			['334px', '424px'],
			['104px', '230px'],
		]);
	});

	test('en una caja angosta apila: sin líneas, sin anillos, un satélite por renglón', async () => {
		const view = render({ label: 'Bluetooth', center: HEADPHONES, satellites: FOUR });
		for (const width of [240, 360]) {
			await sized(view, width, 460);

			expect(view.get('section').attributes('data-layout')).toBe('stacked');
			expect(view.find('svg').exists()).toBe(false);
			expect(view.findAll('[data-orbit-ring]')).toHaveLength(0);
			expect(view.findAll('li').every((item) => item.classes().includes('w-full'))).toBe(true);
			expect(view.findAll('li').every((item) => item.element.style.left === '')).toBe(true);
		}

		// Y al volver a crecer, vuelve a la órbita.
		await sized(view, 668, 460);
		expect(view.get('section').attributes('data-layout')).toBe('radial');
	});

	test('apilada a pedido aunque entre', async () => {
		const view = render({ label: 'Bluetooth', center: HEADPHONES, satellites: FOUR, layout: 'stacked' });
		await sized(view, 668, 460);

		expect(view.get('section').attributes('data-layout')).toBe('stacked');
	});

	test('el halo late mientras se busca', async () => {
		const view = render({ label: 'Bluetooth', center: HEADPHONES, satellites: FOUR });
		expect(view.get('[data-orbit-halo]').classes()).not.toContain('orbit-halo-pulsing');

		await view.setProps({ pulsing: true });
		expect(view.get('[data-orbit-halo]').classes()).toContain('orbit-halo-pulsing');
	});
});
