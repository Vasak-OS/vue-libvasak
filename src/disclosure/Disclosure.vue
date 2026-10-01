<script setup lang="ts">
/**
 * Algo que se despliega: «Opciones avanzadas», un grupo de notificaciones, los
 * detalles de un proceso.
 *
 * Unos diez en seis aplicaciones, cada uno un `div` con `@click` que un lector
 * de pantalla no sabía que se abría. Acá la cabecera es un `<button>` con
 * `aria-expanded` y `aria-controls` apuntando a la región que abre, que es el
 * patrón «disclosure» de WAI-ARIA. `SideGroup` es su variante de barra lateral
 * y queda como está.
 *
 * # Controlado o no
 *
 * Con `v-model:open` lo decide quien lo usa —el escritorio recuerda qué grupos
 * de notificaciones dejó abiertos la persona—; sin él, se maneja solo y
 * arranca como diga `defaultOpen`.
 *
 * `open` vale `undefined` por omisión a propósito: una propiedad `boolean` que
 * no se pasa llega como `false`, y entonces nunca caería del lado del estado
 * propio (la misma trampa que tuvo `DropdownMenu`).
 *
 * # La forma
 *
 * `plain` es la fila suelta, con el velo `ui-hover` al pasar; `card` la pone en
 * una tarjeta de Once UI (`rounded-corner-l`, canto `ui-line`, superficie al
 * 70 %), que es como la usa Configuración. La flecha gira en 200 ms; con
 * movimiento reducido, no se anima.
 *
 * La ranura `meta` va a la derecha de la cabecera (un contador, una
 * insignia) y se corta antes que el título.
 */
import { computed, ref, useId } from 'vue';
import ThemeIcon from '../icons/ThemeIcon.vue';

const props = withDefaults(
	defineProps<{
		title: string;
		open?: boolean;
		defaultOpen?: boolean;
		variant?: 'plain' | 'card';
		disabled?: boolean;
	}>(),
	{ open: undefined, defaultOpen: false, variant: 'plain', disabled: false }
);

const emit = defineEmits<{
	'update:open': [value: boolean];
	toggle: [value: boolean];
}>();

defineSlots<{
	default?: () => unknown;
	meta?: () => unknown;
	title?: () => unknown;
}>();

const own = ref(props.defaultOpen);
const isOpen = computed(() => props.open ?? own.value);
const regionId = `${useId()}-region`;

function toggle() {
	if (props.disabled) return;
	const next = !isOpen.value;
	if (props.open === undefined) own.value = next;
	emit('update:open', next);
	emit('toggle', next);
}
</script>

<template>
  <div
    class="min-w-0"
    :class="variant === 'card' ? 'rounded-corner-l border border-ui-line bg-ui-surface/70' : ''"
    :data-open="isOpen"
    data-disclosure>
    <button
      type="button"
      class="flex min-h-8 w-full min-w-0 items-center gap-2 rounded-corner-m text-left text-label-m text-tx-main transition-colors duration-200 ease-ui focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ui-focus"
      :class="[
        variant === 'card' ? 'px-3 py-2' : 'px-2 py-1',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-ui-hover active:bg-ui-pressed active:duration-100',
      ]"
      :aria-expanded="isOpen"
      :aria-controls="regionId"
      :aria-disabled="disabled || undefined"
      @click="toggle">
      <ThemeIcon
        name="pan-end"
        type="symbol"
        :size="16"
        class="transition-transform duration-200 ease-ui motion-reduce:transition-none"
        :class="isOpen ? 'rotate-90' : ''" />
      <span class="min-w-0 flex-1 break-words font-semibold"><slot name="title">{{ title }}</slot></span>
      <span v-if="$slots.meta" class="flex min-w-0 shrink items-center gap-2 truncate text-label-s text-tx-muted">
        <slot name="meta" />
      </span>
    </button>
    <div
      v-show="isOpen"
      :id="regionId"
      class="min-w-0"
      :class="variant === 'card' ? 'border-t border-ui-line-weak p-3' : 'px-2 pt-1 pb-2'">
      <slot />
    </div>
  </div>
</template>
