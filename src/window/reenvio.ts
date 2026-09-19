import { getCurrentInstance } from 'vue';

/**
 * Los manejadores que hay que pasarle al componente de abajo, y sólo ésos.
 *
 * `WindowControls` decide qué hace cada botón mirando si alguien escucha el
 * evento: sin oyente cierra la ventana, con oyente emite y no la toca. Eso sólo
 * funciona si la cadena de arriba —`WindowFrame` → `AppBar` → `WindowControls`—
 * reenvía los eventos que de verdad le llegaron y no los tres siempre.
 *
 * Escribir `@close="emit('close')"` fijo en el marco hace que el botón vea un
 * oyente puesto aunque la aplicación no haya escuchado nada, y entonces ninguna
 * ventana se cierra nunca: el clic emite hacia arriba y se pierde. Pasó, y no da
 * ningún error.
 *
 * Se mira el `vnode` y no `useAttrs()` porque un evento declarado en `emits` no
 * aparece en los atributos: Vue lo saca de ahí justamente por estar declarado.
 *
 * Se llama desde la plantilla (`v-on="reenviarSiEscuchan([...])"`) para que se
 * evalúe en cada dibujado: el `vnode` se reemplaza y un `computed` sin
 * dependencias reactivas se quedaría con los oyentes del primero.
 */
export function reenviarSiEscuchan(eventos: string[]): Record<string, () => void> {
	const instancia = getCurrentInstance();
	const manejadores: Record<string, () => void> = {};
	for (const evento of eventos) {
		const nombre = `on${evento[0].toUpperCase()}${evento.slice(1)}`;
		if (instancia?.vnode.props?.[nombre]) {
			manejadores[evento] = () => instancia.emit(evento);
		}
	}
	return manejadores;
}
