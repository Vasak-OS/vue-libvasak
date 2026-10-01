<script setup lang="ts">
/** biome-ignore-all lint/style/useVueMultiWordComponentNames: la regla existe
 * para que el nombre de un componente no choque con un elemento HTML. Éste no
 * lo es, y renombrarlo obligaría a tocar cada uso sin ganar nada. */
/**
 * La raíz, que es la que sabe si el diálogo está abierto.
 *
 * No dibuja nada: quien lo usa controla el estado con `v-model:open`, que es lo
 * que deja abrirlo desde un botón, desde una ruta o desde lo que sea.
 */
import { computed, provide, type Ref, ref } from 'vue';
import { DIALOG_KEY } from './types';

const props = withDefaults(defineProps<{ open?: boolean }>(), { open: false });
const emit = defineEmits<{ 'update:open': [open: boolean] }>();

const titleId = ref<string | null>(null);

provide(DIALOG_KEY, {
	open: computed(() => props.open) as Ref<boolean>,
	close: () => emit('update:open', false),
	titleId,
	setTitle: (id: string | null) => {
		titleId.value = id;
	},
});
</script>

<template>
  <slot />
</template>
