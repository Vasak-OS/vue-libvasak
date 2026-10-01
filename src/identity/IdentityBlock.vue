<script setup lang="ts">
/**
 * Quién: el avatar, el nombre y una línea debajo.
 *
 * Sale de las dos tarjetas de usuario del escritorio (`UserMenuCard`,
 * `UserControlCenterCard`) y de la cabecera de un contacto. Las tres eran la
 * misma fila escrita tres veces, y en las tres el nombre largo empujaba lo de
 * al lado: acá el texto se corta y la ranura `trailing` (un botón, una
 * insignia) no se mueve.
 *
 * No es un encabezado: el nombre es un `<p>`. Quien lo use como el título de
 * una pantalla pasa `as="h2"`.
 */
import Avatar, { type AvatarSize } from './Avatar.vue';

withDefaults(
	defineProps<{
		title: string;
		subtitle?: string;
		src?: string | null;
		/** El nombre para las iniciales, si no es `title`. */
		name?: string;
		size?: AvatarSize;
		as?: 'p' | 'h2' | 'h3';
	}>(),
	{ src: null, size: 'lg', as: 'p' }
);

defineSlots<{
	trailing?: () => unknown;
	avatar?: () => unknown;
}>();
</script>

<template>
  <div class="flex min-w-0 items-center gap-3" data-identity-block>
    <slot name="avatar">
      <!-- El nombre ya está escrito al lado: el avatar no lo repite. -->
      <Avatar :src="src" :name="name ?? title" alt="" :size="size" />
    </slot>
    <div class="flex min-w-0 flex-1 flex-col">
      <component
        :is="as"
        class="m-0 truncate font-semibold text-tx-main"
        :class="size === 'sm' || size === 'md' ? 'text-label-m' : 'text-heading-xs'">
        {{ title }}
      </component>
      <p v-if="subtitle" class="m-0 truncate text-body-s text-tx-muted">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.trailing" class="flex shrink-0 items-center gap-2">
      <slot name="trailing" />
    </div>
  </div>
</template>
