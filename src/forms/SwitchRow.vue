<script lang="ts" setup>
/**
 * Una opción con su interruptor, donde la fila entera es el botón.
 *
 * Es la segunda forma que `SwitchTrack` dice tener y que hasta ahora no estaba
 * escrita en ningún lado: la etiqueta, la descripción y el interruptor dentro
 * del mismo `<button>`, que da un blanco de clic mucho más grande que un
 * rectángulo de once píxeles de alto. La armaba el instalador a mano; con la
 * vía suelta y sin la fila, la siguiente aplicación que la necesite la vuelve a
 * armar a mano y otra vez derivan.
 *
 * # Un `<button role="switch">` y no un `div` con `@click`
 *
 * Es lo que hace que el control se anuncie como interruptor, responda a la
 * barra espaciadora y reciba el foco con Tab sin `tabindex` a mano.
 *
 * # Su nombre es el texto que se ve
 *
 * El texto está **adentro** del botón, así que ya es su nombre accesible: acá
 * no va `aria-label`. Ponerlo taparía lo que se lee —el lector diría una cosa y
 * la pantalla otra— y dejaría sin blanco a quien maneja la interfaz por voz,
 * que nombra lo que ve. Es la diferencia con `SwitchToggle`, donde el label
 * **sí** va por propiedad porque no hay ningún texto adentro del que sacarlo.
 *
 * # El pie va en la columna del texto
 *
 * La ranura `pie` cuelga debajo de la descripción y alineada con ella. En el
 * instalador esto se ponía afuera, con un margen a mano calculado sobre la
 * estructura interna de la fila —interruptor, hueco, icono, hueco—, y quedaba
 * veinte píxeles a la izquierda. Un margen que sigue la disposición de otro
 * componente se desincroniza en cuanto ese componente cambia, y nadie se
 * entera.
 */
import ThemeIcon from '../icons/ThemeIcon.vue';
import SwitchTrack from './SwitchTrack.vue';

const props = withDefaults(
	defineProps<{
		modelValue: boolean;
		/** El nombre de la opción. Se dibuja, y es el nombre accesible de la fila. */
		label: string;
		/** Una línea debajo, para lo que el nombre no alcanza a decir. */
		description?: string;
		/** Del tema, por nombre. Las opciones sin identidad propia no llevan. */
		icon?: string;
		iconType?: 'icon' | 'symbol';
		disabled?: boolean;
	}>(),
	{ iconType: 'icon', disabled: false }
);

const emit = defineEmits<{ 'update:modelValue': [valor: boolean] }>();
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :disabled="disabled"
    class="flex w-full items-start gap-3 rounded-corner p-2 text-left transition-colors hover:bg-ui-surface/60 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    @click="emit('update:modelValue', !props.modelValue)">
    <SwitchTrack :on="modelValue" class="mt-0.5" />

    <!-- El icono de la opción, no el del interruptor: es la marca de qué se
         está activando —una tarjeta de vídeo, una impresora— y no dice nada del
         estado, así que no se lee. -->
    <span
      v-if="icon"
      class="flex size-10 shrink-0 items-center justify-center rounded-corner border"
      :class="modelValue ? 'border-secondary bg-primary/20' : 'border-ui-border bg-ui-surface/40'"
      aria-hidden="true">
      <ThemeIcon :name="icon" :type="iconType" :size="24" alt="" />
    </span>

    <span class="min-w-0 flex-1">
      <span class="block font-medium text-sm text-tx-main">{{ label }}</span>
      <span v-if="description" class="mt-0.5 block text-tx-muted text-xs">{{ description }}</span>
      <slot name="pie" />
    </span>
  </button>
</template>
