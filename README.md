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

## La forma: `tokens.css`

Desde la 2.0.0 los componentes se dibujan con los tokens de
`@vasakgroup/vue-libvasak/tokens.css` (radios, bordes, velos de estado,
superficies, sombras, roles de texto y curvas, con el criterio de Once UI; ver
`docs/once-ui.md`). La aplicación lo importa en su `main.css` **después** de
Tailwind, y le dice a Tailwind que mire las clases de la librería:

```css
@import "tailwindcss";
@import "@vasakgroup/vue-libvasak/tokens.css";
/* opcional (2.1.0): la barra de desplazamiento con los tokens, en lugar de la copia propia */
@import "@vasakgroup/vue-libvasak/scrollbar.css";

@source "../../node_modules/@vasakgroup/vue-libvasak/dist";
```

Los colores no viven ahí: `tokens.css` los deriva con `color-mix` de las
variables `--use-*` que ya declara el piso de cada aplicación y pisa el
config-manager con el esquema elegido, así que cambiar de esquema cambia todo
sin tocar nada. El radio sale de `--corner-radius` (el que se elige en
Configuración) y la escala `rounded-corner-xs…xl` se deriva de él. Los nombres
de siempre (`rounded-corner`, `-sm`, `-window`, los colores `primary`,
`ui-bg`, `tx-main`…) siguen valiendo.

Hay un banco con cada componente en todos sus estados, en claro y en oscuro y a
240, 360, 600 y 1200 px: `bun run bench` (puerto 5174), y
`playground/capture.sh <carpeta>` para sacar las capturas con Chrome sin
pantalla.

## Textos

Los textos entran por propiedad. Sin pasarlos salen del catálogo de la
aplicación, y si la clave no está, del respaldo de la librería:

| clave | dónde | respaldo |
|---|---|---|
| `search.clear` | la cruz de `SearchField` | «Vaciar» |
| `search.label` | la lupa de `BarSearch` | «Search» |
| `tabs.close` | el botón de cerrar de `TabItem` | «Close» |
| `tabs.unsaved` | la pestaña con cambios sin guardar | «Unsaved changes» |
| `sidebar.collapse` / `sidebar.expand` | el botón de plegar de `SideBar` | «Collapse» / «Expand» |
| `ventana.minimizar` / `ventana.maximizar` / `ventana.cerrar` | `WindowControls` | la clave |
| `media.*` | el reproductor | la clave |
| `alert.close` | la cruz de `AlertMessage` con `dismissible` | «Cerrar» |
| `dialog.close` | el cerrar de `DialogHeader` con `closable` | «Cerrar» |
| `dialog.body` | el nombre de `DialogBody` cuando desplaza | «Contenido» |
| `numberField.decrement` / `numberField.increment` | los botones de `NumberField` con `stepper` | «Restar» / «Sumar» |

## Qué componente para qué (2.1.0)

Los de formularios, selección y listas que suman la 2.1.0, y de qué copias
salen, están en `docs/components-inventory.md` (§2 y §3). En corto:

- elegir una de varias: `OptionGroup` (lista o tarjetas) o `SegmentedControl`
  (pocas, lado a lado; con `href`, una navegación);
- sí o no que se aplica después: `Checkbox`; que se aplica al tocar:
  `SwitchToggle`;
- una fila «texto a la izquierda, control a la derecha»: `SettingRow`; una
  fila de lista: `ListRow` dentro de un `ListGroup`;
- la columna de una vista: `Panel`; la cabecera de una página: `PageHeader`;
  el título de un tramo: `SectionHeading`;
- un campo con su etiqueta, ayuda y error: `FormGroup`, cuya ranura recibe
  `id`, `describedBy` e `invalid` para pasárselos al campo.

## Reproductor

`NowPlayingCard`, `SpinningCover` y `SeekBar` dibujan lo que suena sin saber de
dónde sale: reciben los datos por propiedad y emiten lo que se tocó (`previous`,
`toggle`, `next`, `seek`). La unidad de `position` y `duration` es la de quien
los usa —MPRIS cuenta en microsegundos—, y `format` es lo único que tiene que
conocerla.

Los textos entran por propiedad; sin pasarlos salen del catálogo de la
aplicación con estas claves: `media.previous`, `media.play`, `media.pause`,
`media.next`, `media.seek`, `media.nothingPlaying` y `media.byArtist` (con `{0}`
donde va el artista).

## Desarrollo

- Construir la librería: `npm run build`
- Servir para desarrollo: `npm run dev`
