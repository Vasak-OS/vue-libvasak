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
const etiquetaDeMinimizar = computed(() => props.minimizeLabel ?? t('ventana.minimizar'));
const etiquetaDeMaximizar = computed(() => props.maximizeLabel ?? t('ventana.maximizar'));
const etiquetaDeCerrar = computed(() => props.closeLabel ?? t('ventana.cerrar'));

const emit = defineEmits<{
	minimize: [];
	maximize: [];
	close: [];
}>();

const { vertical } = usarLaBarra();

const lleva = computed(() => ({
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
function laVentana() {
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
const instancia = getCurrentInstance();

function escuchan(evento: 'Minimize' | 'Maximize' | 'Close') {
	return Boolean(instancia?.vnode.props?.[`on${evento}`]);
}

function minimizar() {
	if (escuchan('Minimize')) return emit('minimize');
	laVentana().minimize();
}

function maximizar() {
	if (escuchan('Maximize')) return emit('maximize');
	laVentana().toggleMaximize();
}

function cerrar() {
	if (escuchan('Close')) return emit('close');
	laVentana().close();
}

const CLASES =
	'flex items-center justify-center rounded-corner border border-ui-border bg-ui-bg/80 p-1 transition-colors';
</script>

<template>
  <div
    v-if="controls.length"
    class="flex shrink-0 gap-1"
    :class="vertical ? 'flex-col' : ''"
    data-tauri-drag-region>
    <button
      v-if="lleva.minimize"
      type="button"
      :class="[CLASES, 'hover:bg-status-success']"
      :title="etiquetaDeMinimizar"
      :aria-label="etiquetaDeMinimizar"
      @click="minimizar()">
      <ThemeIcon name="window-minimize" :size="24" />
    </button>
    <button
      v-if="lleva.maximize"
      type="button"
      :class="[CLASES, 'hover:bg-status-warning']"
      :title="etiquetaDeMaximizar"
      :aria-label="etiquetaDeMaximizar"
      @click="maximizar()">
      <ThemeIcon name="window-maximize" :size="24" />
    </button>
    <button
      v-if="lleva.close"
      type="button"
      :class="[CLASES, 'hover:bg-status-error']"
      :title="etiquetaDeCerrar"
      :aria-label="etiquetaDeCerrar"
      @click="cerrar()">
      <ThemeIcon name="window-close" :size="24" />
    </button>
  </div>
</template>
