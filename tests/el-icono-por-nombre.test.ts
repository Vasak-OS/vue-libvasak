/**
 * Los cuatro que pedían el icono como ruta ya resuelta.
 *
 * `ToggleControl`, `SliderControl`, `TrayIconButton` y `DeviceCard` recibían
 * `icon` con una ruta. Era lo contrario de lo que hace el resto de la librería:
 * obligaba a quien los usara a resolverla por su cuenta, escuchar el cambio de
 * tema y volver a pedirla — que es exactamente el composable que este barrido
 * viene borrando de cada repositorio, y el motivo por el que `vasak-desktop` no
 * podía terminar de migrar.
 *
 * Ahora reciben `name` y lo dibuja `ThemeIcon`, así que siguen al tema y entran
 * en el planificador como cualquier otro icono.
 *
 * `icon` sigue andando y avisa por consola. No se saca de una porque sacarlo es
 * una mayor, y porque quien lo use tiene que seguir viendo su icono mientras
 * tanto, no una ventana rota.
 */

import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test';
import { mount, type VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import DeviceCard from '../src/cards/DeviceCard.vue';
import ToggleControl from '../src/controls/ToggleControl.vue';
import SliderControl from '../src/forms/SliderControl.vue';
import { olvidarLosIconosDelTema } from '../src/internos/iconoDelTema';
import TrayIconButton from '../src/tray/TrayIconButton.vue';
import { olvidarTodo, ponerEnElTema } from './dobles';

async function asentar(vueltas = 8) {
	for (let i = 0; i < vueltas; i++) await nextTick();
}

const montados: VueWrapper[] = [];

function montar(componente: Parameters<typeof mount>[0], props: Record<string, unknown>) {
	const vista = mount(componente, { props } as never);
	montados.push(vista);
	return vista;
}

/** Los cuatro, con lo mínimo que cada uno necesita además del icono. */
const LOS_CUATRO = [
	['ToggleControl', ToggleControl, { label: 'Wi-Fi' }],
	['SliderControl', SliderControl, { label: 'Volumen', modelValue: 50 }],
	['TrayIconButton', TrayIconButton, {}],
	['DeviceCard', DeviceCard, { title: 'Auriculares' }],
] as const;

beforeEach(() => {
	olvidarTodo();
	olvidarLosIconosDelTema();
});

afterEach(() => {
	while (montados.length) montados.pop()?.unmount();
	olvidarLosIconosDelTema();
});

describe('el icono se pide por nombre', () => {
	for (const [nombre, componente, propios] of LOS_CUATRO) {
		test(`${nombre} lo resuelve contra el tema`, async () => {
			ponerEnElTema('audio-volume-high', 'data:image/png;base64,ALTO');

			const vista = montar(componente, { ...propios, name: 'audio-volume-high' });
			await asentar();

			expect(vista.find('img').attributes('src')).toBe('data:image/png;base64,ALTO');
		});

		test(`${nombre} distingue la variante`, async () => {
			// Pedir la que no está **no falla**: el tema devuelve el cuadrito de
			// imagen rota, con forma de icono válido. El doble devuelve cosas
			// distintas para cada variante, así que acá se ve cuál se pidió.
			ponerEnElTema('audio-volume-high', 'data:COLOR');
			ponerEnElTema('audio-volume-high-symbolic', 'data:GLIFO');

			const vista = montar(componente, {
				...propios,
				name: 'audio-volume-high-symbolic',
				type: 'symbol',
			});
			await asentar();

			expect(vista.find('img').attributes('src')).toBe('data:GLIFO');
		});
	}
});

describe('la ruta ya resuelta sigue andando, y avisa', () => {
	for (const [nombre, componente, propios] of LOS_CUATRO) {
		test(`${nombre} todavía dibuja lo que le pasen en «icon»`, async () => {
			// Quien no haya migrado tiene que seguir viendo su icono. Sacarlo de
			// una sería romper una ventana ajena para arreglar una propiedad.
			const aviso = spyOn(console, 'warn').mockImplementation(() => {});

			const vista = montar(componente, { ...propios, icon: 'data:VIEJO' });
			await asentar();

			expect(vista.find('img').attributes('src')).toBe('data:VIEJO');
			expect(aviso).toHaveBeenCalled();
			aviso.mockRestore();
		});

		test(`${nombre} no avisa cuando ya se migró`, async () => {
			// Un aviso que sale siempre deja de leerse.
			ponerEnElTema('audio-volume-high', 'data:ALTO');
			const aviso = spyOn(console, 'warn').mockImplementation(() => {});

			montar(componente, { ...propios, name: 'audio-volume-high' });
			await asentar();

			expect(aviso).not.toHaveBeenCalled();
			aviso.mockRestore();
		});
	}
});
