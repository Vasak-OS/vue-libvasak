<script setup lang="ts">
/**
 * La 2.2.0: el globo con contenido, las teclas, la identidad, los recuadros,
 * las carátulas, los datos, el plegable, la zona de soltar, y lo que sumaron el
 * menú, la bandeja y la barra lateral.
 *
 * Los estados de puntero y de teclado se fuerzan con `is-hover` / `is-active` /
 * `is-focus` (ver `Bench.vue`). Los globos y los menús se abren después de
 * montar, como en la sección del menú.
 */
import { onMounted, ref } from 'vue';
import {
	ActionButton,
	Avatar,
	CodeBlock,
	CoverArt,
	Disclosure,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	DropZone,
	IconTile,
	IdentityBlock,
	Kbd,
	Popover,
	PopoverContent,
	PopoverTrigger,
	PropertyList,
	SideBar,
	Skeleton,
	SpinningCover,
	StatTile,
	SwitchToggle,
	TextInput,
	ToggleControl,
	TrayIconButton,
} from '../src';

defineProps<{ section: string; width: number }>();

const open = ref(false);
const hidden = ref(true);
const sort = ref(true);
const tagName = ref('Trabajo');
const compact = ref(false);
/** La carátula del banco sale del tema de iconos, como todo lo demás. */
const cover = '/__icon/folder-music?kind=icon&mode=light';

const properties = [
	{ label: 'Disco', value: '/dev/nvme0n1 · Samsung 980 PRO 1 TB', mono: true },
	{ label: 'Sistema de archivos', value: 'btrfs, con instantáneas' },
	{ label: 'Idioma', value: 'Español (Argentina)' },
	{ label: 'Usuario', value: 'pato' },
];

const log = [
	{ text: ':: Sincronizando las bases de datos…', tone: 'muted' as const },
	{ text: ' core está al día' },
	{ text: 'advertencia: firefox-133.0-1 está al día, se reinstala', tone: 'warning' as const },
	{ text: 'error: no se pudo bloquear la base de datos', tone: 'error' as const },
	{ text: ':: Instalación terminada', tone: 'success' as const },
];

const categories = [
	{
		id: 'steps',
		title: 'Instalación',
		items: [
			{ id: 'lang', label: 'Idioma', icon: 'preferences-desktop-locale', description: 'Español' },
			{ id: 'disk', label: 'Disco', icon: 'drive-harddisk', description: 'Dónde se instala' },
			{ id: 'user', label: 'Cuenta', icon: 'system-users', description: 'Tu usuario' },
		],
	},
];

onMounted(() => {
	setTimeout(() => {
		open.value = true;
	}, 0);
});
</script>

<template>
  <!-- El globo, abierto, y el menú con las extensiones. -->
  <div v-if="section === 'popover'" class="flex h-96 flex-wrap items-start gap-4">
    <Popover :open="open">
      <PopoverTrigger as-child>
        <ActionButton label="Etiquetas" icon="tag" variant="secondary" />
      </PopoverTrigger>
      <PopoverContent label="Etiquetas" class="w-64">
        <div class="flex flex-col gap-2">
          <p class="m-0 font-semibold text-label-m">Etiquetar 3 archivos</p>
          <TextInput v-model="tagName" aria-label="Nombre de la etiqueta" />
          <div class="flex justify-end gap-2">
            <ActionButton label="Cancelar" variant="ghost" size="sm" />
            <ActionButton label="Aplicar" size="sm" />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  </div>

  <div v-else-if="section === 'menu-22'" class="h-96">
    <DropdownMenu :open="open">
      <DropdownMenuTrigger as-child>
        <ActionButton label="Ver" variant="secondary" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem v-model:checked="hidden">Mostrar los ocultos</DropdownMenuItem>
        <DropdownMenuItem v-model:checked="compact" class="is-hover">Vista compacta</DropdownMenuItem>
        <DropdownMenuItem :checked="sort" toggle="radio">Por nombre</DropdownMenuItem>
        <DropdownMenuItem :checked="false" toggle="radio" class="is-focus">Por fecha</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem icon="edit-copy" :shortcut="['Ctrl', 'C']">Copiar</DropdownMenuItem>
        <DropdownMenuItem icon="edit-paste" :shortcut="['Ctrl', 'V']" disabled>Pegar</DropdownMenuItem>
        <DropdownMenuItem :inset="1">
          Propiedades
          <template #description>Tamaño, permisos y etiquetas</template>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem icon="user-trash" danger>Mover a la papelera</DropdownMenuItem>
        <DropdownMenuItem icon="edit-delete" danger class="is-hover">Borrar para siempre</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>

  <!-- Teclas, identidad, recuadros y esqueletos. -->
  <div v-else-if="section === 'identity'" class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center gap-3">
      <Kbd>Esc</Kbd>
      <Kbd :keys="['Ctrl', 'Mayús', 'T']" />
      <Kbd :keys="['Super', 'Espacio']" />
    </div>
    <div class="flex flex-wrap items-center gap-3">
      <Avatar name="Joaquín Decima" size="sm" />
      <Avatar name="Joaquín Decima" />
      <Avatar name="Ángela Pérez" size="lg" />
      <Avatar :src="cover" name="Con foto" size="xl" />
      <Avatar size="lg" />
      <Avatar name="Editable" size="xl" editable />
      <Avatar name="Editable" size="xl" editable class="is-focus" />
    </div>
    <IdentityBlock title="Joaquín Decima" subtitle="pato@vasak · Administrador">
      <template #trailing><ActionButton label="" icon="system-log-out" icon-alt="Salir" variant="ghost" /></template>
    </IdentityBlock>
    <IdentityBlock title="Un nombre de usuario larguísimo que no entra en la tarjeta" subtitle="y una dirección de correo igual de larga@ejemplo.com" size="md" />
    <div class="flex flex-wrap items-center gap-3">
      <IconTile name="drive-harddisk" size="sm" />
      <IconTile name="drive-harddisk" />
      <IconTile name="drive-harddisk" size="lg" tone="selected" />
      <IconTile name="preferences-desktop-locale" tone="accent" />
      <IconTile name="network-wireless" tone="success" status="success" status-label="Listo" />
      <IconTile name="system-users" tone="warning" status="warning" />
      <IconTile name="package-x-generic" tone="error" status="error" />
      <IconTile name="bluetooth" shape="circle" />
    </div>
    <div class="flex flex-col gap-2">
      <Skeleton width="60%" />
      <Skeleton />
      <div class="flex items-center gap-3">
        <Skeleton shape="circle" :width="40" />
        <Skeleton shape="block" :height="40" />
      </div>
    </div>
  </div>

  <!-- Carátulas, el disco con aro y la zona de soltar. -->
  <div v-else-if="section === 'media-22'" class="flex flex-col gap-4">
    <div class="flex flex-wrap items-end gap-3">
      <CoverArt :src="cover" alt="Álbum" size="sm" />
      <CoverArt :src="cover" alt="Álbum" size="md" />
      <CoverArt alt="Sin carátula" size="lg" />
      <CoverArt alt="Radio Nacional" fallback-text="RN" size="lg" />
      <CoverArt alt="Artista" fallback-text="M" size="lg" shape="round" />
      <CoverArt :src="cover" alt="Grande" size="xl" />
    </div>
    <div class="flex flex-wrap items-center gap-4">
      <SpinningCover :src="cover" state="paused" class="w-16" />
      <SpinningCover :src="cover" state="paused" :progress="35" class="w-16" />
      <SpinningCover state="stopped" :progress="80" interactive label="Abrir el reproductor" class="w-16" />
      <SpinningCover state="stopped" :progress="80" interactive label="Con el foco" class="w-16 is-focus" />
    </div>
    <DropZone />
    <DropZone active label="Soltá para agregar a la biblioteca">
      <ActionButton label="Elegir archivos" variant="secondary" size="sm" />
    </DropZone>
    <DropZone locked locked-label="Hay una instalación en curso" />
    <div class="relative h-40 overflow-hidden rounded-corner-l border border-ui-line">
      <div class="p-3 text-body-s">Contenido de la vista, tapado mientras se arrastra encima.</div>
      <DropZone overlay active label="Soltá el paquete para instalarlo" />
    </div>
  </div>

  <!-- Datos y plegables. -->
  <div v-else-if="section === 'data'" class="flex flex-col gap-4">
    <div class="grid gap-2" :class="width >= 600 ? 'grid-cols-3' : 'grid-cols-1'">
      <StatTile label="Memoria" value="6,2 GB" hint="de 16 GB" icon="media-flash" />
      <StatTile label="Paquetes instalados" value="1 284" />
      <StatTile label="Un número con un nombre larguísimo" value="123 456 789 012 345" hint="Se corta antes que la tarjeta" />
    </div>
    <PropertyList :items="properties" />
    <PropertyList :items="properties" layout="rows" />
    <PropertyList :items="properties.slice(0, 3)" layout="inline" />
    <CodeBlock :lines="log" variant="log" label="Registro" :max-height="120" follow />
    <CodeBlock text="sudo pacman -Syu vasak-desktop vue-libvasak --needed --noconfirm --overwrite '/usr/share/vasak/*'" />
    <Disclosure title="Opciones avanzadas" variant="card" default-open>
      <template #meta>3 ajustes</template>
      <div class="flex items-center justify-between gap-2 text-label-m">
        <span>Instantáneas antes de actualizar</span>
        <SwitchToggle :model-value="true" label="Instantáneas" />
      </div>
    </Disclosure>
    <Disclosure title="Cerrado, en reposo" variant="card" />
    <Disclosure title="Cerrado, encima" class="is-hover" />
    <Disclosure title="Apagado" disabled />
  </div>

  <!-- La bandeja y la barra lateral. -->
  <div v-else-if="section === 'tray-22'" class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center gap-2">
      <ToggleControl label="Wi-Fi" name="network-wireless" :is-active="true" :indicator="{ tone: 'success', label: 'Conectado' }" />
      <ToggleControl label="Bluetooth" name="bluetooth" :badge="2" :indicator="{ tone: 'accent', pulse: true, label: 'Buscando' }" />
      <ToggleControl label="Sin red" name="network-offline" :indicator="{ tone: 'error', label: 'Sin conexión' }" />
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <TrayIconButton name="firefox" alt="Firefox" :badge="3" />
      <TrayIconButton name="system-software-update" alt="Actualizaciones" :progress="45" />
      <TrayIconButton name="folder-download" alt="Descargas" :progress="80" :badge="1" class="is-hover" />
      <TrayIconButton name="app-que-no-esta" :fallbacks="['application-x-executable']" alt="Respaldo" />
    </div>
    <div class="flex h-96 gap-2">
      <SideBar :categories="categories" model-value="disk" title="Instalador">
        <template #footer="{ collapsed }">
          <p v-if="!collapsed" class="m-0 truncate text-body-xs text-tx-muted">Paso 2 de 6</p>
          <p v-else class="m-0 text-center text-body-xs text-tx-muted">2/6</p>
        </template>
      </SideBar>
      <SideBar :categories="categories" model-value="disk" :collapsed="true">
        <template #footer="{ collapsed }">
          <p class="m-0 text-center text-body-xs text-tx-muted">{{ collapsed ? '2/6' : 'Paso 2 de 6' }}</p>
        </template>
      </SideBar>
    </div>
  </div>
</template>
