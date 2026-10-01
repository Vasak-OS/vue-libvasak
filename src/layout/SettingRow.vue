<script setup lang="ts">
/**
 * Una fila de ajuste: qué es y por qué a la izquierda, el control a la derecha.
 *
 * Es la forma que Configuración escribe a mano unas quince veces —en el panel,
 * el escritorio, el tema, las fuentes, la fecha y la hora, el brillo, la
 * pantalla de inicio de sesión, los complementos y los monitores—, y que
 * también tienen el menú del teléfono del escritorio, los repositorios de la
 * tienda y los ajustes de resonance:
 *
 * ```html
 * <div class="flex items-start justify-between gap-4">
 *   <div class="flex flex-col">
 *     <label class="text-sm font-medium">…</label>
 *     <span class="text-xs text-tx-muted">…</span>
 *   </div>
 *   <SwitchToggle … />
 * </div>
 * ```
 *
 * En esa copia la etiqueta era un `<label>` **sin `for`**: no estaba atada a
 * nada, así que el texto no se anunciaba como nombre del control y tocarlo no
 * hacía nada. Acá, con `controlId`, la etiqueta apunta al control (un
 * `SwitchToggle` es un botón, y un botón se puede etiquetar), y la ranura
 * recibe `labelId` y `descriptionId` para el control que prefiere
 * `aria-labelledby` y `aria-describedby`.
 *
 * No es `SwitchRow`: ésa es la fila entera como botón con el interruptor a la
 * izquierda —el formato del instalador— y se queda como está.
 *
 * # Adaptable
 *
 * Por el ancho que le dan (`@container`), no por la pantalla: desde 320 px el
 * control va a la derecha, como hoy; más angosto, debajo del texto, para que
 * la descripción no quede en una columna de dos palabras.
 */
import { computed, useId } from 'vue';

const props = withDefaults(
	defineProps<{
		label: string;
		description?: string;
		/** El `id` del control de la ranura. Con esto la etiqueta lo nombra. */
		controlId?: string;
		disabled?: boolean;
	}>(),
	{ disabled: false }
);

defineSlots<{
	/** El control: un interruptor, un select, un campo numérico. */
	default?: (scope: { labelId: string; descriptionId: string | undefined }) => unknown;
	/** A la izquierda del texto: un icono. */
	leading?: () => unknown;
	/** Debajo de toda la fila: una nota, un aviso, un control que no entra al costado. */
	footer?: () => unknown;
}>();

const id = useId();
const labelId = `${id}-label`;
const descriptionId = computed(() => (props.description ? `${id}-description` : undefined));
</script>

<template>
  <div class="@container min-w-0" :class="disabled ? 'opacity-50' : ''" :aria-disabled="disabled || undefined">
    <div class="flex min-w-0 flex-col gap-2 @xs:flex-row @xs:items-start @xs:justify-between @xs:gap-4">
      <div class="flex min-w-0 items-start gap-3">
        <span v-if="$slots.leading" class="mt-0.5 flex shrink-0 items-center"><slot name="leading" /></span>
        <div class="flex min-w-0 flex-col">
          <label
            v-if="controlId"
            :id="labelId"
            :for="controlId"
            class="break-words font-semibold text-label-m text-tx-main">{{ label }}</label>
          <span v-else :id="labelId" class="break-words font-semibold text-label-m text-tx-main">{{ label }}</span>
          <span v-if="description" :id="descriptionId" class="break-words text-body-xs text-tx-muted">{{ description }}</span>
        </div>
      </div>
      <div class="flex min-w-0 shrink-0 items-center gap-2">
        <slot :labelId="labelId" :descriptionId="descriptionId" />
      </div>
    </div>
    <div v-if="$slots.footer" class="mt-2 min-w-0"><slot name="footer" /></div>
  </div>
</template>
