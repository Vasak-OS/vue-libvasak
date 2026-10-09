<script lang="ts" setup>
/**
 * El marco de una ventana de VasakOS.
 *
 * Es la ventana entera: el borde, la esquina redondeada, el fondo y el recorte,
 * más la barra y el contenido. Estaba copiado en dieciocho repositorios con
 * catorce formas distintas —cada uno derivó por su lado— y era la razón de que
 * dos ventanas del mismo escritorio no se parecieran.
 *
 * # Los cuatro lados
 *
 * La barra queda donde diga `~/.config/vasak/vasak.conf` en `window.barPosition`,
 * y se mueve en las ventanas abiertas cuando eso cambia. `position` la fija a
 * mano para una ventana que no deba seguir la preferencia.
 *
 * El acomodo sale de la dirección del `flex`: arriba es una columna, abajo la
 * misma columna al revés, izquierda una fila y derecha la fila al revés. Así la
 * barra siempre es el primer hijo y lo que cambia es de qué lado empieza a
 * contarse, que es lo que evita cuatro plantillas distintas.
 *
 * # Las ranuras
 *
 * `identidad`, `titulo`, `barra`, `centro` y `acciones` van a la barra; el
 * resto, al contenido. `centro` queda centrado respecto de **la ventana** y no
 * de lo que sobra entre el icono y los controles, que es lo que hacía falta
 * para el mes del calendario, el buscador de la agenda y la carpeta del correo.
 *
 * # Los botones de la ventana
 *
 * `controls` dice cuáles lleva, y escuchar `close` —o `minimize`, o
 * `maximize`— reemplaza lo que hace el botón. Ver `WindowControls`.
 *
 * # El fondo
 *
 * `bg-ui-bg/80` acá y sólo acá: `--ui-background` es el token de **la ventana**.
 * Lo que se apoya encima —paneles, barras laterales, tarjetas— va en
 * `bg-ui-surface/70`.
 *
 * La forma (vue-libvasak#74): conserva `rounded-corner-window` y el fondo de
 * la ventana —es el único lugar donde `bg-ui-bg` corresponde—, y el canto pasa
 * a `ui-line`, que en oscuro aclara en vez de verse como un hueco.
 *
 * # El borde de afuera y los botones (2.16.0)
 *
 * El canto es `window-border`: `ui-line` de 1 px salvo que la persona elija en
 * Configuración el grueso o el color de acento. Y el marco lee una vez las
 * preferencias de ventana —dónde va la barra, el estilo y el orden de los
 * botones— y se las provee a la barra. Ver `window-preferences.ts`.
 */
import { computed, provide } from 'vue';
import { useWindowPreferences, WINDOW_CONTROLS_KEY } from './window-preferences';
import { reenviarSiEscuchan } from './reenvio';
import {
	CLAVE_DE_LA_BARRA,
	type ControlDeVentana,
	LOS_TRES_CONTROLES,
	orientacionDe,
	type PosicionDeLaBarra,
} from './tipos';
import AppBar from './AppBar.vue';

const props = withDefaults(
	defineProps<{
		/** Fija la barra a un lado, ignorando la preferencia del escritorio. */
		position?: PosicionDeLaBarra | null;
		title?: string;
		/**
		 * Las tres etiquetas de los botones de ventana.
		 *
		 * Sin pasar nada salen del catálogo de la aplicación. Ver `WindowControls`,
		 * que es donde se resuelven.
		 */
		minimizeLabel?: string;
		maximizeLabel?: string;
		closeLabel?: string;
		/**
		 * Cuáles de los tres botones de ventana lleva. Vacío en un cuadro de
		 * diálogo y en el instalador; sólo `close` en el mini-reproductor.
		 */
		controls?: ControlDeVentana[];
		/** Para una ventana que dibuja su propia barra o no lleva ninguna. */
		hideBar?: boolean;
	}>(),
	{
		position: null,
		title: '',
		controls: () => LOS_TRES_CONTROLES,
		hideBar: false,
	}
);

defineEmits<{
	minimize: [];
	maximize: [];
	close: [];
}>();

const { barPosition: preferred, controlsStyle, controlsOrder } = useWindowPreferences();
const barPosition = computed<PosicionDeLaBarra>(() => props.position ?? preferred.value);
provide(WINDOW_CONTROLS_KEY, { controlsStyle, controlsOrder });
const orientation = computed(() => orientacionDe(barPosition.value));
const vertical = computed(() => orientation.value === 'vertical');

// Los campos del contexto siguen en castellano: son el contrato público de
// `ContextoDeLaBarra`, que esta tanda no toca.
provide(CLAVE_DE_LA_BARRA, { posicion: barPosition, orientacion: orientation, vertical });

/** De qué lado empieza a contarse el `flex`. */
const DIRECTION: Record<PosicionDeLaBarra, string> = {
	top: 'flex-col',
	bottom: 'flex-col-reverse',
	left: 'flex-row',
	right: 'flex-row-reverse',
};
</script>

<template>
  <div
    class="flex h-screen w-screen overflow-hidden rounded-corner-window window-border bg-ui-bg/80 text-tx-main"
    :class="DIRECTION[barPosition]">
    <AppBar
      v-if="!hideBar"
      :position="barPosition"
      :title="title"
      :minimize-label="minimizeLabel"
      :maximize-label="maximizeLabel"
      :close-label="closeLabel"
      :controls="controls"
      v-on="reenviarSiEscuchan(['minimize', 'maximize', 'close'])">
      <template v-if="$slots.identidad" #identidad><slot name="identidad" /></template>
      <template v-if="$slots.titulo" #titulo><slot name="titulo" /></template>
      <template v-if="$slots.centro" #centro><slot name="centro" /></template>
      <template v-if="$slots.acciones" #acciones><slot name="acciones" /></template>
      <slot name="barra" />
    </AppBar>

    <!-- `min-h-0` y `min-w-0`: un hijo de `flex` no se encoge por debajo de su
         contenido sin esto, así que una lista larga empujaba la barra fuera de
         la ventana en vez de scrollear. -->
    <div class="flex min-h-0 min-w-0 flex-1">
      <slot />
    </div>
  </div>
</template>
