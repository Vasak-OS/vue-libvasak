<script setup lang="ts">
/**
 * Avisos, estados vacíos, secciones y el diálogo.
 *
 * El diálogo y los avisos transitorios se dibujan contra la ventana y no
 * contra su caja, así que para ellos el ancho es el de la ventana: se capturan
 * con `capture.sh` a cada ancho (`WINDOW_WIDTHS`), una vez por página.
 */
import { ref } from 'vue';
import {
	ActionButton,
	AlertMessage,
	ConfigSection,
	Dialog,
	DialogBody,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	EmptyState,
	LoadingState,
	TextInput,
	ToastArea,
} from '../src';

defineProps<{ section: string; width: number; first: boolean }>();

/**
 * Abierto desde el montaje: así no pasa por la transición de entrada, que en
 * Chrome sin pantalla se queda a mitad de camino y la captura sale vacía.
 */
const open = ref(true);
const name = ref('Mis documentos');
const toasts = [
	{ id: 1, message: 'Se copió la carpeta', tone: 'success' as const },
	{ id: 2, message: 'No se pudo conectar con el servidor de correo', tone: 'error' as const },
	{ id: 3, message: 'Hay una actualización', tone: 'info' as const },
	{ id: 4, title: 'Copiando 3 archivos', message: 'A Documentos', description: 'Quedan unos 2 minutos', progress: 40, action: { label: 'Cancelar' } },
	{ id: 5, message: 'El mensaje sale en 8 segundos', action: { label: 'Deshacer' } },
];
const recipe = Array.from({ length: 40 }, (_, i) => `línea ${i + 1} de la receta del paquete`);
</script>

<template>
  <div v-if="section === 'feedback'" class="flex flex-col gap-3">
    <AlertMessage tone="info" title="Para saber" icon="dialog-information">La red se configura sola.</AlertMessage>
    <AlertMessage tone="success" icon="emblem-ok">Se guardó la configuración.</AlertMessage>
    <AlertMessage tone="warning" title="Batería baja" icon="dialog-warning">Quedan quince minutos; conectá el cargador para no perder lo que no guardaste.</AlertMessage>
    <AlertMessage tone="error" title="No se pudo instalar" icon="dialog-error">El paquete está dañado.</AlertMessage>
    <ConfigSection title="Apariencia">
      <p class="text-tx-muted text-sm">El contenido de una sección de Configuración.</p>
    </ConfigSection>
    <EmptyState title="No hay nada acá" note="Arrastrá archivos para empezar" icon="folder-open" bordered />
    <LoadingState label="Cargando fotos…" bordered />
  </div>

  <div v-else-if="section === 'dialog-body' && first">
    <Dialog v-model:open="open">
      <DialogContent size="lg">
        <DialogHeader closable>
          <DialogTitle>Receta de «firefox»</DialogTitle>
          <DialogDescription>El cuerpo desplaza solo; el encabezado y el pie quedan quietos.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <p v-for="line in recipe" :key="line" class="m-0 font-mono text-body-xs">{{ line }}</p>
        </DialogBody>
        <DialogFooter>
          <ActionButton label="Cerrar" variant="secondary" />
          <ActionButton label="Instalar" />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>

  <div v-else-if="section === 'dialog-sm' && first">
    <Dialog v-model:open="open">
      <DialogContent size="sm">
        <DialogHeader close-label="Cerrar" close-style="label">
          <DialogTitle>Carpeta nueva</DialogTitle>
        </DialogHeader>
        <div class="py-4">
          <TextInput v-model="name" aria-label="Nombre" />
        </div>
        <DialogFooter>
          <ActionButton label="Cancelar" variant="secondary" />
          <ActionButton label="Crear" />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>

  <div v-else-if="section === 'dialog' && first">
    <ToastArea :toasts="toasts" />
    <Dialog v-model:open="open">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar el nombre</DialogTitle>
          <DialogDescription>El nombre nuevo se ve en el gestor de archivos y en las búsquedas.</DialogDescription>
        </DialogHeader>
        <div class="py-4">
          <TextInput v-model="name" aria-label="Nombre" />
        </div>
        <DialogFooter>
          <ActionButton label="Cancelar" variant="secondary" />
          <ActionButton label="Cambiar el nombre" />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
