<script setup lang="ts">
/**
 * El título, que además **nombra** al diálogo.
 *
 * Se registra en el contexto para que el `aria-labelledby` del contenido lo
 * apunte: sin eso, un lector de pantalla anuncia «diálogo» y nada más, y quien
 * no ve la pantalla no sabe qué le están preguntando.
 */
import { onMounted, onUnmounted } from 'vue';
import { siguienteIdDeTitulo, usarElDialogo } from './tipos';

const dialogo = usarElDialogo();
const id = siguienteIdDeTitulo();

onMounted(() => dialogo.ponerElTitulo(id));
// Al desmontarse deja de nombrarlo: si no, el diálogo siguiente apuntaría a un
// `id` que ya no está en el documento.
onUnmounted(() => dialogo.ponerElTitulo(null));
</script>

<template>
  <h2 :id="id" class="font-semibold text-lg leading-none tracking-tight">
    <slot />
  </h2>
</template>
