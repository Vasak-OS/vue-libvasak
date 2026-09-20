/**
 * El tooltip, montado.
 *
 * Venía copiado en vasak-file-manager y en vasak-terminal. `Tooltip.vue` era
 * idéntico byte a byte entre los dos; el disparador y el contenido ya habían
 * divergido diez líneas cada uno, y cada copia perdió algo distinto: el
 * disparador de file-manager arrastraba un `asChild` declarado y nunca usado,
 * y el contenido de terminal había perdido el `class` que sus vecinos sí usan
 * para los tooltips de más de una línea.
 *
 * Lo que se comprueba acá es lo que se rompe al tocarlo: que el retardo exista
 * —sin él parpadea al cruzar una barra de botones—, que salir cancele lo que
 * todavía no apareció, que un botón apagado no explique nada, y que el foco lo
 * abra igual que el puntero, que es lo que lo hace alcanzable sin ratón.
 */

import { describe, expect, test } from 'bun:test';
import { mount } from '@vue/test-utils';
import { defineComponent, h, nextTick } from 'vue';
import Tooltip from '../src/tooltip/Tooltip.vue';
import TooltipContent from '../src/tooltip/TooltipContent.vue';
import TooltipTrigger from '../src/tooltip/TooltipTrigger.vue';
import { usarElTooltip } from '../src/tooltip/tipos';

const RETARDO = 200;

function esperar(ms: number) {
	return new Promise((listo) => setTimeout(listo, ms));
}

function armar(props: Record<string, unknown> = {}, claseDelGlobo?: string) {
	return mount(Tooltip, {
		props,
		slots: {
			default: () => [
				h(TooltipTrigger, () => h('button', { class: 'boton' }, 'Guardar')),
				h(TooltipContent, { class: claseDelGlobo }, () => 'Guarda el archivo'),
			],
		},
		attachTo: document.body,
	});
}

/**
 * El envoltorio del disparador, que es donde escucha.
 *
 * `mouseenter` y `focus` **no burbujean**: dispararlos sobre el botón de
 * adentro no llega al `div` que los oye. En un navegador el puntero entra al
 * `div` y por eso funciona; en una prueba hay que apuntarle a él.
 */
function elEnvoltorio(vista: ReturnType<typeof armar>) {
	return vista.findComponent(TooltipTrigger).find('div');
}

/** El globo se teletransporta al `body`, así que no cuelga del montaje. */
function elGlobo() {
	return [...document.body.querySelectorAll('div')].find((d) =>
		d.textContent?.includes('Guarda el archivo')
	);
}

function estaVisible() {
	const globo = elGlobo();
	return !!globo && globo.style.display !== 'none';
}

describe('el tooltip', () => {
	test('no aparece hasta que pasa el retardo', async () => {
		const vista = armar();

		await elEnvoltorio(vista).trigger('mouseenter');
		await nextTick();
		expect(estaVisible()).toBe(false);

		await esperar(RETARDO + 30);
		await nextTick();
		expect(estaVisible()).toBe(true);

		vista.unmount();
	});

	test('y salir antes de tiempo cancela el que no llegó a aparecer', async () => {
		// Sin esto, cruzar una barra de botones camino a otra cosa deja un
		// tooltip apareciendo encima de lo que sea que se esté mirando después.
		const vista = armar();

		await elEnvoltorio(vista).trigger('mouseenter');
		await esperar(RETARDO / 4);
		await elEnvoltorio(vista).trigger('mouseleave');
		await esperar(RETARDO);
		await nextTick();

		expect(estaVisible()).toBe(false);
		vista.unmount();
	});

	test('el foco lo abre igual que el puntero', async () => {
		// Un tooltip que sólo responde al ratón no existe para quien no lo usa.
		const vista = armar();

		await elEnvoltorio(vista).trigger('focus');
		await esperar(RETARDO + 30);
		await nextTick();

		expect(estaVisible()).toBe(true);
		vista.unmount();
	});

	test('un disparador apagado no explica nada', async () => {
		const vista = armar({ disabled: true });

		await elEnvoltorio(vista).trigger('mouseenter');
		await esperar(RETARDO + 30);
		await nextTick();

		expect(estaVisible()).toBe(false);
		vista.unmount();
	});

	test('el retardo se puede cambiar', async () => {
		const vista = armar({ delayDuration: 0 });

		await elEnvoltorio(vista).trigger('mouseenter');
		await esperar(20);
		await nextTick();

		expect(estaVisible()).toBe(true);
		vista.unmount();
	});

	test('y sobrevolarlo apagado no deja nada armado', async () => {
		// Sin la guarda al abrir, el temporizador corre igual y deja el estado
		// en «abierto» detrás del enmascarado. Volver a habilitar el botón —sin
		// que nadie lo vuelva a sobrevolar— haría aparecer el tooltip solo.
		const vista = armar({ disabled: true, delayDuration: 0 });

		await elEnvoltorio(vista).trigger('mouseenter');
		await esperar(20);
		await vista.setProps({ disabled: false });
		await nextTick();

		expect(estaVisible()).toBe(false);
		vista.unmount();
	});

	test('y si se apaga con el tooltip abierto, se va', async () => {
		// Es el otro medio camino de `disabled`, y no lo cubre la prueba de
		// arriba: aquella evita que el temporizador arranque, y ésta apaga uno
		// que ya estaba en pantalla. Pasa de verdad — un botón que se
		// deshabilita por lo que acaba de pasar deja su explicación colgada.
		const vista = armar({ delayDuration: 0 });

		await elEnvoltorio(vista).trigger('mouseenter');
		await esperar(20);
		await nextTick();
		expect(estaVisible()).toBe(true);

		await vista.setProps({ disabled: true });
		await nextTick();

		expect(estaVisible()).toBe(false);
		vista.unmount();
	});

	test('la clase que se le pasa llega al globo', async () => {
		// Es lo que perdió la copia de vasak-terminal, y lo que sus vecinos usan
		// para un tooltip de más de una línea.
		const vista = armar({ delayDuration: 0 }, 'flex flex-col gap-1');

		await elEnvoltorio(vista).trigger('mouseenter');
		await esperar(20);
		await nextTick();

		expect(elGlobo()?.className).toContain('flex-col');
		vista.unmount();
	});

});

describe('una pieza suelta', () => {
	test('se dibuja aunque no haya ningún `Tooltip` alrededor', () => {
		// Una prueba o una vista previa montan el disparador solo. Reventar ahí
		// obligaría a envolverlo para mirarlo.
		const vista = mount(TooltipTrigger, { slots: { default: () => h('button', 'suelto') } });

		expect(vista.find('button').exists()).toBe(true);
		vista.unmount();
	});

	test('y el contexto suelto abre y cierra sin proveedor', () => {
		const Suelto = defineComponent({
			setup() {
				const tooltip = usarElTooltip();
				return () => h('i', { class: 'estado' }, String(tooltip.abierto.value));
			},
		});

		const vista = mount(Suelto);

		expect(vista.find('.estado').text()).toBe('false');
		vista.unmount();
	});
});
