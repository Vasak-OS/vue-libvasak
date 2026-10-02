<script setup lang="ts">
/**
 * Un campo de contraseña con el botón de mostrar y el aviso de Bloq Mayús
 * (2.4.0).
 *
 * Sale del inicio de sesión y del bloqueo de vasak-session-manager, que lo
 * escribían dos veces a mano, y es el mismo campo que piden el agente de
 * polkit, la llave de GPG/SSH de vasak-keyring, la contraseña del wifi en
 * Configuración y la cuenta del instalador.
 *
 * Por dentro es el `TextInput` del sistema —32 de alto, el borde de 3:1, el
 * anillo de foco—, no una copia de sus clases.
 *
 * # Mostrar
 *
 * Un botón sin borde a la derecha, con el ojo del tema (`view-reveal-symbolic`
 * / `view-conceal-symbolic`) y `aria-pressed`: se anuncia «Mostrar la
 * contraseña, botón de alternar». No le roba el foco al campo
 * (`mousedown.prevent`), así que se puede mirar y seguir escribiendo. Cuando la
 * contraseña se vacía —el intento falló y la aplicación la borró— vuelve a
 * ocultarse: lo próximo que se escriba no tiene por qué quedar a la vista.
 * `revealable` en `false` lo saca, para la pantalla que no debe mostrarla.
 *
 * # Bloq Mayús
 *
 * Es la razón más común de que una contraseña correcta se rechace, y un campo
 * de contraseña no da ninguna otra pista. Se lee en cada tecla
 * (`getModifierState`), incluida la que lo cambia. El aviso va debajo, con el
 * icono de advertencia y el texto en `tx-main` —el amarillo del esquema como
 * texto no llega a 4,5:1—, y está atado al campo por `aria-describedby`, así
 * que se oye al escribir. Sale también como evento, `caps-lock`.
 *
 * Los textos: propiedad, catálogo (`password.show`, `password.hide`,
 * `password.capsLock`) y, sin nada, en inglés.
 *
 * No corrige ni capitaliza: una contraseña no es una palabra.
 */
import { computed, ref, useId, watch } from 'vue';
import ThemeIcon from '../icons/ThemeIcon.vue';
import { useLabels } from '../shared/labels';
import TextInput from './TextInput.vue';

const props = withDefaults(
	defineProps<{
		modelValue: string;
		/** El `id` del campo, para una etiqueta (`FormGroup`). Sin esto se genera uno. */
		id?: string;
		ariaLabel?: string;
		describedBy?: string;
		placeholder?: string;
		/** `current-password` para entrar; `new-password` para crear una. */
		autocomplete?: 'current-password' | 'new-password' | 'off';
		disabled?: boolean;
		invalid?: boolean;
		required?: boolean;
		size?: 'md' | 'lg';
		/** El botón de mostrar. */
		revealable?: boolean;
		/** El aviso de Bloq Mayús debajo del campo. */
		capsLockHint?: boolean;
		showLabel?: string;
		hideLabel?: string;
		capsLockLabel?: string;
	}>(),
	{
		id: undefined,
		ariaLabel: undefined,
		describedBy: undefined,
		placeholder: undefined,
		autocomplete: 'current-password',
		disabled: false,
		invalid: false,
		required: false,
		size: 'md',
		revealable: true,
		capsLockHint: true,
		showLabel: undefined,
		hideLabel: undefined,
		capsLockLabel: undefined,
	}
);

const emit = defineEmits<{
	'update:modelValue': [value: string];
	keydown: [event: KeyboardEvent];
	keyup: [event: KeyboardEvent];
	/** Bloq Mayús cambió. */
	'caps-lock': [on: boolean];
}>();

const translate = useLabels();
const generatedId = useId();
const fieldId = computed(() => props.id ?? `${generatedId}-password`);
const capsId = computed(() => `${fieldId.value}-caps`);

const revealed = ref(false);
const capsLock = ref(false);
const field = ref<InstanceType<typeof TextInput> | null>(null);

const showText = computed(() => props.showLabel ?? translate('password.show', 'Show password'));
const hideText = computed(() => props.hideLabel ?? translate('password.hide', 'Hide password'));
const capsText = computed(() => props.capsLockLabel ?? translate('password.capsLock', 'Caps Lock is on'));

const showsCaps = computed(() => props.capsLockHint && capsLock.value);
const describedByAll = computed(() => {
	const ids = [props.describedBy, showsCaps.value ? capsId.value : undefined].filter(Boolean);
	return ids.length > 0 ? ids.join(' ') : undefined;
});

const large = computed(() => props.size === 'lg');

function readCapsLock(event: KeyboardEvent) {
	// `getModifierState` no existe en un evento sintético viejo: sin eso no se
	// sabe, y no saber no es lo mismo que estar apagado, así que no se toca.
	if (typeof event.getModifierState !== 'function') return;
	const on = event.getModifierState('CapsLock');
	if (on === capsLock.value) return;
	capsLock.value = on;
	emit('caps-lock', on);
}

function onKeydown(event: KeyboardEvent) {
	readCapsLock(event);
	emit('keydown', event);
}

function onKeyup(event: KeyboardEvent) {
	readCapsLock(event);
	emit('keyup', event);
}

function toggle() {
	if (props.disabled) return;
	revealed.value = !revealed.value;
}

// Vaciada —un intento que falló, un formulario que se reinicia—, vuelve a
// ocultarse.
watch(
	() => props.modelValue,
	(value) => {
		if (value === '') revealed.value = false;
	}
);

/** Devuelve si el foco llegó, como `TextInput`. */
function focus(): boolean {
	return field.value?.focus() ?? false;
}

defineExpose({ focus, revealed, capsLock });
</script>

<template>
  <div class="flex min-w-0 flex-col gap-1" data-password-field>
    <div class="relative flex min-w-0 items-center">
      <TextInput
        :id="fieldId"
        ref="field"
        :type="revealed ? 'text' : 'password'"
        :model-value="modelValue"
        :ariaLabel="ariaLabel"
        :described-by="describedByAll"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :disabled="disabled"
        :invalid="invalid"
        :required="required"
        :size="size"
        :spellcheck="false"
        autocapitalize="none"
        :class="revealable ? (large ? 'pr-12' : 'pr-10') : ''"
        @update:model-value="emit('update:modelValue', $event)"
        @keydown="onKeydown"
        @keyup="onKeyup" />
      <button
        v-if="revealable"
        type="button"
        class="absolute flex size-8 items-center justify-center rounded-corner-s text-tx-main transition-colors duration-200 ease-ui hover:bg-ui-hover active:bg-ui-pressed active:duration-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ui-focus disabled:cursor-not-allowed disabled:opacity-50"
        :class="large ? 'right-1' : 'right-0'"
        :aria-label="revealed ? hideText : showText"
        :aria-pressed="revealed"
        :aria-controls="fieldId"
        :disabled="disabled"
        @mousedown.prevent
        @click="toggle">
        <ThemeIcon :name="revealed ? 'view-conceal-symbolic' : 'view-reveal-symbolic'" type="symbol" :size="16" />
      </button>
    </div>
    <p v-if="showsCaps" :id="capsId" class="m-0 flex min-w-0 items-start gap-1 text-body-xs text-tx-main" data-caps-lock>
      <ThemeIcon name="dialog-warning-symbolic" type="symbol" :size="16" class="shrink-0" />
      <span class="min-w-0 break-words">{{ capsText }}</span>
    </p>
  </div>
</template>
