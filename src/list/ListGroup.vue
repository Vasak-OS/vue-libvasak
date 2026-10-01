<script setup lang="ts">
/**
 * El contenedor de una lista de `ListRow`: canto, superficie y divisores.
 *
 * Las listas del monitor (`divide-y`), de Configuración y de la tienda lo
 * escribían cada una con su borde y su relleno. Acá es la tarjeta de Once UI
 * —`rounded-corner-l`, canto `ui-line`, la superficie al 70 %— con las filas a
 * ras y separadas por `ui-line-weak`.
 *
 * Con `divided` en `false` es la otra forma de Once UI: las filas con su radio
 * y un relleno de 4 px alrededor, sin líneas, como las opciones de un menú.
 * `rounded-corner-l` afuera y `rounded-corner-m` adentro con `p-1` son el
 * anidado de la especificación: las dos curvas quedan concéntricas.
 *
 * # Semántica
 *
 * Por omisión es sólo un contenedor visual: las filas dicen lo que son. Con
 * `role="listbox"` es una lista de opciones (las filas van con
 * `role="option"`), y `label` le da nombre.
 */
import { provide, reactive, watchEffect } from 'vue';
import { LIST_GROUP_KEY } from './context';

const props = withDefaults(
	defineProps<{
		divided?: boolean;
		role?: 'listbox' | 'group';
		/** El nombre de la lista, ya traducido. */
		label?: string;
		/** Para un `listbox` de varias elecciones. */
		multiselectable?: boolean;
	}>(),
	{ divided: true, multiselectable: false }
);

const context = reactive({ divided: props.divided });
watchEffect(() => {
	context.divided = props.divided;
});
provide(LIST_GROUP_KEY, context);
</script>

<template>
  <div
    :role="role"
    :aria-label="label"
    :aria-multiselectable="role === 'listbox' && multiselectable ? 'true' : undefined"
    class="flex min-w-0 flex-col overflow-hidden rounded-corner-l border border-ui-line bg-ui-surface/70"
    :class="divided ? 'divide-y divide-ui-line-weak' : 'gap-0.5 p-1'">
    <slot />
  </div>
</template>
