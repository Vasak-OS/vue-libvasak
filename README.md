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
| `avatar.edit` | el botón de `Avatar` con `editable` | «Change picture» |
| `media.progress` | el aro de `SpinningCover` con `progress` | «Progress» |
| `tray.progress` | la línea de `TrayIconButton` con `progress` | «Progress» |
| `dropZone.label` / `dropZone.locked` | el texto de `DropZone` | «Drop files here» / «Can't drop here» |
| `password.show` / `password.hide` | el ojo de `PasswordField` | «Show password» / «Hide password» |
| `password.capsLock` | el aviso de Bloq Mayús de `PasswordField` | «Caps Lock is on» |
| `power.title` | el nombre del grupo de `PowerActions` | «Power» |
| `power.suspend` / `power.hibernate` / `power.reboot` / `power.poweroff` / `power.logout` / `power.lock` | los botones de `PowerActions` | «Suspend» / «Hibernate» / «Restart» / «Power off» / «Log out» / «Lock» |
| `pager.label` / `pager.item` | el grupo y cada punto de `PageDots` sin `label` / `labels` (`{0}` es el número y `{1}` el total) | «Pages» / «{0} of {1}» |
| `workspaces.label` / `workspaces.item` | el grupo y cada botón de `WorkspaceSwitcher` sin `label` / `labels` (`{0}` es el número) | «Workspaces» / «Workspace {0}» |
| `equalizer.title` / `equalizer.saved` / `equalizer.unsaved` / `equalizer.unavailable` / `equalizer.presets` / `equalizer.custom` | los textos de `Equalizer` sin sus propiedades | «Equalizer» / «Saved» / «Not saved» / «The equalizer is not available» / «Presets» / «Custom» |
| `textMenu.copy` / `textMenu.cut` / `textMenu.paste` / `textMenu.selectAll` | el menú de `TextContextMenu` | «Copy» / «Cut» / «Paste» / «Select all» |

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

## Qué componente para qué (2.2.0)

- algo que cuelga de un botón y no es un menú (un formulario chico, un
  selector): `Popover`; colgado de otro elemento que no es el disparador:
  `PopoverAnchor`;
- un atajo: `Kbd`; en un menú, la propiedad `shortcut` del ítem;
- una persona: `Avatar`, o `IdentityBlock` con el nombre al lado;
- un icono en un recuadro con estado: `IconTile`;
- lo que todavía carga: `Skeleton` (decoración; lo que carga lo dice la región
  con `aria-busy` o un `LoadingState`);
- una portada: `CoverArt`; girando, con aro o como botón: `SpinningCover`;
- pares de nombre y valor: `PropertyList`; un número con su nombre:
  `StatTile`; texto de máquina o un registro: `CodeBlock`;
- algo que se despliega: `Disclosure`; dónde soltar lo que se arrastra:
  `DropZone`.

## Qué componente para qué (2.12.0)

- una píldora del panel sobre el escritorio —un botón redondo, un dato con
  icono y renglón chico debajo, o un grupo de botones—: `PanelPill`
  (`active` la rellena en el primario, `interactive` para que sea botón,
  `flush` para un grupo);
- los espacios de trabajo, con el actual en el primario: `WorkspaceSwitcher`.

## Qué componente para qué (2.11.0)

- un ecualizador de bandas con perfiles: `Equalizer` (la aplicación le da las
  ganancias y limita cuántas veces por segundo manda lo que emite).

## Qué componente para qué (2.5.0)

- un dato chico con icono debajo de un título —la salida de audio, «vía
  Firefox»—, que se toca o sólo informa: `Chip` (`interactive` para que sea
  botón, `caption` para la etiqueta atenuada);
- pasar de una página a otra con puntos —varios reproductores, un carrusel—:
  `PageDots`, que con una sola página no dibuja nada.

## Qué componente para qué (2.4.0)

- una contraseña, con el ojo y el aviso de Bloq Mayús: `PasswordField`;
- la hora grande (inicio de sesión, bloqueo, un reloj): `ClockDisplay`;
- suspender, reiniciar, apagar, cerrar la sesión, bloquear: `PowerActions`
  (fila de iconos o círculos con nombre);
- elegir una cuenta: `OptionGroup` con `avatar` en cada opción;
- un desplegable corto dibujado por la página y no por el sistema (la sesión,
  el idioma): `SearchSelect` con `:searchable="false"`;
- copiar, cortar, pegar y seleccionar todo con el clic derecho en los campos:
  `TextContextMenu`, una vez por ventana, con `:show` del complemento del menú
  contextual;
- un número sobre un icono: `Badge counter` (con `max` para «99+»);
- el pie de una foto o los controles de un vídeo: `overlay-fade-up` /
  `overlay-fade-down`;
- el desenfoque del inicio de sesión y del bloqueo, y **sólo ahí**:
  `bg-ui-shell shell-blur`.

## Qué componente para qué (2.6.0)

- el dispositivo o la red conectada, con sus datos alrededor (la vista
  radial del Bluetooth y de la red): `DeviceOrbit`; para elegir entre varios
  sigue siendo una lista de `DeviceCard`.

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
