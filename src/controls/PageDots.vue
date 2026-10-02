<script setup lang="ts">
/**
 * Puntos para pasar de una página a otra: el activo en el primario.
 *
 * Es lo que va al pie del reproductor desplegable del escritorio cuando hay
 * más de un reproductor abierto (vasak-desktop#131): un punto por reproductor,
 * y tocarlo pasa a ése. Sirve para cualquier cosa que se recorra de a una —un
 * carrusel, los pasos de una presentación—.
 *
 * # Uno solo no se dibuja
 *
 * Con `count` en 0 o 1 no hay nada que elegir, y no se dibuja nada: ni la
 * fila, ni un hueco. Quien lo pone no tiene que preguntar antes.
 *
 * # Teclado y lector de pantalla
 *
 * Es un grupo de botones con nombre (`label`); cada punto se llama como diga
 * `labels[i]`, o «N de M» si no. El activo lleva `aria-current`. Un solo Tab
 * entra al grupo, en el activo, y las flechas (y Inicio / Fin) se mueven y
 * eligen, como en `OptionGroup`.
 *
 * # La forma
 *
 * El punto se ve de 8 px y el activo se estira a una píldora de 20 en
 * `bg-primary`; los demás van en `ui-border-strong`, que el config-manager
 * calcula para llegar a 3:1 contra el fondo. Cada botón mide 32 × 32 para que
 * se pueda apuntar aunque el punto sea chico. El cambio de ancho es una
 * transición corta, y con `prefers-reduced-motion` no se anima.
 */
import { computed, nextTick, ref } from 'vue';
import { useLabels } from '../shared/labels';

const props = withDefaults(
	defineProps<{
		/** Cuántas páginas hay. */
		count: number;
		/** Cuál es la activa, desde 0. */
		modelValue?: number;
		/** El nombre del grupo, ya traducido. */
		label?: string;
		/** El nombre de cada punto, ya traducido. */
		labels?: readonly string[];
		disabled?: boolean;
	}>(),
	{ modelValue: 0, label: undefined, labels: () => [], disabled: false }
);

const emit = defineEmits<{
	'update:modelValue': [index: number];
	/** Se eligió otra página. */
	change: [index: number];
}>();

const translate = useLabels();
const root = ref<HTMLElement | null>(null);

const total = computed(() => Math.max(0, Math.floor(props.count)));
const active = computed(() => Math.min(Math.max(props.modelValue, 0), Math.max(total.value - 1, 0)));
const groupName = computed(() => props.label ?? translate('pager.label', 'Pages'));

function nameOf(index: number): string {
	const given = props.labels[index];
	if (given) return given;
	const template = translate('pager.item', '{0} of {1}');
	return template.replace('{0}', String(index + 1)).replace('{1}', String(total.value));
}

function select(index: number): void {
	if (props.disabled || index === active.value) return;
	emit('update:modelValue', index);
	emit('change', index);
}

async function onKeydown(event: KeyboardEvent): Promise<void> {
	const last = total.value - 1;
	const targets: Record<string, number> = {
		ArrowRight: Math.min(active.value + 1, last),
		ArrowDown: Math.min(active.value + 1, last),
		ArrowLeft: Math.max(active.value - 1, 0),
		ArrowUp: Math.max(active.value - 1, 0),
		Home: 0,
		End: last,
	};
	const target = targets[event.key];
	if (target === undefined) return;
	event.preventDefault();
	select(target);
	await nextTick();
	root.value?.querySelector<HTMLButtonElement>(`[data-dot="${target}"]`)?.focus();
}
</script>

<template>
  <div
    v-if="total > 1"
    ref="root"
    role="group"
    :aria-label="groupName"
    class="flex items-center justify-center"
    data-page-dots
    @keydown="onKeydown">
    <button
      v-for="index in total"
      :key="index"
      type="button"
      class="group flex size-8 items-center justify-center rounded-corner-full focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ui-focus disabled:cursor-default"
      :class="disabled ? '' : 'cursor-pointer'"
      :aria-label="nameOf(index - 1)"
      :aria-current="index - 1 === active ? 'true' : undefined"
      :tabindex="index - 1 === active ? 0 : -1"
      :disabled="disabled"
      :data-dot="index - 1"
      @click="select(index - 1)">
      <span
        class="block h-2 rounded-corner-full transition-[width,background-color] duration-200 ease-ui motion-reduce:transition-none"
        :class="
          index - 1 === active
            ? 'w-5 bg-primary'
            : 'w-2 bg-ui-border-strong group-hover:bg-tx-muted'
        " />
    </button>
  </div>
</template>
