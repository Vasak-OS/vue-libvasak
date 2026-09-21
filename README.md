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

O desde el registro, que es como la usan las aplicaciones del escritorio:

```bash
bun add @vasakgroup/vue-libvasak
```

## Versionado

Desde la **1.0.0** esta librería sigue versionado semántico de verdad, y eso
cambia lo que significa el rango que declara cada aplicación.

Mientras estuvo en `0.x`, el acento **fijaba la minor**: `^0.7.2` aceptaba la
0.7.9 y **no** aceptaba la 0.8.0. Como un candado que ya satisface el rango no
se mueve solo, las aplicaciones se quedaban atrás sin que nada fallara —
compilaban, pasaban sus pruebas y se empaquetaban con los componentes de hacía
ocho versiones, y lo que se arreglaba acá no les llegaba. Pasó dos veces, y la
segunda dejó dieciséis de diecisiete aplicaciones repartidas en siete rangos
distintos.

Con `^1.x` el acento hace lo que todo el mundo cree que hace: **una minor llega
sola**. Declarar `^1.0.0` alcanza.

Qué se compromete a partir de acá:

- **Lo que se exporta desde `src/index.ts` no desaparece ni cambia de nombre en
  una minor.** Hay una prueba que lo fija: sacar un componente de la lista
  pública falla, así que dejar de exportar algo tiene que ser un acto
  deliberado y va en una mayor.
- Sumar componentes, propiedades opcionales o eventos nuevos es una minor.
- Sacar o renombrar lo público, o cambiar el significado de una propiedad
  existente, es una mayor.

El `0.` de antes no estaba diciendo nada cierto sobre la estabilidad: la
librería ya tenía diecisiete consumidores y una API que no se movía.

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
