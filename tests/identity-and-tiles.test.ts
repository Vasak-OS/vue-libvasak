/**
 * Teclas, identidad, recuadros de icono y esqueletos de la 2.2.0.
 *
 * Lo que se mira es lo que las copias hacían mal sin que se viera: el avatar
 * con la foto rota que dejaba un hueco, las iniciales que cortaban una letra
 * con tilde, el recuadro con estado que se anunciaba dos veces o ninguna, el
 * esqueleto que seguía latiendo con movimiento reducido.
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mount, type VueWrapper } from '@vue/test-utils';
import Skeleton from '../src/feedback/Skeleton.vue';
import Avatar from '../src/identity/Avatar.vue';
import IdentityBlock from '../src/identity/IdentityBlock.vue';
import { initialsOf } from '../src/identity/initials';
import IconTile from '../src/indicators/IconTile.vue';
import Kbd from '../src/text/Kbd.vue';
import { olvidarTodo, traducir, vaciarElCatalogo } from './dobles';

const views: VueWrapper[] = [];
function render<T>(component: T, options: Record<string, unknown> = {}) {
	// biome-ignore lint/suspicious/noExplicitAny: el tipo del componente lo decide quien llama.
	const view = mount(component as any, options);
	views.push(view);
	return view;
}

beforeEach(() => olvidarTodo());
afterEach(() => {
	for (const view of views.splice(0)) view.unmount();
	vaciarElCatalogo();
});

describe('la tecla', () => {
	test('una combinación es un kbd por tecla dentro de uno que las agrupa', () => {
		const view = render(Kbd, { props: { keys: ['Ctrl', 'Mayús', 'T'] } });
		const inner = view.findAll('kbd kbd');

		expect(view.element.tagName).toBe('KBD');
		expect(inner.map((key) => key.text())).toEqual(['Ctrl', 'Mayús', 'T']);
		// Un `<kbd>` no tiene rol: un `aria-label` encima no lo lee nadie.
		expect(view.attributes('aria-label')).toBeUndefined();
	});

	test('el «+» de entre medio se lee, así la combinación no queda «Ctrl S»', () => {
		const view = render(Kbd, { props: { keys: ['Ctrl', 'S'] } });

		expect(view.get('[data-separator]').attributes('aria-hidden')).toBeUndefined();
		expect(view.find('[aria-hidden="true"]').exists()).toBe(false);
		expect(view.text().replace(/\s+/g, '')).toBe('Ctrl+S');
	});

	test('con label, el texto escondido se lee y lo dibujado se calla', () => {
		const view = render(Kbd, { props: { keys: ['Super', 'L'], label: 'Bloquear la sesión' } });

		expect(view.get('.sr-only').text()).toBe('Bloquear la sesión');
		for (const key of view.findAll('kbd kbd')) expect(key.attributes('aria-hidden')).toBe('true');
		expect(view.get('[data-separator]').attributes('aria-hidden')).toBe('true');
	});

	test('con la ranura, una tecla suelta', () => {
		const view = render(Kbd, { slots: { default: 'Esc' } });

		expect(view.element.tagName).toBe('KBD');
		expect(view.text()).toBe('Esc');
		expect(view.find('kbd kbd').exists()).toBe(false);
	});
});

describe('las iniciales', () => {
	test('la primera letra de las dos primeras palabras, entera', () => {
		expect(initialsOf('joaquín decima')).toBe('JD');
		expect(initialsOf('Ángela María Pérez')).toBe('ÁM');
		expect(initialsOf('  Ana  ')).toBe('A');
		expect(initialsOf('')).toBe('');
		expect(initialsOf(undefined)).toBe('');
	});
});

describe('el avatar', () => {
	test('con foto, la foto con el nombre como alt', () => {
		const view = render(Avatar, { props: { src: 'yo.png', name: 'Joaquín Decima' } });

		expect(view.get('img').attributes('alt')).toBe('Joaquín Decima');
	});

	test('una foto que no carga cae a las iniciales, que tienen nombre, y avisa', async () => {
		const view = render(Avatar, { props: { src: 'rota.png', name: 'Joaquín Decima' } });
		await view.get('img').trigger('error');

		expect(view.emitted('error')).toHaveLength(1);
		expect(view.find('img[src="rota.png"]').exists()).toBe(false);
		const named = view.get('[role="img"]');
		expect(named.attributes('aria-label')).toBe('Joaquín Decima');
		expect(named.text()).toBe('JD');

		await view.setProps({ src: 'otra.png' });
		expect(view.get('img').attributes('src')).toBe('otra.png');
	});

	test('sin nombre ni foto, el icono genérico del tema', () => {
		const view = render(Avatar);

		expect(view.findComponent({ name: 'ThemeIcon' }).props('name')).toBe('avatar-default');
	});

	test('editable es un botón con nombre del catálogo, y avisa', async () => {
		traducir('avatar.edit', 'Cambiar la foto');
		const view = render(Avatar, { props: { name: 'Ana', editable: true } });
		const button = view.get('button');

		expect(button.attributes('type')).toBe('button');
		expect(button.attributes('aria-label')).toBe('Cambiar la foto');
		await button.trigger('click');
		expect(view.emitted('edit')).toHaveLength(1);
	});

	test('sin catálogo, el respaldo; y sin editable, no es un botón', () => {
		expect(render(Avatar, { props: { editable: true } }).get('button').attributes('aria-label')).toBe('Change picture');
		expect(render(Avatar, { props: { name: 'Ana' } }).find('button').exists()).toBe(false);
	});

	test('es redondo y del tamaño pedido', () => {
		const view = render(Avatar, { props: { name: 'Ana', size: 'xl' } });

		expect(view.classes()).toContain('rounded-corner-full');
		expect(view.classes()).toContain('size-16');
	});
});

describe('el bloque de identidad', () => {
	test('el avatar no repite el nombre que ya está escrito al lado', () => {
		const view = render(IdentityBlock, { props: { title: 'Joaquín Decima', subtitle: 'jdecima' } });

		expect(view.text()).toContain('Joaquín Decima');
		expect(view.text()).toContain('jdecima');
		expect(view.find('[role="img"]').exists()).toBe(false);
	});

	test('el texto largo se corta y la ranura de la derecha no se mueve', () => {
		const view = render(IdentityBlock, {
			props: { title: 'Un nombre muy largo', as: 'h2' },
			slots: { trailing: '<button class="salir">Salir</button>' },
		});

		expect(view.get('h2').classes()).toContain('truncate');
		expect(view.get('.salir').element.parentElement?.className).toContain('shrink-0');
	});
});

describe('el recuadro de icono', () => {
	test('sin nombre es decoración', () => {
		const view = render(IconTile, { props: { name: 'drive-harddisk' } });

		expect(view.attributes('aria-hidden')).toBe('true');
	});

	test('con nombre y estado, una sola imagen con los dos', () => {
		const view = render(IconTile, {
			props: { name: 'drive-harddisk', label: 'Disco', status: 'success', statusLabel: 'Listo' },
		});

		expect(view.attributes('role')).toBe('img');
		expect(view.attributes('aria-label')).toBe('Disco, Listo');
		expect(view.get('[data-status]').attributes('role')).toBeUndefined();
	});

	test('sólo con el estado, se anuncia el estado', () => {
		const view = render(IconTile, { props: { name: 'drive-harddisk', status: 'error', statusLabel: 'Falló' } });

		expect(view.attributes('aria-hidden')).toBeUndefined();
		expect(view.get('[data-status]').attributes('aria-label')).toBe('Falló');
	});

	test('cada tono es su relleno y su canto; el grande anida el radio', () => {
		expect(render(IconTile, { props: { name: 'x', tone: 'selected' } }).classes()).toContain('bg-ui-selected-accent');
		expect(render(IconTile, { props: { name: 'x', tone: 'error' } }).classes()).toContain('border-status-error');
		expect(render(IconTile, { props: { name: 'x', size: 'lg' } }).classes()).toContain('rounded-corner-l');
		expect(render(IconTile, { props: { name: 'x', shape: 'circle' } }).classes()).toContain('rounded-corner-full');
	});
});

describe('el esqueleto', () => {
	test('no se anuncia y queda quieto con movimiento reducido', () => {
		const view = render(Skeleton);

		expect(view.attributes('aria-hidden')).toBe('true');
		expect(view.classes()).toContain('motion-reduce:animate-none');
		expect(view.classes()).toContain('w-full');
	});

	test('las medidas: números en píxeles, texto tal cual', () => {
		const view = render(Skeleton, { props: { width: 120, height: '2rem', shape: 'block' } });

		expect(view.attributes('style')).toContain('width: 120px');
		expect(view.attributes('style')).toContain('height: 2rem');
		expect(view.classes()).not.toContain('w-full');
	});

	test('el círculo es cuadrado aunque se le dé sólo el ancho', () => {
		const view = render(Skeleton, { props: { width: 40, shape: 'circle' } });

		expect(view.attributes('style')).toContain('width: 40px');
		expect(view.attributes('style')).toContain('height: 40px');
		expect(view.classes()).toContain('rounded-corner-full');
	});
});
