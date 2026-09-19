<script lang="ts" setup>
/**
 * El título de un menú.
 *
 * No es una opción: lleva `role="presentation"` para que no se cuente entre los
 * ítems —un `role="menu"` sólo admite ítems, grupos y separadores— y le presta
 * su texto al menú por `aria-labelledby`, que es lo que hace que al abrirlo se
 * oiga de qué menú se trata y no sólo «menú, dos elementos».
 */
import { onBeforeUnmount, onMounted } from 'vue';
import { siguienteIdDeMenu, usarElMenu } from './tipos';

const menu = usarElMenu();
const id = `${siguienteIdDeMenu()}-titulo`;

onMounted(() => {
	menu.ponerLaEtiqueta(id);
});

onBeforeUnmount(() => {
	menu.ponerLaEtiqueta(null);
});
</script>

<template>
  <div :id="id" role="presentation" class="px-3 py-2 text-sm font-semibold text-tx-main">
    <slot />
  </div>
</template>
