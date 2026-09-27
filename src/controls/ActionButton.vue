<script setup lang="ts">
interface Props {
  label: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  customClass?: string | Record<string, boolean>;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  iconSrc?: string;
  iconAlt?: string;
  iconRight?: boolean;
  type?: 'button' | 'submit' | 'reset';
  stopPropagation?: boolean;
  preventDefault?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  variant: 'primary',
  loading: false,
  customClass: () => ({}),
  size: 'md',
  fullWidth: false,
  iconSrc: '',
  iconAlt: '',
  iconRight: false,
  type: 'button',
  stopPropagation: false,
  preventDefault: false,
});

const emit = defineEmits<{
  click: [];
}>();

/**
 * Cada tono lleva el token de texto que corresponde a **su** fondo.
 *
 * El `secondary` usaba `text-tx-on-primary`, y no se puede leer: ese token es
 * `#1e1e2e` —un casi negro— y sobre `--secondary: #8839ef` da 3.03:1, contra el
 * 4.5:1 de WCAG 1.4.3 para texto normal. El color de texto sobre una marca
 * depende de la marca: el secundario de VasakOS es un violeta saturado, mucho
 * más oscuro que el `#dd7878` del primario, así que el casi negro que funciona
 * sobre el primario no funciona sobre el secundario. Por eso existe
 * `text-tx-on-secondary`, y el commentario del config-manager que lo escribe
 * dice exactamente eso: «el secundario no se parece al primario, así que el
 * color de texto tiene que ser propio».
 *
 * `text-tx-on-secondary` da 4.79:1 sobre `#8839ef`. El modo oscuro no tenía el
 * problema —ahí el secundario es `#cba6f7`, claro, y el casi negro da 8.07:1—
 * pero el token es el correcto en los dos modos, así que va en los dos.
 *
 * `danger` queda fuera de lo que arregla este cambio, y es a propósito: también
 * se leía mal en claro (3.02:1 sobre `#d20f39`), pero no hay token que lo
 * arregle. Habría que escribir `--text-on-danger`, y el config-manager no puede
 * derivarlo porque el esquema no declara los colores de estado —`--status-error`
 * está a mano en cada `main.css`, no sale de `vasak-default.json`. Ese token
 * viene con el trabajo de los esquemas, no con este.
 */
const variantClasses: Record<string, string> = {
  primary: 'bg-primary text-tx-on-primary hover:bg-primary/90',
  secondary: 'bg-secondary text-tx-on-secondary hover:bg-secondary/80',
  danger: 'bg-status-error text-tx-on-primary hover:bg-status-error/90',
};

const sizeClasses: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-2 text-base',
};

const handleClick = (event: Event) => {
  if (props.stopPropagation) event.stopPropagation();
  if (props.preventDefault) event.preventDefault();
  if (!props.disabled && !props.loading) {
    emit('click');
  }
};
</script>

<template>
  <button
    :type="props.type"
    @click="handleClick"
    class="rounded-corner transition-[background-color,opacity] duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    :class="[
      variantClasses[props.variant],
      sizeClasses[props.size],
      props.fullWidth ? 'w-full' : '',
      props.iconSrc && !props.label ? 'px-2 py-2' : '',
      customClass,
    ]"
    :disabled="props.disabled || props.loading"
  >
    <span v-if="loading" class="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
    <template v-if="props.iconSrc && !props.iconRight">
      <img :src="props.iconSrc" :alt="props.iconAlt || props.label" class="w-4 h-4" />
    </template>
    <span v-if="props.label">{{ props.label }}</span>
    <template v-if="props.iconSrc && props.iconRight">
      <img :src="props.iconSrc" :alt="props.iconAlt || props.label" class="w-4 h-4" />
    </template>
  </button>
</template>

<style scoped>
/* Ningún estilo adicional requerido */
</style>
