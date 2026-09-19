/**
 * Los dobles de lo que sólo existe adentro de una ventana de Tauri.
 *
 * Una prueba montada corre en `happy-dom`: no hay backend que resuelva un
 * icono ni quien emita el cambio de tema. Sin esto, importar la barra falla en
 * la primera línea.
 */

const temaDeIconos = new Map<string, string>();
const oyentes = new Map<string, Set<() => unknown>>();

/** Pone un nombre en el tema de iconos. */
export function ponerEnElTema(nombre: string, fuente: string) {
	temaDeIconos.set(nombre, fuente);
}

/**
 * Lo que el tema no tiene vuelve como cadena vacía, no como error.
 *
 * Es lo que hace el complemento de verdad: atrapa lo suyo, lo escribe en la
 * consola y devuelve `''`.
 */
export async function getIconSource(nombre: string) {
	return temaDeIconos.get(nombre) ?? '';
}

export async function getSymbolSource(_nombre: string) {
	return '';
}

export async function listen(nombre: string, manejador: () => unknown) {
	const suyos = oyentes.get(nombre) ?? new Set();
	suyos.add(manejador);
	oyentes.set(nombre, suyos);
	return () => {
		suyos.delete(manejador);
	};
}

/** Emite un evento del escritorio y espera a que lo atiendan. */
export async function emitir(nombre: string) {
	for (const manejador of [...(oyentes.get(nombre) ?? [])]) {
		await manejador();
	}
}

/** Deja los dobles como recién puestos. Va en el `beforeEach` de cada prueba. */
export function olvidarTodo() {
	temaDeIconos.clear();
	oyentes.clear();
}
