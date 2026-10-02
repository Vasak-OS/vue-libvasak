<script setup lang="ts">
/**
 * La 2.5.0: la órbita del dispositivo conectado (vasak-desktop#132).
 *
 * Sobre un fondo de colores del esquema y dentro de una tarjeta `ui-shell`,
 * como queda en el applet del escritorio: lo translúcido sobre el fondo liso
 * de la ventana no se vería. A cada ancho del banco: en la órbita cuando entra,
 * apilada cuando no.
 */
import { DeviceOrbit } from '../src';

defineProps<{ section: string; width: number }>();

const headphones = { icon: 'audio-headphones', title: 'JBL Tune 720BT', subtitle: 'Conectado' };
const bluetooth = [
	{ id: 'scan', icon: 'view-refresh', value: 'Buscar dispositivos', label: 'Cambiar de vista', action: true },
	{ id: 'battery', icon: 'battery-level-70', value: '70 %', label: 'Batería' },
	{ id: 'profile', icon: 'audio-speakers', value: 'A2DP · AAC', label: 'Perfil de audio' },
	{ id: 'mac', icon: 'network-wired', value: '08:92:CC:7C:37:A1', label: 'Dirección MAC' },
];
const wifi = { icon: 'network-wireless-signal-excellent', title: 'Fibernet-IA 5G', subtitle: 'Conectado' };
const wifiSatellites = [
	{ id: 'networks', icon: 'view-list', value: 'Ver redes', label: 'Cambiar de vista', action: true },
	{ id: 'signal', icon: 'network-wireless-signal-good', value: '78 %', label: 'Señal' },
	{ id: 'security', icon: 'security-high', value: 'WPA2 personal', label: 'Seguridad' },
	{ id: 'ip', icon: 'network-workgroup', value: '192.0.2.42', label: 'Dirección IP' },
	{ id: 'battery', icon: 'battery-level-10', value: '8 %', label: 'Batería', tone: 'accent' as const },
];
</script>

<template>
  <div class="flex flex-col gap-4 overflow-hidden rounded-corner-l bg-linear-to-br from-primary via-secondary to-status-success p-4">
    <div class="h-[460px] rounded-corner-xl border border-ui-line bg-ui-shell p-4 shadow-surface-l">
      <DeviceOrbit label="Bluetooth" :center="headphones" :satellites="bluetooth" />
    </div>
    <div class="h-[460px] rounded-corner-xl border border-ui-line bg-ui-shell p-4 shadow-surface-l">
      <DeviceOrbit label="Wi-Fi" :center="wifi" :satellites="wifiSatellites" pulsing />
    </div>
    <div class="h-[320px] rounded-corner-xl border border-ui-line bg-ui-shell p-4 shadow-surface-l">
      <DeviceOrbit
        label="Bluetooth"
        :center="null"
        empty-label="Ningún dispositivo conectado"
        empty-icon="bluetooth-disabled"
        :satellites="[{ id: 'scan', icon: 'view-refresh', label: 'Buscar dispositivos', action: true }]" />
    </div>
  </div>
</template>
