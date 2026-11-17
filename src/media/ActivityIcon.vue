<script setup lang="ts">
/**
 * El icono de una actividad del panel, con su avance en un aro alrededor
 * (2.23.0).
 *
 * Es cada ítem de la fila de la cápsula de actividad del escritorio
 * (`TrayMusicControl`) cuando hay más de una cosa a la vez: la música, una
 * descarga, una transferencia. Antes esa fila eran `ActionButton` sueltos y el
 * avance se perdía; acá cada icono lleva su aro, como el disco del reproductor
 * cuando hay una sola.
 *
 * # El aro
 *
 * `progress` (0–100) dibuja cuánto va en un aro alrededor del icono. Es el mismo
 * aro de `SpinningCover`, en CSS y no en SVG —la librería no dibuja SVG propio—:
 * un `conic-gradient` del primario sobre el canto, recortado en anillo con una
 * máscara. Sin `progress` no hay aro y el icono ocupa lo mismo.
 *
 * # Botón que se puede leer
 *
 * Es siempre un `<button>` con nombre (`label`, obligatorio: un icono no tiene
 * texto que leer) y emite `click`. Lo de adentro no se anuncia aparte, así que
 * el avance se suma al nombre y el aro se calla, igual que `SpinningCover`.
 *
 * El icono va por nombre del tema (`icon`), con los respaldos de `ThemeIcon`
 * para los iconos de otra aplicación que el tema puede no tener. La forma sale
 * del sistema: `rounded-corner-full`, el canto en `ui-line`, la cara en la
 * superficie.
 */
import { computed } from 'vue';
import { useLabels } from '../shared/labels';
import ThemeIcon from '../icons/ThemeIcon.vue';

// El instalador global registra por `component.name`, que `<script setup>` no
// pone solo: sin esto, `app.use()` no expone la clave `ActivityIcon`.
defineOptions({ name: 'ActivityIcon' });

const props = withDefaults(
	defineProps<{
		/** El icono del tema. */
		icon: string;
		/** Otros nombres del tema, en orden, para cuando no tiene `icon`. */
		iconFallbacks?: readonly string[];
		/** El dibujo de otra aplicación, si ningún nombre resolvió. */
		iconFallbackSrc?: string;
		/** El nombre del botón: qué actividad es. Obligatorio. */
		label: string;
		/** Cuánto va, de 0 a 100. Sin esto no hay aro. */
		progress?: number | null;
		/** Cómo se llama el aro para un lector de pantalla. */
		progressLabel?: string;
		size?: 'sm' | 'md';
	}>(),
	{ iconFallbacks: () => [], iconFallbackSrc: '', progress: null, progressLabel: undefined, size: 'md' }
);

const emit = defineEmits<{
	/** Se tocó el icono. */
	click: [];
}>();

const translate = useLabels();

const hasProgress = computed(() => typeof props.progress === 'number' && Number.isFinite(props.progress));
const percent = computed(() => Math.min(Math.max(props.progress ?? 0, 0), 100));
const progressText = computed(() => props.progressLabel ?? translate('media.progress', 'Progress'));

/** Con avance, el aro se calla y el porcentaje va en el nombre; ver arriba. */
const buttonName = computed(() =>
	hasProgress.value ? [props.label, progressText.value, `${Math.round(percent.value)} %`].join(', ') : props.label
);

/** El aro: el primario hasta donde va y el canto el resto, en un anillo de 3 px. */
const ringStyle = computed(() => {
	const ring = 'radial-gradient(farthest-side, transparent calc(100% - 3px), currentColor calc(100% - 3px))';
	return {
		background: `conic-gradient(var(--color-primary) ${percent.value}%, var(--color-ui-line) 0)`,
		mask: ring,
		WebkitMask: ring,
	};
});

const box = computed(() => (props.size === 'sm' ? 'size-7' : 'size-8'));
const iconPx = computed(() => (props.size === 'sm' ? 14 : 18));
</script>

<template>
  <button
    type="button"
    :aria-label="buttonName"
    class="relative grid aspect-square shrink-0 cursor-pointer place-items-center rounded-corner-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-focus"
    :class="[box, hasProgress ? 'p-[3px]' : '']"
    data-activity-icon
    @click="emit('click')">
    <span
      v-if="hasProgress"
      aria-hidden="true"
      class="absolute inset-0 rounded-corner-full"
      :style="ringStyle"
      data-progress-ring />
    <span
      class="relative grid h-full w-full place-items-center overflow-hidden rounded-corner-full border border-ui-line bg-ui-surface">
      <ThemeIcon :name="icon" :fallbacks="iconFallbacks" :fallback-src="iconFallbackSrc" :size="iconPx" alt="" />
    </span>
  </button>
</template>
