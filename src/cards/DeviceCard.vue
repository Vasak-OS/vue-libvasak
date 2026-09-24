<template>
  <div
    class="flex items-center justify-between background rounded-corner px-6 py-3 mb-4"
    :class="[{ 'border-l-4 border-green-500': isConnected }, customClass]"
    @click="handleClick"
  >
    <div class="flex items-center gap-3 flex-1 min-w-0">
      <ThemeIcon v-if="name" :name="name" :type="type" :size="28" :alt="title" />
      <!-- La ruta ya resuelta, mientras `icon` siga existiendo. -->
      <img v-else :src="icon" :alt="title" class="h-7 w-7 shrink-0" />
      <div class="min-w-0">
        <div class="font-semibold truncate">
          {{ title }}
        </div>
        <div v-if="subtitle" class="text-xs text-gray-400 truncate">
          {{ subtitle }}
        </div>
        <div v-if="metadata" class="text-xs text-gray-400 truncate">
          {{ metadata }}
        </div>
        <div v-if="extraInfo && extraInfo.length > 0" class="text-xs text-gray-400 flex gap-2 mt-1">
          <span v-for="(info, index) in extraInfo" :key="index">
            {{ info }}
          </span>
        </div>
      </div>
    </div>
    
    <button
      v-if="showActionButton"
      class="bg-primary text-tx-on-primary rounded-corner px-4 py-2 text-sm font-semibold cursor-pointer hover:opacity-70"
      @click.stop="handleAction"
    >
      {{ actionLabel }}
    </button>

    <!-- Status indicator for connected state -->
    <div
      v-if="showStatusIndicator && isConnected"
      class="w-2 h-2 rounded-full bg-green-500"
    />
  </div>
</template>

<script setup lang="ts">
/**
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
import { onMounted } from 'vue';
import ThemeIcon from '../icons/ThemeIcon.vue';

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
  extraInfo?: string[];
  isConnected?: boolean;
  showActionButton?: boolean;
  actionLabel?: string;
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
  actionLabel: 'Conectar',
  showStatusIndicator: false,
  customClass: '',
  clickable: false,
});

const emit = defineEmits<{
  action: [];
  click: [];
}>();

const handleAction = () => {
  emit('action');
};

const handleClick = () => {
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
