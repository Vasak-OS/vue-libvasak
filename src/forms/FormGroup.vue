<script setup lang="ts">
/**
 * Una etiqueta atada a su campo.
 *
 * La etiqueta de Once UI: `text-label-s` en peso 600 y en el color del texto.
 * Era `text-primary`: el acento es para lo que actúa, y una etiqueta no
 * actúa. Con eso, además, una pantalla de Configuración con veinte campos
 * dejaba de tener veinte rótulos rosas.
 *
 * # La ayuda y el error (2.1.0)
 *
 * `help` es la línea que explica el campo; `error`, la que dice qué está mal.
 * Las dos llevan su `id` y la ranura los recibe ya juntos en `describedBy`,
 * junto con `id` e `invalid`, para pasárselos al campo:
 *
 * ```vue
 * <FormGroup label="Usuario" :error="problema" v-slot="{ id, describedBy, invalid }">
 *   <TextInput :id="id" v-model="usuario" :described-by="describedBy" :invalid="invalid" />
 * </FormGroup>
 * ```
 *
 * Es lo que escribían a mano seis campos de la cuenta del instalador, diez de
 * «Cuentas en línea» de Configuración y el de polkit, cada uno con su `<p>`
 * de error **sin** atar: el error se veía y no se anunciaba, así que quien no
 * mira la pantalla oía que el campo era inválido y nunca por qué.
 *
 * El error va con el texto principal y el icono `dialog-error`, no en rojo: el
 * rojo del esquema de fábrica sobre la superficie de una sección da 3,88:1 en
 * claro, y un texto tiene que llegar a 4,5:1. El rojo queda en el canto del
 * campo (`invalid`), que como contorno sí llega a 3:1. Y se anuncia al
 * aparecer (`aria-live`), porque suele aparecer al salir del campo, cuando el
 * foco ya está en el siguiente.
 *
 * # `variant="eyebrow"`
 *
 * La etiqueta chica en mayúsculas y atenuada, sobre el campo: el
 * `LabeledField` de resonance, que es lo único que esa copia sabía de más.
 */
import { computed, useId } from 'vue';
import ThemeIcon from '../icons/ThemeIcon.vue';

interface Props {
  label: string;
  /**
   * El `id` del campo. Sin esto se genera uno y llega a la ranura como `id`:
   * la etiqueta sólo nombra al campo si el campo lo usa.
   */
  htmlFor?: string;
  customClass?: string | Record<string, boolean>;
  labelClass?: string | Record<string, boolean>;
  /** La línea que explica el campo, ya traducida. */
  help?: string;
  /** Qué está mal, ya traducido. Con esto el campo es inválido. */
  error?: string;
  variant?: 'default' | 'eyebrow';
}

const props = withDefaults(defineProps<Props>(), {
  htmlFor: '',
  customClass: () => ({}),
  labelClass: () => ({}),
  help: '',
  error: '',
  variant: 'default',
});

defineSlots<{
  default?: (scope: { id: string; describedBy: string | undefined; invalid: boolean }) => unknown;
}>();

const generatedId = useId();
const controlId = computed(() => props.htmlFor || generatedId);
const helpId = computed(() => `${controlId.value}-help`);
const errorId = computed(() => `${controlId.value}-error`);
const describedBy = computed(() => {
  const ids = [props.help ? helpId.value : '', props.error ? errorId.value : ''].filter(Boolean);
  return ids.length > 0 ? ids.join(' ') : undefined;
});
const invalid = computed(() => props.error !== '');

const labelClasses = computed(() =>
  props.variant === 'eyebrow'
    ? 'font-semibold text-label-xs tracking-wider text-tx-muted uppercase'
    : 'font-semibold text-label-s text-tx-main'
);
</script>

<template>
  <div class="flex min-w-0 flex-col" :class="[variant === 'eyebrow' ? 'gap-1' : 'gap-2', customClass]">
    <label v-if="label" :for="controlId" class="break-words" :class="[labelClasses, labelClass]">
      {{ label }}
    </label>
    <slot :id="controlId" :describedBy="describedBy" :invalid="invalid" />
    <p v-if="help" :id="helpId" class="m-0 break-words text-body-xs text-tx-muted">{{ help }}</p>
    <p :id="errorId" aria-live="polite" class="m-0 flex min-w-0 items-start gap-1 text-body-xs text-tx-main" :class="error ? '' : 'sr-only'">
      <ThemeIcon v-if="error" name="dialog-error-symbolic" type="symbol" :size="16" class="shrink-0" />
      <span class="min-w-0 break-words">{{ error }}</span>
    </p>
  </div>
</template>
