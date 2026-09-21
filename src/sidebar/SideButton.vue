<script lang="ts" setup>
/**
 * Un elemento de la barra lateral.
 *
 * ── Qué se anima y qué no ───────────────────────────────────────────────────
 *
 * `transition-all` obliga al navegador a mirar **cada** propiedad animable del
 * elemento en cada cambio, incluidas las que nadie toca: alcanza con que
 * alguien agregue un `height` a la clase para que empiece a interpolarse, y con
 * eso se paga layout de la lista entera sin haberlo pedido. Acá cambian tres
 * colores y la escala, así que la lista los nombra.
 *
 * `scale` y no `transform`: en Tailwind 4 las utilidades `scale-*` escriben la
 * propiedad nativa `scale`, así que nombrar `transform` deja el movimiento sin
 * animar —sin error, simplemente no transiciona—.
 *
 * Y se hunde un poco al apretarlo. `scale` es composición: cambiar el tamaño de
 * verdad sería layout de toda la lista. Las dos cosas las traía la copia de
 * resonance, que es de donde sale este componente.
 *
 * El icono sale del tema del escritorio y se vuelve a resolver cuando la
 * persona cambia de tema: por eso no se recibe una ruta sino un nombre. Plegado
 * queda sólo el icono, y el nombre pasa al `title` y al `aria-label` — sin eso,
 * una barra plegada es una columna de dibujos sin explicación, y para un lector
 * de pantalla un botón sin nombre.
 */
import ThemeIcon from '../icons/ThemeIcon.vue';

withDefaults(
	defineProps<{
		label: string;
		icon?: string;
		active?: boolean;
		collapsed?: boolean;
		disabled?: boolean;
		badge?: string | number;
	}>(),
	{ icon: '', active: false, collapsed: false, disabled: false, badge: '' }
);

defineEmits<{ click: [] }>();
</script>

<template>
  <button
    type="button"
    :title="collapsed ? label : undefined"
    :aria-label="collapsed ? label : undefined"
    :disabled="disabled"
    :aria-current="active ? 'page' : undefined"
    class="group relative flex w-full items-center gap-3 rounded-corner border px-3 py-2 text-left text-sm transition-[color,background-color,border-color,scale] duration-200 active:scale-[0.98]"
    :class="[
      active
        ? 'border-secondary bg-primary/15 text-tx-main shadow-sm'
        : 'border-transparent bg-transparent hover:border-ui-border hover:bg-ui-surface/70',
      disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
      collapsed ? 'justify-center px-2' : '',
    ]"
    @click="$emit('click')">
    <span
      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-corner font-semibold text-xs uppercase tracking-wide"
      :class="active ? 'border-secondary bg-primary/20' : ''"
      aria-hidden="true">
      <ThemeIcon v-if="icon" :name="icon" :size="20" />
      <!-- Sin icono, la inicial: un hueco vacío del mismo tamaño deja la fila
           desalineada contra las que sí lo tienen. -->
      <span v-else>{{ label.charAt(0).toUpperCase() }}</span>
    </span>

    <span v-if="!collapsed" class="min-w-0 flex-1 truncate font-medium">{{ label }}</span>

    <span
      v-if="!collapsed && badge !== ''"
      class="rounded-corner bg-ui-surface px-2 py-0.5 font-semibold text-tx-muted text-xs">
      {{ badge }}
    </span>
  </button>
</template>
