/**
 * Lo que comparten las tres piezas del reproductor.
 *
 * El estado viene en tres valores y no en un booleano porque «pausado» y «sin
 * nada sonando» se dibujan distinto: el disco en pausa se queda donde estaba, y
 * sin reproducción no gira ni guarda ningún ángulo. Con `isPlaying` a secas las
 * dos cosas eran la misma, y el disco saltaba a cero cada vez que se pausaba.
 */
export type PlaybackState = 'playing' | 'paused' | 'stopped';

/**
 * Una duración en segundos, como la lee alguien: `3:07`, `1:02:45`.
 *
 * Lo que no es un número finito o es negativo se muestra como `0:00`: una
 * radio en vivo no tiene duración, y un `NaN:NaN` en la barra es peor que un
 * cero. Quien cuenta en otra unidad —MPRIS usa microsegundos— pasa su propio
 * formato a la barra.
 */
export function formatPlaybackTime(seconds: number): string {
	const total = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
	const hours = Math.floor(total / 3600);
	const minutes = Math.floor((total % 3600) / 60);
	const rest = String(total % 60).padStart(2, '0');

	if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${rest}`;
	return `${minutes}:${rest}`;
}

/** Cuánto de la barra está recorrido, entre 0 y 1. */
export function playedRatio(position: number, duration: number): number {
	if (!(duration > 0) || !Number.isFinite(position)) return 0;
	return Math.min(1, Math.max(0, position / duration));
}
