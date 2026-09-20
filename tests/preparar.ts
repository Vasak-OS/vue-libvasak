/**
 * Lo que tiene que estar listo antes de la primera prueba.
 *
 * Corre como `preload` de `bun test` (ver `bunfig.toml`). Tres cosas, y las tres
 * antes de que se importe un componente:
 *
 * 1. el DOM, porque `@vue/test-utils` monta contra `document`;
 * 2. el complemento que compila los `.vue`, porque Bun los trata como un archivo
 *    suelto y lo que se importa sin él es la ruta, no el componente;
 * 3. los dobles de lo que sólo existe adentro de una ventana de Tauri, porque
 *    los componentes los llaman al importarse.
 */

import { GlobalRegistrator } from '@happy-dom/global-registrator';
import * as eventos from '@tauri-apps/api/event';
import { mock } from 'bun:test';
import './complemento-vue';
import {
	asiSeOlvidanLosIconos,
	getCurrentWindow,
	getIconSource,
	getSymbolSource,
	listen,
	useI18n,
} from './dobles';

GlobalRegistrator.register();

// El doble **encima** del módulo de verdad, no en su lugar. Reemplazarlo entero
// deja sin exportar lo que no se nombra acá, y ahí lo que falla es el import y
// no la prueba: el marco de la ventana importa `@tauri-apps/api/event` entero.
mock.module('@tauri-apps/api/event', () => ({ ...eventos, listen }));
mock.module('@vasakgroup/plugin-vicons', () => ({ getIconSource, getSymbolSource }));
// El marco busca en el catálogo las etiquetas de los tres botones, así que sin
// este doble la prueba no puede decir qué hay traducido y qué no.
mock.module('@vasakgroup/tauri-plugin-i18n', () => ({ useI18n }));
// Sin esto `getCurrentWindow()` lanza —no hay ventana de Tauri— y la única
// forma de probar los botones sería no apretarlos.
mock.module('@tauri-apps/api/window', () => ({ getCurrentWindow }));

// La memoria de los iconos vive en el módulo y el módulo se comparte entre
// archivos de prueba, así que `olvidarTodo()` tiene que poder vaciarla. Se
// importa acá y no en `dobles.ts` porque este módulo arrastra a Vue, y Vue
// tomado antes del registro del DOM se queda con `document` en nulo.
const { olvidarLosIconosDelTema } = await import('../src/internos/iconoDelTema');
asiSeOlvidanLosIconos(olvidarLosIconosDelTema);

/**
 * Compilar un `.vue` acá y no en la primera prueba que monte.
 *
 * El primer componente que se importa paga la compilación del complemento de
 * Vue, y eso tarda varios segundos. Si lo paga una prueba, se come el límite de
 * cinco segundos de `bun test` y **falla por el reloj sin tener nada roto** —y
 * falla la primera del archivo que toque correr primero, así que el síntoma se
 * mueve de lugar entre corridas—. Se vio: la suite fallaba una de cada tres
 * veces, siempre en una prueba distinta y siempre la primera en montar.
 *
 * El preload no tiene límite, así que el costo se paga acá una sola vez.
 */
await import('../src/icons/ThemeIcon.vue');
