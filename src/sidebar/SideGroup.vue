<script lang="ts" setup>
/**
 * Un grupo de elementos de la barra, con su título plegable.
 *
 * Plegada la barra, el título del grupo no se muestra —no entra— y el grupo se
 * abre sí o sí: un grupo cerrado sin título visible sería contenido escondido
 * detrás de nada.
 *
 * El título es una etiqueta de Once UI: `text-label-xs`, peso 600, en
 * `tx-muted`, sin mayúsculas forzadas ni espaciado de letras. Se pliega con un
 * botón sin borde que lleva el velo `ui-hover`.
 */
import { ref, watch } from 'vue';
import ThemeIcon from '../icons/ThemeIcon.vue';

const props = withDefaults(
	defineProps<{ title: string; collapsed?: boolean; defaultOpen?: boolean }>(),
	{ collapsed: false, defaultOpen: true }
);

const open = ref(props.defaultOpen);

watch(
	() => props.collapsed,
	(isCollapsed) => {
		if (isCollapsed) {
			open.value = true;
		}
	}
);
</script>

<template>
  <section class="flex flex-col gap-2">
    <button
      v-if="!collapsed"
      type="button"
      class="group flex w-full min-w-0 items-center justify-between gap-2 rounded-corner-m px-3 py-1 font-semibold text-label-xs text-tx-muted transition-colors duration-200 ease-ui hover:bg-ui-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-focus"
      :aria-expanded="open"
      @click="open = !open">
      <span class="min-w-0 truncate">{{ title }}</span>
      <!-- El icono del tema y no un carácter: una `v` suelta se dibuja con la
           tipografía de la interfaz, queda de otro tamaño que el resto de los
           símbolos de la ventana y no sigue al tema. -->
      <ThemeIcon
        name="pan-down-symbolic"
        type="symbol"
        :size="12"
        class="shrink-0 transition-transform duration-200 ease-ui"
        :class="open ? '' : '-rotate-90'" />
    </button>

    <div v-if="open || collapsed" class="flex flex-col gap-1">
      <slot />
    </div>
  </section>
</template>
