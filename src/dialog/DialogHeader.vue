<script setup lang="ts">
/**
 * El encabezado: el título y, si hay, la descripción.
 *
 * Se acomoda por el ancho del diálogo y no por el de la pantalla: el
 * envoltorio es un contenedor (`@container`) y lo de adentro cambia con `@sm:`.
 * Con el `sm:` de la pantalla, un diálogo angosto en una ventana ancha se
 * armaba como si fuera ancho. Los atributos de quien lo usa van al elemento de
 * adentro, que es el que se dibuja.
 */
defineOptions({ inheritAttrs: false });
</script>

<template>
  <div class="@container">
    <div v-bind="$attrs" class="flex flex-col gap-1.5 text-center @sm:text-left">
      <slot />
    </div>
  </div>
</template>
