/**
 * Los controles de formulario de la 2.1.0: la casilla, el deslizador, el campo
 * de varias líneas y el numérico, y lo que sumaron `TextInput` y `SearchField`.
 *
 * Cada uno sale de copias que sabían algo que las demás no; las pruebas son
 * sobre todo de eso, porque es lo que se pierde sin hacer ruido: el `NaN` que
 * Configuración aprendió a no escribir, el nombre del deslizador que el correo
 * no anunciaba, el «a medias» que una casilla dibujada a mano no tiene.
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mount, type VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import Checkbox from '../src/forms/Checkbox.vue';
import NumberField from '../src/forms/NumberField.vue';
import Slider from '../src/forms/Slider.vue';
import SliderControl from '../src/forms/SliderControl.vue';
import TextArea from '../src/forms/TextArea.vue';
import TextInput from '../src/forms/TextInput.vue';
import SearchField from '../src/search/SearchField.vue';
import { olvidarTodo, traducir, vaciarElCatalogo } from './dobles';

const vistas: VueWrapper[] = [];
function montar<T>(componente: T, opciones: Record<string, unknown>) {
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

describe('la casilla', () => {
	test('es un checkbox de verdad, nombrado por su etiqueta', () => {
		const vista = montar(Checkbox, { props: { label: 'Recordar esta decisión' } });
		const input = vista.get('input');

		expect(input.attributes('type')).toBe('checkbox');
		expect(vista.get('label').attributes('for')).toBe(input.attributes('id'));
		expect(vista.text()).toContain('Recordar esta decisión');
	});

	test('marcarla emite el valor nuevo', async () => {
		const vista = montar(Checkbox, { props: { label: 'Sólo lectura', modelValue: false } });
		const input = vista.get('input');
		(input.element as HTMLInputElement).checked = true;
		await input.trigger('change');

		expect(vista.emitted('update:modelValue')?.[0]).toEqual([true]);
		expect(vista.emitted('change')?.[0]).toEqual([true]);
	});

	test('la descripción se anuncia atada a la casilla', () => {
		const vista = montar(Checkbox, { props: { label: 'Mayúsculas', description: 'Distingue A de a' } });
		const descrita = vista.get('input').attributes('aria-describedby');

		expect(descrita).toBeTruthy();
		expect(vista.find(`#${descrita}`).text()).toBe('Distingue A de a');
	});

	test('«a medias» se pone como propiedad del elemento, que es lo único que sirve', async () => {
		const vista = montar(Checkbox, { props: { label: 'Todas', indeterminate: true }, attachTo: document.body });
		const input = vista.get('input').element as HTMLInputElement;

		expect(input.indeterminate).toBe(true);
		await vista.setProps({ indeterminate: false });
		expect(input.indeterminate).toBe(false);
	});

	test('el canto es el de 3:1 de los controles y marcada lleva el primario', () => {
		const clases = montar(Checkbox, { props: { label: 'x' } }).get('input').classes();

		expect(clases).toEqual(
			expect.arrayContaining(['appearance-none', 'border-ui-border-strong', 'checked:bg-primary', 'rounded-corner-xs'])
		);
		expect(clases).toContain('focus-visible:outline-ui-focus');
	});

	test('la fila mide 32 de alto aunque la caja sea de 16', () => {
		expect(montar(Checkbox, { props: { label: 'x' } }).get('label').classes()).toContain('min-h-8');
	});

	test('la etiqueta escondida sigue nombrando', () => {
		const vista = montar(Checkbox, { props: { label: 'Elegir fila', hideLabel: true } });

		expect(vista.find('.sr-only').text()).toContain('Elegir fila');
	});

	test('apagada no cambia', () => {
		const vista = montar(Checkbox, { props: { label: 'x', disabled: true } });

		expect(vista.get('input').attributes('disabled')).toBeDefined();
		expect(vista.get('label').classes()).toContain('opacity-50');
	});

	test('focus() dice si llegó', () => {
		const vista = montar(Checkbox, { props: { label: 'x' }, attachTo: document.body });

		expect((vista.vm as unknown as { focus: () => boolean }).focus()).toBe(true);
	});
});

describe('el deslizador', () => {
	test('tiene nombre y dice el valor con su unidad', () => {
		const input = montar(Slider, {
			props: { modelValue: 30, label: 'Esperar antes de enviar', valueText: (v: number) => `${v} segundos` },
		}).get('input');

		expect(input.attributes('aria-label')).toBe('Esperar antes de enviar');
		expect(input.attributes('aria-valuetext')).toBe('30 segundos');
	});

	test('el tramo recorrido se pinta con el valor', () => {
		const input = montar(Slider, { props: { modelValue: 25, min: 0, max: 50, label: 'x' } }).get('input');

		expect((input.element as HTMLInputElement).style.getPropertyValue('--slider-fill')).toBe('50%');
	});

	test('un valor fuera de rango no desborda el tramo', () => {
		const input = montar(Slider, { props: { modelValue: 900, label: 'x' } }).get('input');

		expect((input.element as HTMLInputElement).style.getPropertyValue('--slider-fill')).toBe('100%');
	});

	test('emite números, en cada paso o al soltar', async () => {
		const enCadaPaso = montar(Slider, { props: { modelValue: 10, label: 'x' } });
		const input = enCadaPaso.get('input');
		(input.element as HTMLInputElement).value = '42';
		await input.trigger('input');
		expect(enCadaPaso.emitted('update:modelValue')?.[0]).toEqual([42]);

		const alSoltar = montar(Slider, { props: { modelValue: 10, label: 'x', lazy: true } });
		const otro = alSoltar.get('input');
		(otro.element as HTMLInputElement).value = '42';
		await otro.trigger('input');
		expect(alSoltar.emitted('update:modelValue')).toBeUndefined();
		await otro.trigger('change');
		expect(alSoltar.emitted('update:modelValue')?.[0]).toEqual([42]);
		expect(alSoltar.emitted('change')?.[0]).toEqual([42]);
	});

	test('el pulgar no crece al pasar por encima ni tiñe la sombra del primario', () => {
		const clases = montar(Slider, { props: { modelValue: 10, label: 'x' } }).get('input').classes().join(' ');

		expect(clases).toContain('[&::-webkit-slider-thumb]:shadow-surface-xs');
		expect(clases).not.toMatch(/scale|shadow-\[/);
	});

	test('las etiquetas de los extremos van en sus ranuras', () => {
		const vista = montar(Slider, {
			props: { modelValue: 1, label: 'Velocidad' },
			slots: { start: 'Lento', end: 'Rápido' },
		});

		expect(vista.text()).toContain('Lento');
		expect(vista.text()).toContain('Rápido');
	});

	test('SliderControl lo usa por dentro sin cambiar lo que anuncia', async () => {
		const vista = montar(SliderControl, { props: { label: 'Volumen', modelValue: 47 } });

		expect(vista.findComponent(Slider).exists()).toBe(true);
		expect(vista.get('input').attributes('aria-valuetext')).toBe('47%');
		const input = vista.get('input');
		(input.element as HTMLInputElement).value = '60';
		await input.trigger('input');
		expect(vista.emitted('update:modelValue')?.[0]).toEqual([60]);
	});
});

describe('el campo de varias líneas', () => {
	test('tiene la forma de TextInput, sin el alto fijo', () => {
		const clases = montar(TextArea, { props: { modelValue: '' } }).classes();

		expect(clases).toEqual(expect.arrayContaining(['rounded-corner-m', 'border-ui-border-strong', 'resize-y']));
		expect(clases).not.toContain('h-8');
	});

	test('inválido, el borde de error y aria-invalid', () => {
		const vista = montar(TextArea, { props: { modelValue: '', invalid: true } });

		expect(vista.classes()).toContain('border-status-error');
		expect(vista.attributes('aria-invalid')).toBe('true');
	});

	test('emite en cada tecla, o al salir si es perezoso', async () => {
		const vista = montar(TextArea, { props: { modelValue: '' } });
		(vista.element as HTMLTextAreaElement).value = 'Hola';
		await vista.trigger('input');
		expect(vista.emitted('update:modelValue')?.[0]).toEqual(['Hola']);

		const perezoso = montar(TextArea, { props: { modelValue: '', lazy: true } });
		(perezoso.element as HTMLTextAreaElement).value = 'Hola';
		await perezoso.trigger('input');
		expect(perezoso.emitted('update:modelValue')).toBeUndefined();
		await perezoso.trigger('change');
		expect(perezoso.emitted('update:modelValue')?.[0]).toEqual(['Hola']);
	});

	test('reenvía las teclas, que es como el correo manda con Ctrl+Enter', async () => {
		const vista = montar(TextArea, { props: { modelValue: '' } });
		await vista.trigger('keydown', { key: 'Enter', ctrlKey: true });

		expect(vista.emitted('keydown')).toHaveLength(1);
	});

	test('focus() dice si llegó', () => {
		const vista = montar(TextArea, { props: { modelValue: '' }, attachTo: document.body });

		expect((vista.vm as unknown as { focus: () => boolean }).focus()).toBe(true);
	});
});

describe('el campo numérico', () => {
	async function escribir(vista: VueWrapper, texto: string, evento: 'input' | 'change' = 'input') {
		const input = vista.get('input');
		(input.element as HTMLInputElement).value = texto;
		await input.trigger(evento);
	}

	test('nunca emite NaN: lo que no es un número no sale', async () => {
		const vista = montar(NumberField, { props: { modelValue: 8 } });
		await escribir(vista, '');

		expect(vista.emitted('update:modelValue')).toBeUndefined();
	});

	test('y al salir vuelve a mostrar el último valor bueno', async () => {
		const vista = montar(NumberField, { props: { modelValue: 8 } });
		await escribir(vista, '', 'change');

		expect((vista.get('input').element as HTMLInputElement).value).toBe('8');
		expect(vista.emitted('change')?.[0]).toEqual([8]);
	});

	test('el límite se aplica al salir, no en cada tecla', async () => {
		// Con un mínimo de 10, escribir «15» empieza por «1».
		const vista = montar(NumberField, { props: { modelValue: 12, min: 10, max: 20 } });
		await escribir(vista, '1');
		expect(vista.emitted('update:modelValue')?.[0]).toEqual([1]);

		await vista.setProps({ modelValue: 1 });
		await escribir(vista, '1', 'change');
		expect(vista.emitted('update:modelValue')?.at(-1)).toEqual([10]);
	});

	test('los botones suman el paso, no pasan los límites y se apagan en ellos', async () => {
		const vista = montar(NumberField, { props: { modelValue: 9, max: 10, stepper: true } });
		const [menos, mas] = vista.findAll('button');

		await mas?.trigger('click');
		expect(vista.emitted('update:modelValue')?.[0]).toEqual([10]);
		await vista.setProps({ modelValue: 10 });
		expect(mas?.attributes('disabled')).toBeDefined();
		expect(menos?.attributes('disabled')).toBeUndefined();
	});

	test('un paso decimal no deja restos de coma flotante', async () => {
		const vista = montar(NumberField, { props: { modelValue: 0.2, step: 0.1, stepper: true } });
		await vista.findAll('button')[1]?.trigger('click');

		expect(vista.emitted('update:modelValue')?.[0]).toEqual([0.3]);
	});

	test('los botones se nombran con la propiedad, el catálogo o el respaldo', () => {
		const conPropiedad = montar(NumberField, { props: { modelValue: 1, stepper: true, incrementLabel: 'Más' } });
		expect(conPropiedad.findAll('button')[1]?.attributes('aria-label')).toBe('Más');

		traducir('numberField.decrement', 'Menos uno');
		const conCatalogo = montar(NumberField, { props: { modelValue: 1, stepper: true } });
		expect(conCatalogo.findAll('button')[0]?.attributes('aria-label')).toBe('Menos uno');

		vaciarElCatalogo();
		const sinNada = montar(NumberField, { props: { modelValue: 1, stepper: true } });
		expect(sinNada.findAll('button').map((b) => b.attributes('aria-label'))).toEqual(['Restar', 'Sumar']);
	});

	test('angosto, del ancho de Configuración; si no, llena la fila', () => {
		expect(montar(NumberField, { props: { modelValue: 1, narrow: true } }).classes()).toContain('w-32');
		expect(montar(NumberField, { props: { modelValue: 1 } }).classes()).toContain('w-full');
	});

	test('con los botones, las flechas nativas del campo se apagan', () => {
		const clases = montar(NumberField, { props: { modelValue: 1, stepper: true } }).get('input').classes().join(' ');

		expect(clases).toContain('[&::-webkit-inner-spin-button]:appearance-none');
	});
});

describe('lo que sumaron TextInput y SearchField', () => {
	test('datetime-local es un tipo más', () => {
		expect(montar(TextInput, { props: { modelValue: '', type: 'datetime-local' } }).attributes('type')).toBe(
			'datetime-local'
		);
	});

	test('el grande mide 40 y el de siempre 32', () => {
		expect(montar(TextInput, { props: { modelValue: '', size: 'lg' } }).classes()).toContain('h-10');
		const comun = montar(TextInput, { props: { modelValue: '' } }).classes();
		expect(comun).toContain('h-8');
		expect(comun).not.toContain('h-10');
	});

	test('sin canto ni fondo, y con el anillo por dentro', () => {
		const clases = montar(TextInput, { props: { modelValue: '', bare: true } }).classes();

		expect(clases).toEqual(expect.arrayContaining(['border-transparent', 'bg-transparent', 'focus-visible:-outline-offset-2']));
		expect(clases).not.toContain('border-ui-border-strong');
		expect(clases).not.toContain('hover:border-tx-main');
	});

	test('el buscador grande agranda la lupa y deja lugar para ella', async () => {
		const vista = montar(SearchField, { props: { modelValue: 'x', label: 'Buscar', size: 'lg', bare: true } });
		await nextTick();
		const input = vista.get('input');

		expect(input.classes()).toEqual(expect.arrayContaining(['h-10', 'pl-10', 'pr-10', 'border-transparent']));
		expect(vista.get('button').classes()).toContain('size-8');
	});

	test('y los atributos de quien lo usa caen en la caja', () => {
		// La plantilla empezaba con un comentario, que la partía en un fragmento.
		const vista = montar(SearchField, { props: { modelValue: '' }, attrs: { class: 'w-64' } });

		expect(vista.classes()).toContain('w-64');
	});
});
