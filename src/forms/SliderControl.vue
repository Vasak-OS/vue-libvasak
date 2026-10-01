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
 *
 * ── El icono va por nombre ─────────────────────────────────────────────────
 *
 * `name` es el **nombre** del icono en el tema del escritorio, y `type` cuál de
 * las dos variantes. Lo dibuja `ThemeIcon`, así que sigue al tema y entra en el
 * planificador de recarga como cualquier otro.
 *
 * `icon` —la ruta ya resuelta— se fue en la 2.0.0, como avisaba desde la 1.x:
 * obligaba a quien lo usara a resolver la ruta por su cuenta, escuchar el
 * cambio de tema y volver a pedirla. Ninguna aplicación lo usaba al sacarlo.
 * Lo pedía el issue #52.
 *
 * ── La forma (vue-libvasak#74) ─────────────────────────────────────────────
 *
 * Una tarjeta de Once UI —`rounded-corner-l`, canto `ui-line`, superficie al
 * 70 %— en vez de `.background`, que era el fondo de la ventana puesto sobre la
 * ventana. El botón es un botón sin borde de 32 con el velo `ui-hover`, y nada
 * escala al pasar ni al apretar. La vía nativa toma el primario del esquema
 * con `accent-color`.
 */
import { computed } from 'vue';
import ThemeIcon from '../icons/ThemeIcon.vue';

interface Props {
  /** El nombre del icono en el tema del escritorio. */
  name?: string;
  /** Cuál de las dos variantes del tema. */
  type?: 'icon' | 'symbol';
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
  name: '',
  type: 'icon',
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

<template>
  <div
    class="flex h-auto w-full min-w-0 flex-row items-center justify-between gap-2 rounded-corner-l border border-ui-line bg-ui-surface/70 p-4 text-tx-main"
  >
    <button
      v-if="showButton"
      @click="handleButtonClick"
      type="button"
      :title="buttonLabel ?? label"
      :aria-label="buttonLabel ?? label"
      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-corner-m transition-colors duration-200 ease-ui hover:bg-ui-hover active:bg-ui-pressed active:duration-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-focus"
    >
      <ThemeIcon v-if="name" :name="name" :type="type" :size="24" :class="iconClass" />
    </button>

    <div
      v-else
      class="flex h-8 w-8 shrink-0 items-center justify-center"
    >
      <ThemeIcon v-if="name" :name="name" :type="type" :size="24" />
    </div>

    <input
      type="range"
      :min="min"
      :max="max"
      :value="modelValue"
      @input="handleInput"
      :aria-label="label"
      :aria-valuetext="`${percentage}%`"
      class="min-w-0 flex-1 cursor-pointer accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-focus"
    />

    <span
      class="w-12 shrink-0 text-right font-semibold text-label-m tabular-nums transition-colors duration-200 ease-ui"
      :class="percentageClass"
    >
      {{ percentage }}%
    </span>
  </div>
</template>
