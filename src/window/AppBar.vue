<script lang="ts" setup>
/**
 * La barra de la ventana, en cualquiera de los cuatro lados.
 *
 * Es lo que en cada aplicación se llamaba `TopBarComponent`: dieciséis copias,
 * cinco variantes distintas. Acá va una sola, y deja de llamarse «top» porque
 * puede no estarlo.
 *
 * # Las ranuras
 *
 * `identidad` es el icono o el logo, que queda pegado al principio.
 * `titulo` es el nombre de la ventana, que no todas muestran.
 * La ranura por omisión es el contenido —pestañas, selectores, lo que sea— y es
 * la única que crece.
 * `centro` va **encima** de la barra, centrado respecto de la ventana entera.
 * `acciones` es lo de la aplicación que va junto a los controles de ventana.
 *
 * Los controles van siempre y al final, que es donde la gente los busca.
 *
 * # `data-tauri-drag-region`
 *
 * En la barra y en el hueco del contenido: sin decoración del compositor, esto
 * es lo único que deja mover la ventana arrastrándola. Va en los contenedores y
 * no en los botones, que tienen que poder apretarse.
 */
import { computed, provide } from 'vue';
import { CLAVE_DE_LA_BARRA, type PosicionDeLaBarra, usarLaBarra } from './tipos';
import WindowControls from './WindowControls.vue';

const props = withDefaults(
	defineProps<{
		/** Sin esto toma la del marco que la envuelve. */
		position?: PosicionDeLaBarra | null;
		title?: string;
		/** Los nombres de los controles de ventana, traducidos por la aplicación. */
		minimizeLabel?: string;
		maximizeLabel?: string;
		closeLabel?: string;
		/** Para una ventana sin botones propios: un diálogo, un asistente. */
		hideControls?: boolean;
	}>(),
	{
		position: null,
		title: '',
		minimizeLabel: 'Minimize',
		maximizeLabel: 'Maximize',
		closeLabel: 'Close',
		hideControls: false,
	}
);

const delMarco = usarLaBarra();
const posicion = computed<PosicionDeLaBarra>(() => props.position ?? delMarco.posicion.value);
const vertical = computed(() => posicion.value === 'left' || posicion.value === 'right');

// Puesta a mano, la barra manda sobre lo que diga el marco: así una ventana
// puede tener la barra fija aunque el resto del escritorio siga la preferencia.
//
// Se provee siempre y no sólo cuando viene por propiedad: lo que se provee es
// un `computed` que ya resuelve las dos fuentes, así que sin propiedad reexpone
// la del marco sin cambiarla. Con un `if` alrededor, el `provide` quedaba
// condicionado al orden de las llamadas de `setup`, que es justo lo que Vue
// pide no hacer.
provide(CLAVE_DE_LA_BARRA, {
	posicion,
	orientacion: computed(() => (vertical.value ? 'vertical' : 'horizontal')),
	vertical,
});
</script>

<template>
  <div
    class="relative flex shrink-0 items-center gap-2 p-1 font-title"
    :class="vertical ? 'h-full flex-col' : 'w-full'"
    data-tauri-drag-region>
    <div v-if="$slots.identidad" class="flex shrink-0 items-center" data-tauri-drag-region>
      <slot name="identidad" />
    </div>

    <!-- El título, que se corta antes de empujar al resto. Vertical no entra
         escrito de costado sin volverse ilegible, así que ahí no se dibuja: lo
         dice el gestor de ventanas igual. -->
    <p
      v-if="($slots.titulo || title) && !vertical"
      class="min-w-0 shrink truncate text-sm"
      data-tauri-drag-region>
      <slot name="titulo">{{ title }}</slot>
    </p>

    <!-- El contenido: lo único que crece, y lo que se desborda scrollea en el
         sentido de la barra en vez de empujar los controles fuera de la
         ventana. -->
    <div
      class="flex min-h-0 min-w-0 flex-1 items-center gap-2 overflow-auto"
      :class="vertical ? 'flex-col' : ''"
      data-tauri-drag-region>
      <slot />
    </div>

    <div v-if="$slots.acciones" class="flex shrink-0 items-center gap-1" :class="vertical ? 'flex-col' : ''">
      <slot name="acciones" />
    </div>

    <WindowControls
      v-if="!hideControls"
      :minimize-label="minimizeLabel"
      :maximize-label="maximizeLabel"
      :close-label="closeLabel" />

    <!-- `centro` va **encima** de la barra y no como una columna más.
         Centrado entre dos columnas queda centrado respecto de lo que sobra a
         los costados, no de la ventana: con el icono de un lado y tres
         controles del otro, eso lo corre visiblemente. Absoluto y al 50% queda
         donde la gente espera.

         `pointer-events-none` en el envoltorio para no tapar la zona de
         arrastre; lo que va adentro lo vuelve a encender. -->
    <div
      v-if="$slots.centro"
      class="pointer-events-none absolute flex items-center justify-center"
      :class="vertical
        ? 'inset-x-0 top-1/2 -translate-y-1/2 flex-col'
        : 'inset-y-0 left-1/2 -translate-x-1/2'">
      <div class="pointer-events-auto flex items-center gap-2" :class="vertical ? 'flex-col' : ''">
        <slot name="centro" />
      </div>
    </div>
  </div>
</template>
