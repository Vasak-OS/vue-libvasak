/**
 * Las preferencias de ventana que elige la persona en Configuración y siguen
 * todas las aplicaciones: dónde va la barra, cómo se dibujan los botones de
 * ventana y de qué lado van.
 *
 * Viven en la sección `window` de `~/.config/vasak/vasak.conf`, la misma de
 * `barPosition` (ver `preferencia.ts`): el config-manager no las declara, pero
 * las guarda y las devuelve tal cual. Se leen **una vez** por ventana —el marco
 * las provee y la barra y los botones las inyectan— y se vuelven a leer con
 * cada `config-changed`, así que cambiarlas en Configuración cambia las
 * ventanas abiertas.
 *
 * Lo que falta o no se reconoce cae en lo de siempre: barra arriba, botones
 * planos, al final. Una errata a mano no deja una ventana sin botones.
 */

import {
	inject,
	type InjectionKey,
	onBeforeUnmount,
	onMounted,
	provide,
	type Ref,
	ref,
} from 'vue';
import { posicionDe } from './preferencia';
import type { PosicionDeLaBarra } from './tipos';

/**
 * Cómo se dibujan los botones de ventana: `default` son los botones planos de
 * Once UI; `macos`, los tres círculos de color —cerrar en el rojo del esquema,
 * minimizar en el amarillo y maximizar en el verde—.
 */
export type WindowControlsStyle = 'default' | 'macos';

/**
 * De qué lado y en qué orden: `default` es al final de la barra
 * (minimizar, maximizar, cerrar); `reversed`, al principio y al revés, como en
 * macOS (cerrar, minimizar, maximizar).
 */
export type WindowControlsOrder = 'default' | 'reversed';

export const WINDOW_CONTROLS_STYLES: readonly WindowControlsStyle[] = ['default', 'macos'];
export const WINDOW_CONTROLS_ORDERS: readonly WindowControlsOrder[] = ['default', 'reversed'];

type ConfigWithWindow = Record<string, unknown> & {
	window?: { controlsStyle?: unknown; controlsOrder?: unknown };
};

/** El estilo de los botones de una configuración ya leída; `default` si no dice nada válido. */
export function controlsStyleFrom(config: unknown): WindowControlsStyle {
	const value = (config as ConfigWithWindow | null)?.window?.controlsStyle;
	return (WINDOW_CONTROLS_STYLES as readonly unknown[]).includes(value) ? (value as WindowControlsStyle) : 'default';
}

/** El orden de los botones de una configuración ya leída; `default` si no dice nada válido. */
export function controlsOrderFrom(config: unknown): WindowControlsOrder {
	const value = (config as ConfigWithWindow | null)?.window?.controlsOrder;
	return (WINDOW_CONTROLS_ORDERS as readonly unknown[]).includes(value) ? (value as WindowControlsOrder) : 'default';
}

/** Lo que el marco provee a la barra y a los botones. */
export interface WindowControlsPreference {
	controlsStyle: Ref<WindowControlsStyle>;
	controlsOrder: Ref<WindowControlsOrder>;
}

export const WINDOW_CONTROLS_KEY: InjectionKey<WindowControlsPreference> = Symbol('vasak window controls');

export interface WindowPreferences extends WindowControlsPreference {
	barPosition: Ref<PosicionDeLaBarra>;
}

/**
 * Las tres preferencias, siguiendo a la configuración.
 *
 * Fuera de Tauri —pruebas, vista previa— no hay configuración y quedan las de
 * por omisión. Si la clave desaparece se vuelve a la de por omisión y no a la
 * anterior: borrarla a mano tiene que devolver lo de siempre.
 */
export function useWindowPreferences(defaultBarPosition: PosicionDeLaBarra = 'top'): WindowPreferences {
	const barPosition = ref<PosicionDeLaBarra>(defaultBarPosition);
	const controlsStyle = ref<WindowControlsStyle>('default');
	const controlsOrder = ref<WindowControlsOrder>('default');
	let stopListening: (() => void) | null = null;
	let unmounted = false;

	async function read() {
		try {
			const { readConfig } = await import('@vasakgroup/plugin-config-manager');
			const config = await readConfig();
			barPosition.value = posicionDe(config) ?? defaultBarPosition;
			controlsStyle.value = controlsStyleFrom(config);
			controlsOrder.value = controlsOrderFrom(config);
		} catch {
			// Sin configuración se quedan las de por omisión.
		}
	}

	onMounted(async () => {
		await read();
		try {
			const { listen } = await import('@tauri-apps/api/event');
			const release = await listen('config-changed', () => {
				void read();
			});
			// El registro es asíncrono: si el componente se desmontó mientras
			// tanto, no queda nadie que lo suelte.
			if (unmounted) {
				release();
				return;
			}
			stopListening = release;
		} catch {
			// Sin eventos, valen las que se leyeron al abrir.
		}
	});

	onBeforeUnmount(() => {
		unmounted = true;
		stopListening?.();
		stopListening = null;
	});

	return { barPosition, controlsStyle, controlsOrder };
}

/**
 * Las preferencias de los botones para quien los dibuja.
 *
 * Dentro de un marco son las que el marco ya leyó. Una barra o unos botones
 * montados sueltos —sin `WindowFrame`— las leen por su cuenta y las proveen a
 * lo de adentro, así que se lee una sola vez igual.
 */
export function useWindowControlsPreference(): WindowControlsPreference {
	const injected = inject(WINDOW_CONTROLS_KEY, null);
	if (injected) return injected;
	const { controlsStyle, controlsOrder } = useWindowPreferences();
	const own = { controlsStyle, controlsOrder };
	provide(WINDOW_CONTROLS_KEY, own);
	return own;
}

/**
 * Los botones en el orden en que se dibujan.
 *
 * `controls` dice **cuáles** lleva la ventana (un diálogo, ninguno; el
 * mini-reproductor, sólo cerrar); el orden sale de la preferencia. Invertido
 * es el de macOS, cerrar primero, y no el espejo exacto: es lo que la gente
 * que lo pide espera encontrar.
 */
export function orderControls<T extends string>(controls: readonly T[], order: WindowControlsOrder): T[] {
	const sequence = order === 'reversed' ? ['close', 'minimize', 'maximize'] : ['minimize', 'maximize', 'close'];
	return sequence.filter((control) => controls.includes(control as T)) as T[];
}
