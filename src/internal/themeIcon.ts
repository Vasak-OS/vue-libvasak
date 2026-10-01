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
 *
 * Hasta la 2.1.0 era `src/internos/iconoDelTema.ts`, con los identificadores
 * en castellano. Pasó al inglés en la 2.2.0 al sumarle los respaldos; los dos
 * nombres que salen del paquete (`olvidarLosIconosDelTema`,
 * `usarLaVersionDelTema`) siguen como alias obsoletos en `index.ts`.
 */

const THEME_EVENT = 'vicons:theme-changed';

/** Lo ya resuelto, por `tipo:nombre`. */
const cache = new Map<string, string>();
/** Los pedidos que todavía no volvieron, para no pedir dos veces lo mismo. */
const inFlight = new Map<string, Promise<string>>();

/**
 * Sube con cada cambio de tema.
 *
 * Es lo que hace que todas las instancias vuelvan a resolver sin que el oyente
 * tenga que conocerlas: cada una lo mira.
 */
const version = ref(0);

let subscribers = 0;
let releaseListener: UnlistenFn | null = null;
let registering: Promise<void> | null = null;

/**
 * Deja el módulo como recién cargado.
 *
 * Sólo para las pruebas: el estado vive en el módulo y el módulo se comparte
 * entre archivos de prueba, así que sin esto una prueba ve los suscriptores que
 * dejó otra y cuenta oyentes que ya no existen.
 */
export function forgetThemeIcons() {
	cache.clear();
	inFlight.clear();
	subscribers = 0;
	releaseListener = null;
	registering = null;
	version.value = 0;
	registered.clear();
	onScreen.clear();
	nextId = 0;
	// El vigía también: se queda mirando elementos de componentes que ya no
	// existen, y en las pruebas eso lo hereda el archivo siguiente.
	observer?.disconnect();
	observer = null;
	observerTried = false;
	if (pending !== null) {
		clearTimeout(pending);
		pending = null;
	}
	if (currentCycle) currentCycle.cancelled = true;
	currentCycle = null;
}

// ── El planificador de la recarga ──────────────────────────────────────────

/** Cuánto se espera antes de empezar, para que varios avisos sean uno. */
const DEBOUNCE_MS = 100;
/** Cuántos iconos se resuelven juntos. */
const BATCH_SIZE = 10;
/** Un cuadro a 60 Hz: lo que se le deja al hilo entre tanda y tanda. */
const BETWEEN_BATCHES_MS = 16;

type Reload = () => Promise<void>;

/** Cada instancia registrada, con el elemento que dibuja si lo tiene. */
const registered = new Map<number, { reload: Reload; element: HTMLElement | null }>();
const onScreen = new Set<number>();
let nextId = 0;

/**
 * Quién está en pantalla.
 *
 * Se crea a la primera, y no al cargar el módulo, porque en una prueba con el
 * DOM puesto después del import no existiría. Donde no haya
 * `IntersectionObserver` —una prueba sin DOM— se sigue sin él: todas cuentan
 * como visibles, que es el orden de antes y no rompe nada.
 */
let observer: IntersectionObserver | null = null;
let observerTried = false;

function getObserver(): IntersectionObserver | null {
	if (observerTried) {
		return observer;
	}
	observerTried = true;
	if (typeof IntersectionObserver === 'undefined') {
		return null;
	}
	observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				const which = (entry.target as HTMLElement).dataset?.iconId;
				if (which == null) continue;
				const id = Number.parseInt(which, 10);
				if (entry.isIntersecting) onScreen.add(id);
				else onScreen.delete(id);
			}
		},
		{ threshold: 0 }
	);
	return observer;
}

function register(reload: Reload): number {
	const id = nextId++;
	registered.set(id, { reload, element: null });
	// Hasta que el vigía diga lo contrario, cuenta como visible: si no, lo que
	// se acaba de montar se recargaría último, que es justo al revés.
	onScreen.add(id);
	return id;
}

/**
 * Le dice al vigía qué elemento mirar.
 *
 * Va aparte de `anotar` porque el elemento no existe cuando se registra: en
 * `setup` todavía no hay DOM. Quien lo tenga lo pasa al montar.
 */
function watchElement(id: number, element: HTMLElement | null) {
	const entry = registered.get(id);
	if (!entry || entry.element === element) return;

	// Se suelta el anterior **antes** de tomar el nuevo. `ThemeIcon` cambia el
	// `span` del hueco por el `img` cuando el icono resuelve, así que esto corre
	// dos veces con elementos distintos: sin soltar, los dos quedan vigilados
	// con el mismo identificador, y un aviso tardío del viejo —que ya no está en
	// el documento, o sea nunca visible— saca de «en pantalla» a un icono que sí
	// lo está. Ahí se recargaría último, que es justo al revés.
	if (entry.element) {
		observer?.unobserve(entry.element);
		delete entry.element.dataset.iconId;
		entry.element = null;
	}

	if (!element) return;
	const eye = getObserver();
	if (!eye) return;
	entry.element = element;
	element.dataset.iconId = String(id);
	eye.observe(element);
}

function unregister(id: number) {
	const entry = registered.get(id);
	if (entry?.element) {
		observer?.unobserve(entry.element);
		delete entry.element.dataset.iconId;
	}
	onScreen.delete(id);
	registered.delete(id);
}

let pending: ReturnType<typeof setTimeout> | null = null;
/** El ciclo en curso. Se compara por identidad para saber si sigue siendo el suyo. */
let currentCycle: { cancelled: boolean } | null = null;

function sleep(ms: number) {
	return new Promise((done) => setTimeout(done, ms));
}

async function runCycle(cycle: { cancelled: boolean }) {
	// Se saca una foto: lo que se desmonte a mitad desaparece del mapa y se
	// saltea al buscarlo.
	const all = [...registered.keys()];
	const visible = all.filter((id) => onScreen.has(id));
	const hidden = all.filter((id) => !onScreen.has(id));

	for (const group of [visible, hidden]) {
		for (let start = 0; start < group.length; start += BATCH_SIZE) {
			if (cycle.cancelled) return;
			const batch = group.slice(start, start + BATCH_SIZE);
			await Promise.allSettled(
				batch.map((id) => registered.get(id)?.reload() ?? Promise.resolve())
			);
			if (cycle.cancelled) return;
			if (start + BATCH_SIZE < group.length || group === visible) {
				await sleep(BETWEEN_BATCHES_MS);
			}
		}
	}

	if (currentCycle === cycle) currentCycle = null;
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
export function countRegisteredIcons(): number {
	return registered.size;
}

/**
 * Empieza de nuevo, cancelando lo que hubiera a medio hacer.
 *
 * Exportado para las pruebas: sin esto habría que esperar los 100 ms de rebote
 * en cada una, y una prueba que duerme es una prueba que a veces falla sola.
 */
export function reloadIconsNow() {
	if (pending !== null) {
		clearTimeout(pending);
		pending = null;
	}
	if (currentCycle) currentCycle.cancelled = true;
	const cycle = { cancelled: false };
	currentCycle = cycle;
	void runCycle(cycle);
}

function onThemeChanged() {
	// Lo resuelto ya no vale, y lo que esté en vuelo tampoco: se pidió contra el
	// tema anterior. Se vacía en el acto y no al empezar el ciclo, para que nadie
	// que resuelva mientras tanto se lleve un valor del tema viejo.
	cache.clear();
	inFlight.clear();
	// Los que resuelven por su cuenta con `useThemeVersion()` no pasan por
	// el planificador: son pocos y saben lo que hacen.
	version.value++;

	if (pending !== null) clearTimeout(pending);
	pending = setTimeout(() => {
		pending = null;
		reloadIconsNow();
	}, DEBOUNCE_MS);
}

/**
 * Registra el oyente si es el primero, y devuelve cuándo está puesto.
 *
 * El primero espera a que esté; los demás siguen de largo. Eso conserva lo que
 * el oyente por instancia garantizaba —que un cambio de tema durante la primera
 * resolución no se pierda— sin pagar el registro una vez por fila.
 */
function takeListener(): Promise<void> {
	subscribers++;

	if (releaseListener || registering) {
		return registering ?? Promise.resolve();
	}

	registering = listen(THEME_EVENT, onThemeChanged).then((release) => {
		// Registrarse tarda, y quien lo pidió puede haberse ido mientras tanto:
		// ahí `onUnmounted` ya pasó y no vio nada que soltar, así que el oyente
		// quedaba puesto para siempre.
		if (subscribers <= 0) {
			release();
		} else {
			releaseListener = release;
		}
		registering = null;
	});

	return registering;
}

function returnListener() {
	subscribers--;
	if (subscribers > 0) {
		return;
	}

	subscribers = 0;
	releaseListener?.();
	releaseListener = null;
}

/**
 * El icono resuelto, de la memoria o del backend.
 *
 * `version` entra en la clave del pedido en vuelo para que una respuesta pedida
 * contra el tema anterior no se memorice como si fuera del nuevo.
 */
function resolveShared(name: string, type: 'icon' | 'symbol'): Promise<string> {
	const key = `${type}:${name}`;

	const saved = cache.get(key);
	if (saved !== undefined) {
		return Promise.resolve(saved);
	}

	const request = inFlight.get(key);
	if (request) {
		return request;
	}

	const atVersion = version.value;
	const fresh = (type === 'symbol' ? getSymbolSource(name) : getIconSource(name))
		.then((source) => {
			// Si el tema cambió mientras tanto, esto es del tema viejo: se
			// devuelve a quien lo pidió —que ya va a volver a resolver— pero no
			// se guarda.
			if (version.value === atVersion) {
				cache.set(key, source);
			}
			return source;
		})
		.finally(() => {
			if (inFlight.get(key) === fresh) {
				inFlight.delete(key);
			}
		});

	inFlight.set(key, fresh);
	return fresh;
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
 * const version = useThemeVersion();
 * watch([loQueSea, version], resolver, { immediate: true });
 * ```
 */
export function useThemeVersion(): Readonly<Ref<number>> {
	let unmounted = false;

	onMounted(async () => {
		await takeListener();
		// Registrarse tarda: si el componente ya se fue, se devuelve en el acto
		// en vez de dejar la cuenta subida para siempre.
		if (unmounted) {
			returnListener();
		}
	});

	onUnmounted(() => {
		if (!unmounted) {
			unmounted = true;
			returnListener();
		}
	});

	return readonly(version);
}

/**
 * El icono de un nombre del tema, o del primero de una lista que el tema tenga.
 *
 * `names` es la lista de candidatos en orden: el nombre pedido y sus
 * respaldos. Los temas no se ponen de acuerdo —el `Icon=` de un `.desktop`, el
 * identificador de AppStream, el nombre del paquete—, así que quien tiene más
 * de un nombre posible los pasa todos y se queda con el primero que resuelva.
 * Cada candidato pasa por la misma memoria compartida: probar tres nombres en
 * diez filas iguales son tres pedidos, no treinta.
 *
 * `name` sigue aceptando un nombre suelto, que es lo que usaba la 2.1.0.
 */
export function useThemeIcon(names: Ref<string> | Ref<readonly string[]>, type: Ref<'icon' | 'symbol'>) {
	const source = ref('');
	let unmounted = false;
	let lastRequest = 0;
	// Se anota en el `setup` y no al montar: entre una cosa y la otra puede
	// llegar un cambio de tema, y quien no está anotado no se entera.
	const id = register(async () => {
		await resolve();
	});

	/** Los candidatos sin vacíos ni repetidos, en el orden en que llegaron. */
	function candidates(): string[] {
		const value = names.value;
		const list = typeof value === 'string' ? [value] : [...value];
		return [...new Set(list.filter(Boolean))];
	}

	async function resolve() {
		const mine = ++lastRequest;
		const list = candidates();

		if (!list.length) {
			source.value = '';
			return;
		}

		let resolved = '';
		for (const candidate of list) {
			resolved = await resolveShared(candidate, type.value);
			// Un pedido más nuevo ya está en camino: éste no decide nada.
			if (mine !== lastRequest || unmounted) return;
			if (resolved) break;
		}

		source.value = resolved;
	}

	onMounted(async () => {
		await takeListener();
		if (!unmounted) {
			await resolve();
		}
	});

	onUnmounted(() => {
		unmounted = true;
		unregister(id);
		returnListener();
	});

	// `deep` porque la lista puede llegar como el mismo arreglo con otro
	// contenido; con un nombre suelto no cambia nada.
	watch([names, type], resolve, { deep: true });

	// El cambio de tema ya **no** se mira acá: lo reparte el planificador, que
	// decide en qué orden y de a cuántos. Mirar `version` además haría las dos
	// cosas a la vez, que es lo que se está tratando de evitar.
	return { source, watchElement: (element: HTMLElement | null) => watchElement(id, element) };
}
