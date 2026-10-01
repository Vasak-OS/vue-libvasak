<script setup lang="ts">
/**
 * Un número con su nombre: «Memoria 6,2 GB», «Paquetes 1 284».
 *
 * Unos veinte en dos aplicaciones: Configuración (quince, en Acerca de y en el
 * almacenamiento) y el monitor (el total y la cabecera de cada tarjeta).
 *
 * La tarjeta de Once UI —`rounded-corner-l`, canto `ui-line`, superficie al
 * 70 %— con el nombre arriba en `tx-muted`, el valor en peso 600 con cifras de
 * ancho fijo (que un número que cambia no haga bailar la fila) y una pista
 * debajo. El valor largo se corta en vez de empujar la grilla, y el `title`
 * lo deja leer entero.
 *
 * Se acomoda a lo que le den: en una columna angosta el icono se esconde antes
 * que el número (`@container`).
 */
import ThemeIcon from '../icons/ThemeIcon.vue';

withDefaults(
	defineProps<{
		label: string;
		value: string | number;
		hint?: string;
		/** Nombre de icono del tema, al lado del nombre. */
		icon?: string;
		iconType?: 'icon' | 'symbol';
	}>(),
	{ iconType: 'symbol' }
);

defineSlots<{
	value?: () => unknown;
	default?: () => unknown;
}>();
</script>

<template>
  <div class="@container flex min-w-0 flex-col gap-1 rounded-corner-l border border-ui-line bg-ui-surface/70 p-3" data-stat-tile>
    <div class="flex min-w-0 items-center gap-2">
      <ThemeIcon v-if="icon" :name="icon" :type="iconType" :size="16" class="hidden @[8rem]:block" />
      <p class="m-0 min-w-0 truncate text-label-s text-tx-muted">{{ label }}</p>
    </div>
    <p class="m-0 min-w-0 truncate font-semibold text-heading-m text-tx-main tabular-nums" :title="String(value)">
      <slot name="value">{{ value }}</slot>
    </p>
    <p v-if="hint" class="m-0 min-w-0 break-words text-body-xs text-tx-muted">{{ hint }}</p>
    <slot />
  </div>
</template>
