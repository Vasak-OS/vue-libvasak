<script setup lang="ts">
/**
 * La barra de pestañas a un costado, con el nombre de una desplegado.
 *
 * La orientación la provee el marco de la ventana; acá se la provee a mano. El
 * desplegado se abre como se abre de verdad, con el puntero encima.
 */
import { computed, onMounted, provide, ref } from 'vue';
import { CLAVE_DE_LA_BARRA, TabBar } from '../src';

defineProps<{ tabs: Array<{ id: string; label: string; icon?: string; dirty?: boolean }> }>();

const position = ref<'left'>('left');
provide(CLAVE_DE_LA_BARRA, {
	posicion: position,
	orientacion: computed(() => 'vertical' as const),
	vertical: computed(() => true),
});

const root = ref<HTMLElement | null>(null);
onMounted(() => {
	setTimeout(() => {
		root.value?.querySelectorAll<HTMLElement>('[role="tab"]')[1]?.dispatchEvent(new MouseEvent('mouseenter'));
	}, 50);
});
</script>

<template>
  <div ref="root" class="flex h-full w-12 flex-col">
    <TabBar :tabs="tabs" model-value="a" new-label="Pestaña nueva" />
  </div>
</template>
