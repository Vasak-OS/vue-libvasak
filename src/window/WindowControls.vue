<script lang="ts" setup>
/**
 * Minimizar, maximizar y cerrar.
 *
 * Estaban copiados en dieciséis repositorios, ocho de ellos byte a byte y los
 * otros ocho derivados: distintos tamaños de icono, distintos colores al pasar
 * por encima, y en varios sin nombre accesible. Acá van una sola vez.
 *
 * # No todas las ventanas llevan los tres
 *
 * `controls` dice cuáles. Una lista vacía deja la barra sin ninguno, que es lo
 * que corresponde en un cuadro de diálogo —el de polkit, el de permisos, el de
 * mantener apretado—: ahí la ventana se responde, no se cierra, y un botón de
 * cerrar es una salida que deja al programa que preguntó esperando para
 * siempre. El instalador tampoco los lleva: minimizarlo o cerrarlo mientras
 * particiona un disco deja el equipo a medio instalar. El mini-reproductor sólo
 * lleva `close`, porque minimizar y maximizar no significan nada en trescientos
 * píxeles.
 *
 * # Cerrar puede no ser cerrar
 *
 * Si quien usa el componente escucha `close` —o `minimize`, o `maximize`—, el
 * botón emite y **no** toca la ventana. Es lo que necesita un reproductor que
 * tiene que apagar el audio antes de irse, o un editor con cambios sin guardar
 * que quiere preguntar primero. Sin nadie escuchando, hace lo suyo.
 *
 * # Botones y no `span`
 *
 * Como `span` no los alcanza el tabulador ni los anuncia un lector de
 * pantalla. Los nombres entran por propiedad, traducidos por la aplicación: una
 * librería de componentes que traduce obliga a todas a compartir sus claves.
 *
 * # Los iconos van en la variante simbólica
 *
 * `ThemeIcon` resuelve por omisión la variante **en color**, que es la que usa
 * el escritorio para los iconos de aplicaciones y carpetas. Para los controles
 * de ventana es la equivocada: en los temas derivados de Breeze —los de
 * VasakOS lo son— `window-close` en color es el círculo rojo relleno de KDE,
 * mientras que minimizar y maximizar son trazos grises. Los tres botones
 * quedaban desparejos y la ventana se leía distinta del resto del escritorio.
 * Las dieciséis aplicaciones que traían esto copiado pedían `getSymbolSource`,
 * o sea la simbólica; al centralizarlo acá se perdió por el valor por omisión.
 *
 * # Se acomodan con la barra
 *
 * Con la barra vertical se apilan, que es lo único que entra en cuarenta y ocho
 * píxeles de ancho.
 *
 * # Estilo macOS y orden invertido (2.16.0)
 *
 * La persona elige en Configuración (`window.controlsStyle` y
 * `window.controlsOrder` de `vasak.conf`) entre los botones planos y los tres
 * círculos de macOS, y entre tenerlos al final o invertidos al principio
 * —cerrar, minimizar, maximizar—. Los colores de los círculos son los del
 * esquema: cerrar en `status-error`, minimizar en `status-warning` y maximizar
 * en `status-success`, que salen de la paleta de la terminal del esquema. El
 * signo de cada uno aparece al pasar por encima del grupo, como en macOS, y
 * siempre que el teclado esté en alguno. Las propiedades `variant` y `order`
 * fijan uno a mano para una ventana que no deba seguir la preferencia.
 */
import { getCurrentWindow } from '@tauri-apps/api/window';
import { computed, getCurrentInstance } from 'vue';
import ThemeIcon from '../icons/ThemeIcon.vue';
import { type ControlDeVentana, LOS_TRES_CONTROLES, usarLaBarra } from './tipos';
import {
	orderControls,
	useWindowControlsPreference,
	type WindowControlsOrder,
	type WindowControlsStyle,
} from './window-preferences';
import { useI18n } from '@vasakgroup/tauri-plugin-i18n';

const props = withDefaults(
	defineProps<{
		/** Cuáles de los tres se dibujan, y en este orden. */
		controls?: ControlDeVentana[];
		/**
		 * Lo que oye un lector de pantalla en cada botón, y el tooltip.
		 *
		 * Sin pasar nada salen del catálogo de la aplicación —`ventana.minimizar`,
		 * `ventana.maximizar` y `ventana.cerrar`—. Las claves las define cada
		 * aplicación en sus `locales`; acá sólo se buscan. Pasarlas gana, que es
		 * lo que deja llamarlas de otra manera.
		 */
		minimizeLabel?: string;
		maximizeLabel?: string;
		closeLabel?: string;
		/** Fija el estilo, ignorando la preferencia del escritorio. */
		variant?: WindowControlsStyle | null;
		/** Fija el orden, ignorando la preferencia del escritorio. */
		order?: WindowControlsOrder | null;
	}>(),
	{
		controls: () => LOS_TRES_CONTROLES,
		variant: null,
		order: null,
	}
);

const { t } = useI18n();

/**
 * La propiedad si vino, y si no el catálogo.
 *
 * `t()` devuelve la clave cruda cuando no la encuentra: una aplicación que deje
 * de pasar la etiqueta sin haber puesto la clave lo ve en el tooltip, que es lo
 * mismo que hace `t()` en todo el sistema.
 */
const minimizeText = computed(() => props.minimizeLabel ?? t('ventana.minimizar'));
const maximizeText = computed(() => props.maximizeLabel ?? t('ventana.maximizar'));
const closeText = computed(() => props.closeLabel ?? t('ventana.cerrar'));

const emit = defineEmits<{
	minimize: [];
	maximize: [];
	close: [];
}>();

const { vertical } = usarLaBarra();

const preference = useWindowControlsPreference();
const style = computed<WindowControlsStyle>(() => props.variant ?? preference.controlsStyle.value);
const ordered = computed(() => orderControls(props.controls, props.order ?? preference.controlsOrder.value));

/**
 * La ventana se pide al usarla y no al montar.
 *
 * `getCurrentWindow()` fuera de Tauri lanza, y este componente se monta en
 * pruebas y vistas previas. Pedirla en el momento del clic deja que el resto se
 * dibuje igual.
 */
function currentWindow() {
	return getCurrentWindow();
}

/**
 * Si alguien escucha el evento, el botón es suyo.
 *
 * Se mira el `vnode` y no `useAttrs()` porque un evento declarado en `emits` no
 * aparece en los atributos: Vue lo saca de ahí justamente por estar declarado.
 * Es la única forma de distinguir «nadie escucha, hacé lo de siempre» de «la
 * aplicación se hace cargo», y la diferencia importa: emitir *y* cerrar deja al
 * reproductor apagando el audio de una ventana que ya no está.
 */
const instance = getCurrentInstance();

function isListened(event: 'Minimize' | 'Maximize' | 'Close') {
	return Boolean(instance?.vnode.props?.[`on${event}`]);
}

function minimize() {
	if (isListened('Minimize')) return emit('minimize');
	currentWindow().minimize();
}

function maximize() {
	if (isListened('Maximize')) return emit('maximize');
	currentWindow().toggleMaximize();
}

function close() {
	if (isListened('Close')) return emit('close');
	currentWindow().close();
}

/**
 * Botones sin borde de Once UI (vue-libvasak#74): 32 de lado, `rounded-corner-m`
 * y el velo `ui-hover`. El de cerrar se tiñe de error al pasar, que es lo único
 * que avisa que ése cierra. Antes cada uno llevaba borde, fondo de ventana y un
 * relleno pleno de color al pasar —verde, ámbar, rojo—.
 */
const CLASSES =
	'flex size-8 items-center justify-center rounded-corner-m text-tx-main transition-colors duration-200 ease-ui active:duration-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-focus';

/**
 * Los círculos de macOS: el blanco del clic es de 20 px aunque el círculo
 * mida 14, para que apuntarles no sea un ejercicio de puntería.
 */
const MACOS_CLASSES =
	'group/control flex size-5 items-center justify-center rounded-corner-full focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ui-focus';

interface ControlButton {
	icon: string;
	label: string;
	action: () => void;
	/** El velo al pasar en el estilo plano. */
	flat: string;
	/** El relleno del círculo en el estilo macOS. */
	dot: string;
}

const buttons = computed<Record<ControlDeVentana, ControlButton>>(() => ({
	minimize: {
		icon: 'window-minimize',
		label: minimizeText.value,
		action: minimize,
		flat: 'hover:bg-ui-hover active:bg-ui-pressed',
		dot: 'bg-status-warning',
	},
	maximize: {
		icon: 'window-maximize',
		label: maximizeText.value,
		action: maximize,
		flat: 'hover:bg-ui-hover active:bg-ui-pressed',
		dot: 'bg-status-success',
	},
	close: {
		icon: 'window-close',
		label: closeText.value,
		action: close,
		flat: 'hover:bg-status-error/15 active:bg-status-error/25',
		dot: 'bg-status-error',
	},
}));
</script>

<template>
  <div
    v-if="ordered.length"
    class="group/controls flex shrink-0"
    :class="[vertical ? 'flex-col' : '', style === 'macos' ? 'gap-0.5 px-1' : 'gap-1']"
    :data-controls-style="style"
    data-tauri-drag-region>
    <template v-if="style === 'macos'">
      <button
        v-for="control in ordered"
        :key="control"
        type="button"
        :class="MACOS_CLASSES"
        :title="buttons[control].label"
        :aria-label="buttons[control].label"
        :data-control="control"
        @click="buttons[control].action()">
        <span
          class="flex size-3.5 items-center justify-center rounded-corner-full text-ui-control-glyph transition-opacity duration-100 ease-ui group-active/control:opacity-80"
          :class="buttons[control].dot">
          <!-- El signo es el icono simbólico del tema, teñido con el color del
               texto. Aparece al pasar por encima del grupo o con el teclado
               en un botón. -->
          <ThemeIcon
            :name="buttons[control].icon"
            type="symbol"
            tint
            :size="10"
            class="opacity-0 transition-opacity duration-100 ease-ui group-hover/controls:opacity-100 group-focus-within/controls:opacity-100" />
        </span>
      </button>
    </template>
    <template v-else>
      <button
        v-for="control in ordered"
        :key="control"
        type="button"
        :class="[CLASSES, buttons[control].flat]"
        :title="buttons[control].label"
        :aria-label="buttons[control].label"
        :data-control="control"
        @click="buttons[control].action()">
        <ThemeIcon :name="buttons[control].icon" type="symbol" :size="16" />
      </button>
    </template>
  </div>
</template>
