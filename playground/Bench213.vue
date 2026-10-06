<script setup lang="ts">
/**
 * La 2.13.0: el mosaico de ajuste rápido del centro de control
 * (vasak-desktop#174/#175).
 *
 * Los mosaicos van sobre `ui-shell` —donde los pone el centro— y el `ui-shell`
 * sobre un fondo de colores del esquema, para ver lo translúcido. En dos
 * columnas por consulta de contenedor, como en el centro, y una sola en lo
 * angosto. Todos los estados: apagado, encendido, encendido con detalle, uno
 * que abre algo, «ahora no», no disponible y cargando.
 */
import { QuickSettingsTile } from '../src';

defineProps<{ section: string; width: number; first: boolean }>();
</script>

<template>
  <div v-if="section === 'tiles-213'" class="bench-wallpaper rounded-corner-l p-3">
    <div class="@container rounded-corner-xl border border-ui-line bg-ui-shell p-3">
      <div class="grid grid-cols-1 gap-2 @[17rem]:grid-cols-2">
        <QuickSettingsTile icon="network-wireless" title="Wi-Fi" status="Casa" :active="true" detail />
        <QuickSettingsTile icon="bluetooth" title="Bluetooth" status="Apagado" :active="false" detail />
        <QuickSettingsTile icon="notifications-disabled" title="No molestar" status="Hasta las 8:00" :active="true" />
        <QuickSettingsTile icon="weather-clear-night" title="Luz nocturna" status="Apagada" :active="false" />
        <QuickSettingsTile icon="airplane-mode" title="Modo avión" status="Apagado" :active="false" />
        <QuickSettingsTile icon="input-gaming" title="Juegos" status="Activando…" :active="false" loading />
        <QuickSettingsTile icon="preferences-system-time" title="Tiempo de pantalla" />
        <QuickSettingsTile icon="system-search" title="Buscar" disabled />
        <QuickSettingsTile
          icon="display-brightness"
          title="Brillo por monitor"
          unavailable
          unavailable-label="No disponible"
          detail />
        <QuickSettingsTile icon="weather-clear" title="Un ajuste con un nombre larguísimo" status="Y un estado que tampoco entra" :active="true" detail />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Sólo del banco: algo de color detrás del escritorio translúcido. */
.bench-wallpaper {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary), var(--color-status-success));
}
</style>
