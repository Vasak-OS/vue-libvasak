<script setup lang="ts">
/**
 * La 2.4.0: lo que pidieron las aplicaciones y las piezas del inicio de sesión
 * y del bloqueo.
 *
 * Lo que se dibuja contra la ventana —el diálogo, los avisos, el menú
 * alineado al final, la lista sin búsqueda— va sólo en la primera caja
 * (`first`) y se captura con la ventana de cada ancho, dentro de un `iframe`
 * de ese ancho: Chrome sin pantalla no maqueta por debajo de unos 500 px.
 *
 * Lo translúcido (`ui-shell`, `shell-blur`, el degradado de medios) se dibuja
 * sobre un fondo de colores del esquema, porque sobre el fondo liso de la
 * ventana no se vería.
 */
import { nextTick, onMounted, ref } from 'vue';
import {
	ActionButton,
	AppBar,
	Badge,
	ClockDisplay,
	ConfigSection,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	EmptyState,
	IconTile,
	IdentityBlock,
	OptionGroup,
	PasswordField,
	PowerActions,
	SearchField,
	SearchSelect,
	SelectField,
	SettingRow,
	SwitchToggle,
	ThemeIcon,
	ToastArea,
} from '../src';

defineProps<{ section: string; width: number; first: boolean }>();

const now = new Date(2026, 9, 2, 9, 41);
const empty = ref('');
const secret = ref('correcto-caballo-batería');
const query = ref('gimp');
const language = ref('es');
const session = ref('wayfire');
const account = ref('ana');
const on = ref(true);
const menuOpen = ref(false);
const selectRoot = ref<HTMLElement | null>(null);
const capsRoot = ref<HTMLElement | null>(null);

const sessions = [
	{ valor: 'wayfire', etiqueta: 'VasakOS (Wayfire)' },
	{ valor: 'plasma', etiqueta: 'Plasma (Wayland)' },
	{ valor: 'shell', etiqueta: 'Consola' },
];
const accounts = [
	{ value: 'ana', label: 'Ana Pérez', description: '@ana', avatar: null },
	{ value: 'pato', label: 'Joaquín Decima', description: '@pato', avatar: '/__icon/avatar-default?kind=icon&mode=light' },
	{ value: 'other', label: 'Otro usuario', icon: 'avatar-default' },
];
const toasts = [
	{ id: 1, message: 'Se agregó a la cola', tone: 'success' as const },
	{ id: 2, message: 'No se encontró la carátula del disco', tone: 'error' as const },
];

onMounted(async () => {
	await nextTick();
	setTimeout(() => {
		menuOpen.value = true;
		// La lista sin búsqueda, abierta como se abre: con un clic.
		selectRoot.value?.querySelector<HTMLButtonElement>('button')?.click();
		// Bloq Mayús, como lo informa el motor.
		for (const input of capsRoot.value?.querySelectorAll('input') ?? []) {
			input.dispatchEvent(new KeyboardEvent('keydown', { key: 'A', modifierCapsLock: true, bubbles: true }));
		}
	}, 50);
});
</script>

<template>
  <!-- Contadores sobre un icono: «99+» en una línea, sin tapar al vecino. -->
  <div v-if="section === 'badge-24'" class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center gap-6">
      <span v-for="count in [3, 42, 120]" :key="count" class="relative inline-flex">
        <IconTile name="mail-unread" size="md" />
        <Badge :label="count" :max="99" counter tone="accent" variant="solid" class="absolute -top-1 -right-2" :title="`${count} sin leer`" />
      </span>
      <span class="relative inline-flex">
        <ThemeIcon name="notification-active" type="symbol" :size="28" />
        <Badge label="99+" counter tone="error" class="absolute -top-1 -right-2" />
      </span>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <Badge label="Predeterminado" />
      <Badge label="Una insignia de las de siempre, que parte el texto si no entra" tone="warning" />
      <Badge :label="7" counter size="md" />
    </div>
  </div>

  <!-- La barra con un centro largo: centrada si entra, en la zona libre si no. -->
  <div v-else-if="section === 'appbar-24'" class="flex flex-col gap-2">
    <div v-for="title in ['Correo', '']" :key="title" class="rounded-corner-l border border-ui-line">
      <AppBar :title="title" :controls="['minimize', 'maximize', 'close']">
        <template #identidad>
          <ThemeIcon name="internet-mail" :size="24" />
        </template>
        <template #centro>
          <span class="flex min-w-0 items-baseline gap-2">
            <span class="min-w-0 truncate text-label-m font-semibold">Bandeja de entrada</span>
            <span class="min-w-0 truncate text-body-xs text-tx-muted">ana@example.org</span>
          </span>
        </template>
        <template #acciones>
          <ActionButton label="" icon="mail-message-new-symbolic" icon-alt="Redactar" variant="ghost" />
          <ActionButton label="" icon="view-refresh-symbolic" icon-alt="Actualizar" variant="ghost" />
        </template>
      </AppBar>
    </div>
  </div>

  <!-- La cabecera de una ficha: h1, partida y apilada en angosto. -->
  <div v-else-if="section === 'identity-24'" class="flex flex-col gap-4">
    <IdentityBlock title="María de los Ángeles Fernández Etcheverry" subtitle="Gerenta de operaciones en Cooperativa La Esperanza" as="h1" size="xl" wrap stack="narrow">
      <template #details>
        <Badge label="Favorito" tone="accent" />
        <Badge label="Trabajo" variant="outline" />
      </template>
      <template #trailing>
        <ActionButton label="Editar" variant="secondary" />
      </template>
    </IdentityBlock>
    <IdentityBlock title="Ana Pérez" subtitle="ana@example.org" stack="always" size="2xl" />
    <IdentityBlock title="Un nombre que se corta en la fila de siempre" subtitle="y una dirección larguísima@ejemplo.com" size="ml" />
  </div>

  <!-- Los campos: contraseña en cada estado, y lo que sumaron los demás. -->
  <div v-else-if="section === 'fields-24'" class="grid gap-3" :class="width >= 600 ? 'grid-cols-2' : ''">
    <PasswordField v-model="empty" aria-label="Contraseña vacía" placeholder="Contraseña" />
    <PasswordField v-model="secret" aria-label="Contraseña escrita" />
    <div ref="capsRoot"><PasswordField v-model="secret" aria-label="Con Bloq Mayús" /></div>
    <PasswordField v-model="secret" aria-label="Inválida" invalid />
    <PasswordField v-model="secret" aria-label="Apagada" disabled />
    <PasswordField v-model="secret" aria-label="Grande" size="lg" />
    <SearchField v-model="query" label="Buscar aplicaciones" autocomplete="off" :spellcheck="false" />
    <SelectField v-model="language" label="Idioma (apagado)" :options="[{ label: 'Español', value: 'es' }]" disabled />
    <ConfigSection>
      <p class="m-0 text-body-s">Una sección sin título: ni h3 vacío ni hueco arriba.</p>
    </ConfigSection>
    <EmptyState title="No hay impresoras" muted icon="" size="sm" bordered />
    <SettingRow label="Cámara" description="Las aplicaciones pueden usarla">
      <SwitchToggle v-model="on" aria-label="Cámara" />
    </SettingRow>
  </div>

  <!-- El menú con la casilla a medias. -->
  <div v-else-if="section === 'menu-24'" class="h-64">
    <DropdownMenu :open="menuOpen">
      <DropdownMenuTrigger as-child>
        <ActionButton label="Bandeja" variant="secondary" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Mostrar</DropdownMenuLabel>
        <DropdownMenuItem :checked="true">Marcada</DropdownMenuItem>
        <DropdownMenuItem checked="mixed">A medias (mixed)</DropdownMenuItem>
        <DropdownMenuItem :checked="false">Sin marcar</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem checked="mixed" class="is-hover">A medias, encima</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>

  <!-- Elegir una cuenta. -->
  <div v-else-if="section === 'accounts-24'" class="flex flex-col gap-4">
    <OptionGroup v-model="account" label="Usuarios" variant="card" :options="accounts" />
    <OptionGroup v-model="account" label="Usuarios" :options="accounts" />
  </div>

  <!-- El inicio de sesión sobre un fondo de colores del esquema: la hora con
       su halo, la tarjeta translúcida desenfocada, y la energía. -->
  <div
    v-else-if="section === 'session-24'"
    class="relative flex flex-col items-center gap-6 overflow-hidden rounded-corner-l bg-linear-to-br from-primary via-secondary to-status-success p-4">
    <ClockDisplay :now="now" locale="es-AR" :hour12="false" legible />
    <div class="flex w-full max-w-md flex-col gap-3 rounded-corner-xl border border-ui-line bg-ui-shell p-4 shell-blur shadow-surface-l">
      <IdentityBlock title="Ana Pérez" subtitle="@ana" size="ml" />
      <PasswordField v-model="secret" aria-label="Contraseña" />
      <ActionButton label="Entrar" full-width />
    </div>
    <PowerActions button-variant="overlay" class="self-end" />
    <div class="w-full rounded-corner-xl border border-ui-line bg-ui-shell p-4">
      <PowerActions variant="tiles" :actions="['lock', 'logout', 'suspend', 'reboot', 'poweroff']" />
    </div>
    <!-- El pie de una foto, con el velo en degradado. -->
    <div class="relative h-32 w-full overflow-hidden rounded-corner-l">
      <div class="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-4 pt-12 overlay-fade-up">
        <span class="text-label-m font-semibold text-tx-main">vacaciones-2026.jpg</span>
        <span class="text-body-xs text-tx-main">3 de enero · 4,2 MB</span>
      </div>
    </div>
  </div>

  <!-- Contra la ventana: el menú alineado al final, pegado al borde derecho. -->
  <div v-else-if="section === 'menu-end' && first" class="fixed top-2 right-2 left-2 flex justify-end">
    <DropdownMenu :open="menuOpen">
      <DropdownMenuTrigger as-child>
        <ActionButton label="" icon="view-more-symbolic" icon-alt="Más" variant="secondary" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem icon="document-new-symbolic">Carpeta nueva</DropdownMenuItem>
        <DropdownMenuItem icon="edit-paste-symbolic" :shortcut="['Ctrl', 'V']">Pegar</DropdownMenuItem>
        <DropdownMenuItem icon="view-hidden-symbolic" :checked="false">Mostrar los archivos ocultos</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>

  <!-- Contra la ventana: la lista sin búsqueda, abierta. -->
  <div v-else-if="section === 'select-24' && first" ref="selectRoot" class="w-56 max-w-full">
    <SearchSelect v-model="session" :options="sessions" label="Sesión" :searchable="false" />
  </div>

  <!-- Contra la ventana: el diálogo intermedio y el grande con su velo. -->
  <div v-else-if="(section === 'dialog-wide' || section === 'dialog-lg') && first">
    <p class="text-body-s">Lo de atrás, que el velo oscurece.</p>
    <Dialog :open="true">
      <DialogContent :size="section === 'dialog-wide' ? 'wide' : 'lg'">
        <DialogHeader>
          <DialogTitle>{{ section === 'dialog-wide' ? 'Red «Casa»' : 'Receta del paquete' }}</DialogTitle>
          <DialogDescription>{{ section === 'dialog-wide' ? 'El ancho intermedio, de 576 px.' : 'El grande, ahora con el velo detrás.' }}</DialogDescription>
        </DialogHeader>
        <PasswordField v-model="secret" aria-label="Contraseña de la red" />
        <DialogFooter>
          <ActionButton label="Cancelar" variant="secondary" />
          <ActionButton label="Conectar" />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>

  <!-- Contra la ventana: los avisos arriba. -->
  <div v-else-if="section === 'toast-top' && first">
    <p class="text-body-s">Los controles del reproductor están abajo.</p>
    <ToastArea :toasts="toasts" position="top-center" />
  </div>
</template>
