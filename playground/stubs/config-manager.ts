/**
 * El banco no lee `vasak.conf`: se queda con lo que declara su hoja.
 *
 * Salvo las preferencias de ventana, que se pueden probar por la dirección:
 * `?controlsStyle=macos&controlsOrder=reversed`.
 */
export async function readConfig() {
	const params = new URLSearchParams(globalThis.location?.search ?? '');
	const controlsStyle = params.get('controlsStyle');
	const controlsOrder = params.get('controlsOrder');
	if (!controlsStyle && !controlsOrder) return null;
	return { window: { controlsStyle, controlsOrder } };
}
