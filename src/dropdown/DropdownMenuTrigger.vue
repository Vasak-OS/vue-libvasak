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
import { useMenu } from './types';

/** El único hijo de verdad, saltando comentarios, huecos y fragmentos. */
function onlyChild(children: VNode[]): VNode | null {
	const real = children.filter(
		(node) =>
			node.type !== Comment &&
			!(node.type === Text && typeof node.children === 'string' && !node.children.trim())
	);
	if (real.length !== 1) return null;

	const one = real[0] as VNode;
	if (one.type === Fragment && Array.isArray(one.children)) {
		return onlyChild(one.children as VNode[]);
	}
	return one;
}

/**
 * El elemento del DOM detrás de una referencia.
 *
 * Con `as-child` el hijo puede ser otro componente —un disparador de tooltip,
 * por ejemplo—, y ahí la referencia es su instancia y no un elemento. El menú
 * necesita el elemento: es lo que mide para ubicarse.
 */
function elementOf(value: unknown): HTMLElement | null {
	if (value instanceof HTMLElement) return value;
	const root = (value as { $el?: unknown } | null)?.$el;
	return root instanceof HTMLElement ? root : null;
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
		const menu = useMenu();
		const own = ref<unknown>(null);

		function register() {
			menu.setTrigger(elementOf(own.value));
		}

		function onClick() {
			if (props.disabled) return;
			register();
			menu.toggle();
		}

		function onKeydown(event: KeyboardEvent) {
			if (props.disabled) return;

			switch (event.key) {
				case 'Enter':
				case ' ':
					event.preventDefault();
					register();
					menu.toggle('first');
					break;
				case 'ArrowDown':
					event.preventDefault();
					register();
					menu.show('first');
					break;
				case 'ArrowUp':
					event.preventDefault();
					register();
					menu.show('last');
					break;
				case 'Escape':
					if (menu.open.value) {
						event.preventDefault();
						menu.close({ returnFocus: true });
					}
					break;
			}
		}

		return () => {
			const shared: Record<string, unknown> = {
				ref: (value: unknown) => {
					own.value = value;
					register();
				},
				'aria-haspopup': 'menu',
				'aria-expanded': menu.open.value ? 'true' : 'false',
				// Sólo cuando hay algo que controlar: `aria-controls` apuntando
				// a un elemento que el lector no expone —el menú cerrado está
				// `inert`— es una referencia rota.
				'aria-controls': menu.open.value ? menu.menuId : undefined,
				onClick,
				onKeydown,
			};

			const children = slots.default?.() ?? [];

			if (props.asChild) {
				const child = onlyChild(children);
				if (child) return cloneVNode(child, { ...attrs, ...shared });
			}

			return h(
				'div',
				{ ...attrs, class: ['dropdown-menu-trigger inline-block', attrs.class], ...shared },
				children
			);
		};
	},
});
</script>
