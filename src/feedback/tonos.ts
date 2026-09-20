/**
 * Los cuatro tonos con los que el sistema avisa algo.
 *
 * Son los mismos para el aviso en línea y para el transitorio: que un error se
 * vea igual esté donde esté es la mitad del punto de tener esto en la librería.
 *
 * `info` no usa un token `status-*` porque no existe —el sistema tiene
 * `status-success`, `status-warning` y `status-error`, y nada más—: va con el
 * borde y la superficie de siempre, que es lo que ya hacía vasak-settings.
 */

export type TonoDelAviso = 'info' | 'success' | 'warning' | 'error';

export const CLASES_POR_TONO: Record<TonoDelAviso, string> = {
	info: 'border-ui-border bg-ui-surface/70 text-tx-main',
	success: 'border-status-success/40 bg-status-success/10 text-tx-main',
	warning: 'border-status-warning/40 bg-status-warning/10 text-tx-main',
	error: 'border-status-error/40 bg-status-error/10 text-tx-main',
};

/**
 * Cómo lo anuncia un lector de pantalla.
 *
 * Un error lleva `alert`, que **interrumpe** lo que se esté leyendo, porque
 * algo salió mal y conviene enterarse ahora. Los demás llevan `status`, que
 * espera su turno para no cortar a la mitad. El criterio es de vasak-gallery,
 * que fue la única de las seis copias que se lo planteó.
 */
export function rolDelTono(tono: TonoDelAviso): 'alert' | 'status' {
	return tono === 'error' ? 'alert' : 'status';
}
