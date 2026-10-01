/**
 * Los cuatro tonos con los que el sistema avisa algo.
 *
 * Son los mismos para el aviso en línea y para el transitorio: que un error se
 * vea igual esté donde esté es la mitad del punto de tener esto en la librería.
 *
 * `info` no usa un token `status-*` porque no existe —el sistema tiene
 * `status-success`, `status-warning` y `status-error`, y nada más—: va con el
 * canto fino y la superficie de las tarjetas.
 *
 * La forma es la de Once UI (vue-libvasak#74): el canto del tono al 30 % y el
 * relleno al 8 %, con el texto de siempre. Hasta la 1.x los nombres estaban en
 * castellano (`TonoDelAviso`, `CLASES_POR_TONO`, `rolDelTono`); siguen saliendo
 * como alias obsoletos desde `index.ts`.
 */

export type NoticeTone = 'info' | 'success' | 'warning' | 'error';

/** El aviso en línea: canto, relleno y texto. */
export const TONE_CLASSES: Record<NoticeTone, string> = {
	info: 'border-ui-line bg-ui-surface/70 text-tx-main',
	success: 'border-status-success/30 bg-status-success/8 text-tx-main',
	warning: 'border-status-warning/30 bg-status-warning/8 text-tx-main',
	error: 'border-status-error/30 bg-status-error/8 text-tx-main',
};

/**
 * El aviso transitorio, que flota: la superficie flotante opaca con el tinte
 * del tono **encima**, como imagen de fondo. Un relleno translúcido a secas
 * dejaría ver lo de atrás, y desenfocarlo no se hace (decisión 3).
 */
export const TOAST_TONE_CLASSES: Record<NoticeTone, string> = {
	info: 'border-ui-line',
	success: 'border-status-success/30 bg-linear-to-r from-status-success/8 to-status-success/8',
	warning: 'border-status-warning/30 bg-linear-to-r from-status-warning/8 to-status-warning/8',
	error: 'border-status-error/30 bg-linear-to-r from-status-error/8 to-status-error/8',
};

/**
 * Cómo lo anuncia un lector de pantalla.
 *
 * Un error lleva `alert`, que **interrumpe** lo que se esté leyendo, porque
 * algo salió mal y conviene enterarse ahora. Los demás llevan `status`, que
 * espera su turno para no cortar a la mitad. El criterio es de vasak-gallery,
 * que fue la única de las seis copias que se lo planteó.
 */
export function toneRole(tone: NoticeTone): 'alert' | 'status' {
	return tone === 'error' ? 'alert' : 'status';
}
