# vue-libvasak

Librería de componentes VueJS reutilizables.

## Instalación

Primero, construye la librería:

```bash
npm install
npm run build
```

Esto generará los archivos en la carpeta `dist/`.

Luego, en tu proyecto Vue:

```bash
npm install /ruta/a/vue-libvasak/dist
```

O publica el paquete en un registro npm privado/público y luego:

```bash
npm install vue-libvasak
```

## Uso

Importa los componentes que necesites:

```js
import { SideBar, SideButton, WindowFrame } from 'vue-libvasak';
```

O registra toda la librería globalmente:

```js
import * as VasakLib from 'vue-libvasak';

app.use(VasakLib);
```

## Desarrollo

- Construir la librería: `npm run build`
- Servir para desarrollo: `npm run dev`
