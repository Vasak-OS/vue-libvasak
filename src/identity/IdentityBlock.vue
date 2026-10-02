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
 * una pantalla pasa `as="h1"` o `as="h2"`.
 *
 * # Lo que sumó la 2.4.0 (lo pidió la ficha de Contactos, contacts#47)
 *
 * - La ranura `details`, debajo del subtítulo: la empresa y el cargo, una
 *   insignia, una línea con enlaces. Lo que no es una sola línea de texto.
 * - `as="h1"`: la ficha de un contacto es la pantalla entera.
 * - `wrap`: el nombre y el subtítulo se **parten** en vez de cortarse con
 *   «…». Cortar está bien en una fila de lista, donde el nombre entero sigue
 *   en otro lado; en la cabecera de una ficha es el único lugar donde está, y
 *   cortarlo es perderlo.
 * - `stack`: la forma apilada —el avatar arriba, el texto centrado debajo y
 *   `trailing` al pie—. `always` siempre; `narrow` por el ancho que le dan
 *   (`@container`), por debajo de 20 rem, que es la ficha en ventana angosta.
 *   En `never` (por omisión) es la fila de siempre, sin contenedor: un
 *   contenedor de consulta no se mide por lo que tiene adentro, y en una fila
 *   que se ajusta a su contenido el bloque quedaría en cero. Por eso en
 *   `narrow` la raíz es el contenedor y la fila va adentro, y en las otras dos
 *   la raíz es la fila misma, como hasta la 2.3. (Esto no va como comentario
 *   arriba de la raíz de la plantilla: eso la parte en un fragmento.)
 */
import { computed } from 'vue';
import Avatar, { type AvatarSize } from './Avatar.vue';

const props = withDefaults(
	defineProps<{
		title: string;
		subtitle?: string;
		src?: string | null;
		/** El nombre para las iniciales, si no es `title`. */
		name?: string;
		size?: AvatarSize;
		as?: 'p' | 'h1' | 'h2' | 'h3';
		/** Partir el texto en vez de cortarlo. */
		wrap?: boolean;
		/** La forma apilada: nunca, siempre o cuando el contenedor es angosto. */
		stack?: 'never' | 'always' | 'narrow';
	}>(),
	{ src: null, size: 'lg', as: 'p', wrap: false, stack: 'never' }
);

defineSlots<{
	trailing?: () => unknown;
	avatar?: () => unknown;
	details?: () => unknown;
}>();

const small = computed(() => props.size === 'sm' || props.size === 'md' || props.size === 'ml');
const titleSize = computed(() => {
	if (props.as === 'h1') return 'text-heading-m';
	return small.value ? 'text-label-m' : 'text-heading-xs';
});
const textFlow = computed(() => (props.wrap ? 'break-words' : 'truncate'));

/** La fila, la columna, o la columna que se vuelve fila desde 20 rem. */
const layout = computed(() => {
	// `items-center` en la fila; en la columna, además, el texto centrado.
	switch (props.stack) {
		case 'always':
			return 'flex-col items-center text-center';
		case 'narrow':
			return 'flex-col items-center text-center @xs:flex-row @xs:items-center @xs:text-start';
		default:
			return 'items-center';
	}
});
const textColumn = computed(() => {
	if (props.stack === 'always') return 'w-full';
	if (props.stack === 'narrow') return 'w-full @xs:w-auto @xs:flex-1';
	return 'flex-1';
});
</script>

<template>
  <div v-if="stack === 'narrow'" class="@container min-w-0" data-identity-block data-stack="narrow">
    <div class="flex min-w-0 gap-3" :class="layout">
      <slot name="avatar">
        <Avatar :src="src" :name="name ?? title" alt="" :size="size" />
      </slot>
      <div class="flex min-w-0 flex-col" :class="textColumn">
        <component :is="as" class="m-0 font-semibold text-tx-main" :class="[titleSize, textFlow]">{{ title }}</component>
        <p v-if="subtitle" class="m-0 text-body-s text-tx-muted" :class="textFlow">{{ subtitle }}</p>
        <div v-if="$slots.details" class="mt-1 flex min-w-0 flex-wrap items-center justify-center gap-2 @xs:justify-start" data-identity-details>
          <slot name="details" />
        </div>
      </div>
      <div v-if="$slots.trailing" class="flex shrink-0 items-center gap-2">
        <slot name="trailing" />
      </div>
    </div>
  </div>
  <div v-else class="flex min-w-0 gap-3" :class="layout" data-identity-block :data-stack="stack">
    <slot name="avatar">
      <!-- El nombre ya está escrito al lado: el avatar no lo repite. -->
      <Avatar :src="src" :name="name ?? title" alt="" :size="size" />
    </slot>
    <div class="flex min-w-0 flex-col" :class="textColumn">
      <component :is="as" class="m-0 font-semibold text-tx-main" :class="[titleSize, textFlow]">{{ title }}</component>
      <p v-if="subtitle" class="m-0 text-body-s text-tx-muted" :class="textFlow">{{ subtitle }}</p>
      <div
        v-if="$slots.details"
        class="mt-1 flex min-w-0 flex-wrap items-center gap-2"
        :class="stack === 'always' ? 'justify-center' : ''"
        data-identity-details>
        <slot name="details" />
      </div>
    </div>
    <div v-if="$slots.trailing" class="flex shrink-0 items-center gap-2">
      <slot name="trailing" />
    </div>
  </div>
</template>
