<script setup lang="ts">
/**
 * Un interruptor de dos estados.
 *
 * ── Lo que le faltaba ───────────────────────────────────────────────────────
 *
 * Esto era un `<button>` pelado con un círculo adentro: se anunciaba como
 * «botón» y **no decía si estaba encendido o apagado**, que es la única
 * información que este control transmite. Tampoco tenía nombre: un botón cuyo
 * contenido es un círculo no tiene nada que leer.
 *
 * El escritorio y la configuración le agregaron `role="switch"`, `aria-checked`
 * y una etiqueta, cada uno por su lado y con el mismo comentario. Ahora está
 * acá, y `label` es **obligatorio**: en todos los usos la etiqueta ya está
 * escrita al lado del interruptor, así que quien lo usa pasa la misma cadena y
 * no hay que inventar ninguna.
 *
 * ── El contrato ─────────────────────────────────────────────────────────────
 *
 * `v-model`, como el resto de la librería. Antes era `isOn` con un evento
 * `toggle`, y las aplicaciones estaban repartidas entre eso, `v-model` y
 * `valor` con `cambiar`: tres formas de decir lo mismo. Es un cambio que rompe,
 * y se arregla en la misma pasada que adopta esta versión.
 *
 * El anillo de foco va acá adentro y no lo pone quien lo usa. Quien lo usaba
 * en el escritorio se lo agregaba por fuera con una clase suelta, que es
 * exactamente la señal de que faltaba adentro: sin él, recorrer con Tab es a
 * ciegas —WCAG 2.4.7— y cada aplicación lo resuelve o lo olvida por su cuenta.
 *
 * Es un `<button role="switch">` de verdad y no un `div` con un `@click`: es lo
 * que hace que responda a la barra espaciadora y reciba el foco con Tab sin
 * `tabindex` a mano.
 *
 * Para la fila entera clickeable —etiqueta, descripción e interruptor dentro de
 * un solo botón— no se usa esto sino `SwitchTrack`, que es el dibujo sin el
 * control: un botón no puede vivir adentro de otro.
 */
import SwitchTrack from './SwitchTrack.vue';

const props = withDefaults(
	defineProps<{
		modelValue: boolean;
		/** Qué controla este interruptor. Es su nombre accesible. */
		label: string;
		disabled?: boolean;
		size?: 'small' | 'medium';
	}>(),
	{ disabled: false, size: 'small' }
);

const emit = defineEmits<{ 'update:modelValue': [valor: boolean] }>();

function alternar() {
	emit('update:modelValue', !props.modelValue);
}
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :aria-label="label"
    :disabled="disabled"
    class="rounded-full transition-opacity disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    @click="alternar">
    <SwitchTrack :on="modelValue" :size="size" />
  </button>
</template>
