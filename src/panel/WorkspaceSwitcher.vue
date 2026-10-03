<script setup lang="ts">
/**
 * Los espacios de trabajo en una píldora: un número por espacio, el activo en
 * el primario.
 *
 * Es la píldora de los espacios del panel del escritorio (vasak-desktop#151):
 * «1 2 3 4 5 6 7 8» con el actual relleno. Cuántos hay lo dice el compositor
 * —Wayfire los arma en una grilla, y una de 3 × 2 son seis—, así que `count`
 * es dato y no una constante.
 *
 * # Teclado y lector de pantalla
 *
 * Es un grupo de botones con nombre (`label`); cada uno se llama como diga
 * `labels[i]`, o «Workspace N» del catálogo. El actual lleva `aria-current`.
 * Un solo Tab entra al grupo, en el actual, y las flechas (e Inicio / Fin)
 * mueven el foco **sin cambiar de espacio**: cambiar de espacio mueve todas
 * las ventanas de la pantalla, y eso no se hace de pasada con una flecha. Se
 * elige con Enter, Espacio o el clic, como cualquier botón.
 *
 * # La forma
 *
 * Por fuera es una `PanelPill` quieta (`ui-shell`, sin `backdrop-blur`).
 * Adentro, un botón de 32 de ancho por espacio —para que se pueda apuntar—
 * con un círculo de 24 y el número en cifras tabulares: el actual en
 * `bg-primary`, los demás en `tx-muted` con el velo `ui-hover` al pasar. De
 * costado (`orientation="vertical"`) se apilan. La píldora no se encoge
 * (`shrink-0`): en un panel angosto se cortan los textos de las demás, no los
 * números.
 */
import { computed, nextTick, ref } from 'vue';
import { useLabels } from '../shared/labels';
import PanelPill from './PanelPill.vue';

const props = withDefaults(
	defineProps<{
		/** Cuántos espacios hay. */
		count: number;
		/** Cuál es el actual, desde 0. */
		modelValue?: number;
		/** El nombre del grupo, ya traducido. */
		label?: string;
		/** El nombre de cada espacio, ya traducido. */
		labels?: readonly string[];
		orientation?: 'horizontal' | 'vertical';
		disabled?: boolean;
	}>(),
	{ modelValue: 0, label: undefined, labels: () => [], orientation: 'horizontal', disabled: false }
);

const emit = defineEmits<{
	'update:modelValue': [index: number];
	/** Se eligió otro espacio. */
	change: [index: number];
}>();

const translate = useLabels();
const root = ref<HTMLElement | null>(null);

const total = computed(() => Math.max(0, Math.floor(props.count)));
const active = computed(() => Math.min(Math.max(props.modelValue, 0), Math.max(total.value - 1, 0)));
const groupName = computed(() => props.label ?? translate('workspaces.label', 'Workspaces'));
/** Dónde está el foco del teclado dentro del grupo; arranca en el actual. */
const focused = ref<number | null>(null);
const tabStop = computed(() => focused.value ?? active.value);

function nameOf(index: number): string {
	const given = props.labels[index];
	if (given) return given;
	return translate('workspaces.item', 'Workspace {0}').replace('{0}', String(index + 1));
}

function select(index: number): void {
	focused.value = index;
	if (props.disabled || index === active.value) return;
	emit('update:modelValue', index);
	emit('change', index);
}

async function onKeydown(event: KeyboardEvent): Promise<void> {
	const last = total.value - 1;
	const current = tabStop.value;
	const targets: Record<string, number> = {
		ArrowRight: Math.min(current + 1, last),
		ArrowDown: Math.min(current + 1, last),
		ArrowLeft: Math.max(current - 1, 0),
		ArrowUp: Math.max(current - 1, 0),
		Home: 0,
		End: last,
	};
	const target = targets[event.key];
	if (target === undefined) return;
	event.preventDefault();
	focused.value = target;
	await nextTick();
	root.value?.querySelector<HTMLButtonElement>(`[data-workspace="${target}"]`)?.focus();
}
</script>

<template>
  <!-- `contents`: el envoltorio sólo junta el teclado; la caja es la píldora. -->
  <div
    v-if="total > 0"
    ref="root"
    class="contents"
    data-workspace-switcher
    @keydown="onKeydown"
    @focusout="focused = null">
  <PanelPill
    :interactive="false"
    :orientation="orientation"
    role="group"
    :accessible-label="groupName"
    flush
    class="shrink-0 gap-0">
    <button
      v-for="index in total"
      :key="index"
      type="button"
      class="group flex shrink-0 items-center justify-center rounded-corner-full focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ui-focus disabled:cursor-default"
      :class="[orientation === 'vertical' ? 'h-8 w-full' : 'h-full w-8', disabled ? '' : 'cursor-pointer']"
      :aria-label="nameOf(index - 1)"
      :aria-current="index - 1 === active ? 'true' : undefined"
      :tabindex="index - 1 === tabStop ? 0 : -1"
      :disabled="disabled"
      :data-workspace="index - 1"
      @click="select(index - 1)">
      <span
        class="flex size-6 items-center justify-center rounded-corner-full text-label-xs font-semibold tabular-nums transition-colors duration-200 ease-ui"
        :class="
          index - 1 === active
            ? 'bg-primary text-tx-on-primary'
            : 'text-tx-muted group-hover:bg-ui-hover group-hover:text-tx-main group-active:bg-ui-pressed'
        "
        data-workspace-mark>{{ index }}</span>
    </button>
  </PanelPill>
  </div>
</template>
