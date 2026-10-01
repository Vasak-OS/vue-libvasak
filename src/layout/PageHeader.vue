<script setup lang="ts">
/**
 * La cabecera de una página: de qué sección es, cómo se llama, qué se hace acá,
 * y las acciones de la página.
 *
 * Unas sesenta en seis aplicaciones. Sale de dos copias con nombre propio:
 *
 * - el `PageHeader` de vasak-settings (33 usos): **la sección arriba**
 *   (`eyebrow`), la descripción y la ranura `actions` a la derecha. Se
 *   acomodaba con `sm:`, el punto de corte **de la pantalla**: en una ventana
 *   angosta de una pantalla ancha, las acciones se apretaban al costado.
 * - el `PageHeader` del instalador (11): **el icono en un recuadro**, que
 *   repite el del paso de la barra lateral y es lo que ata la pantalla a ese
 *   paso.
 *
 * Y las cabeceras escritas a mano de resonance, la tienda, la galería y el
 * monitor.
 *
 * # Adaptable
 *
 * Por el ancho de la cabecera (`@container`), no de la pantalla: desde 448 px
 * las acciones van a la derecha, alineadas abajo con el título; más angosta,
 * debajo.
 *
 * # El tamaño del título
 *
 * `md` es el de 20 del instalador; `lg`, el de 24 de Configuración. Los dos
 * están para que pasar a la librería no le cambie el título a ninguna de las
 * dos (decisión 8: el formato no cambia).
 */
import ThemeIcon from '../icons/ThemeIcon.vue';

withDefaults(
	defineProps<{
		title: string;
		/** La línea chica de arriba: la sección a la que pertenece la página. */
		eyebrow?: string;
		description?: string;
		/** Nombre de icono del tema, en un recuadro a la izquierda. */
		icon?: string;
		iconType?: 'icon' | 'symbol';
		size?: 'md' | 'lg';
		/** El nivel del título. Una página tiene un solo `h1`. */
		as?: 'h1' | 'h2';
	}>(),
	{ iconType: 'icon', size: 'md', as: 'h1' }
);

defineSlots<{
	actions?: () => unknown;
}>();
</script>

<template>
  <header class="@container min-w-0">
    <div class="flex min-w-0 flex-col gap-3 @md:flex-row @md:items-end @md:justify-between">
      <div class="flex min-w-0 items-start gap-3">
        <span
          v-if="icon"
          aria-hidden="true"
          class="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-corner-m border border-ui-line bg-ui-surface/70">
          <ThemeIcon :name="icon" :type="iconType" :size="24" />
        </span>
        <div class="flex min-w-0 flex-col gap-1">
          <p v-if="eyebrow" class="m-0 break-words font-semibold text-label-xs tracking-wider text-tx-muted uppercase">{{ eyebrow }}</p>
          <component
            :is="as"
            class="m-0 break-words font-semibold text-tx-main"
            :class="size === 'lg' ? 'text-heading-l' : 'text-heading-m'">
            {{ title }}
          </component>
          <p v-if="description" class="m-0 max-w-prose break-words text-body-s text-tx-muted">{{ description }}</p>
        </div>
      </div>
      <div v-if="$slots.actions" class="flex min-w-0 flex-wrap items-center gap-2">
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>
