import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { getIconSource, getSymbolSource } from '@vasakgroup/plugin-vicons';
import { onMounted, onUnmounted, ref, type Ref, watch } from 'vue';

/**
 * Resolver un icono del tema del escritorio, y seguirlo cuando cambia.
 *
 * El pack de iconos cambia en caliente: sin escuchar el aviso, la ventana se
 * queda con los del tema anterior hasta reabrirla. Y las resoluciones se
 * cruzan —cambiar de icono y cambiar de tema resuelven en paralelo—, así que
 * cada pedido lleva un testigo y sólo se aplica el último: sin él, la respuesta
 * vieja llega última y deja puesto el icono de antes.
 *
 * Interno a propósito: lo comparten `ThemeIcon` y `SideButton`, y lo que las
 * aplicaciones usan es el componente, no esto.
 */
export function useIconoDelTema(nombre: Ref<string>, tipo: Ref<'icon' | 'symbol'>) {
	const fuente = ref('');
	let soltar: UnlistenFn | null = null;
	let desmontado = false;
	let ultimoPedido = 0;

	async function resolver() {
		const mio = ++ultimoPedido;
		const cual = nombre.value;
		if (!cual) {
			fuente.value = '';
			return;
		}
		const resuelto =
			tipo.value === 'symbol' ? await getSymbolSource(cual) : await getIconSource(cual);
		if (mio === ultimoPedido) {
			fuente.value = resuelto;
		}
	}

	onMounted(async () => {
		// El oyente antes de la primera resolución: resolver tarda, y un cambio
		// de tema en esa espera no lo escuchaba nadie.
		const dejarDeEscuchar = await listen('vicons:theme-changed', resolver);
		// Registrarse tarda, y en una lista que se desplaza el componente puede
		// irse antes. Ahí `onUnmounted` ya pasó y no vio nada que soltar.
		if (desmontado) {
			dejarDeEscuchar();
			return;
		}
		soltar = dejarDeEscuchar;
		await resolver();
	});

	onUnmounted(() => {
		desmontado = true;
		soltar?.();
	});

	watch(nombre, resolver);

	return fuente;
}
