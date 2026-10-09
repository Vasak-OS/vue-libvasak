/**
 * Cómo se leen el estilo y el orden de los botones de ventana (2.16.0).
 *
 * Salen de `window.controlsStyle` y `window.controlsOrder` de `vasak.conf`, un
 * archivo que cualquiera edita a mano. Lo que importa acá es que un valor
 * inventado no deje una ventana sin botones ni con un estilo a medias, y que el
 * orden invertido sea el de macOS —cerrar primero— y no el espejo exacto.
 */

import { describe, expect, test } from 'bun:test';
import { controlsOrderFrom, controlsStyleFrom, orderControls } from '../src/index';

describe('el estilo de los botones', () => {
	test('sale de `window.controlsStyle`', () => {
		expect(controlsStyleFrom({ window: { controlsStyle: 'macos' } })).toBe('macos');
		expect(controlsStyleFrom({ window: { controlsStyle: 'default' } })).toBe('default');
	});

	test('lo que falta o no se reconoce queda en los botones planos', () => {
		for (const basura of [
			null,
			undefined,
			{},
			{ window: {} },
			{ window: null },
			{ window: { controlsStyle: 'MacOS' } },
			{ window: { controlsStyle: 'gnome' } },
			{ window: { controlsStyle: 1 } },
			{ controlsStyle: 'macos' },
		]) {
			expect(controlsStyleFrom(basura)).toBe('default');
		}
	});
});

describe('el orden de los botones', () => {
	test('sale de `window.controlsOrder`', () => {
		expect(controlsOrderFrom({ window: { controlsOrder: 'reversed' } })).toBe('reversed');
		expect(controlsOrderFrom({ window: { controlsOrder: 'default' } })).toBe('default');
	});

	test('lo que falta o no se reconoce queda al final, como siempre', () => {
		for (const basura of [
			null,
			{},
			{ window: {} },
			{ window: { controlsOrder: 'reverse' } },
			{ window: { controlsOrder: true } },
			{ window: { controlsStyle: 'reversed' } },
		]) {
			expect(controlsOrderFrom(basura)).toBe('default');
		}
	});

	test('por omisión es minimizar, maximizar, cerrar', () => {
		expect(orderControls(['minimize', 'maximize', 'close'], 'default')).toEqual(['minimize', 'maximize', 'close']);
	});

	test('invertido es el de macOS: cerrar, minimizar, maximizar', () => {
		// No el espejo exacto (cerrar, maximizar, minimizar): quien lo pide
		// espera encontrar los círculos en el orden de macOS.
		expect(orderControls(['minimize', 'maximize', 'close'], 'reversed')).toEqual(['close', 'minimize', 'maximize']);
	});

	test('el orden no depende de cómo se pasaron los botones', () => {
		expect(orderControls(['close', 'maximize', 'minimize'], 'default')).toEqual(['minimize', 'maximize', 'close']);
		expect(orderControls(['maximize', 'close', 'minimize'], 'reversed')).toEqual(['close', 'minimize', 'maximize']);
	});

	test('sólo dibuja los que la ventana lleva', () => {
		// El mini-reproductor lleva sólo cerrar, un diálogo ninguno: invertir no
		// puede devolver un botón que no se pidió.
		expect(orderControls(['close'], 'reversed')).toEqual(['close']);
		expect(orderControls(['maximize', 'close'], 'reversed')).toEqual(['close', 'maximize']);
		expect(orderControls([], 'reversed')).toEqual([]);
		expect(orderControls([], 'default')).toEqual([]);
	});
});
