<script setup lang="ts">
/**
 * La cara de una persona: su foto, o sus iniciales.
 *
 * Sale de cuatro copias en tres aplicaciones: Contactos (las iniciales, la
 * imagen rota que cae a las iniciales, la caja fija que no se deforma con una
 * foto apaisada), las dos tarjetas de usuario del escritorio y la de
 * Configuración, que se puede editar.
 *
 * # Siempre algo
 *
 * Sin foto, o con una que no carga —un archivo que se borró, una dirección
 * vencida—, las iniciales del nombre; sin nombre, el icono genérico del tema
 * (`avatar-default`). La foto rota avisa con `error`.
 *
 * # Nombre
 *
 * La foto lleva `alt` (por omisión, el nombre). Las iniciales son la misma
 * persona, así que también lo llevan, como imagen con nombre: «JD» leído en
 * voz alta no dice nada.
 *
 * # Editable
 *
 * Con `editable`, el avatar es un botón con nombre («Cambiar la foto», del
 * catálogo `avatar.edit`) y un lápiz en la esquina; emite `edit`.
 *
 * Es redondo por naturaleza: `rounded-corner-full`.
 */
import { computed, ref, watch } from 'vue';
import ThemeIcon from '../icons/ThemeIcon.vue';
import { useLabels } from '../shared/labels';
import { initialsOf } from './initials';

export type AvatarSize = 'sm' | 'md' | 'ml' | 'lg' | 'xl' | '2xl';

const props = withDefaults(
	defineProps<{
		src?: string | null;
		/** El nombre de la persona: las iniciales y el `alt` por omisión. */
		name?: string;
		alt?: string;
		size?: AvatarSize;
		editable?: boolean;
		/** Lo que oye un lector de pantalla en el botón de editar. */
		editLabel?: string;
	}>(),
	{ src: null, name: '', size: 'md', editable: false }
);

const emit = defineEmits<{
	edit: [];
	error: [];
}>();

const translate = useLabels();

const broken = ref(false);
watch(
	() => props.src,
	() => {
		broken.value = false;
	}
);

const hasPhoto = computed(() => Boolean(props.src) && !broken.value);
const initials = computed(() => initialsOf(props.name));
const accessibleName = computed(() => props.alt ?? props.name);
const editText = computed(() => props.editLabel ?? translate('avatar.edit', 'Change picture'));

/**
 * 24, 32, 48 y 64: las alturas de control de Once UI, y la de la tarjeta.
 *
 * En la 2.4.0, `ml` (40) y `2xl` (96). El 40 es la tarjeta de usuario del menú
 * del escritorio (`UserMenuCard`), que seguía local por no tenerlo y mostraba
 * la imagen rota cuando no había foto; el 96, la cara de la pantalla de
 * bloqueo y del inicio de sesión.
 */
const BOX: Record<AvatarSize, string> = {
	sm: 'size-6 text-label-xs',
	md: 'size-8 text-label-s',
	ml: 'size-10 text-label-m',
	lg: 'size-12 text-heading-xs',
	xl: 'size-16 text-heading-m',
	'2xl': 'size-24 text-heading-l',
};
const ICON: Record<AvatarSize, number> = { sm: 14, md: 18, ml: 24, lg: 28, xl: 36, '2xl': 56 };

function onError(): void {
	broken.value = true;
	emit('error');
}
</script>

<template>
  <component
    :is="editable ? 'button' : 'span'"
    v-bind="editable ? { type: 'button', 'aria-label': editText } : {}"
    data-avatar
    class="relative inline-flex shrink-0 rounded-corner-full"
    :class="[
      BOX[size],
      editable
        ? 'group cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-focus'
        : '',
    ]"
    @click="editable && emit('edit')">
    <span
      class="flex size-full items-center justify-center overflow-hidden rounded-corner-full border border-ui-line bg-ui-selected-accent font-semibold text-tx-main"
      :role="!hasPhoto && accessibleName ? 'img' : undefined"
      :aria-label="!hasPhoto && accessibleName ? accessibleName : undefined">
      <img
        v-if="hasPhoto"
        :src="src ?? undefined"
        :alt="accessibleName"
        class="size-full object-cover"
        draggable="false"
        @error="onError" />
      <span v-else-if="initials" aria-hidden="true">{{ initials }}</span>
      <ThemeIcon v-else name="avatar-default" type="symbol" :size="ICON[size]" />
    </span>
    <span
      v-if="editable"
      aria-hidden="true"
      class="absolute -right-0.5 -bottom-0.5 flex size-5 items-center justify-center rounded-corner-full border border-ui-line bg-ui-float text-tx-main transition-colors duration-200 ease-ui group-hover:bg-ui-hover">
      <ThemeIcon name="document-edit" type="symbol" :size="12" />
    </span>
  </component>
</template>
