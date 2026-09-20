<script setup lang="ts">
/**
 * La línea que explica de qué va el diálogo.
 *
 * Va en `text-tx-muted`, que es el token de texto secundario del sistema. La
 * copia de la que salió esto usaba `text-[hsl(var(--muted-foreground))]`, un
 * resto de shadcn: esa variable no existe en ningún tema de VasakOS, así que el
 * color no se aplicaba y el texto quedaba del color heredado.
 */
</script>

<template>
  <p class="text-sm text-tx-muted">
    <slot />
  </p>
</template>
