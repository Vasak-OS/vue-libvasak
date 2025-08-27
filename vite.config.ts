import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: './src/index.ts',
      name: 'VueLibVasak',
      fileName: (format) => `vue-libvasak.${format}.js`,
    },
    rollupOptions: {
      // Asegura que vue sea un peer dependency
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
});
