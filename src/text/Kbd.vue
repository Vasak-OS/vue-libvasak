<script setup lang="ts">
/**
 * Una tecla o una combinación: `Ctrl` `+` `S`.
 *
 * Unas veinte escritas a mano en tres aplicaciones —los atajos del gestor de
 * archivos (14 y la barra de dirección), los del correo, los de
 * Configuración—, cada una con su borde y su tamaño de letra.
 *
 * Con `keys` dibuja la combinación separada; con la ranura, lo que se le pase.
 * Es un `<kbd>` de verdad, y la combinación va como el HTML la recomienda: un
 * `<kbd>` por tecla dentro de uno que las agrupa. El `+` de entre medio **se
 * lee** («Ctrl más S»): un `<kbd>` no tiene rol, así que un `aria-label`
 * encima no lo anuncia nadie, y sin el `+` quedaba «Ctrl S». Con `label`, ese
 * texto va escondido a la vista y lo dibujado se calla.
 *
 * La forma: una insignia de Once UI, `rounded-corner-xs`, canto `ui-line` y el
 * velo `ui-selected` debajo del texto principal (lo mide
 * `tests/surface-contrast.test.ts`). Mono para que `I` y `l` no se confundan.
 */

const props = withDefaults(
	defineProps<{
		/** Las teclas de la combinación, ya traducidas («Ctrl», «Mayús»). */
		keys?: readonly string[];
		/** Cómo se lee la combinación, si unirla con «+» no alcanza. */
		label?: string;
	}>(),
	{ keys: () => [] }
);

const KEY = 'inline-flex min-h-5 min-w-5 items-center justify-center rounded-corner-xs border border-ui-line bg-ui-selected px-1 font-mono text-label-xs text-tx-main';

</script>

<template>
  <kbd v-if="keys.length" class="inline-flex max-w-full min-w-0 flex-wrap items-center gap-1 font-sans">
    <span v-if="label" class="sr-only">{{ label }}</span>
    <template v-for="(key, index) in keys" :key="`${index}-${key}`">
      <span v-if="index > 0" :aria-hidden="label ? 'true' : undefined" class="text-label-xs text-tx-muted" data-separator>+</span>
      <kbd :class="KEY" :aria-hidden="label ? 'true' : undefined">{{ key }}</kbd>
    </template>
  </kbd>
  <kbd v-else :class="KEY">
    <span v-if="label" class="sr-only">{{ label }}</span>
    <span :aria-hidden="label ? 'true' : undefined"><slot /></span>
  </kbd>
</template>
