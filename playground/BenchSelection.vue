<script setup lang="ts">
/**
 * La 2.1.0: elegir y escribir. Grupos de opciones, controles segmentados,
 * casillas, deslizadores, los campos nuevos y lo que sumaron los de antes.
 *
 * Los estados de puntero y de teclado se fuerzan con `is-hover` / `is-active` /
 * `is-focus` (ver `Bench.vue`).
 */
import { ref } from 'vue';
import {
	ActionButton,
	Checkbox,
	FormGroup,
	NumberField,
	OptionGroup,
	SearchField,
	SegmentedControl,
	SelectField,
	Slider,
	TextArea,
	TextInput,
} from '../src';

defineProps<{ section: string; width: number }>();

const output = ref('jack');
const disk = ref('nvme');
const view = ref('grid');
const theme = ref('dark');
const storeSection = ref('updates');
const tag = ref('rock');
const yes = ref(true);
const no = ref(false);
const speed = ref(40);
const port = ref(993);
const fraction = ref(0.5);
const body = ref('Hola:\n\nTe mando el informe de septiembre.');
const user = ref('pato');
const when = ref('2026-10-02T09:30');
const query = ref('firefox');
const layout = ref('bottom');

const outputs = [
	{ value: 'hdmi', label: 'HDMI / DisplayPort', description: 'Volumen 80 %' },
	{ value: 'jack', label: 'Auriculares', description: 'Volumen 45 %', badge: 'Predeterminado' },
	{ value: 'usb', label: 'Interfaz USB con un nombre largo que no entra en la fila', description: 'Desconectada', disabled: true },
];
const disks = [
	{ value: 'nvme', label: 'Samsung 980 (500 GB)', description: 'NVMe, se borra entero', icon: 'drive-harddisk-solidstate' },
	{ value: 'sata', label: 'WD Blue (1 TB)', description: 'Rotacional', icon: 'drive-harddisk' },
];
const views = [
	{ value: 'list', label: 'Lista', icon: 'view-list', iconOnly: true },
	{ value: 'grid', label: 'Cuadrícula', icon: 'view-grid', iconOnly: true },
];
const themes = [
	{ value: 'light', label: 'Claro' },
	{ value: 'dark', label: 'Oscuro' },
	{ value: 'auto', label: 'Automático' },
];
const sections = [
	{ value: 'discover', label: 'Descubrir', href: '#discover' },
	{ value: 'installed', label: 'Instaladas', href: '#installed' },
	{ value: 'updates', label: 'Actualizaciones', href: '#updates', badge: 3, badgeTone: 'warning' as const },
	{ value: 'repos', label: 'Repositorios', href: '#repos' },
];
const tags = ['rock', 'jazz', 'clásica', 'electrónica', 'folklore', 'tango', 'noticias'].map((t) => ({ value: t, label: t }));
</script>

<template>
  <div v-if="section === 'selection'" class="flex flex-col gap-4">
    <OptionGroup v-model="output" :options="outputs" label="Salida de audio" />
    <OptionGroup v-model="output" :options="outputs.slice(0, 2)" label="Salida de audio (applet)" size="sm" />
    <OptionGroup v-model="disk" :options="disks" label="Disco" variant="card" />
    <div class="flex flex-wrap items-center gap-3">
      <SegmentedControl v-model="view" :options="views" label="Vista" />
      <SegmentedControl v-model="theme" :options="themes" label="Tema" />
    </div>
    <SegmentedControl v-model="storeSection" :options="sections" label="Secciones" />
    <SegmentedControl v-model="tag" :options="tags" label="Etiquetas" variant="chips" />
    <div class="flex flex-wrap gap-x-6">
      <Checkbox v-model="yes" label="Marcada" />
      <Checkbox v-model="no" label="Sin marcar" />
      <Checkbox v-model="no" label="A medias" indeterminate />
      <Checkbox v-model="yes" label="Apagada" disabled />
    </div>
    <Checkbox v-model="yes" label="Recordar esta decisión" description="No vuelve a preguntar por esta aplicación hasta que reinicies la sesión." />
  </div>

  <div v-else-if="section === 'fields'" class="flex flex-col gap-4">
    <Slider v-model="speed" label="Velocidad del puntero" :value-text="(v: number) => `${v} %`">
      <template #start>Lento</template>
      <template #end>Rápido</template>
    </Slider>
    <Slider v-model="speed" label="Apagado" disabled />
    <div class="grid gap-3" :class="width >= 600 ? 'grid-cols-2' : ''">
      <FormGroup label="Puerto IMAP" help="El 993 es el de siempre con TLS." v-slot="{ id, describedBy }">
        <NumberField :id="id" v-model="port" :min="1" :max="65535" :described-by="describedBy" stepper />
      </FormGroup>
      <FormGroup label="Opacidad" v-slot="{ id }">
        <NumberField :id="id" v-model="fraction" :min="0" :max="1" :step="0.1" narrow />
      </FormGroup>
      <FormGroup label="Usuario" error="Ya hay una cuenta con ese nombre." v-slot="{ id, describedBy, invalid }">
        <TextInput :id="id" v-model="user" :described-by="describedBy" :invalid="invalid" />
      </FormGroup>
      <FormGroup label="Programar el envío" variant="eyebrow" v-slot="{ id }">
        <TextInput :id="id" v-model="when" type="datetime-local" />
      </FormGroup>
      <SelectField v-model="layout" label="Posición de la barra" :options="[{ label: 'Abajo', value: 'bottom' }, { label: 'Arriba', value: 'top' }]" />
      <SelectField v-model="layout" label="Como cadenas" :options="['bottom', 'top']" />
    </div>
    <FormGroup label="Mensaje" v-slot="{ id }">
      <TextArea :id="id" v-model="body" :rows="4" />
    </FormGroup>
    <TextArea v-model="body" :rows="2" invalid aria-label="Inválido" />
    <TextArea v-model="body" :rows="2" class="is-focus" aria-label="Con el foco" />
    <div class="rounded-corner-l border border-ui-line bg-ui-float p-2">
      <SearchField v-model="query" label="Buscar aplicaciones" size="lg" bare />
    </div>
    <TextInput v-model="user" size="lg" aria-label="Grande" />
    <div class="flex flex-wrap items-center gap-2">
      <ActionButton label="Aleatorio" icon="media-playlist-shuffle" variant="ghost" :pressed="true" />
      <ActionButton label="Repetir" icon="media-playlist-repeat" variant="ghost" :pressed="false" />
      <ActionButton label="" icon="view-preview" icon-alt="Vista previa" variant="secondary" :pressed="true" />
      <ActionButton label="Sitio del proyecto" icon="go-next" icon-right href="#" variant="secondary" />
    </div>
    <!-- Sobre una «foto»: un degradado de los dos extremos del esquema. -->
    <div class="flex flex-wrap items-center gap-2 rounded-corner-l bg-linear-to-r from-tx-main to-ui-bg p-4">
      <ActionButton label="" icon="go-previous" icon-alt="Anterior" variant="overlay" />
      <ActionButton label="" icon="media-playback-start" icon-alt="Reproducir" variant="overlay" size="lg" />
      <ActionButton label="Cerrar" icon="window-close" variant="overlay" class="is-hover" />
    </div>
  </div>
</template>
