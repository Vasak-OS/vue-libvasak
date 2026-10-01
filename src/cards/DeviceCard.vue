<template>
  <div
    class="mb-4 flex min-w-0 items-center justify-between gap-3 rounded-corner-l border border-ui-line bg-ui-surface/70 px-6 py-3 text-tx-main transition-colors duration-200 ease-ui"
    :class="[
      {
        'border-l-4 border-l-status-success': isConnected,
        'cursor-pointer hover:bg-linear-to-r hover:from-ui-hover hover:to-ui-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-focus':
          clickable,
      },
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
      <div class="min-w-0">
        <div class="truncate font-semibold text-label-m">
          {{ title }}
        </div>
        <div v-if="subtitle" class="truncate text-body-xs text-tx-muted">
          {{ subtitle }}
        </div>
        <div v-if="metadata" class="truncate text-body-xs text-tx-muted">
          {{ metadata }}
        </div>
        <div v-if="extraInfo.length > 0" class="mt-1 flex flex-wrap gap-3 text-body-xs text-tx-muted">
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
      class="min-h-8 shrink-0 cursor-pointer rounded-corner-m border px-4 py-1 font-semibold text-label-m transition-colors duration-200 ease-ui active:duration-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-focus disabled:cursor-not-allowed disabled:opacity-50"
      :class="actionClasses"
      :disabled="isConnecting"
      @click.stop="handleAction"
    >
      {{ isConnecting ? connectingLabel : actionLabel }}
    </button>

    <!-- Status indicator for connected state -->
    <div
      v-if="showStatusIndicator && isConnected"
      class="size-2 shrink-0 rounded-corner-full bg-status-success"
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
 * `icon` —la ruta ya resuelta— se fue en la 2.0.0, como avisaba desde la 1.x:
 * obligaba a quien lo usara a resolver la ruta por su cuenta, escuchar el
 * cambio de tema y volver a pedirla. Ninguna aplicación lo usaba al sacarlo.
 *
 * ── La forma (vue-libvasak#74) ─────────────────────────────────────────────
 *
 * La tarjeta de Once UI: `rounded-corner-l`, canto `ui-line` y la superficie
 * al 70 %, en vez de `.background`. Conectada conserva la franja del éxito a
 * la izquierda, que es estado y no decoración. El botón de la acción es un
 * botón de 32 con `rounded-corner-m`; ya no se aclara a la mitad al pasar.
 */
import { computed } from 'vue';
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
    ? 'border-status-error/30 bg-status-error/10 text-status-error hover:bg-status-error/20'
    : 'border-transparent bg-primary text-tx-on-primary hover:bg-primary/90 active:bg-primary/80',
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

</script>
