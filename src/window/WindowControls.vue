<script lang="ts" setup>
/**
 * Minimizar, maximizar y cerrar.
 *
 * Estaban copiados en dieciséis repositorios, ocho de ellos byte a byte y los
 * otros ocho derivados: distintos tamaños de icono, distintos colores al pasar
 * por encima, y en varios sin nombre accesible. Acá van una sola vez.
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
import ThemeIcon from '../icons/ThemeIcon.vue';
import { usarLaBarra } from './tipos';

withDefaults(
	defineProps<{
		minimizeLabel?: string;
		maximizeLabel?: string;
		closeLabel?: string;
	}>(),
	{
		minimizeLabel: 'Minimize',
		maximizeLabel: 'Maximize',
		closeLabel: 'Close',
	}
);

const { vertical } = usarLaBarra();

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

const CLASES =
	'flex items-center justify-center rounded-corner border border-ui-border bg-ui-bg/80 p-1 transition-colors';
</script>

<template>
  <div
    class="flex shrink-0 gap-1"
    :class="vertical ? 'flex-col' : ''"
    data-tauri-drag-region>
    <button
      type="button"
      :class="[CLASES, 'hover:bg-status-success']"
      :title="minimizeLabel"
      :aria-label="minimizeLabel"
      @click="laVentana().minimize()">
      <ThemeIcon name="window-minimize" :size="24" />
    </button>
    <button
      type="button"
      :class="[CLASES, 'hover:bg-status-warning']"
      :title="maximizeLabel"
      :aria-label="maximizeLabel"
      @click="laVentana().toggleMaximize()">
      <ThemeIcon name="window-maximize" :size="24" />
    </button>
    <button
      type="button"
      :class="[CLASES, 'hover:bg-status-error']"
      :title="closeLabel"
      :aria-label="closeLabel"
      @click="laVentana().close()">
      <ThemeIcon name="window-close" :size="24" />
    </button>
  </div>
</template>
