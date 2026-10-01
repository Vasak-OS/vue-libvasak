<script setup lang="ts">
/**
 * Pares de nombre y valor: el resumen del instalador, los datos de un
 * contacto, la ficha de un paquete, la información del sistema.
 *
 * Unos doce en cinco aplicaciones, casi todos como una grilla de `div` que un
 * lector de pantalla lee como una sopa de palabras. Acá es una lista de
 * definiciones (`<dl>`), que dice qué valor es de qué nombre.
 *
 * # Formas
 *
 * - `grid`: el nombre a la izquierda y el valor a la derecha, alineados en
 *   columna. Angosta (menos de 20 rem **de la lista**, no de la pantalla), el
 *   nombre va arriba del valor: dos columnas de 120 px no se leen.
 * - `rows`: una fila por par con divisor, el valor al extremo derecho. La de
 *   la ficha de la tienda.
 * - `inline`: los pares uno al lado del otro y partidos donde no entren.
 *
 * Un valor largo —una ruta, un identificador— se parte, nunca empuja la
 * lista hacia afuera. `mono` lo pone en letra de ancho fijo.
 *
 * La ranura `value` recibe el par y su índice, para un valor que no es texto
 * (una insignia, un enlace).
 */
export interface PropertyItem {
	label: string;
	value?: string | number | null;
	mono?: boolean;
	/** Para el `key` del `v-for` cuando dos nombres se repiten. */
	id?: string;
}

withDefaults(
	defineProps<{
		items: readonly PropertyItem[];
		layout?: 'grid' | 'rows' | 'inline';
	}>(),
	{ layout: 'grid' }
);

defineSlots<{
	value?: (props: { item: PropertyItem; index: number }) => unknown;
}>();
</script>

<template>
  <div class="@container min-w-0" data-property-list>
    <dl
      class="m-0 min-w-0"
      :class="{
        'grid grid-cols-1 gap-x-4 gap-y-2 @xs:grid-cols-[minmax(0,max-content)_minmax(0,1fr)]': layout === 'grid',
        'flex flex-col divide-y divide-ui-line-weak': layout === 'rows',
        'flex flex-wrap gap-x-4 gap-y-1': layout === 'inline',
      }"
      :data-layout="layout">
      <div
        v-for="(item, index) in items"
        :key="item.id ?? `${index}-${item.label}`"
        class="min-w-0"
        :class="{
          'grid grid-cols-subgrid gap-y-0 @xs:col-span-2': layout === 'grid',
          'flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2': layout === 'rows',
          'flex items-baseline gap-1': layout === 'inline',
        }">
        <dt class="m-0 text-label-s text-tx-muted" :class="layout === 'inline' ? 'shrink-0 whitespace-nowrap' : 'min-w-0 break-words'">{{ item.label }}<template v-if="layout === 'inline'">:</template></dt>
        <dd
          class="m-0 min-w-0 break-words text-label-m text-tx-main"
          :class="[item.mono ? 'font-mono' : '', layout === 'rows' ? 'text-right' : '']">
          <slot name="value" :item="item" :index="index">{{ item.value ?? '' }}</slot>
        </dd>
      </div>
    </dl>
  </div>
</template>
