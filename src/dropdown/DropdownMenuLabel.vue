<script lang="ts" setup>
/**
 * El título de un menú.
 *
 * No es una opción: lleva `role="presentation"` para que no se cuente entre los
 * ítems —un `role="menu"` sólo admite ítems, grupos y separadores— y le presta
 * su texto al menú por `aria-labelledby`, que es lo que hace que al abrirlo se
 * oiga de qué menú se trata y no sólo «menú, dos elementos».
 *
 * Chico y en gris (`text-label-xs`, `tx-muted`): en `text-sm` y en el color del
 * texto se confundía con una opción más.
 */
import { onBeforeUnmount, onMounted } from 'vue';
import { nextMenuId, useMenu } from './types';

const menu = useMenu();
const id = `${nextMenuId()}-label`;

onMounted(() => {
	menu.setLabel(id);
});

onBeforeUnmount(() => {
	menu.setLabel(null);
});
</script>

<template>
  <div :id="id" role="presentation" class="px-3 pt-2 pb-1 font-semibold text-label-xs text-tx-muted">
    <slot />
  </div>
</template>
