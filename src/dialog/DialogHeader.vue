<script setup lang="ts">
/**
 * El encabezado: el título y, si hay, la descripción.
 *
 * Se acomoda por el ancho del diálogo y no por el de la pantalla: el
 * envoltorio es un contenedor (`@container`) y lo de adentro cambia con `@sm:`.
 * Con el `sm:` de la pantalla, un diálogo angosto en una ventana ancha se
 * armaba como si fuera ancho. Los atributos de quien lo usa van al elemento de
 * adentro, que es el que se dibuja.
 *
 * # El botón de cerrar (2.1.0)
 *
 * Con `closable` —o con `closeLabel`, que lo implica— el encabezado dibuja el
 * cerrar arriba a la derecha y cierra el diálogo por su contexto, como Escape.
 * Lo escribían a mano cuatro copias: las preferencias y los atajos del correo,
 * el `ModalBase` de la tienda y el `ModalDialog` de Configuración, cada una con
 * su borde y su texto. Las dos formas de esas copias están: `closeStyle="icon"`
 * (por omisión, un botón `ghost` con `window-close` y el nombre en el globo) y
 * `closeStyle="label"`, el botón con la palabra, que es lo que tenía
 * Configuración y lo que no puede cambiar sin cambiarle el formato.
 *
 * El texto sale de `closeLabel`, del catálogo (`dialog.close`) o del respaldo
 * «Cerrar».
 */
import { computed } from 'vue';
import ActionButton from '../controls/ActionButton.vue';
import { useLabels } from '../shared/labels';
import { useDialog } from './types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
	defineProps<{
		/** Dibuja el botón de cerrar. */
		closable?: boolean;
		/** El nombre del botón de cerrar. Pasarlo también lo dibuja. */
		closeLabel?: string;
		closeStyle?: 'icon' | 'label';
	}>(),
	{ closable: false, closeStyle: 'icon' }
);

const dialog = useDialog();
const translate = useLabels();

const showsClose = computed(() => props.closable || props.closeLabel !== undefined);
const closeName = computed(() => props.closeLabel ?? translate('dialog.close', 'Cerrar'));
</script>

<template>
  <div class="@container">
    <div v-if="showsClose" class="flex min-w-0 items-start gap-4">
      <div v-bind="$attrs" class="flex min-w-0 flex-1 flex-col gap-1 text-left">
        <slot />
      </div>
      <ActionButton
        v-if="closeStyle === 'label'"
        :label="closeName"
        variant="secondary"
        size="sm"
        class="shrink-0"
        @click="dialog.close()" />
      <ActionButton
        v-else
        label=""
        :icon-alt="closeName"
        :title="closeName"
        icon="window-close-symbolic"
        variant="ghost"
        class="-mt-1 -mr-2 shrink-0"
        @click="dialog.close()" />
    </div>
    <div v-else v-bind="$attrs" class="flex flex-col gap-1 text-center @sm:text-left">
      <slot />
    </div>
  </div>
</template>
