/**
 * De dónde sale la posición de la barra.
 *
 * De `~/.config/vasak/vasak.conf`, en `window.barPosition`, que es la misma
 * configuración del escritorio que ya traen las fuentes, el tema y los iconos.
 * Que sea de ahí y no de cada aplicación es el punto: moverla en un lado la
 * mueve en todas.
 *
 * # Por qué una clave que el plugin no declara
 *
 * `VSKConfig` no la tiene en su tipo, pero el modelo de Rust guarda todo lo que
 * no conoce en un `serde(flatten)` y lo devuelve tal cual, así que la clave
 * sobrevive a cada lectura y a cada escritura. Es el mismo camino por el que
 * pasan los widgets del escritorio, que los escribe y los lee sólo el
 * escritorio. Si algún día se vuelve parte del tipo, esto sigue andando.
 *
 * # Y por qué tolera que no haya nada
 *
 * Una ventana se dibuja antes de que la configuración llegue, y puede abrirse
 * fuera de Tauri —una prueba, una vista previa— donde no hay configuración
 * ninguna. En los dos casos la respuesta es «arriba», que es donde la barra
 * estuvo siempre.
 */

import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue';
import { esPosicion, type PosicionDeLaBarra } from './tipos';

/** La sección de la configuración donde vive esto. */
const SECCION = 'window';
const CLAVE = 'barPosition';

type ConfiguracionConVentana = Record<string, unknown> & {
	[SECCION]?: { [CLAVE]?: unknown };
};

/** Saca la posición de una configuración ya leída, o `null` si no dice nada. */
export function posicionDe(configuracion: unknown): PosicionDeLaBarra | null {
	const seccion = (configuracion as ConfiguracionConVentana | null)?.[SECCION];
	const valor = seccion?.[CLAVE];
	return esPosicion(valor) ? valor : null;
}

/**
 * La posición de la barra, siguiendo a la configuración.
 *
 * Se vuelve a leer con cada `config-changed`, que es el evento que el gestor de
 * configuración emite al guardar: mover la barra en Configuración la mueve en
 * las ventanas abiertas sin cerrarlas.
 */
export function usarLaPosicionDeLaBarra(porOmision: PosicionDeLaBarra = 'top'): Ref<PosicionDeLaBarra> {
	const posicion = ref<PosicionDeLaBarra>(porOmision);
	let dejarDeEscuchar: (() => void) | null = null;
	let desmontado = false;

	async function leer() {
		try {
			const { readConfig } = await import('@vasakgroup/plugin-config-manager');
			const configuracion = await readConfig();
			// Y si deja de decir algo válido, se vuelve a la de por omisión en
			// lugar de quedarse con la anterior: borrar la clave a mano tiene
			// que devolver la barra a donde estaba, no dejarla donde quedó.
			posicion.value = posicionDe(configuracion) ?? porOmision;
		} catch {
			// Sin configuración —fuera de Tauri, o el archivo ilegible— se queda
			// la de por omisión. Una ventana sin barra no es una opción.
		}
	}

	onMounted(async () => {
		await leer();
		try {
			const { listen } = await import('@tauri-apps/api/event');
			const soltar = await listen('config-changed', () => {
				void leer();
			});
			// El registro es asíncrono: si el componente se desmontó mientras
			// tanto, `onBeforeUnmount` ya pasó y no había nada que soltar. El
			// oyente quedaba puesto para toda la vida del proceso.
			if (desmontado) {
				soltar();
				return;
			}
			dejarDeEscuchar = soltar;
		} catch {
			// Sin eventos, la posición es la que se leyó al abrir.
		}
	});

	onBeforeUnmount(() => {
		desmontado = true;
		dejarDeEscuchar?.();
		dejarDeEscuchar = null;
	});

	return posicion;
}
