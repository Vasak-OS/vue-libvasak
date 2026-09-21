<template>
  <div
    class="background rounded-corner flex flex-row items-center gap-2 justify-between w-full h-auto p-4 transition-[background-color] duration-200 hover:bg-ui-surface/80 dark:hover:bg-ui-surface-dark/80"
  >
    <button
      v-if="showButton"
      @click="handleButtonClick"
      type="button"
      :title="buttonLabel ?? label"
      :aria-label="buttonLabel ?? label"
      class="w-8 h-8 flex items-center justify-center rounded-corner transition-[background-color,scale] duration-200 hover:bg-ui-surface/80 dark:hover:bg-ui-surface-dark/80 hover:scale-110 active:scale-95"
    >
      <img
        :src="icon"
        alt=""
        class="w-6 h-6"
        :class="iconClass"
      />
    </button>
    
    <div
      v-else
      class="w-8 h-8 flex items-center justify-center"
    >
      <img
        :src="icon"
        alt=""
        class="w-6 h-6"
      />
    </div>

    <input
      type="range"
      :min="min"
      :max="max"
      :value="modelValue"
      @input="handleInput"
      :aria-label="label"
      :aria-valuetext="`${percentage}%`"
      class="flex-1 transition-[scale] duration-200 hover:scale-105"
    />
    
    <span
      class="w-12 text-right transition-[color] duration-200 font-medium"
      :class="percentageClass"
    >
      {{ percentage }}%
    </span>
  </div>
</template>

<script setup lang="ts">
/**
 * Un deslizador con su icono y su porcentaje: el volumen, el brillo.
 *
 * ── Lo que le faltaba ───────────────────────────────────────────────────────
 *
 * El `<input type="range">` no tenía nombre: ni `aria-label` ni un `<label>`
 * asociado, así que se anunciaba «control deslizante, 47» sin decir de qué. Y
 * el número tampoco tenía unidad — `aria-valuetext` es lo que hace que se oiga
 * «47%» en vez de «47».
 *
 * Con `showButton`, ese botón tampoco tenía nombre: su único contenido es un
 * icono, y el `alt` era la cadena vacía por omisión.
 *
 * Por eso `label` es obligatorio y reemplaza a `alt` y `tooltip`, que eran dos
 * formas de nombrar lo mismo y ninguna obligaba a hacerlo.
 */
import { computed } from 'vue';

interface Props {
  icon: string;
  /**
   * Qué regula el deslizador, ya traducido. Obligatorio: el `input` no tiene
   * `<label>` asociado ni texto propio.
   */
  label: string;
  /** El nombre de la acción del botón, si no es el mismo que el del deslizador. */
  buttonLabel?: string;
  modelValue: number;
  min?: number;
  max?: number;
  showButton?: boolean;
  iconClass?: string | Record<string, boolean>;
  getPercentageClass?: (percentage: number) => string;
}

const props = withDefaults(defineProps<Props>(), {
  min: 0,
  max: 100,
  showButton: false,
  iconClass: () => ({}),
  getPercentageClass: () => '',
});

const emit = defineEmits<{
  'update:modelValue': [value: number];
  'buttonClick': [];
}>();

const percentage = computed(() => {
  if (props.max <= props.min) return 0;
  const range = props.max - props.min;
  const value = props.modelValue - props.min;
  return Math.round((value / range) * 100);
});

const percentageClass = computed(() => {
  if (props.getPercentageClass) {
    return props.getPercentageClass(percentage.value);
  }
  return '';
});

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', Number(target.value));
};

const handleButtonClick = () => {
  emit('buttonClick');
};
</script>
