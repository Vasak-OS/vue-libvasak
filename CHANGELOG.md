# Cambios de vue-libvasak

## 2.13.1

`QuickSettingsTile` no corta el texto en lo angosto (vue-libvasak#91). Es un
arreglo: no cambia la API.

### Arreglado

- En el centro de control de vasak-desktop, a 350 px de ventana, la grilla de
  dos columnas deja unos 150 px por mosaico, y con el círculo del icono, el
  relleno y la flecha al texto le quedaban 40: «Bluet…», «Encen…», «Tiempo de
  …». El título y el estado pasan a ocupar hasta dos líneas cada uno
  (`line-clamp-2`, `text-balance`, `break-words`) en vez de cortarse en una; el
  umbral del círculo sube de 9 rem a 11,5 rem del mosaico, y por debajo el
  relleno y la separación bajan de 12 a 8 px. Medido en el banco con Chrome
  sin pantalla: a 150 px con detalle al texto le quedan 100 px (antes 44), y
  ningún texto de los mosaicos del centro tiene `scrollWidth > clientWidth` a
  240, 350 y 360 px de ventana (antes, 48 cortados). La zona del detalle sigue
  en 32 px y el cuerpo nunca baja de 32.

### Banco

- Sección `tiles-2131` (los textos reales del centro de control, en la grilla y
  en mosaicos de 150 px clavados) y `tiles-frames.html`: la grilla dentro de un
  `<iframe>` de cada ancho de ventana —Chrome sin pantalla no maqueta debajo de
  ~500 px— que escribe en `#result` qué texto se corta.

### Dependencias

- Nada para subir: todo al día salvo `typescript` 7, que sigue anotada en
  `vasak.bibliotecasAtrasadas`.

## 2.13.0

El mosaico de ajuste rápido del centro de control del escritorio
(`vasak-desktop#174`/`#175`). Es una minor: no cambia nada de lo que ya se
exportaba.

### Nuevo

- **`QuickSettingsTile`**: icono del tema, título y línea de estado en una
  tarjeta de Once UI (`rounded-corner-l`, canto `ui-line`, `ui-surface/70`).
  `active` en `true`/`false` lo vuelve interruptor con `aria-pressed`, y el
  encendido se pinta: velo `ui-selected-accent`, canto del primario y el icono
  en un círculo del primario teñido con `tx-on-primary`. Con `active` en `null`
  abre algo, sin `aria-pressed`. `detail` suma a la derecha una zona aparte con
  la flecha › (`go-next`), otro botón con su nombre que emite `detail`; el
  cuerpo emite `activate`. `unavailable` lo muestra apagado, dice «No
  disponible» (catálogo `quickSettings.unavailable`) y no se puede tocar;
  `disabled` es «ahora no» y conserva el estado; `loading` marca `aria-busy` y
  no vuelve a alternar. Es un contenedor: por debajo de 9 rem el círculo del
  icono se va, el título y el estado se cortan con el texto entero en el
  globo, y se toca con el dedo (56 px de alto, 32 de ancho la flecha).

### Dependencias

- `@vasakgroup/plugin-config-manager` 2.10.0 (desarrollo) y `vite` 8.3.3.

## 2.12.0 — sin publicar

Las píldoras del panel flotante del escritorio (`vasak-desktop#151`; la
especificación, `docs/once-ui.md` §20). Es una minor: no cambia nada de lo que
ya se exportaba.

### Nuevo

- **`PanelPill`**: una píldora del panel en `ui-shell`, sin `backdrop-blur`
  (el desenfoque lo pone Wayfire), con canto fino y `rounded-corner-full`.
  Icono del tema, `label` y `caption` (el renglón chico de abajo) cortados con
  puntos suspensivos y con cifras tabulares. `active` la rellena en el
  primario; `interactive` la hace botón con anillo de foco y, sin él, es un
  `div` quieto que no se pinta al pasar; `expanded` suma `aria-expanded` y el
  velo `ui-selected-accent` sin tapar la superficie; `orientation="vertical"`
  la apila para un panel a un costado; `flush` le saca el relleno a un grupo.
- **`WorkspaceSwitcher`**: los espacios de trabajo en una `PanelPill` que no
  se encoge, un botón de 32 de ancho por espacio con el número, el actual en
  el primario y con `aria-current`. Un solo Tab entra al grupo y las flechas
  mueven el foco sin cambiar de espacio; se elige con Enter, Espacio o el clic.
- **`ThemeIcon` con `tint`**: dibuja el icono con el color del texto
  (`currentColor`, el archivo del tema de máscara). `PanelPill` lo usa en lo
  activo: el simbólico del tema oscuro (`#dedede`) sobre el primario del
  esquema por omisión medía 1,5:1; con `tx-on-primary` pasa el 3:1.

### Cambiado

- `PageDots` y `WorkspaceSwitcher` comparten las cuentas del recorrido con
  flechas (`shared/roving-index.ts`); `PageDots` se comporta igual.

## 2.11.0 — sin publicar

Las píldoras del panel flotante del escritorio (`vasak-desktop#151`; la
especificación, `docs/once-ui.md` §20). Es una minor: no cambia nada de lo que
ya se exportaba.

### Nuevo

- **`PanelPill`**: una píldora del panel en `ui-shell`, sin `backdrop-blur`
  (el desenfoque lo pone Wayfire), con canto fino y `rounded-corner-full`.
  Icono del tema, `label` y `caption` (el renglón chico de abajo) cortados con
  puntos suspensivos y con cifras tabulares. `active` la rellena en el
  primario; `interactive` la hace botón con anillo de foco y, sin él, es un
  `div` quieto que no se pinta al pasar; `expanded` suma `aria-expanded` y el
  velo `ui-selected-accent` sin tapar la superficie; `orientation="vertical"` la
  apila para un panel a un costado; `flush` le saca el relleno a un grupo.
- **`WorkspaceSwitcher`**: los espacios de trabajo en una `PanelPill`, un botón
  de 32 de ancho por espacio con el número, el actual en el primario y con
  `aria-current`. Un solo Tab entra al grupo y las flechas mueven el foco sin
  cambiar de espacio; se elige con Enter, Espacio o el clic.

## 2.10.1 — sin publicar

### Arreglado

- **`NowPlayingCard` en un contenedor angosto pasa a una columna.** Mira su
  propio ancho (`@container`): desde 20 rem es la de siempre, con el disco al
  costado; por debajo, el disco arriba (80 px) y los datos centrados debajo,
  cortados con puntos suspensivos. A 240 px el título se quedaba en seis
  letras, el artista se cortaba de los dos lados y los chips de `details` se
  aplastaban. En el ancho de siempre dibuja lo mismo (`docs/once-ui.md` §15).

## 2.10.0 — sin publicar

El cambio de esquema se funde en lugar de saltar (Vasak-OS/vasak-settings#134).
Es una minor: sin la clase `scheme-transition` no cambia nada.

### Nuevo

- **El fundido del esquema.** Las variables que escribe `tauri-plugin-config-manager`
  (`--primary`, `--secondary`, `--ui-background`, `--ui-surface`, `--ui-border`,
  `--text-main`, `--text-muted` y sus `-dark`) se registran con `@property` como
  colores, y con la clase `scheme-transition` en `:root` van del color viejo al
  nuevo en 300 ms. Con `prefers-reduced-motion: reduce`, directo. La clase la pone
  quien aplica el esquema después de la primera carga, para que abrir una ventana
  no parpadee. No se registran `--ui-border-strong`, `--ui-focus` ni los
  `--text-on-*`: se leen con respaldo, y un color registrado nunca cae en él.

## 2.9.0 — sin publicar

Las piezas del tablero de fecha del escritorio (vasak-desktop#130), que
comparten los widgets de calendario (#112) y `vasak-calendar`; la
especificación, `docs/once-ui.md` §19. Es una minor: lo que ya había dibuja lo
mismo si no se pide lo nuevo.

### Nuevo

- **`MonthCalendar`**: el mes en cuadrícula de seis semanas, con la semana que
  empieza donde dice el idioma, hoy relleno en el acento, el día elegido con el
  canto en el acento y un punto en el secundario en los días con eventos
  (`markedDates`). Un solo Tab; las flechas, Inicio, Fin, Re Pág y Av Pág
  recorren y cambian de mes solas. `v-model` del día y `v-model:month`; la
  ranura `actions` para el «+».
- **`EventList`**: los eventos de un día como tarjetas con hora, título, lugar
  y calendario, y la barra del color del calendario (sólo un hexadecimal; si no,
  el secundario). El que está pasando lleva el canto en el acento. Se reparten
  en las columnas que entren sin desplazar de costado; sin eventos lo dice.
- **`HourlyForecast`**: las horas en arco alrededor de lo que vaya en la ranura
  (el reloj), con la de ahora en una píldora en el acento; en angosto, una tira
  que baja de renglón.
- **`ProgressRing`**: un anillo chico con el valor adentro y el nombre debajo,
  dibujado con CSS (`role="meter"`).
- **`dates.ts`**: las cuentas que comparten —`monthGrid`, `weekStartOf`,
  `entryDays`, `markedDates`, `entriesOn`, `isOngoing`, `safeCalendarColor` y
  las de días y meses como texto—. Un evento de día completo se lee en UTC, que
  es como lo manda el almacén de vasak-accounts.

### Cambia, si se pide

- **`ClockDisplay`** con `smallSeconds`: los segundos aparte, en `heading-m` y
  atenuados.

## 2.8.0 — sin publicar

Los gráficos chicos del tablero de tiempo de pantalla del escritorio
(vasak-desktop#150; la especificación, `docs/once-ui.md` §18). Es una minor:
nada de lo que exporta la 2.7.0 cambia, y `ListRow` dibuja lo mismo si no se
le pide la barra.

### Nuevo

- **`BarChart`**: un gráfico de barras chico (la semana, las horas de un día).
  Cajas con el alto en porcentaje, sin SVG; la barra de ahora (`current`) en
  el acento y con `aria-current`, las demás en el texto apagado, las dos a
  3:1 sobre cualquier superficie. Cada barra se anuncia «nombre: valor».
  Ocupa el alto que le den y pasa a los nombres cortos por debajo de 16 rem.
- **`CalendarHeatmap`**: el mes en una grilla de siete columnas, con el día en
  que empieza la semana (lunes por omisión) y los nombres de `Intl`. Cinco
  niveles según la parte del máximo; cada día dice su valor en su nombre
  (`formatValue`) y en el globo, hoy lleva `aria-current="date"` y el elegido
  un contorno.
- **El token `ui-data`**: la tinta de un dato dibujado. Es el primario con la
  luminosidad OKLCH topada (0,52 en claro, piso de 0,7 en oscuro), así que
  conserva el tono de la marca y llega a 3:1 contra el fondo, un panel y el
  escritorio translúcido sobre negro o blanco. El config-manager puede
  escribir el suyo (`--ui-data`, `--ui-data-dark`).

### Extensiones

- `ListRow`: `bar` (de 0 a 1), una barra proporcional en `ui-data` sobre la
  vía `ui-line-weak`, al lado del título con espacio y debajo por debajo de
  20 rem; y `hoverable`, el velo al pasar en una fila que no hace nada.

## 2.6.0 — sin publicar

La vista radial del dispositivo conectado (vasak-desktop#132). Es una minor:
sólo suma.

### Nuevo

- **`DeviceOrbit`**: el dispositivo o la red al centro, en un círculo de
  acento con su halo, y sus datos alrededor como satélites unidos por líneas
  en codo, con dos anillos tenues de fondo. Genérico: recibe el centro
  (`OrbitCenter`) y los satélites (`OrbitSatellite`: icono, valor, etiqueta,
  acción opcional y tono de acento) ya armados. Un satélite sin dato no se
  dibuja —una batería que no se publica no aparece como «0 %»—, sin centro
  queda el círculo vacío con `emptyLabel`, `pulsing` hace latir el halo
  mientras se busca y cambiar `orbitKey` contrae los satélites al centro y
  saca los nuevos. Se lee como lista, con la etiqueta antes del valor; la
  acción es un botón. Mide la caja con un `ResizeObserver` y, si la órbita no
  entra, apila: el círculo arriba y un satélite por renglón.
- **La guardia nombra su única excepción de SVG**: las líneas de
  `DeviceOrbit`, atadas a un `<svg>` oculto al lector, con sólo `<path>`, sin
  relleno y con el trazo en `currentColor`.
## 2.5.0 — sin publicar

Las dos piezas del reproductor desplegable del escritorio
(`vasak-desktop#131`; la especificación, `docs/once-ui.md` §15). Es una minor:
no cambia nada de lo que exporta la 2.4.0.

### Nuevo

- **`Chip`**: una pastilla chica con icono del tema, etiqueta atenuada
  (`caption`) y el dato, que se corta en un renglón y queda entero en el globo.
  Con `interactive` es un botón; sin él sólo informa y no se pinta al pasar.
- **`PageDots`**: puntos para pasar de una página a otra, con el activo en el
  primario, nombre por punto, un solo Tab y las flechas. Con una página no
  dibuja nada.

## 2.4.0 — sin publicar

Lo que pidieron las aplicaciones al adoptar la 2.2 y la 2.3, y las piezas
genéricas del inicio de sesión y del bloqueo (`vue-libvasak#74`; la
especificación, `docs/once-ui.md` §14). Es una minor: nada de lo que exporta
la 2.3.0 cambia de nombre, y lo que ya había dibuja lo mismo si no se pide lo
nuevo, salvo los tres cambios de «Cambia».

### Nuevo

- **`PasswordField`**: el campo de contraseña con el botón de mostrar
  (`aria-pressed`, no roba el foco, vuelve a ocultarse cuando la contraseña
  se vacía) y el aviso de Bloq Mayús debajo, atado al campo por
  `aria-describedby` y como evento `caps-lock`. Sin corrector ni mayúsculas
  automáticas.
- **`ClockDisplay`**: la hora grande con la fecha debajo; se alinea al minuto
  (o al segundo con `seconds`), cifras tabulares, la fecha con sólo la primera
  letra en mayúscula, `legible` para ponerla sobre un fondo de pantalla, `now`
  para una hora fija.
- **`PowerActions`**: suspender, hibernar, reiniciar, apagar, cerrar la sesión
  y bloquear, con los iconos de freedesktop, como fila de botones de icono
  (`icons`) o círculos de 80 con el nombre (`tiles`). Emite `action`.
- **`TextContextMenu`**: copiar, cortar, pegar y seleccionar todo con el clic
  derecho sobre cualquier campo de texto de la ventana, con el menú del
  sistema. Junta las copias de Configuración y del gestor de archivos (cortar
  borra el tramo que se copió); `show` y `clipboard` entran por propiedad, así
  que la librería no depende del complemento del menú. Las funciones que
  deciden qué ofrece y qué hace salen también (`textMenuEntries`,
  `runTextAction`, `getTextField`…).
- Tokens: los roles `text-display-m` y `text-display-l`, el halo
  `text-shadow-legible`, el velo en degradado `overlay-fade-up` /
  `overlay-fade-down`, y `shell-blur`, el desenfoque **sólo** del inicio de
  sesión y del bloqueo (decisión del usuario del 02/10/2026).
- Textos con respaldo en el catálogo: `password.show`, `password.hide`,
  `password.capsLock`, `power.*`, `textMenu.*`.

### Extensiones

- `Badge`: `counter`, `max` («99+») y `title`.
- `AppBar`: el centro ya no pisa los botones en una ventana angosta: centrado
  con un tope de ancho, en la zona libre o en un renglón propio debajo.
- `IdentityBlock`: ranura `details`, `as="h1"`, `wrap` y `stack`.
- `SideBar`: `autoCollapse` y `fill`.
- `SearchField`: `autocomplete` y `spellcheck`. `TextInput`: `spellcheck` y
  `autocapitalize`.
- `ConfigSection`: `title` opcional. `SelectField`: `id` y `disabled`
  declarados. `EmptyState`: `muted`.
- `DialogContent`: `size="wide"` (576 px). `ToastArea`: `top-right` y
  `top-center`.
- `Avatar`: `ml` (40) y `2xl` (96). `IconTile`: `xl` (64) y `2xl` (80).
- `DropdownMenuItem`: `checked="mixed"`. `OptionGroup`: `avatar` en una
  opción. `SearchSelect`: `searchable`.

### Cambia

- `SearchField`: la cruz emite también `search('')`, después de `clear`.
- `DialogContent size="lg"` dibuja el velo detrás.
- `SettingRow` apila por debajo de 256 px y no de 320.
- `SearchSelect`: el mínimo de la lista (256 px) se topa a la ventana menos
  16 px; a 240 salía cortada por la derecha.
- La guardia acepta el color relativo sobre una variable del esquema
  (`oklch(from var(--…) …)`) y prohíbe las sombras de texto y de dibujo de
  Tailwind.

### Revisado, sin cambio en la librería

- El menú alineado al final no sale cortado a 240 px: era la captura de
  Chrome sin pantalla. Queda atado con una prueba.
- vue-tsc 3.3.12 con `#default="{ id }"` de `FormGroup`: es de vue-tsc (un
  `$` en un atributo del mismo elemento); ver `docs/once-ui.md` §14.5.

## 2.3.0 — sin publicar

La superficie translúcida del escritorio (`vue-libvasak#74`, corrección del
usuario del 02/10/2026). Es una minor: suma un token y no cambia nada de lo
que ya había.

### Nuevo

- **`ui-shell`** (`bg-ui-shell`): el fondo de la ventana al 85 %, translúcido,
  para las superficies del escritorio —panel, menú, applets, centro de
  control, OSD, sesión, widgets—. El desenfoque lo pone Wayfire; sin
  `backdrop-blur`. Al 85 % el texto principal llega a 4,5:1 sobre un fondo de
  pantalla negro o blanco puro con cada esquema del sistema (al 80 % de antes
  daba 4,42:1); lo mide `tests/surface-contrast.test.ts`.

### Cambia

- La especificación (`docs/once-ui.md`) corrige la «superficie opaca» del menú
  y los applets (decisión 3 del §10): van en `ui-shell`. `ui-float` queda
  para lo que flota dentro de una ventana, opaco como hasta ahora (§13).
- `vue-tsc` 3.3.12.

## 2.2.0

Globos, teclas, identidad, carátulas, datos, plegables y soltar
(`vue-libvasak#74`, decisión 1 del 01/10/2026; el relevamiento está en
`docs/components-inventory.md`, §2 y §3). Quince componentes nuevos y las
extensiones de medios, menú, bandeja y barra lateral. Es una minor: nada de lo
que exporta la 2.1.0 cambia de nombre ni de comportamiento si no se pide lo
nuevo. `WidgetFrame` no entra: queda en el escritorio hasta que aparezca una
segunda copia (decisión 4).

### Nuevo

- **`Popover`, `PopoverTrigger`, `PopoverAnchor`, `PopoverContent`**: un
  `dialog` no modal que cuelga de un botón o de otro elemento (el ancla).
  `v-model:open`, `side`/`align`/`sideOffset` con la misma cuenta que el menú
  (pasó a `shared/placement.ts`), foco al primer control al abrir, Escape y
  clic afuera cierran, `trapFocus` opcional; sin él, salir con Tab cierra y
  devuelve el foco. Se vuelve a ubicar con `ResizeObserver`, no con `resize`.
- **`Kbd`**: una tecla o una combinación (`keys`), un `<kbd>` por tecla.
- **`Avatar`** (foto, iniciales o el icono `avatar-default`; editable con
  evento `edit`) e **`IdentityBlock`** (avatar, nombre, línea y ranura).
- **`IconTile`**: el icono del tema en un recuadro con tono y estado en la
  esquina, con un solo nombre accesible.
- **`Skeleton`**: línea, bloque o círculo; quieto con movimiento reducido.
- **`CoverArt`**: la carátula con respaldo de texto o de icono y evento
  `error`. `SpinningCover` la usa por dentro.
- **`Disclosure`**: un plegable con `aria-expanded`/`aria-controls`,
  controlado o no, `plain` o `card`.
- **`PropertyList`** (`<dl>` en grilla, filas o en línea; la grilla se apila
  por su ancho), **`StatTile`**, **`CodeBlock`** (`text` o `lines` con tono en
  el canto, `wrap`, `maxHeight`, `follow` que respeta a quien subió a leer,
  `variant="log"`) y **`DropZone`** (en línea o encima, `locked`).
- Textos con respaldo en el catálogo: `avatar.edit`, `media.progress`,
  `tray.progress`, `dropZone.label`, `dropZone.locked`.

### Extensiones

- `DropdownMenuItem`: `checked` (`menuitemcheckbox`, o `menuitemradio` con
  `toggle="radio"`) con `update:checked`; `inset`; `icon` y ranura `prefix`;
  ranura `description`; `shortcut` (con `Kbd`) y su ranura; `danger`. El
  teclado del menú recorre los tres roles (`MENU_ITEM_SELECTOR`).
- `ToggleControl`: `indicator` (un `StatusDot` cuyo estado se suma al nombre),
  `badge` y la ranura `overlay`.
- `SpinningCover`: `progress` (un aro sin SVG, `conic-gradient` con máscara)
  e `interactive` + `label` (un botón).
- `TrayIconButton`: `progress` opcional (el de LauncherEntry), `fallbacks` y
  `fallbackSrc`. Sólo se dibuja si viene: de dónde sale es del escritorio
  (vasak-desktop#145).
- `SideBar`: ranura `footer`. `SideButton`: `description` y ranura `icon`;
  `SidebarItem` gana `description`.
- `ThemeIcon`: `fallbacks` (nombres probados en orden) y `fallbackSrc` (el
  dibujo de otra aplicación).

### Nombres

- `src/internos/iconoDelTema.ts` → `src/internal/themeIcon.ts`, con los
  identificadores en inglés. Salen `forgetThemeIcons` y `useThemeVersion`;
  `olvidarLosIconosDelTema` y `usarLaVersionDelTema` quedan como alias
  obsoletos hasta la 3.0.

### Arreglos

- `SideBar` subía por cualquier antepasado que no fuera más ancho que ella
  buscando el lugar que comparte, así que desplegada (288 px) en un panel de
  240 llegaba a la página y no se plegaba. Ahora sólo sube por los que miden
  lo mismo que ella o cero.
- `ThemeIcon` tenía comentarios antes de la raíz de su plantilla: en
  desarrollo eso la partía en un fragmento y las clases de quien lo usaba no
  caían en ningún lado.

### Dependencias

- Todo al día salvo `typescript`, que sigue en 5.9 (ver
  `vasak.bibliotecasAtrasadas`).

## 2.1.0 — sin publicar

Formularios, selección, listas y cabeceras (`vue-libvasak#74`, decisión 1 del
01/10/2026; el relevamiento del taller está en `docs/components-inventory.md`).
Quince componentes nuevos que salen de las copias que cada aplicación dibujaba
a mano, y extensiones de los que ya estaban. Es una minor: nada de lo que
exporta la 2.0.0 cambia de nombre ni de comportamiento si no se pide lo nuevo.

### Nuevo

- **`OptionGroup`**: elegir una de varias (`radiogroup`), en lista o en
  tarjetas con icono. Un solo Tab para entrar y salir y las flechas eligen,
  salteando lo apagado. Sale de las cuatro copias del selector de audio, las
  preferencias del correo y la `OpcionRadio` del instalador.
- **`SegmentedControl`**: pocas opciones lado a lado, en carril o en
  pastillas; con `href` es una navegación con `aria-current="page"`. Insignia
  por opción (el contador de la tienda).
- **`Checkbox`**: un `input type="checkbox"` de verdad con la forma del
  sistema, descripción atada y estado «a medias».
- **`Slider`**: la vía y el pulgar de Once UI sobre un `input range`, con
  `valueText`, `lazy` y etiquetas en los extremos. `SliderControl` lo usa por
  dentro sin cambiar su API.
- **`TextArea`**: el espejo de varias líneas de `TextInput`.
- **`NumberField`**: nunca emite `NaN`, ajusta a los límites al salir y no en
  cada tecla, redondea a las cifras del paso; botones − y + opcionales.
- **`SettingRow`**: la fila de ajuste de Configuración, con la etiqueta atada
  al control (antes un `<label>` sin `for`).
- **`ListRow` y `ListGroup`**: la fila de lista con icono, título,
  descripción, dato y ranuras; roles `button`, `option` y `link`; no impone su
  alto (los desplazadores virtuales).
- **`Badge`** y **`StatusDot`**: el texto de la insignia es siempre el
  principal; el punto lleva el contorno de 3:1.
- **`SectionHeading`**, **`PageHeader`** (con `size="lg"` para los títulos de
  24 px de Configuración) y **`Panel`**.
- **`DialogBody`**: el cuerpo que desplaza entre un encabezado y un pie
  quietos; se vuelve tabulable sólo cuando no entra.
- Tokens: `ui-overlay` (el velo sobre una imagen, 4,5:1 sobre negro o blanco
  puro) y `text-heading-l`.
- **`@vasakgroup/vue-libvasak/scrollbar.css`**: la barra de desplazamiento que
  cada aplicación copiaba en su `main.css`, con el radio de la persona. Va en
  un archivo aparte porque sus reglas son globales: importar los tokens no
  cambia la barra de nadie.
- Textos con respaldo en el catálogo: `alert.close`, `dialog.close`,
  `dialog.body`, `numberField.decrement`, `numberField.increment`.

### Extensiones

- `ActionButton`: `pressed` (`aria-pressed`), `href`/`target` (un `<a>`),
  `variant="overlay"`, `title`.
- `AlertMessage`: ranura `actions`, `dismissible` + `close`, `variant="banner"`,
  `icon="auto"` (el icono del tono).
- `EmptyState`: `size="sm"`; `icon=""` ya no deja un hueco.
- `LoadingState`: `size="sm"`, la fila.
- `ProgressBar`: `size` (`xs`/`sm`/`md`), `showValue`, `decimals`, ranura `label`.
- `SelectField`: `options`, objetos o cadenas.
- `FormGroup`: `help`, `error` (atados por `aria-describedby`, el error
  anunciado), `variant="eyebrow"`, y la ranura recibe `id`, `describedBy`,
  `invalid`.
- `SearchField`: `size="lg"`, `bare`. `TextInput`: `size`, `bare`,
  `type="datetime-local"`.
- `DialogHeader`: `closable`, `closeLabel`, `closeStyle`. `DialogContent`:
  `size="sm"` (420 px).
- `ToastArea`: `ToastNotice` gana `title`, `description`, `progress` y
  `action`, con el evento `action`; la ranura pasa el aviso como `toast` y
  sigue pasándolo como `aviso`.
- `ConfigSection`: `description`, `iconType`, `as`, ranuras `header`, `aside`
  y `actions`.

### Arreglos

- `ConfigSection` escribía el **nombre** del icono delante del título; ahora
  dibuja el icono del tema.
- La guardia de colores no veía `rgba(` dentro de un valor arbitrario
  (`drop-shadow-[0_2px_rgba(…)]`): el `\b` no corta entre `_` y `r`. Pasa a
  `(?<![a-zA-Z])`.
- `SearchField` empezaba su plantilla con un comentario, que la partía en un
  fragmento y dejaba sin caer los atributos de quien lo usaba.
- El velo del diálogo se dibuja también en el tamaño `sm`.
- Una prueba del diálogo buscaba el primer `<p>` del documento y no el del
  panel: fallaba en la suite entera según qué quedara de otra prueba.
- `playground/capture.sh` usa un perfil de Chrome propio: con el de siempre
  tomado por otro Chrome sin pantalla, se quedaba esperando sin escribir nada.

### Dependencias

- `vite` 8.3.1 → 8.3.2. `typescript` sigue en 5.9 (ver
  `vasak.bibliotecasAtrasadas`).

## 2.0.0 — sin publicar

La forma de Once UI en los 48 componentes, sobre los colores del esquema del
usuario (`vue-libvasak#74`, especificación en `docs/once-ui.md`). Ninguna
pantalla cambia de distribución, tamaño ni contenido: cambian los radios, los
bordes, las sombras, el espaciado interno, los estados y los tiempos.

### Nuevo

- **`@vasakgroup/vue-libvasak/tokens.css`.** Los tokens de la forma: radios
  `rounded-corner-xs…xl` y `-full` derivados de `--corner-radius`; bordes
  `ui-line-weak` / `ui-line`; velos `ui-hover`, `ui-pressed`, `ui-selected`,
  `ui-selected-accent`; superficies `ui-float` y `ui-scrim`; `ui-focus`;
  sombras `shadow-surface-xs…xl`; roles de texto `text-label-*`, `text-body-*`,
  `text-heading-*`; curvas `ease-ui` / `ease-ui-out`. Todo es `color-mix` sobre
  las `--use-*` del esquema: ningún color fijo, ni en las sombras. Trae también
  el piso del anillo de foco con `ui-focus` y repite el mapeo de colores del
  esquema que ya declara cada aplicación. Ver el README para importarlo.
- **`ActionButton`**: variante `ghost` (sin borde ni fondo); propiedad `icon`
  con el **nombre** del icono del tema y `iconType`.
- **`SearchField`**: `clearLabel`, el nombre de la cruz.
- Los textos que la librería ponía fijos salen de la propiedad, después del
  catálogo de la aplicación y al final de un respaldo: `search.clear`,
  `search.label`, `tabs.close`, `tabs.unsaved`, `sidebar.collapse`,
  `sidebar.expand`.
- `TextInput` y `SearchField` exponen `focus()`; `enfocar()` sigue como alias.
- Los nombres en inglés de lo que se exporta de los módulos tocados:
  `MenuContext`, `FocusOnOpen`, `MENU_KEY`, `useMenu`, `TooltipContext`,
  `TOOLTIP_KEY`, `useTooltip`, `DialogContext`, `DIALOG_KEY`, `useDialog`,
  `TabEntry`, `TabAction`, `NoticeTone`, `TONE_CLASSES`, `TOAST_TONE_CLASSES`,
  `toneRole`, `ToastNotice`.
- Banco de estados: `bun run bench` (`playground/`).

### Rupturas, y cómo migrar

- **`ActionButton` `variant="secondary"` cambió de significado** (decisión 6
  del 30/09/2026). Era el relleno del color secundario del esquema; ahora es el
  botón neutro con contorno de Once UI. Los tres usos del taller (el «Cancelar»
  del Wi-Fi y la tarjeta de notificación del escritorio, el botón de transporte
  de resonance) son acciones secundarias, que es justo lo que el contorno
  dice: no hay que tocarlos. No queda una variante con el relleno del color
  secundario; si alguien la necesita, se suma con otro nombre en una minor
  (pisarla con `custom-class` no es estable: las dos clases de fondo pelean
  por el orden en que Tailwind las emite).
- **Se fue la propiedad `icon` (ruta ya resuelta)** de `SliderControl`,
  `ToggleControl`, `DeviceCard` y `TrayIconButton`, obsoleta desde la 1.x con
  aviso de «se va en la próxima mayor». Usá `name` con el nombre del icono del
  tema y `type` para la variante simbólica. Ninguna aplicación la usaba.
- **`SideBar` se pliega por el ancho de su contenedor**, no por el de la
  página, y ya no lleva clases `md:`. En las aplicaciones del taller el
  contenedor es la fila de la ventana, así que se pliega igual que antes.
- **Los campos de los contextos cambiaron de nombre.** `MenuContext` (`open`,
  `menuId`, `labelId`, `setLabel`, `trigger`, `setTrigger`, `focusOnOpen`,
  `show`, `close({ returnFocus })`, `toggle`), `FocusOnOpen` (`'first' |
  'last' | 'none'`), `TooltipContext` (`open`, `trigger`, `setTrigger`, `show`,
  `hide`) y `DialogContext` (`open`, `close`, `titleId`, `setTitle`). Los
  nombres viejos de los tipos y las funciones (`ContextoDelMenu`,
  `usarElMenu`, `CLAVE_DEL_MENU`, `FocoAlAbrir`, `ContextoDelTooltip`,
  `usarElTooltip`, `CLAVE_DEL_TOOLTIP`, `ContextoDelDialogo`, `usarElDialogo`,
  `CLAVE_DEL_DIALOGO`, `ElementoDePestana`, `AccionDePestana`,
  `TonoDelAviso`, `CLASES_POR_TONO`, `rolDelTono`, `AvisoTransitorio`) siguen
  exportados como alias obsoletos hasta la 3.0, pero los **campos** son los
  nuevos. Ninguna aplicación usaba los campos.
- **`ListCard`, `DeviceCard`, `SliderControl` y `ConfigSection` ya no usan la
  clase `.background`** de las aplicaciones: llevan `bg-ui-surface/70`. Si una
  aplicación pisaba `.background` para cambiarles el fondo, pasá
  `custom-class`.
- **Las clases cambiaron.** Quien probaba las clases de los componentes desde
  afuera (`rounded-corner`, `border-ui-border`, `md:w-72`, `.rounded-full` del
  punto de «sin guardar»…) tiene que mirar las nuevas; el punto lleva ahora
  `data-tab-dirty` y el nombre desplegado de la pestaña,
  `data-tab-expanded-label`.
- `TooltipTrigger` escucha `focusin`/`focusout` en vez de `focus`/`blur` sobre
  su envoltorio: el globo ahora sí aparece al tabular hasta el botón.
  Disparar `focus` a mano sobre el `div` en una prueba ya no lo abre.

### Sin cambiar

Propiedades, ranuras y eventos de todos los componentes, salvo lo de arriba.
Las ranuras y los eventos con nombre en castellano (`identidad`, `acciones`,
`pie`, `aviso`, `navegar`, `mover`…) y los campos de `OpcionDeBusqueda` y de
`ContextoDeLaBarra` quedan como estaban: son contrato público y no entraron en
esta mayor.
