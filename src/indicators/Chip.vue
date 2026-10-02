<script setup lang="ts">
/**
 * Una pastilla chica con un icono y un dato: «🎧 Auriculares», «vía Firefox».
 *
 * Es lo que va debajo del artista en el reproductor desplegable del escritorio
 * (vasak-desktop#131): la salida de audio, que al tocarla abre el selector, y
 * la aplicación de origen, que sólo informa. Hasta la 2.5.0 eso se armaba con
 * un `ActionButton` —que con un nombre largo se partía en dos renglones y se
 * dibujaba como un botón de formulario, con su canto— y una `Badge`, que no
 * lleva icono. Dos piezas de alto distinto para lo mismo.
 *
 * # Botón o no
 *
 * Con `interactive` la raíz es un `<button>` con su `type` y emite `click`;
 * sin él es un `<span>` quieto, que no se pinta al pasar el puntero. Lo mismo
 * que `TrayIconButton`: el que informa no promete un clic que no existe.
 *
 * # El texto no se parte
 *
 * Un nombre de dispositivo largo («Auriculares Bluetooth WH-1000XM4») se corta
 * con puntos suspensivos y el entero queda en el globo (`title`). La pastilla
 * no crece más que su contenedor (`max-w-full`, `min-w-0`).
 *
 * # La etiqueta
 *
 * `caption` va antes del dato, atenuada y en versalitas chicas: el «VIA» del
 * video de referencia. Es parte del nombre que se lee, no decoración.
 *
 * La forma (vue-libvasak#74): `bg-ui-surface/70` como los bloques internos,
 * canto `ui-line-weak`, radio `rounded-corner-full` derivado del del usuario,
 * 32 px de alto para que se pueda apuntar.
 */
import { computed } from 'vue';
import ThemeIcon from '../icons/ThemeIcon.vue';

const props = withDefaults(
	defineProps<{
		/** El dato. */
		label: string;
		/** Lo que va antes, atenuado: «vía», «de». */
		caption?: string;
		/** Un icono del tema, por nombre. */
		icon?: string;
		iconType?: 'icon' | 'symbol';
		/** La pastilla es un botón. */
		interactive?: boolean;
		/** El texto entero, para el globo. Sin esto, la etiqueta y el dato. */
		title?: string;
	}>(),
	{ caption: '', icon: '', iconType: 'symbol', interactive: false, title: undefined }
);

const emit = defineEmits<{
	/** Se tocó, con `interactive`. */
	click: [event: MouseEvent];
}>();

const fullText = computed(() => [props.caption, props.label].filter(Boolean).join(' '));
const tooltip = computed(() => props.title ?? fullText.value);

function onClick(event: MouseEvent): void {
	if (props.interactive) emit('click', event);
}
</script>

<template>
  <component
    :is="interactive ? 'button' : 'span'"
    v-bind="interactive ? { type: 'button' } : {}"
    class="inline-flex h-8 min-w-0 max-w-full items-center gap-2 rounded-corner-full border border-ui-line-weak bg-ui-surface/70 px-3 text-label-xs text-tx-main"
    :class="
      interactive
        ? 'cursor-pointer transition-colors duration-200 ease-ui hover:bg-ui-hover active:bg-ui-pressed active:duration-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-focus disabled:cursor-default disabled:opacity-50'
        : ''
    "
    :title="tooltip"
    data-chip
    @click="onClick">
    <ThemeIcon v-if="icon" :name="icon" :type="iconType" :size="16" alt="" class="shrink-0" />
    <span v-if="caption" class="shrink-0 font-medium text-tx-muted uppercase tracking-wide" data-caption>{{ caption }}</span>
    <span class="min-w-0 truncate font-medium" data-label>{{ label }}</span>
  </component>
</template>
