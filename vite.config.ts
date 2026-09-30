import { readFileSync } from 'node:fs';
import vue from '@vitejs/plugin-vue';
import { defineConfig, type Plugin } from 'vite';

/**
 * Lo que no se empaqueta acá adentro.
 *
 * Vue, la API de Tauri y los complementos los pone la aplicación que consume la
 * librería, y tienen que ser **los suyos**: dos copias de `@tauri-apps/api` en
 * una ventana son dos canales de IPC y dos registros de oyentes, y los eventos
 * llegan a uno solo. Sin esto quedaban adentro del bundle —46 KB de más— y con
 * la barra lateral, que escucha el cambio de tema, habría empezado a fallar de
 * una forma difícil de rastrear.
 */
const externos = [/^vue$/, /^vue-router$/, /^@tauri-apps\//, /^@vasakgroup\//];

/**
 * `tokens.css` sale tal cual, al lado del bundle.
 *
 * No pasa por Vite ni por Tailwind: es un archivo con bloques `@theme` que
 * compila **la aplicación**, con su propio Tailwind, después de su
 * `@import "tailwindcss"`. Compilarlo acá lo dejaría sin `@theme` y sin las
 * utilidades, que es justo lo que la aplicación necesita que traiga.
 */
function publishTokens(): Plugin {
  return {
    name: 'vasak-publish-tokens',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'tokens.css',
        source: readFileSync(new URL('./src/styles/tokens.css', import.meta.url), 'utf8'),
      });
    },
  };
}

export default defineConfig({
  plugins: [vue(), publishTokens()],
  build: {
    lib: {
      entry: './src/index.ts',
      name: 'VueLibVasak',
      fileName: (format) => `vue-libvasak.${format}.js`,
    },
    rollupOptions: {
      external: externos,
      output: {
        // Los nombres globales del build UMD. Sin declararlos, rollup los
        // adivina y avisa en cada compilación.
        globals: {
          vue: 'Vue',
          'vue-router': 'VueRouter',
          '@tauri-apps/api/event': 'TauriEvent',
          '@tauri-apps/api/window': 'TauriWindow',
          '@vasakgroup/plugin-vicons': 'VasakVicons',
          '@vasakgroup/tauri-plugin-i18n': 'VasakI18n',
        },
        exports: 'named',
      },
    },
  },
});
