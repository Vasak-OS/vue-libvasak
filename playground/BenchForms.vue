<script setup lang="ts">
/**
 * Formularios, tarjetas de dispositivo y bandeja, en todos sus estados.
 *
 * Escrito contra la API que existe antes y después de vue-libvasak#74, para
 * que el mismo banco sirva para las dos capturas. Los estados de puntero y de
 * teclado se fuerzan con `is-hover` / `is-active` / `is-focus` (ver `Bench.vue`).
 */
import { ref } from 'vue';
import {
	DeviceCard,
	FormGroup,
	ProgressBar,
	SearchSelect,
	SelectField,
	SliderControl,
	SwitchRow,
	SwitchToggle,
	TextInput,
	ToggleControl,
	TrayIconButton,
} from '../src';

defineProps<{ section: string; width: number }>();

const name = ref('Pato');
const layout = ref('us');
const city = ref('es');
const on = ref(true);
const off = ref(false);
const volume = ref(60);
const options = [
	{ valor: 'us', etiqueta: 'Inglés (EE. UU.)', detalle: 'us' },
	{ valor: 'es', etiqueta: 'Español', detalle: 'es' },
	{ valor: 'latam', etiqueta: 'Español (Latinoamérica)', detalle: 'latam' },
];
</script>

<template>
  <div v-if="section === 'forms'" class="flex flex-col gap-3">
    <FormGroup label="Nombre de usuario" html-for="bench-name">
      <TextInput id="bench-name" v-model="name" />
    </FormGroup>
    <SelectField v-model="layout" label="Distribución">
      <option value="us">Inglés (EE. UU.)</option>
      <option value="es">Español</option>
    </SelectField>
    <SelectField v-model="layout" label="Encima" class="is-hover">
      <option value="us">Inglés (EE. UU.)</option>
    </SelectField>
    <SearchSelect v-model="city" :options="options" label="Teclado" />
    <div class="flex flex-wrap items-center gap-3">
      <SwitchToggle v-model="on" label="Encendido" />
      <SwitchToggle v-model="off" label="Apagado" />
      <SwitchToggle v-model="on" label="Con el foco" class="is-focus" />
      <SwitchToggle v-model="off" label="Apagado" disabled />
      <SwitchToggle v-model="on" label="Mediano" size="medium" />
      <SwitchToggle v-model="off" label="Mediano" size="medium" />
    </div>
    <SwitchRow v-model="on" label="Controladores privativos" description="Para la tarjeta de vídeo de esta máquina" icon="video-display" />
    <SwitchRow v-model="off" label="Impresoras" description="Encima" icon="printer" class="is-hover" />
    <SwitchRow v-model="off" label="Con el foco, sin icono ni descripción" class="is-focus" />
    <ProgressBar :value="40" label="Copiando" />
    <ProgressBar :value="80" label="Disco" tone="warning" />
    <ProgressBar :value="95" label="Disco" tone="critical" />
    <ProgressBar :value="null" label="Buscando" />
    <SliderControl v-model="volume" label="Volumen" name="audio-volume-high" show-button />
    <div class="flex flex-wrap gap-2">
      <ToggleControl label="Wi-Fi" name="network-wireless" is-active />
      <ToggleControl label="Bluetooth" name="bluetooth" />
      <ToggleControl label="Encima" name="night-light" class="is-hover" />
      <ToggleControl label="Cargando" name="network-wired" is-loading />
    </div>
  </div>

  <div v-else-if="section === 'devices'" class="flex flex-col gap-0">
    <DeviceCard title="Auriculares" subtitle="Conectados" name="audio-headphones" is-connected action-label="Desconectar" action-kind="destructive" show-status-indicator />
    <DeviceCard title="Teclado de la sala" subtitle="Emparejado" metadata="Batería 80 %" name="input-keyboard" action-label="Conectar" clickable />
    <DeviceCard title="Un dispositivo con un nombre largo que no entra en la fila" name="phone" action-label="Conectar" is-connecting connecting-label="Conectando…" />
    <div class="flex flex-wrap items-center gap-1 rounded-corner border border-dashed border-ui-border-strong/40 p-1">
      <TrayIconButton name="network-wireless" alt="Red" />
      <TrayIconButton name="audio-volume-high" alt="Encima" class="is-hover" />
      <TrayIconButton name="mail-unread" alt="Correo" :badge="3" />
      <TrayIconButton name="battery" alt="Batería" :interactive="false" />
      <TrayIconButton name="bluetooth" alt="Con globo" show-custom-tooltip custom-tooltip-text="Bluetooth encendido" class="is-hover" data-bench-enter />
    </div>
  </div>
</template>
