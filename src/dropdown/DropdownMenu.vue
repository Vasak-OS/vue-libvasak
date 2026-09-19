<script lang="ts" setup>
/**
 * La raíz de un menú desplegable.
 *
 * No dibuja nada propio: provee el estado que comparten el disparador, el
 * contenido y los ítems. Se puede usar sin controlar —`<DropdownMenu>` y
 * listo— o atado con `v-model:open`, que es lo que necesita un menú
 * contextual, donde quien decide abrirlo es la aplicación y no un clic sobre
 * el disparador.
 */
import { computed, provide, ref, watch } from 'vue';
import { CLAVE_DEL_MENU, type FocoAlAbrir, siguienteIdDeMenu } from './tipos';

const props = withDefaults(
	defineProps<{
		/** Atado desde afuera. Sin esto el menú se abre y se cierra solo. */
		open?: boolean;
	}>(),
	{
		// Sin esto, nunca. Una propiedad declarada `boolean` que no se pasa vale
		// `false` y no `undefined` —Vue trata los booleanos como los atributos
		// del HTML, donde estar ausente es estar apagado—, así que el `??` de
		// abajo jamás caía del lado del estado interno y un menú sin `v-model`
		// no se abría nunca. No se notaba porque las dos aplicaciones que lo
		// usan lo atan.
		open: undefined,
	}
);

const emit = defineEmits<{
	'update:open': [value: boolean];
}>();

const interno = ref(false);
const disparador = ref<HTMLElement | null>(null);
const idDeLaEtiqueta = ref<string | null>(null);
const focoAlAbrir = ref<FocoAlAbrir>('ninguno');
const idDelMenu = siguienteIdDeMenu();

/**
 * Quién tenía el foco cuando el menú se abrió.
 *
 * Es a quien vuelve el foco al cerrar, y no el disparador: en un menú
 * contextual el disparador es un ancla de cero por cero puesta donde se apretó
 * el botón derecho, y devolverle el foco a eso es tirarlo al vacío. Se anota al
 * abrir y no al cerrar, que es cuando el foco ya está adentro del menú.
 */
let quienLoAbrio: HTMLElement | null = null;

const abierto = computed({
	get: () => props.open ?? interno.value,
	set: (valor: boolean) => {
		if (props.open === undefined) {
			interno.value = valor;
		}
		emit('update:open', valor);
	},
});

// También cuando lo abre la aplicación por la propiedad: el menú contextual de
// una pestaña nunca pasa por `abrir()`, y sin esto se cerraría sin devolverle
// el foco a nadie.
watch(abierto, (esta) => {
	if (esta) {
		const activo = document.activeElement;
		quienLoAbrio = activo instanceof HTMLElement ? activo : null;
	} else {
		focoAlAbrir.value = 'ninguno';
	}
});

function abrir(foco: FocoAlAbrir = 'ninguno') {
	focoAlAbrir.value = foco;
	abierto.value = true;
}

function cerrar(opciones: { devolverElFoco?: boolean } = {}) {
	abierto.value = false;

	if (!opciones.devolverElFoco) return;
	const destino = quienLoAbrio ?? disparador.value;
	// `isConnected` porque la acción que se acaba de elegir bien puede haber
	// sacado del documento a quien abrió el menú —«cerrar las demás pestañas»
	// se lleva puesta la pestaña que tenía el foco—, y enfocar un elemento
	// huérfano deja el foco en el `body`, sin decirlo.
	if (destino?.isConnected) {
		destino.focus();
	}
}

function alternar(foco: FocoAlAbrir = 'ninguno') {
	if (abierto.value) {
		cerrar({ devolverElFoco: true });
		return;
	}
	abrir(foco);
}

provide(CLAVE_DEL_MENU, {
	abierto,
	idDelMenu,
	idDeLaEtiqueta,
	ponerLaEtiqueta: (id: string | null) => {
		idDeLaEtiqueta.value = id;
	},
	disparador,
	ponerElDisparador: (elemento: HTMLElement | null) => {
		disparador.value = elemento;
	},
	focoAlAbrir,
	abrir,
	cerrar,
	alternar,
});
</script>

<template>
  <div class="relative inline-block">
    <slot />
  </div>
</template>
