<script lang="ts" setup>
/**
 * Un elemento de la barra lateral.
 *
 * ── La forma (vue-libvasak#74) ─────────────────────────────────────────────
 *
 * La opción de una lista de Once UI: `rounded-corner-m`, **sin borde en ningún
 * estado** —antes aparecía uno al pasar por encima y el activo llevaba el canto
 * secundario, el relleno del primario y una sombra—. Pasar por encima es el
 * velo neutro `ui-hover`; apretar, `ui-pressed`; el activo, el velo de acento
 * `ui-selected-accent` con peso 600 (decisión 4: lo elegido se marca con el
 * color de acento). Nada escala al apretar: Once UI no mueve los controles. El
 * alto es el de antes, para que la barra de Configuración no cambie de
 * distribución.
 *
 * Se anima el color y nada más: `transition-colors`, que no puede tocar el
 * maquetado.
 *
 * El icono sale del tema del escritorio y se vuelve a resolver cuando la
 * persona cambia de tema: por eso no se recibe una ruta sino un nombre. Plegado
 * queda sólo el icono, y el nombre pasa al `title` y al `aria-label` — sin eso,
 * una barra plegada es una columna de dibujos sin explicación, y para un lector
 * de pantalla un botón sin nombre.
 *
 * ── Lo que sumó la 2.2.0 ───────────────────────────────────────────────────
 *
 * `description`, una línea debajo del nombre —el `PasoBoton` del instalador:
 * «Disco · Dónde se instala»—, atada con `aria-describedby`; plegado no se
 * ve y pasa al `title`. Y la ranura `icon`, para lo que no es un icono del
 * tema: el número del paso, un `IconTile` con el estado.
 */
import { computed, useId } from 'vue';
import ThemeIcon from '../icons/ThemeIcon.vue';

const props = withDefaults(
	defineProps<{
		label: string;
		/** Una línea debajo del nombre. */
		description?: string;
		icon?: string;
		active?: boolean;
		collapsed?: boolean;
		disabled?: boolean;
		badge?: string | number;
	}>(),
	{ description: '', icon: '', active: false, collapsed: false, disabled: false, badge: '' }
);

defineEmits<{ click: [] }>();

defineSlots<{
	icon?: () => unknown;
}>();

const descriptionId = `${useId()}-description`;
/** Plegado, el globo dice el nombre y la línea de abajo. */
const collapsedTitle = computed(() =>
	props.description ? `${props.label} — ${props.description}` : props.label
);
</script>

<template>
  <button
    type="button"
    :title="collapsed ? collapsedTitle : undefined"
    :aria-label="collapsed ? label : undefined"
    :aria-describedby="description ? descriptionId : undefined"
    :disabled="disabled"
    :aria-current="active ? 'page' : undefined"
    class="group relative flex w-full min-w-0 items-center gap-3 rounded-corner-m px-3 py-2 text-left text-label-m text-tx-main transition-colors duration-200 ease-ui focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-focus"
    :class="[
      active ? 'bg-ui-selected-accent font-semibold' : 'bg-transparent',
      disabled
        ? 'cursor-not-allowed opacity-50'
        : active
          ? 'cursor-pointer'
          : 'cursor-pointer hover:bg-ui-hover active:bg-ui-pressed active:duration-100',
      collapsed ? 'justify-center px-2' : '',
    ]"
    @click="$emit('click')">
    <span
      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-corner-s font-semibold text-label-xs uppercase"
      aria-hidden="true">
      <slot name="icon">
        <ThemeIcon v-if="icon" :name="icon" :size="20" />
        <!-- Sin icono, la inicial: un hueco vacío del mismo tamaño deja la fila
             desalineada contra las que sí lo tienen. -->
        <span v-else>{{ label.charAt(0).toUpperCase() }}</span>
      </slot>
    </span>

    <span v-if="!collapsed && !description" class="min-w-0 flex-1 truncate">{{ label }}</span>
    <span v-else-if="!collapsed" class="flex min-w-0 flex-1 flex-col">
      <span class="min-w-0 truncate">{{ label }}</span>
      <span :id="descriptionId" class="min-w-0 truncate font-normal text-body-xs text-tx-muted">{{ description }}</span>
    </span>
    <!-- Plegado, la descripción no se ve pero sigue atada. -->
    <span v-if="collapsed && description" :id="descriptionId" class="sr-only">{{ description }}</span>

    <span
      v-if="!collapsed && badge !== ''"
      class="flex h-5 shrink-0 items-center rounded-corner-full bg-ui-selected px-2 font-semibold text-label-xs text-tx-main">
      {{ badge }}
    </span>
  </button>
</template>
