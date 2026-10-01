<script lang="ts">
/**
 * Contra qué se ubica el globo, cuando no es el disparador.
 *
 * Lo sabía el gestor de archivos: el selector de etiquetas se abre desde el
 * menú contextual —que ya se cerró— pero cuelga de la fila. Sin ancla, el
 * globo se ubica contra el disparador.
 *
 * Con `as-child` marca al hijo sin envolverlo; sin él envuelve en un `div`.
 */
import { cloneVNode, defineComponent, h, onBeforeUnmount, ref } from 'vue';
import { elementOf, onlyChild } from '../shared/as-child';
import { usePopover } from './types';

export default defineComponent({
	name: 'PopoverAnchor',
	inheritAttrs: false,
	props: {
		asChild: { type: Boolean, default: false },
	},
	setup(props, { slots, attrs }) {
		const popover = usePopover();
		const own = ref<unknown>(null);

		onBeforeUnmount(() => popover.setAnchor(null));

		return () => {
			const shared = {
				ref: (value: unknown) => {
					own.value = value;
					popover.setAnchor(elementOf(value));
				},
			};
			const children = slots.default?.() ?? [];
			if (props.asChild) {
				const child = onlyChild(children);
				if (child) return cloneVNode(child, { ...attrs, ...shared });
			}
			return h('div', { ...attrs, ...shared }, children);
		};
	},
});
</script>
