<script lang="ts">
/**
 * Lo que abre el globo.
 *
 * Como `DropdownMenuTrigger`: con `as-child` no dibuja nada y le pone al hijo
 * los atributos y el clic; sin él envuelve en un `div`. `aria-haspopup` es
 * `dialog` —lo que se abre no es un menú— y `aria-expanded` dice si está
 * abierto.
 */
import { cloneVNode, defineComponent, h, ref } from 'vue';
import { elementOf, onlyChild } from '../shared/as-child';
import { usePopover } from './types';

export default defineComponent({
	name: 'PopoverTrigger',
	inheritAttrs: false,
	props: {
		asChild: { type: Boolean, default: false },
		disabled: { type: Boolean, default: false },
	},
	setup(props, { slots, attrs }) {
		const popover = usePopover();
		const own = ref<unknown>(null);

		function register() {
			popover.setTrigger(elementOf(own.value));
		}

		function onClick() {
			if (props.disabled) return;
			register();
			popover.toggle();
		}

		return () => {
			const shared: Record<string, unknown> = {
				ref: (value: unknown) => {
					own.value = value;
					register();
				},
				'aria-haspopup': 'dialog',
				'aria-expanded': popover.open.value ? 'true' : 'false',
				'aria-controls': popover.open.value ? popover.contentId : undefined,
				onClick,
			};
			const children = slots.default?.() ?? [];
			if (props.asChild) {
				const child = onlyChild(children);
				if (child) return cloneVNode(child, { ...attrs, ...shared });
			}
			return h('div', { ...attrs, class: ['inline-block', attrs.class], ...shared }, children);
		};
	},
});
</script>
