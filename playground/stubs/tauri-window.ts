/** Una ventana que no hace nada: los botones del marco se pueden apretar. */
export function getCurrentWindow() {
	const noop = async () => {};
	return {
		minimize: noop,
		toggleMaximize: noop,
		close: noop,
		isMaximized: async () => false,
		onResized: async () => () => {},
		startDragging: noop,
	};
}
