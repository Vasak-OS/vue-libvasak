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
import { getCurrentWindow, getIconSource, getSymbolSource, listen } from './dobles';

GlobalRegistrator.register();

// El doble **encima** del módulo de verdad, no en su lugar. Reemplazarlo entero
// deja sin exportar lo que no se nombra acá, y ahí lo que falla es el import y
// no la prueba: el marco de la ventana importa `@tauri-apps/api/event` entero.
mock.module('@tauri-apps/api/event', () => ({ ...eventos, listen }));
mock.module('@vasakgroup/plugin-vicons', () => ({ getIconSource, getSymbolSource }));
// Sin esto `getCurrentWindow()` lanza —no hay ventana de Tauri— y la única
// forma de probar los botones sería no apretarlos.
mock.module('@tauri-apps/api/window', () => ({ getCurrentWindow }));
