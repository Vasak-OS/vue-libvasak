/**
 * Lo que `strictTemplates` no sabe de los atributos `data-*`.
 *
 * Con `vueCompilerOptions.strictTemplates`, `vue-tsc` comprueba que cada
 * atributo de una plantilla exista: en un componente, que sea una propiedad
 * declarada; en un elemento, que esté en el tipo de ese elemento. Es lo que
 * hace que un `:size` sobre un `<img>` o un `@click` sobre un componente que no
 * lo emite dejen de pasar en silencio.
 *
 * Los `data-*` son la excepción legítima: HTML los permite todos, y acá se usan
 * para marcar nodos que después se buscan con `closest()` o `querySelector()`
 * —la zona de arrastre de la ventana, el contenido de un desplegable—. Sin
 * esto, `strictTemplates` los rechaza uno por uno.
 *
 * Se declara el patrón, no cada nombre: una lista de nombres queda vieja en
 * cuanto alguien marca un nodo nuevo, y lo que se quiere permitir es la forma.
 */
declare module 'vue' {
	interface HTMLAttributes {
		[atributo: `data-${string}`]: unknown;
	}
}

export {};
