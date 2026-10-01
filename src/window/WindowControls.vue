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
 */
import { getCurrentWindow } from '@tauri-apps/api/window';
import { computed, getCurrentInstance } from 'vue';
import ThemeIcon from '../icons/ThemeIcon.vue';
import { type ControlDeVentana, LOS_TRES_CONTROLES, usarLaBarra } from './tipos';
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
	}>(),
	{
		controls: () => LOS_TRES_CONTROLES,
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

const has = computed(() => ({
	minimize: props.controls.includes('minimize'),
	maximize: props.controls.includes('maximize'),
	close: props.controls.includes('close'),
}));

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
</script>

<template>
  <div
    v-if="controls.length"
    class="flex shrink-0 gap-1"
    :class="vertical ? 'flex-col' : ''"
    data-tauri-drag-region>
    <button
      v-if="has.minimize"
      type="button"
      :class="[CLASSES, 'hover:bg-ui-hover active:bg-ui-pressed']"
      :title="minimizeText"
      :aria-label="minimizeText"
      @click="minimize()">
      <ThemeIcon name="window-minimize" type="symbol" :size="16" />
    </button>
    <button
      v-if="has.maximize"
      type="button"
      :class="[CLASSES, 'hover:bg-ui-hover active:bg-ui-pressed']"
      :title="maximizeText"
      :aria-label="maximizeText"
      @click="maximize()">
      <ThemeIcon name="window-maximize" type="symbol" :size="16" />
    </button>
    <button
      v-if="has.close"
      type="button"
      :class="[CLASSES, 'hover:bg-status-error/15 active:bg-status-error/25']"
      :title="closeText"
      :aria-label="closeText"
      @click="close()">
      <ThemeIcon name="window-close" type="symbol" :size="16" />
    </button>
  </div>
</template>
