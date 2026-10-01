<script setup lang="ts">
/**
 * Una etiqueta atada a su campo.
 *
 * La etiqueta de Once UI: `text-label-s` en peso 600 y en el color del texto.
 * Era `text-primary`: el acento es para lo que actúa, y una etiqueta no
 * actúa. Con eso, además, una pantalla de Configuración con veinte campos
 * dejaba de tener veinte rótulos rosas.
 */
interface Props {
  label: string;
  htmlFor?: string;
  customClass?: string | Record<string, boolean>;
  labelClass?: string | Record<string, boolean>;
}

withDefaults(defineProps<Props>(), {
  htmlFor: '',
  customClass: () => ({}),
  labelClass: () => ({}),
});
</script>

<template>
  <div class="flex flex-col gap-2" :class="customClass">
    <label v-if="label" :for="htmlFor" class="font-semibold text-label-s text-tx-main" :class="labelClass">
      {{ label }}
    </label>
    <slot />
  </div>
</template>
