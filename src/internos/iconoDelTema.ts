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
 * instancias.
 *
 * # Y por qué la recarga va por tandas
 *
 * La memoria evita **pedir dos veces lo mismo**. No evita **pedir cuarenta cosas
 * a la vez**, que es otro problema y aparece donde los nombres son todos
 * distintos: el menú del escritorio dibuja la lista entera de aplicaciones
 * instaladas, entre sesenta y ciento cincuenta iconos, casi todas fuera de
 * pantalla. Al cambiar de tema, resolver todo de golpe es una llamada al backend
 * por aplicación disparada en el proceso que dibuja el panel.
 *
 * Así que al cambiar el tema no se resuelve todo de una:
 *
 * - se **espera 100 ms** antes de empezar, porque los avisos vienen de a varios
 *   —cambiar de claro a oscuro toca más de una cosa— y sólo importa el último;
 * - si entra un aviso nuevo con un ciclo a medio correr, el viejo **se cancela**;
 * - lo que está **en pantalla** se recarga primero, y para saberlo hay un
 *   `IntersectionObserver`: sin eso el orden lo decide el de montaje, que no
 *   tiene nada que ver con lo que la persona está mirando;
 * - y el resto va **de a diez, con 16 ms entre tandas** —un cuadro a 60 Hz—
 *   para que el hilo pueda dibujar entre medio.
 *
 * Esto venía de `vasak-desktop`, que lo escribió porque le hacía falta y lo tuvo
 * sin pruebas: acá es de todos y está probado.
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
	registradas.clear();
	enPantalla.clear();
	proximoId = 0;
	// El vigía también: se queda mirando elementos de componentes que ya no
	// existen, y en las pruebas eso lo hereda el archivo siguiente.
	vigia?.disconnect();
	vigia = null;
	vigiaIntentado = false;
	if (esperando !== null) {
		clearTimeout(esperando);
		esperando = null;
	}
	if (cicloActual) cicloActual.cancelado = true;
	cicloActual = null;
}

// ── El planificador de la recarga ──────────────────────────────────────────

/** Cuánto se espera antes de empezar, para que varios avisos sean uno. */
const ESPERA_MS = 100;
/** Cuántos iconos se resuelven juntos. */
const POR_TANDA = 10;
/** Un cuadro a 60 Hz: lo que se le deja al hilo entre tanda y tanda. */
const ENTRE_TANDAS_MS = 16;

type Recarga = () => Promise<void>;

/** Cada instancia registrada, con el elemento que dibuja si lo tiene. */
const registradas = new Map<number, { recargar: Recarga; elemento: HTMLElement | null }>();
const enPantalla = new Set<number>();
let proximoId = 0;

/**
 * Quién está en pantalla.
 *
 * Se crea a la primera, y no al cargar el módulo, porque en una prueba con el
 * DOM puesto después del import no existiría. Donde no haya
 * `IntersectionObserver` —una prueba sin DOM— se sigue sin él: todas cuentan
 * como visibles, que es el orden de antes y no rompe nada.
 */
let vigia: IntersectionObserver | null = null;
let vigiaIntentado = false;

function elVigia(): IntersectionObserver | null {
	if (vigiaIntentado) {
		return vigia;
	}
	vigiaIntentado = true;
	if (typeof IntersectionObserver === 'undefined') {
		return null;
	}
	vigia = new IntersectionObserver(
		(entradas) => {
			for (const entrada of entradas) {
				const cual = (entrada.target as HTMLElement).dataset?.iconoId;
				if (cual == null) continue;
				const id = Number.parseInt(cual, 10);
				if (entrada.isIntersecting) enPantalla.add(id);
				else enPantalla.delete(id);
			}
		},
		{ threshold: 0 }
	);
	return vigia;
}

function anotar(recargar: Recarga): number {
	const id = proximoId++;
	registradas.set(id, { recargar, elemento: null });
	// Hasta que el vigía diga lo contrario, cuenta como visible: si no, lo que
	// se acaba de montar se recargaría último, que es justo al revés.
	enPantalla.add(id);
	return id;
}

/**
 * Le dice al vigía qué elemento mirar.
 *
 * Va aparte de `anotar` porque el elemento no existe cuando se registra: en
 * `setup` todavía no hay DOM. Quien lo tenga lo pasa al montar.
 */
function mirarElemento(id: number, elemento: HTMLElement | null) {
	const entrada = registradas.get(id);
	if (!entrada || entrada.elemento === elemento) return;

	// Se suelta el anterior **antes** de tomar el nuevo. `ThemeIcon` cambia el
	// `span` del hueco por el `img` cuando el icono resuelve, así que esto corre
	// dos veces con elementos distintos: sin soltar, los dos quedan vigilados
	// con el mismo identificador, y un aviso tardío del viejo —que ya no está en
	// el documento, o sea nunca visible— saca de «en pantalla» a un icono que sí
	// lo está. Ahí se recargaría último, que es justo al revés.
	if (entrada.elemento) {
		vigia?.unobserve(entrada.elemento);
		delete entrada.elemento.dataset.iconoId;
		entrada.elemento = null;
	}

	if (!elemento) return;
	const ojo = elVigia();
	if (!ojo) return;
	entrada.elemento = elemento;
	elemento.dataset.iconoId = String(id);
	ojo.observe(elemento);
}

function olvidar(id: number) {
	const entrada = registradas.get(id);
	if (entrada?.elemento) {
		vigia?.unobserve(entrada.elemento);
		delete entrada.elemento.dataset.iconoId;
	}
	enPantalla.delete(id);
	registradas.delete(id);
}

let esperando: ReturnType<typeof setTimeout> | null = null;
/** El ciclo en curso. Se compara por identidad para saber si sigue siendo el suyo. */
let cicloActual: { cancelado: boolean } | null = null;

function dormir(ms: number) {
	return new Promise((listo) => setTimeout(listo, ms));
}

async function correrElCiclo(ciclo: { cancelado: boolean }) {
	// Se saca una foto: lo que se desmonte a mitad desaparece del mapa y se
	// saltea al buscarlo.
	const todas = [...registradas.keys()];
	const visibles = todas.filter((id) => enPantalla.has(id));
	const ocultas = todas.filter((id) => !enPantalla.has(id));

	for (const grupo of [visibles, ocultas]) {
		for (let desde = 0; desde < grupo.length; desde += POR_TANDA) {
			if (ciclo.cancelado) return;
			const tanda = grupo.slice(desde, desde + POR_TANDA);
			await Promise.allSettled(
				tanda.map((id) => registradas.get(id)?.recargar() ?? Promise.resolve())
			);
			if (ciclo.cancelado) return;
			if (desde + POR_TANDA < grupo.length || grupo === visibles) {
				await dormir(ENTRE_TANDAS_MS);
			}
		}
	}

	if (cicloActual === ciclo) cicloActual = null;
}

/**
 * Cuántos iconos hay anotados en el planificador.
 *
 * Sólo para las pruebas, y hace falta: lo que se anota al montar tiene que
 * irse al desmontar, y desde afuera eso **no se puede ver** contando pedidos.
 * Un componente desmontado que siguiera anotado tampoco pediría nada —al
 * desmontarse su nombre queda vacío y la resolución sale antes de preguntar—,
 * así que una prueba que cuente pedidos pasa con la baja puesta y sin ella.
 * Se vio: el sabotaje de sacar la baja no movió ninguna prueba.
 */
export function cuantosIconosAnotados(): number {
	return registradas.size;
}

/**
 * Empieza de nuevo, cancelando lo que hubiera a medio hacer.
 *
 * Exportado para las pruebas: sin esto habría que esperar los 100 ms de rebote
 * en cada una, y una prueba que duerme es una prueba que a veces falla sola.
 */
export function recargarLosIconosAhora() {
	if (esperando !== null) {
		clearTimeout(esperando);
		esperando = null;
	}
	if (cicloActual) cicloActual.cancelado = true;
	const ciclo = { cancelado: false };
	cicloActual = ciclo;
	void correrElCiclo(ciclo);
}

function alCambiarElTema() {
	// Lo resuelto ya no vale, y lo que esté en vuelo tampoco: se pidió contra el
	// tema anterior. Se vacía en el acto y no al empezar el ciclo, para que nadie
	// que resuelva mientras tanto se lleve un valor del tema viejo.
	memoria.clear();
	enVuelo.clear();
	// Los que resuelven por su cuenta con `usarLaVersionDelTema()` no pasan por
	// el planificador: son pocos y saben lo que hacen.
	version.value++;

	if (esperando !== null) clearTimeout(esperando);
	esperando = setTimeout(() => {
		esperando = null;
		recargarLosIconosAhora();
	}, ESPERA_MS);
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
	// Se anota en el `setup` y no al montar: entre una cosa y la otra puede
	// llegar un cambio de tema, y quien no está anotado no se entera.
	const id = anotar(async () => {
		await resolver();
	});

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
		olvidar(id);
		devolverElOyente();
	});

	watch([nombre, tipo], resolver);

	// El cambio de tema ya **no** se mira acá: lo reparte el planificador, que
	// decide en qué orden y de a cuántos. Mirar `version` además haría las dos
	// cosas a la vez, que es lo que se está tratando de evitar.
	return { fuente, mirarElemento: (elemento: HTMLElement | null) => mirarElemento(id, elemento) };
}
