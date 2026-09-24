<template>
  <div
    class="background rounded-corner flex flex-row items-center gap-2 justify-between w-full h-auto p-4 transition-[background-color] duration-200 hover:bg-ui-surface/80"
  >
    <button
      v-if="showButton"
      @click="handleButtonClick"
      type="button"
      :title="buttonLabel ?? label"
      :aria-label="buttonLabel ?? label"
      class="w-8 h-8 flex items-center justify-center rounded-corner transition-[background-color,scale] duration-200 hover:bg-ui-surface/80 hover:scale-110 active:scale-95"
    >
      <ThemeIcon v-if="name" :name="name" :type="type" :size="24" :class="iconClass" />
      <!-- La ruta ya resuelta, mientras `icon` siga existiendo. -->
      <img
        v-else
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
      <ThemeIcon v-if="name" :name="name" :type="type" :size="24" />
      <!-- La ruta ya resuelta, mientras `icon` siga existiendo. -->
      <img
        v-else
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
 *
 * ── El icono va por nombre ─────────────────────────────────────────────────
 *
 * `name` es el **nombre** del icono en el tema del escritorio, y `type` cuál de
 * las dos variantes. Lo dibuja `ThemeIcon`, así que sigue al tema y entra en el
 * planificador de recarga como cualquier otro.
 *
 * `icon` —la ruta ya resuelta— sigue funcionando y está **obsoleto**. Era lo
 * contrario de lo que hace el resto de la librería: obligaba a quien lo usara a
 * resolver la ruta por su cuenta, escuchar el cambio de tema y volver a
 * pedirla, que es exactamente el composable que este barrido viene borrando de
 * cada repositorio. Se va en la próxima mayor; hasta entonces avisa por consola.
 * Lo pedía el issue #52.
 */
import { computed, onMounted } from 'vue';
import ThemeIcon from '../icons/ThemeIcon.vue';

interface Props {
  /** El nombre del icono en el tema del escritorio. */
  name?: string;
  /** Cuál de las dos variantes del tema. */
  type?: 'icon' | 'symbol';
  /** @deprecated La ruta ya resuelta. Usá `name`. Se va en la próxima mayor. */
  icon?: string;
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
  icon: '',
  min: 0,
  max: 100,
  showButton: false,
  iconClass: () => ({}),
  getPercentageClass: () => '',
});

onMounted(() => {
  if (props.icon && !props.name) {
    console.warn(
      '[SliderControl] «icon» está obsoleto y se va en la próxima mayor: recibe una ruta ya resuelta. Usá «name» con el nombre del icono del tema, y «type» si hace falta el símbolo.'
    );
  }
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
