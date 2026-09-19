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
import { mock } from 'bun:test';
import './complemento-vue';
import { getIconSource, getSymbolSource, listen } from './dobles';

GlobalRegistrator.register();

mock.module('@tauri-apps/api/event', () => ({ listen }));
mock.module('@vasakgroup/plugin-vicons', () => ({ getIconSource, getSymbolSource }));
