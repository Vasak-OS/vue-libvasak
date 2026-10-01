# Cambios de vue-libvasak

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
