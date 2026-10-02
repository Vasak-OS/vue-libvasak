<script setup lang="ts">
/**
 * Los botones de energía: suspender, reiniciar, apagar, y los de la sesión
 * (2.4.0).
 *
 * Salen del `PowerMenu` del inicio de sesión (vasak-session-manager), que los
 * dibujaba con tres glifos de texto —☾ ↻ ⏻— en lugar de iconos, y del diálogo
 * de sesión del escritorio, con sus círculos de 80 px. Es el mismo conjunto en
 * las dos pantallas, y en las dos tiene que decir lo mismo con los mismos
 * iconos.
 *
 * La librería no apaga nada: emite `action` con el nombre, y quien la usa
 * llama a lo suyo (logind, greetd, el gestor de sesión). Tampoco pregunta
 * «¿seguro?»: eso depende de la pantalla —en el inicio de sesión no hay nada
 * que perder, en el escritorio sí—.
 *
 * # Las dos formas
 *
 * - `icons`: una fila de botones de icono de 40 (`ActionButton` `lg`), con el
 *   nombre como `aria-label` y como globo del sistema (`title`). La del
 *   inicio de sesión, en una esquina. Sobre un fondo de pantalla va con
 *   `buttonVariant="overlay"`.
 * - `tiles`: cada acción es un círculo de 80 (`IconTile` `2xl`) con el nombre
 *   escrito debajo. La del diálogo de sesión.
 *
 * Las dos se acomodan al lugar: la fila se parte en renglones en vez de
 * salirse, y en `tiles` el nombre se parte debajo de su círculo.
 *
 * # Los iconos y los nombres
 *
 * Los de la especificación de freedesktop: `system-suspend`,
 * `system-hibernate`, `system-reboot`, `system-shutdown`, `system-log-out`,
 * `system-lock-screen`. Los nombres salen de `labels`, del catálogo
 * (`power.suspend`, `power.hibernate`, `power.reboot`, `power.poweroff`,
 * `power.logout`, `power.lock` —las claves del inicio de sesión—) y, sin nada,
 * en inglés.
 */
import { computed } from 'vue';
import IconTile from '../indicators/IconTile.vue';
import { useLabels } from '../shared/labels';
import ActionButton from './ActionButton.vue';

export type PowerAction = 'suspend' | 'hibernate' | 'reboot' | 'poweroff' | 'logout' | 'lock';

const props = withDefaults(
	defineProps<{
		/** Cuáles, en ese orden. */
		actions?: readonly PowerAction[];
		variant?: 'icons' | 'tiles';
		/** La variante de los botones en `icons`: `overlay` sobre un fondo de pantalla. */
		buttonVariant?: 'secondary' | 'ghost' | 'overlay';
		/** Los nombres, ya traducidos. Lo que falte sale del catálogo. */
		labels?: Partial<Record<PowerAction, string>>;
		/** El nombre del grupo, para un lector de pantalla. */
		label?: string;
		disabled?: boolean;
	}>(),
	{
		actions: () => ['suspend', 'reboot', 'poweroff'],
		variant: 'icons',
		buttonVariant: 'secondary',
		labels: () => ({}),
		label: undefined,
		disabled: false,
	}
);

const emit = defineEmits<{ action: [action: PowerAction] }>();

const translate = useLabels();

const ICONS: Record<PowerAction, string> = {
	suspend: 'system-suspend',
	hibernate: 'system-hibernate',
	reboot: 'system-reboot',
	poweroff: 'system-shutdown',
	logout: 'system-log-out',
	lock: 'system-lock-screen',
};

const FALLBACK: Record<PowerAction, string> = {
	suspend: 'Suspend',
	hibernate: 'Hibernate',
	reboot: 'Restart',
	poweroff: 'Power off',
	logout: 'Log out',
	lock: 'Lock',
};

const items = computed(() =>
	props.actions.map((action) => ({
		action,
		icon: ICONS[action],
		name: props.labels[action] ?? translate(`power.${action}`, FALLBACK[action]),
	}))
);

const groupName = computed(() => props.label ?? translate('power.title', 'Power'));

function run(action: PowerAction) {
	if (props.disabled) return;
	emit('action', action);
}
</script>

<template>
  <div
    role="group"
    :aria-label="groupName"
    class="flex min-w-0 flex-wrap items-start"
    :class="variant === 'tiles' ? 'justify-center gap-4' : 'gap-2'"
    :data-variant="variant">
    <template v-if="variant === 'icons'">
      <ActionButton
        v-for="item in items"
        :key="item.action"
        label=""
        :icon="`${item.icon}-symbolic`"
        :icon-alt="item.name"
        :title="item.name"
        :variant="buttonVariant"
        size="lg"
        :disabled="disabled"
        @click="run(item.action)" />
    </template>
    <template v-else>
      <!-- El botón es el círculo y su nombre juntos: se apunta a cualquiera de
           los dos, y el foco los rodea a los dos. -->
      <button
        v-for="item in items"
        :key="item.action"
        type="button"
        class="group flex w-24 min-w-0 flex-col items-center gap-2 rounded-corner-l p-2 text-tx-main transition-colors duration-200 ease-ui focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-focus disabled:cursor-not-allowed disabled:opacity-50"
        :class="disabled ? '' : 'hover:bg-ui-hover active:bg-ui-pressed active:duration-100'"
        :disabled="disabled"
        :data-action="item.action"
        @click="run(item.action)">
        <IconTile :name="item.icon" size="2xl" shape="circle" />
        <span class="max-w-full break-words text-center text-label-m">{{ item.name }}</span>
      </button>
    </template>
  </div>
</template>
