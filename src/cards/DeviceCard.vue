<template>
  <div
    class="flex items-center justify-between background rounded-corner border border-ui-border px-6 py-3 mb-4"
    :class="[
      { 'border-l-4 border-status-success': isConnected, 'cursor-pointer': clickable },
      customClass,
    ]"
    :role="clickable ? 'button' : undefined"
    :tabindex="clickable ? 0 : undefined"
    :aria-label="clickable ? title : undefined"
    @click="handleClick"
    @keydown.enter.self.prevent="handleClick"
    @keydown.space.self.prevent="handleClick"
  >
    <div class="flex items-center gap-3 flex-1 min-w-0">
      <ThemeIcon v-if="name" :name="name" :type="type" :size="28" :alt="title" />
      <!-- La ruta ya resuelta, mientras `icon` siga existiendo. -->
      <img v-else :src="icon" :alt="title" class="h-7 w-7 shrink-0" />
      <div class="min-w-0">
        <div class="font-semibold truncate">
          {{ title }}
        </div>
        <div v-if="subtitle" class="text-xs text-tx-muted truncate">
          {{ subtitle }}
        </div>
        <div v-if="metadata" class="text-xs text-tx-muted truncate">
          {{ metadata }}
        </div>
        <div v-if="extraInfo.length > 0" class="text-xs text-tx-muted flex gap-3 mt-1 flex-wrap">
          <!-- Cada dato puede traer su icono. Una cadena suelta también vale:
               es lo que este componente recibía antes y sigue andando. -->
          <span v-for="(info, index) in extraInfo" :key="index" class="inline-flex items-center gap-1">
            <ThemeIcon v-if="iconOf(info)" :name="iconOf(info)" type="symbol" :size="14" />
            {{ textOf(info) }}
          </span>
        </div>
      </div>
    </div>

    <button
      v-if="showActionButton"
      type="button"
      class="rounded-corner px-4 py-2 text-sm font-semibold cursor-pointer hover:opacity-70 disabled:opacity-50 disabled:cursor-not-allowed"
      :class="actionClasses"
      :disabled="isConnecting"
      @click.stop="handleAction"
    >
      {{ isConnecting ? connectingLabel : actionLabel }}
    </button>

    <!-- Status indicator for connected state -->
    <div
      v-if="showStatusIndicator && isConnected"
      class="w-2 h-2 rounded-full bg-status-success"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * ── La fila se abre con el teclado ─────────────────────────────────────────
 *
 * Cuando es `clickable`, la fila entera se abre con el mouse **y** con el
 * teclado. Lleva `role="button"` y no un `<button>` de verdad porque adentro
 * hay otro —el de la acción— y un botón dentro de otro no es HTML válido: el
 * navegador desanida el marcado y el de adentro deja de funcionar.
 *
 * Las teclas llevan `.self` antes de `.prevent`: la tecla apretada sobre el
 * botón de adentro **burbujea** hasta la fila, y sin eso se dispararía además
 * su acción y se le cancelaría al botón la suya.
 *
 * Esto va acá y **no** como comentario arriba de la raíz de la plantilla: un
 * comentario ahí la vuelve un fragmento, se pierde la raíz y el componente deja
 * de tener atributos que mirar. Ya pasó, y lo agarró la prueba de abajo.
 *
 * ── El icono va por nombre ─────────────────────────────────────────────────
 *
 * `name` es el **nombre** del icono en el tema del escritorio, y `type` cuál de
 * las dos variantes. Lo dibuja `ThemeIcon`, así que sigue al tema y entra en el
 * planificador de recarga como cualquier otro.
 *
 * `icon` —la ruta ya resuelta— sigue funcionando y está **obsoleto**. Era lo
 * contrario de lo que hace el resto de la librería: obligaba a quien lo usara a
 * resolver la ruta por su cuenta, escuchar el cambio de tema y volver a
 * pedirla, que es exactamente el composable que este barrido viene borrando de
 * cada repositorio. Se va en la próxima mayor; hasta entonces avisa por consola.
 */
import { computed, onMounted } from 'vue';
import ThemeIcon from '../icons/ThemeIcon.vue';

/**
 * Un dato extra de la tarjeta: una cadena suelta, o una con su icono.
 *
 * Las dos formas valen. La cadena es lo que este componente recibía antes y
 * sigue andando; la otra es lo que la copia de `vasak-desktop` necesitaba para
 * poner un símbolo al lado de cada dato —la señal, la batería—.
 */
export type ExtraInfo = string | { icon?: string; text: string };

interface Props {
  /** El nombre del icono en el tema del escritorio. */
  name?: string;
  /** Cuál de las dos variantes del tema. */
  type?: 'icon' | 'symbol';
  /** @deprecated La ruta ya resuelta. Usá `name`. Se va en la próxima mayor. */
  icon?: string;
  title: string;
  subtitle?: string;
  metadata?: string;
  extraInfo?: ExtraInfo[];
  isConnected?: boolean;
  showActionButton?: boolean;
  /**
   * Qué dice el botón de la acción.
   *
   * Va por propiedad y **no** se traduce acá adentro: una librería que busque
   * `components.DeviceCard.connect` en el catálogo obliga a que las seis
   * aplicaciones tengan esa clave, y la que no la tenga dibuja el nombre de la
   * clave en pantalla. Quien la usa ya tiene su `t()`.
   */
  actionLabel?: string;
  /** Qué dice mientras `isConnecting`. */
  connectingLabel?: string;
  /**
   * Si la acción deshace algo —desconectar, desvincular, olvidar—, va en rojo.
   *
   * No sale de `isConnected`, aunque en Bluetooth las dos cosas coincidan: hay
   * tarjetas donde la acción del estado conectado no destruye nada, y otras
   * donde la del desconectado sí —«olvidar este dispositivo»—. Atarlo al
   * estado acertaría por casualidad en un caso y se equivocaría en el otro.
   */
  actionKind?: 'primary' | 'destructive';
  /** Mientras dura la acción: el botón queda deshabilitado y cambia el texto. */
  isConnecting?: boolean;
  showStatusIndicator?: boolean;
  customClass?: string;
  clickable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  name: '',
  type: 'icon',
  icon: '',
  subtitle: '',
  metadata: '',
  extraInfo: () => [],
  isConnected: false,
  showActionButton: true,
  // Sin valor por omisión: un literal en español adentro de una librería que
  // usan seis aplicaciones es un texto que nadie puede traducir.
  actionLabel: '',
  connectingLabel: '',
  actionKind: 'primary',
  isConnecting: false,
  showStatusIndicator: false,
  customClass: '',
  clickable: false,
});

/**
 * Las clases del botón de la acción.
 *
 * El rojo va tenue —fondo y borde con alfa, texto en el color pleno— y no como
 * un botón lleno de rojo: en una lista de dispositivos, la acción destructiva
 * está en **cada** fila, y seis botones rojos macizos gritan más que lo que la
 * pantalla quiere decir. Lo que tiene que leerse es que ésta deshace algo, no
 * que sea peligrosa.
 */
const actionClasses = computed(() =>
  props.actionKind === 'destructive'
    ? 'border border-status-error/20 bg-status-error/10 text-status-error hover:bg-status-error/20'
    : 'bg-primary text-tx-on-primary',
);

/** El icono de un dato extra, si lo trae. */
const iconOf = (info: ExtraInfo): string => (typeof info === 'string' ? '' : (info.icon ?? ''));

/** El texto de un dato extra, venga en la forma que venga. */
const textOf = (info: ExtraInfo): string => (typeof info === 'string' ? info : info.text);

const emit = defineEmits<{
  action: [];
  click: [];
}>();

const handleAction = () => {
  emit('action');
};

const handleClick = () => {
  // Atado a `clickable`: la propiedad estaba declarada y no se usaba, así que
  // la fila emitía siempre un `click` que nadie escuchaba. Una fila que dice
  // ser un botón y no hace nada es el mismo problema al revés.
  if (!props.clickable) return;
  emit('click');
};

onMounted(() => {
	if (props.icon && !props.name) {
		console.warn(
			'[DeviceCard] «icon» está obsoleto y se va en la próxima mayor: recibe una ruta ya resuelta. Usá «name» con el nombre del icono del tema, y «type» si hace falta el símbolo.'
		);
	}
});
</script>
