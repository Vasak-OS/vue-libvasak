<script lang="ts" setup>
/**
 * Un elemento de la barra lateral.
 *
 * El icono sale del tema del escritorio y se vuelve a resolver cuando la
 * persona cambia de tema: por eso no se recibe una ruta sino un nombre. Plegado
 * queda sólo el icono, y el nombre pasa al `title` para que el globo lo diga —
 * sin eso, una barra plegada es una columna de dibujos sin explicación.
 */
import { getIconSource } from '@vasakgroup/plugin-vicons';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { onMounted, onUnmounted, ref, toRef, watch } from 'vue';

const props = withDefaults(
	defineProps<{
		label: string;
		icon?: string;
		active?: boolean;
		collapsed?: boolean;
		disabled?: boolean;
		badge?: string | number;
	}>(),
	{ icon: '', active: false, collapsed: false, disabled: false, badge: '' }
);

defineEmits<{ click: [] }>();

const fuente = ref('');
const icono = toRef(props, 'icon');
let soltar: UnlistenFn | null = null;

async function resolver() {
	if (!icono.value) {
		fuente.value = '';
		return;
	}
	fuente.value = await getIconSource(icono.value);
}

onMounted(async () => {
	await resolver();
	// El tema de iconos cambia en caliente: sin esto, la barra se queda con los
	// del tema anterior hasta que se reabre la ventana.
	soltar = await listen('vicons:theme-changed', resolver);
});

onUnmounted(() => soltar?.());

watch(icono, resolver);
</script>

<template>
  <button
    type="button"
    :title="collapsed ? label : undefined"
    :disabled="disabled"
    :aria-current="active ? 'page' : undefined"
    class="group relative flex w-full items-center gap-3 rounded-corner border px-3 py-2 text-left text-sm transition-all duration-200"
    :class="[
      active
        ? 'border-secondary bg-primary/15 text-tx-main shadow-sm'
        : 'border-transparent bg-ui-bg/30 hover:border-ui-border hover:bg-ui-surface/70',
      disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
      collapsed ? 'justify-center px-2' : '',
    ]"
    @click="$emit('click')">
    <span
      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-corner font-semibold text-xs uppercase tracking-wide"
      :class="active ? 'border-secondary bg-primary/20' : ''"
      aria-hidden="true">
      <img v-if="fuente" :src="fuente" alt="" class="h-8 w-8 object-contain">
      <!-- Sin icono, la inicial: un hueco vacío del mismo tamaño deja la fila
           desalineada contra las que sí lo tienen. -->
      <span v-else>{{ label.charAt(0).toUpperCase() }}</span>
    </span>

    <span v-if="!collapsed" class="min-w-0 flex-1 truncate font-medium">{{ label }}</span>

    <span
      v-if="!collapsed && badge !== ''"
      class="rounded-corner bg-ui-surface px-2 py-0.5 font-semibold text-tx-muted text-xs">
      {{ badge }}
    </span>
  </button>
</template>
