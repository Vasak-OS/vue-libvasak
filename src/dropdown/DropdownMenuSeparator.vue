<script lang="ts" setup>
/**
 * La línea entre dos grupos de opciones.
 *
 * Con `role="separator"`: sin él es un `div` decorativo, y el lector de
 * pantalla lee las opciones de los dos lados como si fueran una sola lista.
 *
 * Un píxel de `ui-line-weak` que llega hasta el canto del panel (`-mx-1`
 * contra su `p-1`). Era `bg-ui-bg/80` de dos píxeles con 16 de aire a cada
 * lado: en claro casi no se veía y separaba 32 px.
 */
</script>

<template>
  <div role="separator" aria-orientation="horizontal" class="-mx-1 my-1 h-px bg-ui-line-weak" />
</template>
