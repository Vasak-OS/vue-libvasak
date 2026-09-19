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
 *
 * # La etiqueta
 *
 * Con `label`, el componente la dibuja y la ata al control con `for`/`id`. Es
 * la razón de que exista la propiedad: quien lo usaba ponía un `<label>` suelto
 * al lado, que **no** está asociado a nada — un lector de pantalla anuncia un
 * desplegable sin nombre, y hacer clic en el texto no abre la lista.
 *
 * Envolverlo en un `<label>` también vale, que es asociación implícita; en ese
 * caso no se pasa `label` y no se dibuja ninguna.
 */
import { computed, useAttrs, useId } from 'vue';
import ThemeIcon from '../icons/ThemeIcon.vue';

// Los atributos van al `select` y no al contenedor: si no, un `@change` o un
// `aria-label` quedan colgados de un `div` y no hacen nada.
defineOptions({ inheritAttrs: false });

const props = defineProps<{ label?: string }>();
const atributos = useAttrs();

// El `id` propio sólo si hace falta uno y quien lo usa no trajo el suyo.
const generado = useId();
const id = computed(() => (atributos.id as string | undefined) ?? generado);

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
  <div class="flex min-w-0 flex-col gap-1">
    <label v-if="props.label" :for="id" class="text-tx-muted text-xs">{{ props.label }}</label>
    <div class="relative flex min-w-0 items-center">
      <select
        :id="id"
        v-model="modelo"
        class="min-w-0 flex-1 appearance-none truncate rounded-corner border border-ui-border bg-ui-surface/60 py-1.5 pr-8 pl-2 text-sm text-tx-main"
        v-bind="atributos">
        <slot />
      </select>
      <ThemeIcon
        name="pan-down-symbolic"
        type="symbol"
        :size="14"
        class="pointer-events-none absolute right-2" />
    </div>
  </div>
</template>
