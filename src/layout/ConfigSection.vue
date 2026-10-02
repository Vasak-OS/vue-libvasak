<script setup lang="ts">
/**
 * Una sección de Configuración: título y lo que va adentro.
 *
 * La tarjeta de Once UI (vue-libvasak#74): `rounded-corner-l`, canto `ui-line`
 * y la superficie al 70 % —era `.background`, el fondo de la ventana sobre la
 * ventana—. El título es `text-heading-xs` en el color del texto: el acento es
 * para lo que actúa, y un título no actúa.
 *
 * # El icono era un error (arreglado en la 2.1.0)
 *
 * `icon` anteponía **el texto** del nombre al título: `icon="network-wired"`
 * dibujaba «network-wired Red». Ahora es un icono del tema, con `ThemeIcon`,
 * como en el resto de la librería. Nadie lo usaba al arreglarlo —contado en los
 * diecisiete repositorios—, que es probablemente por qué nadie lo había visto.
 *
 * # Lo que sumó la 2.1.0
 *
 * Sale de las tres copias que la reemplazan por su cuenta: el `SectionCard` de
 * Configuración (79 usos), el `SectionCard` del instalador y las tarjetas de
 * recursos del monitor.
 *
 * - `description`: la línea de abajo del título (del instalador).
 * - la ranura `header`, en lugar del título y la descripción, para una
 *   cabecera propia (la `encabezado` del instalador).
 * - la ranura `aside`, a la derecha de la cabecera: la métrica de las tarjetas
 *   del monitor («34 %»), un interruptor, un botón.
 * - la ranura `actions`, al pie, alineada a la derecha.
 *
 * La cabecera se acomoda por el ancho de la sección (`@container`): angosta, lo
 * de `aside` baja debajo del título.
 *
 * # Sin título (2.4.0)
 *
 * `title` es opcional. Sin título, sin descripción y sin las ranuras `header`
 * ni `aside`, la cabecera no se dibuja: hasta la 2.3 quedaba un `h3` vacío y el
 * hueco de su `gap`, y Configuración pasó 57 secciones sin título a `Panel`
 * para no verlo (settings#142).
 */
import { computed, useSlots } from 'vue';
import ThemeIcon from '../icons/ThemeIcon.vue';

interface Props {
  title?: string;
  /** Nombre de icono del tema, antes del título. */
  icon?: string;
  iconType?: 'icon' | 'symbol';
  description?: string;
  customClass?: string | Record<string, boolean>;
  /** El nivel del título en el documento. */
  as?: 'h2' | 'h3' | 'h4';
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  icon: '',
  iconType: 'symbol',
  description: '',
  customClass: () => ({}),
  as: 'h3',
});

defineSlots<{
  default?: () => unknown;
  header?: () => unknown;
  aside?: () => unknown;
  actions?: () => unknown;
}>();

const slots = useSlots();
/** Si hay algo que poner arriba. */
const hasHeader = computed(() => Boolean(props.title || props.description || props.icon || slots.header || slots.aside));
</script>

<template>
  <div
    class="flex min-w-0 flex-col gap-4 rounded-corner-l border border-ui-line bg-ui-surface/70 p-4 text-tx-main"
    :class="customClass"
  >
    <div v-if="hasHeader" class="@container min-w-0" data-config-section-header>
      <div class="flex min-w-0 flex-col gap-2 @xs:flex-row @xs:items-start @xs:justify-between @xs:gap-4">
        <slot name="header">
          <div class="flex min-w-0 items-start gap-2">
            <ThemeIcon v-if="icon" :name="icon" :type="iconType" :size="20" class="shrink-0" />
            <div class="flex min-w-0 flex-col gap-1">
              <component :is="as" v-if="title" class="m-0 break-words font-semibold text-heading-xs text-tx-main">
                {{ title }}
              </component>
              <p v-if="description" class="m-0 break-words text-body-s text-tx-muted">{{ description }}</p>
            </div>
          </div>
        </slot>
        <div v-if="$slots.aside" class="flex min-w-0 shrink-0 items-center gap-2"><slot name="aside" /></div>
      </div>
    </div>
    <slot />
    <div v-if="$slots.actions" class="flex min-w-0 flex-wrap items-center justify-end gap-2"><slot name="actions" /></div>
  </div>
</template>
