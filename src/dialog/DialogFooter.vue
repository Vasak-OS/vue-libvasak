<script setup lang="ts">
/**
 * El pie, donde van los botones.
 *
 * Apilados al revés en un diálogo angosto —`flex-col-reverse`— para que la
 * acción principal quede arriba, que es la que el pulgar alcanza primero.
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
    <div v-bind="$attrs" class="flex flex-col-reverse gap-2 @sm:flex-row @sm:justify-end">
      <slot />
    </div>
  </div>
</template>
