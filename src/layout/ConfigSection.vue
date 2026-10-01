<script setup lang="ts">
/**
 * Una sección de Configuración: título y lo que va adentro.
 *
 * La tarjeta de Once UI (vue-libvasak#74): `rounded-corner-l`, canto `ui-line`
 * y la superficie al 70 % —era `.background`, el fondo de la ventana sobre la
 * ventana—. El título es `text-heading-xs` en el color del texto: el acento es
 * para lo que actúa, y un título no actúa.
 */
interface Props {
  title: string;
  icon?: string;
  customClass?: string | Record<string, boolean>;
}

withDefaults(defineProps<Props>(), {
  icon: '',
  customClass: () => ({}),
});
</script>

<template>
  <div
    class="flex min-w-0 flex-col gap-4 rounded-corner-l border border-ui-line bg-ui-surface/70 p-4 text-tx-main"
    :class="customClass"
  >
    <h3 class="m-0 font-semibold text-heading-xs text-tx-main">
      {{ icon ? `${icon} ${title}` : title }}
    </h3>
    <slot />
  </div>
</template>
