<script setup lang="ts">
/**
 * La 2.20.0: la lista que se reordena arrastrando y con el teclado.
 *
 * Los dos consumidores de Configuración, uno al lado del otro: los anclados del
 * panel (icono + nombre + quitar) y los módulos de fastfetch (nombre + plegar
 * las opciones). El mismo componente, filas distintas por la ranura.
 */
import { ref } from 'vue';
import { ActionButton, Disclosure, SortableList, ThemeIcon } from '../src';

defineProps<{ section: string; width: number }>();

type Pinned = { id: string; name: string; icon: string };
type Module = { name: string; options: string[] };

const pinned = ref<Pinned[]>([
	{ id: 'files', name: 'Archivos', icon: 'system-file-manager' },
	{ id: 'term', name: 'Terminal', icon: 'utilities-terminal' },
	{ id: 'web', name: 'Firefox', icon: 'firefox' },
	{ id: 'mail', name: 'Correo', icon: 'mail-unread' },
]);

const modules = ref<Module[]>([
	{ name: 'os', options: ['key: Sistema'] },
	{ name: 'cpu', options: ['format: {name}'] },
	{ name: 'cpu', options: ['temp: true'] },
	{ name: 'memory', options: [] },
]);

function remove(id: string) {
	pinned.value = pinned.value.filter((item) => item.id !== id);
}
</script>

<template>
  <div v-if="section === 'sortable'" class="flex flex-col gap-6">
    <div class="flex flex-col gap-2">
      <p class="font-semibold text-sm text-tx-muted">Anclados del panel</p>
      <SortableList v-model="pinned" item-key="id" label="Anclados del panel">
        <template #item="{ item }">
          <div class="flex min-w-0 items-center gap-2 py-1">
            <ThemeIcon :name="item.icon" :size="24" />
            <span class="min-w-0 flex-1 truncate text-label-m text-tx-main">{{ item.name }}</span>
            <ActionButton label="" icon="list-remove" icon-alt="Quitar" variant="ghost" size="sm" @click="remove(item.id)" />
          </div>
        </template>
      </SortableList>
    </div>

    <div class="flex flex-col gap-2">
      <p class="font-semibold text-sm text-tx-muted">Módulos de fastfetch (nombres repetidos)</p>
      <SortableList v-model="modules" label="Módulos de fastfetch">
        <template #item="{ item }">
          <Disclosure :title="item.name">
            <ul class="flex flex-col gap-1 py-1 pl-2 text-body-xs text-tx-muted">
              <li v-for="opt in item.options" :key="opt">{{ opt }}</li>
              <li v-if="item.options.length === 0" class="italic">sin opciones</li>
            </ul>
          </Disclosure>
        </template>
      </SortableList>
    </div>
  </div>
</template>
