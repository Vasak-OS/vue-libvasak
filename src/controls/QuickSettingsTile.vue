<script setup lang="ts">
/**
 * Un mosaico de ajuste rápido: Wi-Fi, Bluetooth, No molestar, Luz nocturna.
 *
 * Lo pidió el centro de control del escritorio (vasak-desktop#174/#175): los
 * ajustes de su estado B son mosaicos de dos columnas, y casi todos los que
 * vienen —No molestar, Modo avión, Juegos, Luz nocturna— son interruptores.
 * Hasta ahora eran `ListRow` con el estado escrito en la segunda línea; el
 * encendido no se veía.
 *
 * # La forma (Once UI, vue-libvasak#74)
 *
 * Una tarjeta como `ToggleControl`: `rounded-corner-l`, canto `ui-line`, la
 * superficie al 70 %. **Encendido** es la tarjeta elegida —el velo de acento y
 * el canto del primario— y el icono va en un círculo del primario, teñido con
 * el color del texto sobre el primario. Apagado, el círculo es `ui-line-weak` y
 * el icono el del texto. Pasar por encima es el velo `ui-hover`, apretar
 * `ui-pressed`, y el foco el anillo `ui-focus` hacia adentro (la tarjeta
 * recorta lo que se sale, para que el velo siga la curva).
 *
 * # Dos toques, separados
 *
 * - El cuerpo hace **una** cosa: alterna (con `active` en `true`/`false`, y
 *   entonces lleva `aria-pressed`) o abre algo (con `active` en `null`, sin
 *   `aria-pressed`, que mentiría). Emite `activate`.
 * - Con `detail`, a la derecha va una zona aparte con la flecha › (`go-next`
 *   del tema) que emite `detail`: el detalle del ajuste. Es otro botón, con su
 *   nombre, no un botón adentro de otro.
 *
 * # No disponible
 *
 * `unavailable` es «este equipo no lo tiene» (sin radio, sin `ddcutil`): se ve
 * apagado, dice «No disponible» en la línea de estado y no se puede tocar —ni
 * el cuerpo ni el detalle—. Distinto de `disabled`, que es «ahora no» y deja el
 * estado que se pasó.
 *
 * # Se acomoda al lugar
 *
 * Es un contenedor: el título y el estado se cortan con el texto entero en el
 * globo, y por debajo de 9 rem el círculo del icono se va para que el nombre
 * no desaparezca. El alto mínimo es de 56 px y la zona del detalle de 32 de
 * ancho: los dos se tocan con el dedo.
 */
import { computed } from 'vue';
import ThemeIcon from '../icons/ThemeIcon.vue';
import { useLabels } from '../shared/labels';

const props = withDefaults(
	defineProps<{
		/** El nombre del icono en el tema del escritorio. */
		icon: string;
		/** Cuál de las dos variantes del tema. */
		iconType?: 'icon' | 'symbol';
		/** Qué ajuste es, ya traducido. */
		title: string;
		/** El estado, ya traducido: «Conectado a Casa», «Apagado». */
		status?: string;
		/**
		 * Encendido o apagado, si el mosaico **alterna** algo. `null` (por
		 * omisión) en los que abren otra cosa: ahí no hay `aria-pressed`.
		 */
		active?: boolean | null;
		/** Si tiene detalle: suma la zona de la flecha ›. */
		detail?: boolean;
		/** El nombre de la zona del detalle. Sin él, «Detalles de» + el título. */
		detailLabel?: string;
		/** «Ahora no»: no se puede tocar, el estado queda como está. */
		disabled?: boolean;
		/** «Este equipo no lo tiene». */
		unavailable?: boolean;
		/** El texto de no disponible, ya traducido. */
		unavailableLabel?: string;
		/** Mientras el cambio se aplica. */
		loading?: boolean;
	}>(),
	{
		iconType: 'symbol',
		status: undefined,
		active: null,
		detail: false,
		detailLabel: undefined,
		disabled: false,
		unavailable: false,
		unavailableLabel: undefined,
		loading: false,
	}
);

const emit = defineEmits<{ activate: []; detail: [] }>();

const translate = useLabels();

const isOn = computed(() => props.active === true && !props.unavailable);
const blocked = computed(() => props.disabled || props.unavailable);
const statusText = computed(() =>
	props.unavailable
		? (props.unavailableLabel ?? translate('quickSettings.unavailable', 'Not available'))
		: props.status
);
const detailName = computed(
	() => props.detailLabel ?? `${translate('quickSettings.details', 'Details')}: ${props.title}`
);
/** El texto entero, para el globo: el título y el estado se pueden cortar. */
const tooltip = computed(() => [props.title, statusText.value].filter(Boolean).join(' — '));

function activate() {
	if (blocked.value || props.loading) return;
	emit('activate');
}

function openDetail() {
	if (blocked.value) return;
	emit('detail');
}

const zone =
	'flex min-w-0 items-center text-tx-main transition-colors duration-200 ease-ui focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ui-focus disabled:cursor-not-allowed';
const touchable = computed(() =>
	blocked.value ? '' : 'cursor-pointer hover:bg-ui-hover active:bg-ui-pressed active:duration-100'
);
</script>

<template>
  <div
    class="@container flex min-h-14 min-w-0 overflow-hidden rounded-corner-l border transition-colors duration-200 ease-ui"
    :class="[
      isOn ? 'border-primary bg-ui-selected-accent' : 'border-ui-line bg-ui-surface/70',
      blocked ? 'opacity-50' : '',
    ]"
    :data-active="isOn ? 'true' : 'false'"
    :data-unavailable="unavailable ? 'true' : undefined">
    <button
      type="button"
      class="flex-1 gap-3 px-3 py-2 text-left"
      :class="[zone, touchable]"
      :disabled="blocked"
      :title="tooltip"
      :aria-pressed="active === null || unavailable ? undefined : active"
      :aria-busy="loading || undefined"
      data-tile-main
      @click="activate">
      <span
        class="hidden size-9 shrink-0 items-center justify-center rounded-corner-full transition-colors duration-200 ease-ui @[9rem]:flex"
        :class="isOn ? 'bg-primary text-tx-on-primary' : 'bg-ui-line-weak text-tx-main'"
        :data-tile-icon="isOn ? 'on' : 'off'">
        <ThemeIcon
          :name="icon"
          :type="iconType"
          :size="20"
          tint
          :class="{ 'animate-pulse': loading }" />
      </span>
      <span class="flex min-w-0 flex-1 flex-col">
        <span class="truncate font-medium text-label-m" data-tile-title>{{ title }}</span>
        <span
          v-if="statusText"
          class="truncate text-body-xs font-normal text-tx-muted"
          data-tile-status>{{ statusText }}</span>
      </span>
    </button>
    <button
      v-if="detail"
      type="button"
      class="w-8 shrink-0 justify-center border-l border-ui-line-weak"
      :class="[zone, touchable]"
      :disabled="blocked"
      :aria-label="detailName"
      :title="detailName"
      data-tile-detail
      @click="openDetail">
      <ThemeIcon name="go-next" type="symbol" :size="16" tint />
    </button>
  </div>
</template>
