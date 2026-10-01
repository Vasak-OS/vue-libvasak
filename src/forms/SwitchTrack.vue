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
 *
 * # La forma (vue-libvasak#74)
 *
 * La vía de Once UI: 40 × 24 con pulgar de 16 en el tamaño chico (era 44 × 24)
 * y 48 × 28 con pulgar de 20 en el mediano, `rounded-corner-full`. Apagada, la
 * superficie con el borde de 3:1 (decisión 5); encendida, el primario. El
 * pulgar lleva `shadow-surface-xs` y recorre en 300 ms, con dos píxeles de aire
 * a cada lado en los dos estados.
 */
import { computed } from 'vue';

const props = withDefaults(defineProps<{ on: boolean; size?: 'small' | 'medium' }>(), {
	size: 'small',
});

const small = computed(() => props.size === 'small');
</script>

<template>
  <span
    aria-hidden="true"
    class="inline-flex shrink-0 items-center rounded-corner-full border transition-colors duration-200 ease-ui"
    :class="[
      small ? 'h-6 w-10' : 'h-7 w-12',
      on ? 'border-transparent bg-primary' : 'border-ui-border-strong bg-ui-surface',
    ]">
    <!-- El pulgar es el primer plano de su vía. Con `bg-white` fijo daba 1,54 de
         contraste sobre la vía apagada en modo claro —contra el mínimo de 3,0
         que pide WCAG 1.4.11 para lo que delimita un control—, así que el
         estado del interruptor no se percibía. `tx-on-primary` está garantizado
         sobre el acento sea el que sea, y `tx-main` sobre la superficie. Lo
         encontró el escritorio; acá vale para todos. -->
    <span
      class="inline-block rounded-corner-full shadow-surface-xs transition-[translate,background-color] duration-300 ease-ui"
      :class="[
        small ? 'size-4' : 'size-5',
        on ? 'bg-tx-on-primary' : 'bg-tx-main',
        on ? (small ? 'translate-x-5' : 'translate-x-6') : 'translate-x-0.5',
      ]"></span>
  </span>
</template>
