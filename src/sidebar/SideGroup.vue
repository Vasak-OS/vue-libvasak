<script lang="ts" setup>
/**
 * Un grupo de elementos de la barra, con su título plegable.
 *
 * Plegada la barra, el título del grupo no se muestra —no entra— y el grupo se
 * abre sí o sí: un grupo cerrado sin título visible sería contenido escondido
 * detrás de nada.
 */
import { ref, watch } from 'vue';
import ThemeIcon from '../icons/ThemeIcon.vue';

const props = withDefaults(
	defineProps<{ title: string; collapsed?: boolean; defaultOpen?: boolean }>(),
	{ collapsed: false, defaultOpen: true }
);

const abierto = ref(props.defaultOpen);

watch(
	() => props.collapsed,
	(plegada) => {
		if (plegada) {
			abierto.value = true;
		}
	}
);
</script>

<template>
  <section class="flex flex-col gap-2">
    <button
      v-if="!collapsed"
      type="button"
      class="group flex w-full items-center justify-between rounded-corner px-2 py-1 text-tx-muted text-xs uppercase tracking-[0.08em] hover:bg-ui-surface/60"
      :aria-expanded="abierto"
      @click="abierto = !abierto">
      <span>{{ title }}</span>
      <!-- El icono del tema y no un carácter: una `v` suelta se dibuja con la
           tipografía de la interfaz, queda de otro tamaño que el resto de los
           símbolos de la ventana y no sigue al tema. -->
      <ThemeIcon
        name="pan-down-symbolic"
        type="symbol"
        :size="12"
        class="transition-transform duration-200"
        :class="abierto ? '' : '-rotate-90'" />
    </button>

    <div v-if="abierto || collapsed" class="flex flex-col gap-1">
      <slot />
    </div>
  </section>
</template>
