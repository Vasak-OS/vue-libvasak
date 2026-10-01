<script setup lang="ts">
/**
 * La 2.1.0: filas, listas, cabeceras, superficies, insignias y lo que sumaron
 * los avisos, el vacío, la espera y la barra de progreso.
 */
import { ref } from 'vue';
import {
	ActionButton,
	AlertMessage,
	Badge,
	ConfigSection,
	EmptyState,
	ListGroup,
	ListRow,
	LoadingState,
	PageHeader,
	Panel,
	ProgressBar,
	SectionHeading,
	SettingRow,
	StatusDot,
	SwitchToggle,
} from '../src';

defineProps<{ section: string; width: number }>();

const weather = ref(true);
const music = ref(false);
const selected = ref('inbox');
</script>

<template>
  <div v-if="section === 'rows'" class="flex flex-col gap-4">
    <PageHeader eyebrow="Sistema" title="Red" description="Las conexiones por cable, Wi-Fi y VPN de este equipo." size="lg">
      <template #actions>
        <ActionButton label="Agregar VPN" icon="list-add" variant="secondary" />
        <ActionButton label="" icon="view-refresh" icon-alt="Actualizar" variant="ghost" />
      </template>
    </PageHeader>
    <PageHeader title="Elegí el disco" description="Todo lo que tenga se va a borrar." icon="drive-harddisk" />

    <ConfigSection title="Indicadores del panel" icon="preferences-desktop" description="Lo que se ve al lado del reloj.">
      <SettingRow label="Clima" description="La temperatura y el cielo de tu ciudad" control-id="bench-weather">
        <SwitchToggle id="bench-weather" v-model="weather" label="Clima" />
      </SettingRow>
      <SettingRow label="Lo que suena, con un nombre de ajuste bastante largo para ver cómo se parte" control-id="bench-music">
        <SwitchToggle id="bench-music" v-model="music" label="Lo que suena" />
      </SettingRow>
      <template #actions>
        <ActionButton label="Restablecer" variant="ghost" size="sm" />
      </template>
    </ConfigSection>
    <ConfigSection title="Procesador" icon="cpu">
      <template #aside><Badge tone="warning" variant="solid" label="78 %" /></template>
      <ProgressBar :value="78" label="Uso" tone="warning" show-value />
    </ConfigSection>

    <SectionHeading title="Cuentas" />
    <ListGroup>
      <ListRow title="Firefox" description="Navegador web" icon="firefox" meta="320 MB" role="button" />
      <ListRow title="Encima" description="Con el velo neutro" icon="utilities-terminal" role="button" class="is-hover" />
      <ListRow title="Con el foco" icon="system-file-manager" role="button" class="is-focus" />
      <ListRow title="Elegida" description="El velo de acento" icon="mail-unread" role="button" selected />
      <ListRow title="Apagada" icon="printer" role="button" disabled />
      <ListRow title="Un nombre de aplicación muy largo que se corta en una línea porque la lista es virtual" description="y su descripción" icon="applications-games" truncate>
        <template #trailing><Badge label="Nueva" tone="accent" /></template>
      </ListRow>
    </ListGroup>

    <Panel>
      <SectionHeading title="Hoy" variant="group" :count="12" divider>
        <template #actions><ActionButton label="Ver todo" variant="ghost" size="sm" /></template>
      </SectionHeading>
      <ListGroup :divided="false" role="listbox" label="Carpetas">
        <ListRow v-for="f in ['inbox', 'sent', 'drafts']" :key="f" :title="f" role="option" :selected="selected === f" @click="selected = f">
          <template #leading><StatusDot :tone="f === 'inbox' ? 'accent' : 'neutral'" :label="f === 'inbox' ? 'Sin leer' : undefined" /></template>
          <template #trailing><Badge :label="f === 'inbox' ? 4 : 0" /></template>
        </ListRow>
      </ListGroup>
    </Panel>

    <div class="flex flex-wrap items-center gap-2">
      <Badge label="Neutra" />
      <Badge tone="accent" label="Acento" />
      <Badge tone="success" label="Instalado" dot />
      <Badge tone="warning" label="AUR" variant="outline" />
      <Badge tone="error" label="Falló" variant="solid" />
      <Badge tone="accent" label="3" variant="solid" />
      <Badge color="#40a02b" label="Etiqueta de la persona" />
      <Badge size="md" tone="success" label="Mediana" />
    </div>
    <div class="flex flex-wrap items-center gap-3">
      <StatusDot tone="success" label="Conectado" />
      <StatusDot tone="warning" label="Conectando" pulse />
      <StatusDot tone="error" label="Sin conexión" />
      <StatusDot tone="neutral" />
      <StatusDot color="#1e66f5" size="md" label="Calendario de trabajo" />
      <StatusDot tone="success" :outlined="false" />
    </div>
  </div>

  <div v-else-if="section === 'notices'" class="flex flex-col gap-3">
    <AlertMessage tone="info" icon="auto" title="Con el icono del tono">La red se configura sola.</AlertMessage>
    <AlertMessage tone="warning" icon="auto" dismissible>
      Hay imágenes remotas bloqueadas en este mensaje.
      <template #actions><ActionButton label="Mostrar imágenes" variant="secondary" size="sm" /></template>
    </AlertMessage>
    <AlertMessage tone="error" icon="auto" title="No se pudo cargar la radio" dismissible>
      El servidor no contestó.
      <template #actions><ActionButton label="Reintentar" variant="secondary" size="sm" /></template>
    </AlertMessage>
    <AlertMessage tone="success" variant="banner">Se guardó «notas.md».</AlertMessage>
    <AlertMessage tone="error" variant="banner" dismissible>
      «informe.odt» cambió en el disco.
      <template #actions>
        <ActionButton label="Recargar" variant="secondary" size="sm" />
        <ActionButton label="Guardar igual" variant="secondary" size="sm" />
      </template>
    </AlertMessage>
    <EmptyState title="No hay dispositivos de audio" size="sm" icon="" bordered />
    <EmptyState title="Sin notificaciones" note="Lo nuevo aparece acá" size="sm" icon="notifications-disabled" />
    <LoadingState label="Cargando paquetes…" size="sm" />
    <LoadingState label="Cargando paquetes…" size="sm" bordered />
    <ProgressBar :value="62" label="Copiando" size="xs" />
    <ProgressBar :value="62" label="Copiando" size="sm" />
    <ProgressBar :value="54.37" label="Disco / (ext4)" show-value :decimals="1" />
    <ProgressBar :value="null" label="Buscando" show-value />
  </div>
</template>
