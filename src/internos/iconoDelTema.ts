import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { getIconSource, getSymbolSource } from '@vasakgroup/plugin-vicons';
import { onMounted, onUnmounted, readonly, ref, type Ref, watch } from 'vue';

/**
 * Resolver un icono del tema del escritorio, y seguirlo cuando cambia.
 *
 * El pack de iconos cambia en caliente: sin escuchar el aviso, la ventana se
 * queda con los del tema anterior hasta reabrirla. Y las resoluciones se
 * cruzan —cambiar de icono y cambiar de tema resuelven en paralelo—, así que
 * cada pedido lleva un testigo y sólo se aplica el último: sin él, la respuesta
 * vieja llega última y deja puesto el icono de antes.
 *
 * # Por qué hay memoria y un solo oyente
 *
 * Antes cada instancia resolvía por su cuenta y se suscribía por su cuenta:
 * montar una fila costaba **dos llamadas al backend**, el `listen` y el
 * `getIconSource`. En una ventana con diez iconos no se nota; en una lista que
 * se desplaza son dos por fila que aparece, y las mismas dos otra vez cuando la
 * fila vuelve a entrar. Diez filas con el mismo icono lo resolvían diez veces.
 *
 * Ahora lo resuelto se memoriza por nombre y tipo, el pedido en vuelo se
 * comparte, y el oyente del cambio de tema es uno solo para todas las
 * instancias. Al cambiar el tema se vacía la memoria y todas vuelven a resolver.
 *
 * Interno a propósito: lo comparten `ThemeIcon` y `SideButton`, y lo que las
 * aplicaciones usan es el componente, no esto.
 */

const EVENTO = 'vicons:theme-changed';

/** Lo ya resuelto, por `tipo:nombre`. */
const memoria = new Map<string, string>();
/** Los pedidos que todavía no volvieron, para no pedir dos veces lo mismo. */
const enVuelo = new Map<string, Promise<string>>();

/**
 * Sube con cada cambio de tema.
 *
 * Es lo que hace que todas las instancias vuelvan a resolver sin que el oyente
 * tenga que conocerlas: cada una lo mira.
 */
const version = ref(0);

let suscriptores = 0;
let soltarElOyente: UnlistenFn | null = null;
let registrando: Promise<void> | null = null;

/**
 * Deja el módulo como recién cargado.
 *
 * Sólo para las pruebas: el estado vive en el módulo y el módulo se comparte
 * entre archivos de prueba, así que sin esto una prueba ve los suscriptores que
 * dejó otra y cuenta oyentes que ya no existen.
 */
export function olvidarLosIconosDelTema() {
	memoria.clear();
	enVuelo.clear();
	suscriptores = 0;
	soltarElOyente = null;
	registrando = null;
	version.value = 0;
}

function alCambiarElTema() {
	// Lo resuelto ya no vale, y lo que esté en vuelo tampoco: se pidió contra el
	// tema anterior.
	memoria.clear();
	enVuelo.clear();
	version.value++;
}

/**
 * Registra el oyente si es el primero, y devuelve cuándo está puesto.
 *
 * El primero espera a que esté; los demás siguen de largo. Eso conserva lo que
 * el oyente por instancia garantizaba —que un cambio de tema durante la primera
 * resolución no se pierda— sin pagar el registro una vez por fila.
 */
function tomarElOyente(): Promise<void> {
	suscriptores++;

	if (soltarElOyente || registrando) {
		return registrando ?? Promise.resolve();
	}

	registrando = listen(EVENTO, alCambiarElTema).then((soltar) => {
		// Registrarse tarda, y quien lo pidió puede haberse ido mientras tanto:
		// ahí `onUnmounted` ya pasó y no vio nada que soltar, así que el oyente
		// quedaba puesto para siempre.
		if (suscriptores <= 0) {
			soltar();
		} else {
			soltarElOyente = soltar;
		}
		registrando = null;
	});

	return registrando;
}

function devolverElOyente() {
	suscriptores--;
	if (suscriptores > 0) {
		return;
	}

	suscriptores = 0;
	soltarElOyente?.();
	soltarElOyente = null;
}

/**
 * El icono resuelto, de la memoria o del backend.
 *
 * `version` entra en la clave del pedido en vuelo para que una respuesta pedida
 * contra el tema anterior no se memorice como si fuera del nuevo.
 */
function resolverCompartido(nombre: string, tipo: 'icon' | 'symbol'): Promise<string> {
	const clave = `${tipo}:${nombre}`;

	const guardado = memoria.get(clave);
	if (guardado !== undefined) {
		return Promise.resolve(guardado);
	}

	const pedido = enVuelo.get(clave);
	if (pedido) {
		return pedido;
	}

	const cuando = version.value;
	const nuevo = (tipo === 'symbol' ? getSymbolSource(nombre) : getIconSource(nombre))
		.then((fuente) => {
			// Si el tema cambió mientras tanto, esto es del tema viejo: se
			// devuelve a quien lo pidió —que ya va a volver a resolver— pero no
			// se guarda.
			if (version.value === cuando) {
				memoria.set(clave, fuente);
			}
			return fuente;
		})
		.finally(() => {
			if (enVuelo.get(clave) === nuevo) {
				enVuelo.delete(clave);
			}
		});

	enVuelo.set(clave, nuevo);
	return nuevo;
}

/**
 * Cuántas veces cambió el tema de iconos, para quien resuelve por su cuenta.
 *
 * `ThemeIcon` resuelve **un** nombre del tema. Hay componentes que no pueden
 * usarlo porque su forma de conseguir el icono es otra: la tienda prueba una
 * lista de nombres candidatos en orden —los temas no se ponen de acuerdo entre
 * el `Icon=` del `.desktop`, el identificador de AppStream y el nombre del
 * paquete— y si ninguno está, cae a un archivo del catálogo.
 *
 * Ese componente igual tiene que volver a resolver cuando la persona cambia de
 * tema, y sin esto la única salida es registrar su propio `listen`: un oyente
 * más por instancia, al lado del que esta librería ya tiene para todas. Eso es
 * exactamente el composable que este barrido viene borrando de cada aplicación.
 *
 * Se devuelve de sólo lectura: quien la usa la mira en un `watch`, no la mueve.
 *
 * ```ts
 * const version = usarLaVersionDelTema();
 * watch([loQueSea, version], resolver, { immediate: true });
 * ```
 */
export function usarLaVersionDelTema(): Readonly<Ref<number>> {
	let desmontado = false;

	onMounted(async () => {
		await tomarElOyente();
		// Registrarse tarda: si el componente ya se fue, se devuelve en el acto
		// en vez de dejar la cuenta subida para siempre.
		if (desmontado) {
			devolverElOyente();
		}
	});

	onUnmounted(() => {
		if (!desmontado) {
			desmontado = true;
			devolverElOyente();
		}
	});

	return readonly(version);
}

export function useIconoDelTema(nombre: Ref<string>, tipo: Ref<'icon' | 'symbol'>) {
	const fuente = ref('');
	let desmontado = false;
	let ultimoPedido = 0;

	async function resolver() {
		const mio = ++ultimoPedido;
		const cual = nombre.value;

		if (!cual) {
			fuente.value = '';
			return;
		}

		const resuelto = await resolverCompartido(cual, tipo.value);

		if (mio === ultimoPedido && !desmontado) {
			fuente.value = resuelto;
		}
	}

	onMounted(async () => {
		await tomarElOyente();
		if (!desmontado) {
			await resolver();
		}
	});

	onUnmounted(() => {
		desmontado = true;
		devolverElOyente();
	});

	watch([nombre, tipo], resolver);
	// Al cambiar el tema, todas vuelven a resolver contra la memoria vacía.
	watch(version, resolver);

	return fuente;
}
