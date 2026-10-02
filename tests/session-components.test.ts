/**
 * Las piezas genéricas que salen del inicio de sesión y del bloqueo
 * (vasak-session-manager) en la 2.4.0: el campo de contraseña, el reloj
 * grande y los botones de energía.
 *
 * Lo que se prueba es lo que la copia sabía y lo que no puede perderse al
 * subir: que Bloq Mayús se avise y se oiga, que mostrar la contraseña no se
 * quede puesto después de un intento fallido, que el reloj no despierte la
 * máquina cada segundo, y que los botones digan qué hacen con los iconos del
 * tema y no con glifos.
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mount, type VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import PowerActions from '../src/controls/PowerActions.vue';
import ClockDisplay from '../src/data/ClockDisplay.vue';
import PasswordField from '../src/forms/PasswordField.vue';
import { olvidarTodo, pedidosDeIcono, traducir, vaciarElCatalogo } from './dobles';

const views: VueWrapper[] = [];
function render<T>(component: T, options: Record<string, unknown> = {}) {
	// biome-ignore lint/suspicious/noExplicitAny: el tipo del componente lo decide quien llama.
	const view = mount(component as any, options);
	views.push(view);
	return view;
}

const waitForIcons = () => new Promise((done) => setTimeout(done, 0));

/** Una tecla con Bloq Mayús prendido o apagado. */
function key(type: 'keydown' | 'keyup', capsLock: boolean) {
	const event = new KeyboardEvent(type, { key: 'a' });
	Object.defineProperty(event, 'getModifierState', { value: (name: string) => name === 'CapsLock' && capsLock });
	return event;
}

beforeEach(() => olvidarTodo());
afterEach(() => {
	for (const view of views.splice(0)) view.unmount();
	vaciarElCatalogo();
	document.body.innerHTML = '';
});

describe('el campo de contraseña', () => {
	test('es el campo del sistema, oculto, sin corrector y para entrar', () => {
		const input = render(PasswordField, { props: { modelValue: '' } }).get('input');

		expect(input.attributes('type')).toBe('password');
		expect(input.attributes('autocomplete')).toBe('current-password');
		expect(input.attributes('spellcheck')).toBe('false');
		expect(input.attributes('autocapitalize')).toBe('none');
		expect(input.classes()).toContain('border-ui-border-strong');
	});

	test('el ojo muestra y oculta, con aria-pressed y el nombre del catálogo o el respaldo', async () => {
		const view = render(PasswordField, { props: { modelValue: 'secreto' } });
		const eye = view.get('button');

		expect(eye.attributes('aria-label')).toBe('Show password');
		expect(eye.attributes('aria-pressed')).toBe('false');
		expect(eye.attributes('aria-controls')).toBe(view.get('input').attributes('id'));

		await eye.trigger('click');
		expect(view.get('input').attributes('type')).toBe('text');
		expect(eye.attributes('aria-pressed')).toBe('true');
		expect(eye.attributes('aria-label')).toBe('Hide password');

		traducir('password.show', 'Mostrar la contraseña');
		const translated = render(PasswordField, { props: { modelValue: '' } });
		expect(translated.get('button').attributes('aria-label')).toBe('Mostrar la contraseña');
	});

	test('el ojo no le roba el foco al campo', async () => {
		const view = render(PasswordField, { props: { modelValue: 'x' } });
		const down = new MouseEvent('mousedown', { cancelable: true, bubbles: true });
		view.get('button').element.dispatchEvent(down);

		expect(down.defaultPrevented).toBe(true);
	});

	test('vaciada después de un intento, vuelve a ocultarse', async () => {
		const view = render(PasswordField, { props: { modelValue: 'secreto' } });
		await view.get('button').trigger('click');
		expect(view.get('input').attributes('type')).toBe('text');

		await view.setProps({ modelValue: '' });
		expect(view.get('input').attributes('type')).toBe('password');
	});

	test('sin revealable no hay ojo', () => {
		const view = render(PasswordField, { props: { modelValue: '', revealable: false } });

		expect(view.find('button').exists()).toBe(false);
	});

	test('Bloq Mayús se avisa debajo, se ata al campo y sale como evento', async () => {
		const view = render(PasswordField, { props: { modelValue: '', describedBy: 'ayuda' } });
		const input = view.get('input');

		input.element.dispatchEvent(key('keydown', true));
		await nextTick();
		const warning = view.get('[data-caps-lock]');
		expect(warning.text()).toBe('Caps Lock is on');
		// La ayuda de quien lo usa y el aviso, los dos.
		expect(input.attributes('aria-describedby')).toBe(`ayuda ${warning.attributes('id')}`);
		expect(view.emitted('caps-lock')).toEqual([[true]]);

		input.element.dispatchEvent(key('keyup', false));
		await nextTick();
		expect(view.find('[data-caps-lock]').exists()).toBe(false);
		expect(input.attributes('aria-describedby')).toBe('ayuda');
		expect(view.emitted('caps-lock')).toEqual([[true], [false]]);
	});

	test('el aviso de Bloq Mayús se puede apagar, y el evento sigue saliendo', async () => {
		const view = render(PasswordField, { props: { modelValue: '', capsLockHint: false } });
		view.get('input').element.dispatchEvent(key('keydown', true));
		await nextTick();

		expect(view.find('[data-caps-lock]').exists()).toBe(false);
		expect(view.emitted('caps-lock')).toEqual([[true]]);
	});

	test('lo escrito sube por v-model y las teclas se reenvían', async () => {
		const view = render(PasswordField, { props: { modelValue: '' } });
		await view.get('input').setValue('hola');
		view.get('input').element.dispatchEvent(key('keydown', false));

		expect(view.emitted('update:modelValue')).toEqual([['hola']]);
		expect(view.emitted('keydown')).toHaveLength(1);
	});

	test('focus() enfoca el campo', () => {
		const view = render(PasswordField, { props: { modelValue: '' }, attachTo: document.body });

		expect((view.vm as unknown as { focus: () => boolean }).focus()).toBe(true);
		expect(document.activeElement).toBe(view.get('input').element);
	});

	test('pide el ojo al tema por su nombre', async () => {
		render(PasswordField, { props: { modelValue: '' } });
		await waitForIcons();

		expect(pedidosDeIcono.map((pedido) => pedido.nombre)).toContain('view-reveal-symbolic');
	});
});

describe('el reloj grande', () => {
	const NOW = new Date(2026, 9, 2, 9, 5, 30);

	test('con una hora fija muestra esa hora, la fecha con la primera en mayúscula y cifras tabulares', () => {
		const view = render(ClockDisplay, { props: { now: NOW, locale: 'es-AR', hour12: false } });
		const time = view.get('time');

		expect(time.text()).toBe('09:05');
		expect(time.attributes('datetime')).toBe(NOW.toISOString());
		expect(time.classes()).toEqual(expect.arrayContaining(['tabular-nums', 'font-light', 'text-display-m', '@xs:text-display-l']));
		expect(view.get('p').text()).toBe('viernes, 2 de octubre');
		expect(view.get('p').classes()).toContain('first-letter:uppercase');
	});

	test('sin fecha, sin fecha; con segundos, con segundos', () => {
		const view = render(ClockDisplay, { props: { now: NOW, locale: 'es-AR', hour12: false, showDate: false, seconds: true } });

		expect(view.find('p').exists()).toBe(false);
		expect(view.get('time').text()).toBe('09:05:30');
	});

	test('no se anuncia cada minuto', () => {
		const view = render(ClockDisplay, { props: { now: NOW } });

		expect(view.html()).not.toContain('aria-live');
	});

	test('ocupa el ancho que le dan: un contenedor de consulta no se mide por lo de adentro', () => {
		const view = render(ClockDisplay, { props: { now: NOW } });

		expect(view.classes()).toEqual(expect.arrayContaining(['@container', 'w-full']));
	});

	test('legible suma el halo del esquema, no una sombra negra', () => {
		const view = render(ClockDisplay, { props: { now: NOW, legible: true } });

		expect(view.classes()).toContain('text-shadow-legible');
		expect(view.html()).not.toMatch(/drop-shadow/);
	});

	test('sin hora fija despierta al minuto siguiente y después de a uno', async () => {
		const original = { setTimeout: globalThis.setTimeout, setInterval: globalThis.setInterval };
		const delays: Array<['timeout' | 'interval', number]> = [];
		const callbacks: Array<() => void> = [];
		globalThis.setTimeout = ((fn: () => void, ms: number) => {
			delays.push(['timeout', ms]);
			callbacks.push(fn);
			return 1;
		}) as unknown as typeof setTimeout;
		globalThis.setInterval = ((_fn: () => void, ms: number) => {
			delays.push(['interval', ms]);
			return 2;
		}) as unknown as typeof setInterval;
		try {
			render(ClockDisplay);
			await nextTick();
			const first = delays.find(([kind]) => kind === 'timeout');
			expect(first?.[1]).toBeGreaterThan(0);
			expect(first?.[1]).toBeLessThanOrEqual(60_000);
			callbacks[0]?.();
			expect(delays).toContainEqual(['interval', 60_000]);
		} finally {
			globalThis.setTimeout = original.setTimeout;
			globalThis.setInterval = original.setInterval;
		}
	});
});

describe('los botones de energía', () => {
	test('por omisión: suspender, reiniciar y apagar, con su nombre y los iconos del tema', async () => {
		const view = render(PowerActions);
		await waitForIcons();
		const buttons = view.findAll('button');

		expect(buttons.map((button) => button.attributes('aria-label'))).toEqual(['Suspend', 'Restart', 'Power off']);
		expect(buttons.map((button) => button.attributes('title'))).toEqual(['Suspend', 'Restart', 'Power off']);
		const names = pedidosDeIcono.map((pedido) => pedido.nombre);
		for (const name of ['system-suspend-symbolic', 'system-reboot-symbolic', 'system-shutdown-symbolic']) {
			expect(names).toContain(name);
		}
		// Nada de glifos de texto en lugar de iconos.
		expect(view.text()).not.toMatch(/[☾↻⏻]/);
		expect(view.attributes('role')).toBe('group');
	});

	test('los nombres salen de labels, del catálogo o del respaldo', () => {
		traducir('power.reboot', 'Reiniciar');
		const view = render(PowerActions, { props: { labels: { poweroff: 'Apagar el equipo' } } });
		const names = view.findAll('button').map((button) => button.attributes('aria-label'));

		expect(names).toEqual(['Suspend', 'Reiniciar', 'Apagar el equipo']);
	});

	test('apretar emite la acción y no hace nada más', async () => {
		const view = render(PowerActions, { props: { actions: ['lock', 'logout'] } });
		await view.findAll('button')[1]?.trigger('click');

		expect(view.emitted('action')).toEqual([['logout']]);
	});

	test('apagado no emite', async () => {
		const view = render(PowerActions, { props: { disabled: true } });
		await view.findAll('button')[0]?.trigger('click');

		expect(view.emitted('action')).toBeUndefined();
	});

	test('en tiles cada acción es un círculo de 80 con su nombre escrito', () => {
		const view = render(PowerActions, { props: { variant: 'tiles', actions: ['poweroff'] } });
		const button = view.get('button[data-action="poweroff"]');

		expect(button.text()).toBe('Power off');
		expect(button.get('[data-tone]').classes()).toEqual(expect.arrayContaining(['size-20', 'rounded-corner-full']));
	});

	test('la fila se parte en vez de salirse', () => {
		expect(render(PowerActions).classes()).toContain('flex-wrap');
		expect(render(PowerActions, { props: { variant: 'tiles' } }).classes()).toContain('flex-wrap');
	});
});
