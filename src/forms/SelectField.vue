<script lang="ts" setup>
/**
 * Un `select` que respeta el tema.
 *
 * El `select` nativo de WebKit se dibuja solo: pinta su propio fondo blanco y
 * su propio texto, y las clases de color no lo tocan — en una ventana en modo
 * oscuro eso deja texto claro sobre blanco, ilegible. `appearance-none` apaga
 * ese dibujo, y entonces la flecha hay que ponerla a mano porque se va con el
 * resto.
 *
 * Estaba copiado en vasak-monitor y en vasak-settings con dos nombres
 * distintos.
 */
import ThemeIcon from '../icons/ThemeIcon.vue';

// Los atributos van al `select` y no al contenedor: si no, un `@change` o un
// `aria-label` quedan colgados de un `div` y no hacen nada.
defineOptions({ inheritAttrs: false });

const [modelo, modificadores] = defineModel<string | number>({
	required: true,
	set(valor) {
		// `v-model.number` sobre un componente no convierte solo como lo hace
		// sobre un `input`: el modificador llega acá y hay que aplicarlo. Sin
		// esto, un valor numérico sale como cadena y quien lo valida lo rechaza.
		return modificadores.number ? Number(valor) : valor;
	},
});
</script>

<template>
  <div class="relative flex min-w-0 items-center">
    <select
      v-model="modelo"
      class="min-w-0 flex-1 appearance-none truncate rounded-corner border border-ui-border bg-ui-surface/60 py-1.5 pr-8 pl-2 text-sm text-tx-main"
      v-bind="$attrs">
      <slot />
    </select>
    <ThemeIcon
      name="pan-down-symbolic"
      type="symbol"
      :size="14"
      class="pointer-events-none absolute right-2" />
  </div>
</template>
