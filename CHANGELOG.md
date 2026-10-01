# Cambios de vue-libvasak

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
