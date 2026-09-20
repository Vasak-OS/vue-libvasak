<script setup lang="ts">
/**
 * La vía y el pulgar de un interruptor. Sólo el dibujo.
 *
 * Existe suelto porque hay dos formas legítimas de usar un interruptor y las
 * dos tienen que verse igual: el control solo, con su etiqueta al lado, y **la
 * fila entera como botón** —etiqueta, descripción e interruptor dentro del
 * mismo `<button>`—, que da un blanco de clic mucho más grande y es lo que hace
 * el instalador. En el segundo caso no se puede meter un botón adentro de otro,
 * así que lo que se comparte es el dibujo y no el control.
 *
 * No escucha nada y va marcado `aria-hidden`: lo que se anuncia es el botón que
 * lo contiene, con su `role="switch"` y su `aria-checked`. Sin eso un lector de
 * pantalla leería dos veces la misma cosa.
 */
import { computed } from 'vue';

const props = withDefaults(defineProps<{ on: boolean; size?: 'small' | 'medium' }>(), {
	size: 'small',
});

const chico = computed(() => props.size === 'small');
</script>

<template>
  <span
    aria-hidden="true"
    class="inline-flex shrink-0 items-center rounded-full border transition-colors"
    :class="[
      chico ? 'h-6 w-11' : 'h-7 w-12',
      on ? 'border-transparent bg-primary' : 'border-ui-border-strong bg-ui-surface',
    ]">
    <!-- El pulgar es el primer plano de su vía. Con `bg-white` fijo daba 1,54 de
         contraste sobre la vía apagada en modo claro —contra el mínimo de 3,0
         que pide WCAG 1.4.11 para lo que delimita un control—, así que el
         estado del interruptor no se percibía. `tx-on-primary` está garantizado
         sobre el acento sea el que sea, y `tx-main` sobre la superficie. Lo
         encontró el escritorio; acá vale para todos. -->
    <span
      class="inline-block transform rounded-full shadow transition-transform"
      :class="[
        chico ? 'h-4 w-4' : 'h-5 w-5',
        on ? 'bg-tx-on-primary' : 'bg-tx-main',
        on ? 'translate-x-6' : 'translate-x-1',
      ]"></span>
  </span>
</template>
