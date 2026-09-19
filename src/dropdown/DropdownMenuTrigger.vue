<script lang="ts">
/**
 * Lo que abre el menú.
 *
 * # Por qué es una función de render y no una plantilla
 *
 * `aria-haspopup` y `aria-expanded` tienen que ir **en el botón**, que es lo
 * que el lector de pantalla anuncia y lo que recibe el foco. Envolverlo en un
 * `div` y ponérselos al `div` no sirve de nada: quien tabula llega al botón y
 * oye «botón», sin que haya un menú ni un estado abierto por ningún lado.
 *
 * Con `as-child` el disparador no dibuja nada suyo: clona el hijo que le
 * pasaron y le agrega los atributos y los manejadores. Sin `as-child` sí
 * envuelve, que es lo que necesita un menú contextual anclado a un punto.
 *
 * # El teclado y el clic sintético
 *
 * Enter y Espacio se atienden en `keydown` y con `preventDefault`. Sobre un
 * `<button>` de verdad el navegador **también** dispara un clic por esas dos
 * teclas: sin cortarlo, el menú se abriría con la tecla y se cerraría con el
 * clic que viene detrás, y desde afuera parece que la tecla no hace nada.
 */
import { cloneVNode, Comment, defineComponent, Fragment, h, ref, Text, type VNode } from 'vue';
import { usarElMenu } from './tipos';

/** El único hijo de verdad, saltando comentarios, huecos y fragmentos. */
function unicoHijo(hijos: VNode[]): VNode | null {
	const reales = hijos.filter(
		(nodo) =>
			nodo.type !== Comment &&
			!(nodo.type === Text && typeof nodo.children === 'string' && !nodo.children.trim())
	);
	if (reales.length !== 1) return null;

	const uno = reales[0] as VNode;
	if (uno.type === Fragment && Array.isArray(uno.children)) {
		return unicoHijo(uno.children as VNode[]);
	}
	return uno;
}

/**
 * El elemento del DOM detrás de una referencia.
 *
 * Con `as-child` el hijo puede ser otro componente —un disparador de tooltip,
 * por ejemplo—, y ahí la referencia es su instancia y no un elemento. El menú
 * necesita el elemento: es lo que mide para ubicarse.
 */
function elementoDe(valor: unknown): HTMLElement | null {
	if (valor instanceof HTMLElement) return valor;
	const raiz = (valor as { $el?: unknown } | null)?.$el;
	return raiz instanceof HTMLElement ? raiz : null;
}

export default defineComponent({
	name: 'DropdownMenuTrigger',
	inheritAttrs: false,
	props: {
		/** Sin envoltorio: los atributos van sobre el hijo que se le pasó. */
		asChild: { type: Boolean, default: false },
		/** El disparador no abre nada; lo abre la aplicación por su cuenta. */
		disabled: { type: Boolean, default: false },
	},
	setup(props, { slots, attrs }) {
		const menu = usarElMenu();
		const propia = ref<unknown>(null);

		function anotarse() {
			menu.ponerElDisparador(elementoDe(propia.value));
		}

		function alHacerClic() {
			if (props.disabled) return;
			anotarse();
			menu.alternar();
		}

		function alTeclear(evento: KeyboardEvent) {
			if (props.disabled) return;

			switch (evento.key) {
				case 'Enter':
				case ' ':
					evento.preventDefault();
					anotarse();
					menu.alternar('primero');
					break;
				case 'ArrowDown':
					evento.preventDefault();
					anotarse();
					menu.abrir('primero');
					break;
				case 'ArrowUp':
					evento.preventDefault();
					anotarse();
					menu.abrir('ultimo');
					break;
				case 'Escape':
					if (menu.abierto.value) {
						evento.preventDefault();
						menu.cerrar({ devolverElFoco: true });
					}
					break;
			}
		}

		return () => {
			const comunes: Record<string, unknown> = {
				ref: (valor: unknown) => {
					propia.value = valor;
					anotarse();
				},
				'aria-haspopup': 'menu',
				'aria-expanded': menu.abierto.value ? 'true' : 'false',
				// Sólo cuando hay algo que controlar: `aria-controls` apuntando
				// a un elemento que el lector no expone —el menú cerrado está
				// `inert`— es una referencia rota.
				'aria-controls': menu.abierto.value ? menu.idDelMenu : undefined,
				onClick: alHacerClic,
				onKeydown: alTeclear,
			};

			const hijos = slots.default?.() ?? [];

			if (props.asChild) {
				const hijo = unicoHijo(hijos);
				if (hijo) return cloneVNode(hijo, { ...attrs, ...comunes });
			}

			return h(
				'div',
				{ ...attrs, class: ['dropdown-menu-trigger inline-block', attrs.class], ...comunes },
				hijos
			);
		};
	},
});
</script>
