/**
 * Los dobles de lo que sólo existe adentro de una ventana de Tauri.
 *
 * Una prueba montada corre en `happy-dom`: no hay backend que resuelva un icono
 * ni quien emita el cambio de tema. Sin esto, importar la barra falla en la
 * primera línea.
 *
 * No son mudos: dejan contestar tarde. Las dos carreras que el botón tiene que
 * aguantar —una resolución vieja que llega última, y un registro de oyente que
 * termina después de que el componente se fue— sólo se pueden comprobar
 * decidiendo desde la prueba cuándo contesta cada cosa.
 */

const temaDeIconos = new Map<string, string | (() => Promise<string>)>();
const oyentes = new Map<string, Set<() => unknown>>();

/** Lo que deja colgado al próximo `listen`, si la prueba lo pidió. */
let esperaDelRegistro: Promise<void> | null = null;

/**
 * Cómo vaciar la memoria del módulo de iconos.
 *
 * Se recibe de afuera en vez de importarlo acá arriba: importar un módulo que
 * importa Vue **antes** de que `preparar.ts` registre el DOM deja a
 * `@vue/runtime-dom` con `document` en nulo para toda la corrida, y ahí no monta
 * ni un componente. Lo pone `preparar.ts`, después de registrarlo.
 */
let olvidarLosIconos: (() => void) | null = null;

export function asiSeOlvidanLosIconos(como: () => void) {
	olvidarLosIconos = como;
}

/**
 * Pone un nombre en el tema de iconos.
 *
 * Se puede pasar una función para quedarse con el control de cuándo contesta.
 */
export function ponerEnElTema(nombre: string, fuente: string | (() => Promise<string>)) {
	temaDeIconos.set(nombre, fuente);
}

/**
 * Lo que el tema no tiene vuelve como cadena vacía, no como error.
 *
 * Es lo que hace el complemento de verdad: atrapa lo suyo, lo escribe en la
 * consola y devuelve `''`.
 */
export async function getIconSource(nombre: string) {
	const puesto = temaDeIconos.get(nombre) ?? '';
	return typeof puesto === 'function' ? await puesto() : puesto;
}

/**
 * La variante simbólica sale del mismo tema.
 *
 * Devolvía siempre cadena vacía, así que todo lo que pide un símbolo —el botón
 * de plegar, la flecha de los grupos— no dibujaba nada y ninguna prueba se
 * enteraba.
 */
export async function getSymbolSource(nombre: string) {
	return await getIconSource(nombre);
}

/** Deja el próximo `listen` colgado. Lo que devuelve lo suelta. */
export function demorarElProximoRegistro() {
	let soltar = () => {};
	esperaDelRegistro = new Promise<void>((listo) => {
		soltar = listo;
	});
	return soltar;
}

export async function listen(nombre: string, manejador: () => unknown) {
	if (esperaDelRegistro) {
		const espera = esperaDelRegistro;
		esperaDelRegistro = null;
		await espera;
	}
	const suyos = oyentes.get(nombre) ?? new Set<() => unknown>();
	suyos.add(manejador);
	oyentes.set(nombre, suyos);
	return () => {
		suyos.delete(manejador);
	};
}

/** Cuántos oyentes quedaron puestos. */
export function cuantosOyentes(nombre: string) {
	return oyentes.get(nombre)?.size ?? 0;
}

/**
 * Emite un evento del escritorio y espera a que lo atiendan.
 *
 * Se recorre una copia y no el conjunto: un manejador puede soltarse a sí mismo
 * mientras se lo atiende —es justo lo que hace el botón al desmontarse— y
 * modificar el conjunto durante su propio recorrido se saltea al siguiente.
 */
export async function emitir(nombre: string) {
	for (const manejador of [...(oyentes.get(nombre) ?? [])]) {
		await manejador();
	}
}

/** Deja los dobles como recién puestos. Va en el `beforeEach` de cada prueba. */
export function olvidarTodo() {
	temaDeIconos.clear();
	oyentes.clear();
	esperaDelRegistro = null;
	laVentanaRecibio.length = 0;
	// Y lo que el módulo de iconos guarda de su lado. Su memoria y su cuenta de
	// suscriptores viven en el módulo, y el módulo se comparte entre archivos de
	// prueba: sin esto, una prueba arranca con los suscriptores que dejó otra y
	// cuenta un oyente que acá arriba se acaba de borrar.
	olvidarLosIconos?.();
}

/**
 * Lo que la ventana de Tauri recibió.
 *
 * `getCurrentWindow()` fuera de Tauri lanza, así que sin este doble la única
 * forma de probar los botones de la ventana es no apretarlos. Y lo que hay que
 * comprobar es justo eso: que sin nadie escuchando el botón **sí** cierra.
 */
export const laVentanaRecibio: string[] = [];

export function getCurrentWindow() {
	return {
		minimize: async () => void laVentanaRecibio.push('minimize'),
		toggleMaximize: async () => void laVentanaRecibio.push('toggleMaximize'),
		close: async () => void laVentanaRecibio.push('close'),
	};
}

/** Cuántas veces se le pidió cerrar a la ventana. */
export function cerrosDeVentana() {
	return laVentanaRecibio.filter((que) => que === 'close').length;
}

/**
 * El catálogo de traducciones, que en una ventana de verdad llena el plugin.
 *
 * `t()` devuelve la clave cruda cuando no la encuentra, y eso es parte del
 * contrato: una aplicación que deje de pasar la etiqueta sin haber puesto la
 * clave lo ve en el tooltip. Para poder comprobar las dos caras, la prueba
 * decide qué hay en el catálogo.
 */
const catalogo = new Map<string, string>();

export function traducir(clave: string, texto: string) {
	catalogo.set(clave, texto);
}

export function vaciarElCatalogo() {
	catalogo.clear();
}

export function useI18n() {
	return { t: (clave: string) => catalogo.get(clave) ?? clave };
}
