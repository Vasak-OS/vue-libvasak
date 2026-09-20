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
import { CLAVE_DEL_DIALOGO } from './tipos';

const props = withDefaults(defineProps<{ open?: boolean }>(), { open: false });
const emit = defineEmits<{ 'update:open': [abierto: boolean] }>();

const idDelTitulo = ref<string | null>(null);

provide(CLAVE_DEL_DIALOGO, {
	abierto: computed(() => props.open) as Ref<boolean>,
	cerrar: () => emit('update:open', false),
	idDelTitulo,
	ponerElTitulo: (id: string | null) => {
		idDelTitulo.value = id;
	},
});
</script>

<template>
  <slot />
</template>
