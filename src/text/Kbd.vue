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
 * `<kbd>` por tecla dentro de uno que las agrupa. El `+` de entre medio no se
 * lee —un lector de pantalla diría «más»—; para quien no ve, la combinación
 * tiene nombre (`label`, o las teclas unidas con «+»).
 *
 * La forma: una insignia de Once UI, `rounded-corner-xs`, canto `ui-line` y el
 * velo `ui-selected` debajo del texto principal (lo mide
 * `tests/surface-contrast.test.ts`). Mono para que `I` y `l` no se confundan.
 */
import { computed } from 'vue';

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

const spoken = computed(() => props.label ?? (props.keys.length > 1 ? props.keys.join('+') : undefined));
</script>

<template>
  <kbd
    v-if="keys.length"
    class="inline-flex max-w-full min-w-0 flex-wrap items-center gap-1 font-sans"
    :aria-label="spoken">
    <template v-for="(key, index) in keys" :key="`${index}-${key}`">
      <span v-if="index > 0" aria-hidden="true" class="text-label-xs text-tx-muted">+</span>
      <kbd :class="KEY">{{ key }}</kbd>
    </template>
  </kbd>
  <kbd v-else :class="KEY" :aria-label="label"><slot /></kbd>
</template>
