<script setup lang="ts">
/**
 * La ventana, la barra, la búsqueda de la barra y el reproductor.
 *
 * `WindowFrame` ocupa la ventana entera (`h-screen w-screen`), así que se
 * captura con la ventana de cada ancho, como el diálogo (`frame`). La barra, los
 * controles y la búsqueda se dibujan en su caja.
 */
import { ref } from 'vue';
import {
	ActionButton,
	AppBar,
	BarSearch,
	NowPlayingCard,
	SeekBar,
	SideBar,
	SpinningCover,
	WindowControls,
	WindowFrame,
} from '../src';

defineProps<{ section: string; width: number; first: boolean }>();

const query = ref('');
const typed = ref('fotos');
const categories = [
	{
		id: 'system',
		title: 'Sistema',
		items: [
			{ id: 'network', label: 'Red', icon: 'preferences-system-network' },
			{ id: 'sound', label: 'Sonido', icon: 'audio-volume-high' },
		],
	},
];
</script>

<template>
  <div v-if="section === 'window'" class="flex flex-col gap-3">
    <AppBar title="Configuración" :controls="['minimize', 'maximize', 'close']">
      <BarSearch v-model="query" placeholder="Buscar" label="Buscar" />
    </AppBar>
    <AppBar title="Con la búsqueda plegada y acciones">
      <template #acciones>
        <ActionButton label="" icon="view-refresh" icon-alt="Recargar" variant="ghost" />
      </template>
      <BarSearch v-model="typed" collapsed label="Buscar" />
    </AppBar>
    <div class="flex items-center gap-4">
      <WindowControls :controls="['minimize', 'maximize', 'close']" class="is-hover" />
      <WindowControls :controls="['close']" />
    </div>
    <!-- 2.16.0: estilo macOS, al final y invertido. -->
    <div class="flex items-center gap-4">
      <WindowControls variant="macos" />
      <WindowControls variant="macos" order="reversed" />
      <WindowControls order="reversed" />
    </div>
  </div>

  <div v-else-if="section === 'media'" class="flex flex-col gap-4">
    <NowPlayingCard
      title="Un título de canción bastante largo para ver cómo se corta"
      artist="Artista"
      album="Disco"
      state="playing"
      :position="83"
      :duration="245"
      can-go-previous
      can-go-next
      can-play-pause
      can-seek />
    <NowPlayingCard state="stopped" :position="0" :duration="0" />
    <SeekBar :position="40" :duration="200" />
    <div class="flex gap-4">
      <SpinningCover class="w-16" state="paused" />
      <SpinningCover class="w-10" state="stopped" />
    </div>
  </div>

  <WindowFrame v-else-if="section === 'frame' && first" title="Configuración" :position="'top'">
    <div class="flex min-h-0 flex-1 gap-1 p-1">
      <SideBar :categories="categories" model-value="sound" title="Configuración" />
      <div class="min-w-0 flex-1 rounded-corner-l border border-ui-line bg-ui-surface/70 p-4">Contenido</div>
    </div>
  </WindowFrame>
</template>
