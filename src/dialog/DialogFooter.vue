<script setup lang="ts">
/**
 * El pie, donde van los botones.
 *
 * Apilados al revés en pantalla angosta —`flex-col-reverse`— para que la acción
 * principal quede arriba, que es la que el pulgar alcanza primero.
 */
</script>

<template>
  <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
    <slot />
  </div>
</template>
