<script setup lang="ts">
/**
 * El título, que además **nombra** al diálogo.
 *
 * Se registra en el contexto para que el `aria-labelledby` del contenido lo
 * apunte: sin eso, un lector de pantalla anuncia «diálogo» y nada más, y quien
 * no ve la pantalla no sabe qué le están preguntando.
 */
import { onMounted, onUnmounted } from 'vue';
import { nextTitleId, useDialog } from './types';

const dialog = useDialog();
const id = nextTitleId();

onMounted(() => dialog.setTitle(id));
// Al desmontarse deja de nombrarlo: si no, el diálogo siguiente apuntaría a un
// `id` que ya no está en el documento.
onUnmounted(() => dialog.setTitle(null));
</script>

<template>
  <h2 :id="id" class="font-semibold text-heading-s text-tx-main">
    <slot />
  </h2>
</template>
