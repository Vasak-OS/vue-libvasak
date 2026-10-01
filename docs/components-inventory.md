No escribí `/home/pato/VasakOS/.worktrees/components-inventory.md`. Mi rol es sólo planificar y no puedo escribir archivos, así que el documento entero va abajo, listo para pegar en esa ruta. Todo se leyó en `origin/main` después de `git fetch` en los 18 repos.

## Resumen con los números

- **Librería en `origin/main`:** `vue-libvasak` 2.0.0, publicada en npm, con 48 componentes exportados (contados en `src/index.ts`).
- **Quién está en 2.0.0:** sólo `vasak-desktop`, con `tokens.css` y guardia. Los otros 16 están en 1.9.0 (`vasak-contacts` en 1.10.0) y ninguno importa `tokens.css`.
- **Piezas dibujadas a mano inventariadas, 349 en total:**

| repo | piezas | repo | piezas |
|---|---|---|---|
| settings | ~95 | monitor | 16 |
| file-manager | ~70 | mail | 30 |
| resonance | ~45 | text | 11 |
| desktop | ~32 | calendar | 9 |
| installer | ~22 | contacts | 8 |
| store | ~20 | polkit | 6 |
| gallery | ~15 | prism | 4 |
| permissions | 2 | terminal | 2 |
| vapp | 1 | | |

- **Lo que va a rechazar la guardia, en bruto:**
  - **Alias de radio `rounded-corner`/`-sm`:** 539. Los más grandes: settings 197, file-manager 98, resonance 81, mail 41, monitor 30.
  - **Radios fijos de Tailwind:** 175.
  - **Puntos de corte de pantalla:** 131. settings 101, resonance 13, monitor 11, mail 5, gallery 1.
  - **SVG embebidos:** 30, en settings, gallery, file-manager, resonance, monitor y desktop. Dos son gráficos de datos.
  - **Desenfoques:** 20.
  - **Tokens inexistentes:** varios, como `bg-ui-bg/80-3`, `bg-background-2`, `text-seccondary`, `bg-bg-primary`, `hsl(var(--muted))` y `border-ui-border.hover`.
- **26 genéricos nuevos propuestos.** Los de más uso:

| genérico | lugares | repos |
|---|---|---|
| `SectionHeading` | ~70 | 10 |
| `PageHeader` | ~60 | 6 |
| `Badge` | ~40 | 9 |
| `ListRow`/`ListGroup` | ~35 | 9 |
| `SettingRow` | ~25 | 4 |
| `NumberField` | ~29 | 2 |
| `Kbd` | ~20 | 3 |
| `StatTile` | ~20 | 2 |
| `Checkbox` | 18 | 7 |
| `Slider` | ~16 | 5 |
| `OptionGroup` | 11 | 4 |
| `Popover` | ~11 | 4 |

  `OptionGroup` incluye las cuatro copias del selector de salida de audio.
- **19 componentes de la librería necesitan una extensión.**
- **Orden propuesto:** la librería 2.1.0 primero, después `vapp`, y luego las aplicaciones en tres tandas. `vasak-settings` va repartido en tres PR.

**Un hallazgo que cambia notas ya escritas.** `plugin-config-manager` 2.9.0 declara pinia `^3.0.4 || ^4.0.0`; lo comprobé con `npm view`. La condición de salida de la nota en `vasak.bibliotecasAtrasadas` ya se cumplió en 9 repos que siguen en `~2.6.1`: gallery, permissions, prism, resonance, store, terminal, text, polkit-vasak y vapp.

**pinia no frena esta migración.** La librería no declara pinia como dependencia par, y la que sí declara (config-manager `^2.0.0`) la satisface también la `~2.6.1`. Lo que la 2.6.1 escribe en `:root` cubre todo lo que `tokens.css` lee; sólo le falta `--text-on-error`.

---

# Inventario de componentes — vue-libvasak#74 (decisión 8)

Leído en `origin/main` de los 18 repos (01/10/2026). Las reglas son la decisión 8 de `/home/pato/VasakOS/CLAUDE.md` y la sección «Design system (VasakOS)» de `.claude/agents/frontend.md`. La guardia es la de `vue-libvasak/tests/tokens-exist.test.ts` y la copia de `vasak-desktop/tests/design-guard.test.ts`.

## 0. Lo verificado y lo que sigue siendo hipótesis

**Verificado:**
- `vue-libvasak` 2.0.0 está en npm y exporta 48 componentes.
- Sólo `vasak-desktop` la usa, con `tokens.css` y su guardia propia. El PR #144 migró menú, panel, Redes, Bluetooth y Audio; lo leí en su cuerpo.
- Los otros 16 repos bloquean 1.9.0 en `bun.lock` (`vasak-contacts` 1.10.0). Ninguno importa `tokens.css`.
- `vasak-settings`, `vasak-file-manager` y `vasak-mail` tienen la guardia vieja `tests/los-colores-existen.test.ts`. El resto no tiene ninguna.

**Rupturas de la 2.0.0 que hay que migrar al subir:**
- **`enfocar()` → `focus()`:** en mail (`ListaComponent.vue:82`, `RedactarComponent.vue:114`) y en polkit (`PolkitModal.vue:89`, `:100`, `UnlockModal.vue:121`).
- **Alias obsoletos:** text usa `CLASES_POR_TONO` y `rolDelTono` en `AvisoComponent.vue:23`.
- **`.background`:** el bloque está declarado en 14 `main.css`.
- **`variant="secondary"` y la propiedad `icon` con ruta:** nadie fuera del escritorio los usa.

**Hipótesis, sin verificar en pantalla:**
- Que cada sustitución mantenga el formato. Eso sólo lo dicen las capturas del banco a 240, 360, 600 y 1200, en claro y oscuro.
- Que las filas dentro de `RecycleScroller`/`DynamicScroller` no cambien de alto al pasar a `ListRow`. En resonance y file-manager eso rompe el desplazador virtual sin que nada falle (ver `desplazador-virtual-del-taller`).

## 1. Por repo

Notación: `archivo:línea` → destino.
- **Lib** = componente existente de la librería.
- **Nuevo** = genérico de la sección 2.
- **Ext** = extensión de la sección 3.

### vapp (plantilla) — 1 pieza
- **Estado:** `layouts/WindowAppLayout.vue:43` sólo envuelve `WindowFrame`.
- **A corregir:** `main.css` declara `.background` y repite tokens que ahora trae `tokens.css`. config-manager está en `~2.6.1` con una nota vieja.
- **Destino:** importar `tokens.css`, sumar la guardia de desktop, sacar `.background` y subir config-manager a `^2.9.0`. Que las aplicaciones nuevas nazcan bien.

### vasak-permissions — 2 piezas
- **Piezas:**
  - `App.vue:147` «Denegar» → Lib `ActionButton variant="secondary"`.
  - `App.vue:156` «Permitir» → Lib `ActionButton` primary. Hoy lleva `hover:bg-secondary`, que es un relleno de color.
- **Literales:** `text-lg` en `:96`, alias `rounded-corner`.

### polkit-vasak — 6 piezas
- **`PolkitModal.vue`:**
  - `:168` Cancelar y `:176` Aceptar → Lib `ActionButton` (`loading` en lugar del `span` que cambia de texto).
  - `:144` + `:158` campo con su error → Ext `FormGroup error`.
- **`UnlockModal.vue`:**
  - `:181` y `:189` → Lib `ActionButton`.
  - `:169` `input type="checkbox"` → Nuevo `Checkbox`.
  - `:140` es una superficie a mano con `bg-ui-bg/80` → `WindowFrame hide-bar`, como hace `PolkitModal`.
- **Encabezado (`:127` y `:153`):** el texto chico en mayúsculas → Nuevo `SectionHeading variant="eyebrow"`.
- **Nota:** las dos ventanas comparten la misma maqueta (icono 80, encabezado, mensaje, campo, acciones). Esa maqueta queda local al repo; sólo pasan a la librería las piezas.

### vasak-prism — 4 piezas
- **`componentes/FilaDeResultado.vue:51`** (`role=option`, elegida con `bg-primary/20 ring`) → Nuevo `ListRow role="option" selected`.
  - Riesgo: el alto viene de `ALTO_DE_FILA` y el desplazador es virtual a mano; `ListRow` no puede imponer el suyo.
- **`vistas/Lanzador.vue:174`** campo grande sin borde → Ext `SearchField size="lg" bare`.
- **`vistas/Lanzador.vue:171`** panel con `bg-ui-bg/90 shadow-xl` y `max-w-[640px]` → superficie `bg-ui-float shadow-surface-l`.
- **`vistas/Lanzador.vue:194` y `:202`** vacío y ayuda → Lib `EmptyState`, o un párrafo con tokens.
- **Literales:** `text-tx-main/60`, `/50`, `/40`.
- **Nombres a renombrar al tocar:** `componentes/`, `vistas/`, `FilaDeResultado`, `ListaDeResultados`, `Lanzador`.

### vasak-terminal — 2 piezas
- `components/overlay/OverlayLayout.vue:33` lleva `bg-ui-bg/80` y una transición en `style` en línea. Pasa a tokens (`ease-ui`, 200 ms) y `bg-ui-float`.
- `TerminalComponent.vue:64` y `:223` (`rgba(0,0,0,0)`) son el tema de xterm, o sea datos. Excepción de la guardia (sección 5).
- Lo demás ya usa `TabBar`, `DropdownMenu` y `ToastArea`.

### vasak-text — 11 piezas
- **`App.vue:330`, `:339`, `:348`:** tres botones de icono en la barra → Lib `ActionButton variant="ghost"` con `icon` e `iconAlt`.
- **`components/editor/AvisoComponent.vue`:**
  - `:101` banda de aviso con acciones → Ext `AlertMessage variant="banner"` + ranura `actions` + `dismissible`.
  - `:110`, `:117`, `:126` → `ActionButton`.
- **`BarraEstadoComponent.vue`:**
  - `:67` y `:85` → `ActionButton ghost sm`.
  - `:78` «Sólo lectura» → Nuevo `Badge tone="warning"`.
- **`OpcionesComponent.vue`:**
  - `:60` panel flotante a mano con `shadow-lg` → Nuevo `Popover`.
  - `:75` anchos de sangría → Nuevo `SegmentedControl`.
  - `:91`, `:97`, `:106` → Nuevo `Checkbox`.
- **`SinGuardarComponent.vue:59`, `:68`, `:75`** → `ActionButton` secondary, danger y primary.
- **Renombrar al tocar:** `AvisoComponent`, `BarraEstadoComponent`, `OpcionesComponent`, `SinGuardarComponent`, el alias `CLASES_POR_TONO`.

### vasak-calendar — 9 piezas
- **`views/CalendarioView.vue`:**
  - `:70` actualizar, `:102` y `:120` mes anterior y siguiente → `ActionButton ghost` con icono.
  - `:129` «Hoy» → `ActionButton secondary sm`.
- **`components/calendario/CuentasComponent.vue`:**
  - `:27` panel `rounded-corner border bg-ui-surface/45` → Nuevo `Panel`.
  - `:37`, `:54`, `:74` encabezados en mayúsculas → Nuevo `SectionHeading`.
  - `:31` sin cuentas → Lib `EmptyState size="sm"` (Ext).
  - `:61` punto de color del calendario → Nuevo `StatusDot color=…`. El color es dato del servidor: se queda.
  - `:73` avisos → Lib `AlertMessage`, como ya hace contacts.
- **`MesComponent.vue`:**
  - `:195` día de hoy (`bg-primary`) → `ui-selected-accent` (decisión 4 del PR #144).
  - `:227` 🌐 y `:236` ↻ son iconos escritos → `ThemeIcon`.
  - `:144` cuadrícula → `Panel`. Queda propia.
- **Renombrar al tocar:** `calendario/`, `CuentasComponent`, `MesComponent`, `ZonaComponent`, `CalendarioView`.

### vasak-contacts — 8 piezas
- **`components/agenda/ContactPhotoComponent.vue`** → Nuevo `Avatar`. Es la copia que más sabe: iniciales, imagen rota que vuelve a iniciales y caja fija para que la cabecera no salte.
- **`ContactDetailComponent.vue`:**
  - `:147` panel → `Panel`.
  - `:151` cabecera → Nuevo `IdentityBlock` (con `Avatar`).
  - `:165` categorías → Nuevo `Badge variant="outline"`.
  - `:183` y siguientes, siete encabezados → `SectionHeading`.
  - `:191`…`:307`, diez botones Escribir, Llamar, Abrir y Copiar → `ActionButton ghost sm`.
  - Filas de propiedad → Nuevo `ListRow` (etiqueta, valor, acciones).
  - `:325` `<details>` → Nuevo `Disclosure`.
  - `:329` `<dl>` → Nuevo `PropertyList`.
- **`ContactListComponent.vue`:**
  - `:64` encabezado de grupo pegajoso con `bg-ui-bg/95` → `SectionHeading sticky`.
  - `:70` fila seleccionable → `ListRow selectable selected`.
  - `:48`–`:58` estados vacío y cargando → `EmptyState` / `LoadingState size="sm"`.
- **`views/AgendaView.vue:53`** actualizar → `ActionButton ghost`.
- **`CuentasComponent.vue:12`** → `Panel`, `SectionHeading`, `EmptyState`. Calendar, contacts y mail tienen tres copias de este panel: se reparten piezas, no se crea un componente «cuentas» en la librería, que es de interfaz genérica.

### vasak-mail — 30 piezas
- **`components/correo/PreferenciasComponent.vue`:**
  - `:91`, `:113`, `:130` tres `fieldset` de radios → Nuevo `OptionGroup`.
  - `:151` `range` → Nuevo `Slider`.
  - `:83` cerrar dentro de la cabecera → Ext `DialogHeader closeLabel`.
- **`AtajosComponent.vue`:**
  - `:62` cerrar → Ext `DialogHeader closeLabel`.
  - `:74` `<kbd>` → Nuevo `Kbd`.
- **`CuentasComponent.vue`:**
  - `:81` → `Panel`.
  - `:90` «Nuevo» → `ActionButton`.
  - `:102`, `:115`, `:146` cuentas y carpetas → `ListRow selectable` (Ext `SideButton` no sirve: la segunda línea es el contador de no leídos).
  - `:109` y `:130` contadores → `Badge`.
- **`ListaComponent.vue`:**
  - `:142` `md:flex md:w-80` → consulta de contenedor.
  - `:148` (`md:hidden`, «▾» escrito) → `ActionButton` + `pan-down-symbolic`.
  - `:205` fila de mensaje → `ListRow selectable`.
  - `:223` punto de no leído → `StatusDot`.
  - `:245` 📎 → `ThemeIcon mail-attachment`.
  - `:195` y `:198` → `LoadingState`/`EmptyState size="sm"`.
- **`MensajeComponent.vue`:**
  - `:247` `md:flex` y `:258` `md:hidden` → contenedor.
  - `:255` «← Volver», `:283`, `:290`, `:325`, `:357`, `:397` → `ActionButton`.
  - `:317` adjuntos → `ListRow`.
  - `:350` imágenes bloqueadas con botón → Ext `AlertMessage actions`.
  - `:365` y `:389` → `AlertMessage`.
- **`RedactarComponent.vue`:**
  - `:273`, `:282`, `:287` etiqueta + campo → Lib `FormGroup`.
  - `:294` `<textarea>` → Nuevo `TextArea`.
  - `:309` adjunto → `ListRow` + `:312` ✕ → `ActionButton` con `window-close`.
  - `:334`, `:340`, `:350`, `:392` → `ActionButton`. El 📎 de `:344` va como `icon`.
  - `:360` panel programar a mano con `shadow-lg` → Nuevo `Popover` + `DropdownMenuItem`.
  - `:377` `datetime-local` nativo → Ext `TextInput type="datetime-local"`.
  - `:382` → `ActionButton`.
- **`DeshacerComponent.vue:59`** barra flotante con `shadow-lg` → Ext `ToastArea` (aviso con `action`).
- **`SalidaComponent.vue`:** `:27` → `ListRow`; `:44` y `:56` → `ActionButton ghost sm`.
- **`views/CorreoView.vue`:** `:493` ⚙ escrito → `ActionButton` + `preferences-system-symbolic`; `:501` → `ActionButton ghost`.
- **Excepción:** `tools/formato.ts:151` son valores de respaldo para el HTML del correo en `srcdoc`. Es dato, no interfaz (sección 5).
- **Renombrar al tocar:** `correo/` y los 10 componentes.

### vasak-monitor — 16 piezas
- **`views/AplicacionesView.vue`:**
  - `:89` y `:134` listas `divide-y` → Nuevo `ListGroup` + `ListRow`.
  - `:100` y `:142` Cerrar → `ActionButton secondary sm`.
  - `:118` mostrar u ocultar → Nuevo `Disclosure`.
  - `sm:px-4` en `:93` y `:138` → quitar.
- **`views/ServiciosView.vue`:**
  - `:73` → `Checkbox`.
  - `:80` → `ActionButton` con `view-refresh`.
  - `:96` → `ListRow`.
  - `:105` «del sistema» con `text-[10px]` → `Badge`.
  - `:112` → `ActionButton sm`.
- **`views/RegistrosView.vue`:**
  - `:122` → `Checkbox`.
  - `:132` → `ActionButton`.
  - `:148` → `EmptyState`.
  - `:164` registro → Nuevo `CodeBlock variant="log"`.
  - `sm:` en `:108`, `:175`, `:177`, `:179` → contenedor.
- **`views/LimpiezaView.vue`:**
  - `:124` éxito en `<p>` → `AlertMessage tone="success"`.
  - `:130` total → Nuevo `StatTile`.
  - `:144` y `:184` → `ActionButton` (el primero tiene acento a mano).
  - `:154` y `:200` → `ListGroup`/`ListRow`.
  - `:197` → `AlertMessage tone="info"`.
- **`views/RecursosView.vue`:** `:93`, `:118`, `:148`, `:174`, `:202` tarjetas con icono, título y métrica → Ext `ConfigSection` (`icon` como `ThemeIcon` + ranura `aside`).
- **`components/ProyectosLimpiables.vue`:** `:194` → `ConfigSection`; `:218`, `:228`, `:244`, `:291` → `ActionButton`; `:268` → `Checkbox`; `:267` → `ListRow`.
- **`App.vue`:** `:110` usa `sm:p-4`; `:111` título → Nuevo `PageHeader icon`; `:101` usa `text-[11px]`.
- **Excepción:** `components/GraficoDeUso.vue:70` es un gráfico de datos en SVG.
- **Renombrar al tocar:** `GraficoDeUso`, `ProyectosLimpiables` y las vistas.

### vasak-installer — 22 piezas
- **Componentes propios que son casos de uno genérico:**
  - `components/ui/OpcionRadio.vue` → Nuevo `OptionGroup variant="card"`. Sabe de más: icono en un recuadro que cambia con la selección, y descripción.
  - `ui/PageHeader.vue` → Nuevo `PageHeader` (sabe: el icono en un recuadro).
  - `ui/SectionCard.vue` → Ext `ConfigSection` (sabe: `descripcion` y la ranura `encabezado`).
  - `ui/SystemIcon.vue` → Lib `ThemeIcon` (`size-class` → `size`). Es una capa fina que sobra.
  - `ui/AlertMessage.vue` → Lib `AlertMessage`, con Ext para el icono por omisión según tono, que es lo único que agrega la capa.
- **`components/sidebar/PasoBoton.vue:29`** → `SideButton` + Ext (`description`, ranura `icon`) + Nuevo `IconTile status`. Riesgo de formato: el recuadro mide 36 contra los 32 de `SideButton`. Medir en el banco.
- **`App.vue`:** `:237` y `:246` navegación → `ActionButton`. La confirmación usa `text-ui-bg` sobre `bg-status-error`: pasa a `variant="danger"`.
- **`views/DiscoView.vue`:**
  - `:191` disco elegible → `OptionGroup variant="card"`.
  - `:205` → `IconTile`.
  - `:309` `<select>` nativo → Lib `SelectField`.
  - `:327` → `Checkbox`.
  - `:449` → `ListRow`.
- **`views/CuentaView.vue`:**
  - `:200` y siguientes, seis etiquetas + campo + ayuda/error → Ext `FormGroup help error`.
  - `:245` medidor de fuerza a mano → Lib `ProgressBar` (Ext `size="xs"` y `tone`).
- **`views/InstalacionView.vue`:**
  - `:191` → `IconTile status`.
  - `:227` → `Disclosure`.
  - `:238` → `CodeBlock variant="log"`.
  - `:260`, `:277`, `:284` → `ActionButton`.
- **`views/BienvenidaView.vue:32` y `ResumenView.vue:111`, `:136`, `:161`** `<dl>` → Nuevo `PropertyList`.
- **`FinView.vue:44`, `:51`, `RedView.vue:73`, `ResumenView.vue:184`** → `ActionButton`.
- **Renombrar al tocar:** `PasoBoton`, `PasosSidebar`, `OpcionRadio`, las 11 vistas, `ICONO_*`.

### vasak-store — 20 piezas
- **Componentes propios que son casos de uno genérico:**
  - `ui/BotonAccion.vue` → Lib `ActionButton`: `principal` → primary, `suave` → secondary, `peligro` → danger.
  - `ui/ModalBase.vue` → `Dialog` + Ext `DialogHeader closeLabel` + Nuevo `DialogBody`.
  - `ui/IndicadorDeCarga.vue` → Ext `LoadingState size="sm"`.
  - `tienda/InsigniaDeOrigen.vue` → Nuevo `Badge variant="outline"`.
  - `tienda/BotonInstalar.vue` → `ActionButton`. La forma de píldora (`rounded-full`) pasa a `rounded-corner-m`, y el estado se dice con la variante y `loading`.
- **`barra/SelectorDeSeccion.vue:44`** → Nuevo `SegmentedControl` (con `badge` y modo navegación).
- **`PanelDeOperacion.vue`:** `:70` `backdrop-blur`; `:84` barra a mano → `ProgressBar size="sm"`; `:108` → `CodeBlock variant="log"`.
- **`CarruselDeCapturas.vue`:** `:101` y `:109` «‹ ›» escritos → `ActionButton` + `go-previous` / `go-next`. `:85` sube al pasar el ratón (`hover:-translate-y-0.5`), algo que la guardia prohíbe.
- **`TarjetaDeApp.vue:28` y `TarjetaGrande.vue:32`** → Lib `ListCard clickable`. Quedan propias por dentro. `TarjetaGrande` hace `hover:scale-105` en `:49`, que la guardia prohíbe.
- **`IconoDeApp.vue`** → Ext `ThemeIcon fallbacks` + `fallbackSrc` (sabe: probar una lista de nombres del tema y luego un archivo de AppStream).
- **Vistas:**
  - `DetalleView.vue:223` y `DialogoDePrevisualizacion.vue:60` `<dl>` → `PropertyList`.
  - `DetalleView.vue:159` enlace con forma de botón → Ext `ActionButton href`; la flecha ↗ escrita → `ThemeIcon`.
  - `DetalleView.vue:248` → `CodeBlock`.
  - `InstaladasView.vue:140` zona de soltar → Nuevo `DropZone`.
  - `RepositoriosView.vue:118`, `:149` → `SettingRow`; `:131` → `Badge`; `:187` y siguientes → `FormGroup`.
  - Cuatro vistas con título + acciones → `PageHeader`.
- **Renombrar al tocar:** `barra/`, `tienda/`, `BotonAccion`, `ModalBase`, `IndicadorDeCarga` y las vistas.

### vasak-gallery — 15 piezas
- **`components/ui/AppButton.vue`** → Lib `ActionButton`; es un caso del genérico. Los emojis de `GalleryView.vue:43`–`:46` → `icon` del tema.
- **`components/ui/MediaCard.vue`:**
  - `:53` sube al pasar el ratón (`hover:-translate-y-1`), prohibido.
  - `:73`, `:84`, `:92` → `Badge`.
  - `:98` → Nuevo `Skeleton`.
  - El resto queda propio.
- **`ImageGrid.vue`:** `:259` cabecera de mes con contador y `backdrop-blur` → `SectionHeading sticky count divider`; `:240` y `:246` → `ActionButton`; `:269` `sm:p-3`.
- **`Lightbox.vue`:**
  - `:349`, `:368`, `:380`, `:501`, `:517` botones redondos con siete SVG → `ActionButton` + Ext `variant="overlay"`, con iconos `window-close`, `go-previous`, `go-next`, `media-playback-start`/`-pause`, `audio-volume-*`.
  - `:480` → Lib `SeekBar`.
  - `:534` → Nuevo `Slider`.
  - `:362`, `:416`, `:423`, `:562` pastillas sobre la imagen → `Badge variant="overlay"`.
  - `:456` → `EmptyState`. El 🎬 escrito va como icono.
  - 25 colores literales (`white/…`, `black/…`, `rgba` en sombras) y 13 desenfoques.
- **`TimelineSidebar.vue:135`** globo a mano con flecha → Lib `Tooltip`. El riel queda propio.
- **`GalleryView.vue:38`** → `PageHeader eyebrow`.

### vasak-resonance — 45 piezas
- **Componentes propios que son casos de uno genérico:**
  - `components/layout/LabeledField.vue` → Lib `FormGroup` (Ext: etiqueta en mayúsculas atenuada, que es lo que sabe).
  - `player/transport/TransportButton.vue` → `ActionButton` + Ext `pressed`, que es lo que sabe: aleatorio y repetir como alternancia.
  - `player/TrackMetaCard.vue` → Nuevo `CoverArt` + texto.
- **`views/HomeView.vue`:**
  - `:276` → `SearchField`.
  - `:286`, `:298`, `:310` `<select>` con flecha SVG en `:290`, `:302`, `:320` → `SelectField`.
  - `:327` aleatorio con SVG en `:333` → `ActionButton`.
  - `:365` fila de pista → `ListRow`, con riesgo por el `RecycleScroller` de `:item-size="92"`.
  - `:377` → `Badge`.
  - `:386` y `:396` → `ActionButton`.
  - `lg:` en `:274`, `:284`, `:296`, `:308`.
- **`AlbumsView.vue`, `ArtistsView.vue`, `FavoritesView.vue`, `PlaylistsView.vue`:**
  - Ocho encabezados con eyebrow → `PageHeader`.
  - Siete `<input>`/`<select>` → `SearchField`, `TextInput`, `SelectField`.
  - Unos 25 botones → `ActionButton`; los ✕ escritos de `PlaylistsView.vue:236` y `:317` → `window-close`.
  - Portadas: `AlbumsView.vue:224`, `ArtistsView.vue:115`, `:187`, `FavoritesView.vue:162` → `CoverArt`.
  - Filas: `PlaylistsView.vue:212`, `:298`, `:343` → `ListRow selectable`.
  - Puntos de corte: `lg:` y `sm:`/`xl:` en `AlbumsView.vue:163`, `ArtistsView.vue:103`, `FavoritesView.vue:116`, `PlaylistsView.vue:191`.
- **`RadiosView.vue`:**
  - `:202` etiquetas como filtro de selección única → Nuevo `SegmentedControl variant="chips"`.
  - `:219` → `SearchField`.
  - `:232` error con reintentar → Ext `AlertMessage actions`.
  - `:314` y `:320` → `Badge`.
  - `:333` → `ActionButton`.
  - `:340` aro a mano con `border-white` → `LoadingState`. El 👍 de `:327` va como icono.
- **`SettingsView.vue`:**
  - `:134` → `SettingRow` + `Checkbox`, o `SwitchToggle` (ver decisiones).
  - `:156` → `Slider`.
  - `:172`, `:195`, `:208`, `:215`, `:227` → `ActionButton`.
  - `:237` usa `text-red-400` → `AlertMessage tone="error"`.
  - `:128` y `:185` → `ConfigSection`.
- **`PlayerQueuePanel.vue`:** `:129` → `ActionButton`; `:152` → `ListRow`; el ⋮⋮ de `:176` → `ThemeIcon` (`list-drag-handle-symbolic`).
- **`VolumeControl.vue`:** `:58` `md:flex`; `:59` → `Badge`; `:63` → `Slider`; `:83` `rgba`.
- **Otras piezas:**
  - `ScanningIndicator.vue:15` superposición a mano (`bg-black/50`, `bg-bg-primary` que no existe) → `Dialog` + `LoadingState`.
  - `AudioDropOverlay.vue:21` → `DropZone`.
  - `ResonanceSidebar.vue:115` usa `md:w-72` → Ext `SideBar` ranura `footer`.
  - `WindowAppLayout.vue:81` → `ActionButton`; `:111` `md:flex-row`; `:105` → Ext `ToastArea`.
- **Excepción:** `PlayerBackground.vue:25` arma el degradado con el color de la portada: es dato.

### vasak-file-manager — 70 piezas
Es un puerto de otra aplicación de estilo shadcn. Tiene `components/ui/` propio y varios tokens que no existen.
- **Componentes propios que son casos de uno genérico, o que suben a la librería:**
  - `ui/popover/{Popover,PopoverAnchor,PopoverContent,PopoverTrigger}.vue` → Nuevo `Popover*`. Se usa en 7 lugares.
  - `ui/number-field/*` → Nuevo `NumberField`.
  - `ui/Skeleton.vue` (`bg-[hsl(var(--muted))]`, que no existe) → Nuevo `Skeleton`.
  - `ui/toast/{CustomError,CustomSimple,CustomProgress,ToastContainer}.vue` → Ext `ToastArea` (título, descripción, progreso y acción). `CustomError.vue:22` y `CustomSimple.vue:14` llevan SVG.
  - `ui/ScrollArea.vue` → `overflow-y-auto` + barra de desplazamiento desde `tokens.css` (Ext de tokens).
  - `ui/TagSelector.vue:105` (`color:'#fff'`) y `:115` panel a mano → `Popover` + Nuevo `Badge dot color`.
- **`FileBrowserToolbarComponent.vue`:** `:127`, `:136`, `:145`, `:154`, `:162`, `:189`, `:212` llevan `hover:bg-primary`. Pasan a `ActionButton ghost` + `Tooltip`. El nombre de icono `refreshstructure` no es freedesktop.
- **`NavigatorToolbarActionsComponent.vue`:** `:54`, `:77`, `:91`, `:103` → `ActionButton` + Ext `pressed`; `:63` y `:68` lista o cuadrícula → Nuevo `SegmentedControl`.
- **`StatusCenterButton.vue`:**
  - `:61` y `:122` SVG → `ThemeIcon` (`content-loading-symbolic`, `window-close`).
  - `:74` → `Badge`.
  - `:105` → `StatusDot`; usa `bg-amber-500`, de la paleta.
  - `:128` → `ProgressBar size="xs"`.
- **`FileBrowserStatusBarComponent.vue`:** `:173` usa `rounded-[var(--radius-sm)]` y `bg-ui-bg/80-2`, que no existen; `:195`, `:201`, `:207`, `:215` → `ActionButton`; `:260` → `SearchField`; `:268` → `ListRow`.
- **Diálogos:**
  - `Compress`, `NewItem`, `Rename` y `OpenWith` usan `<input>` sin estilo (`:105`, `:103`, `:140`, `:333`, `:339`, `:359`) → `TextInput` + `FormGroup`.
  - `CompressDialogComponent.vue:114` → `SelectField`.
  - Unos 15 `<button>` sin estilo en los pies → `ActionButton`.
  - `ConflictDialogComponent.vue:92` y `OpenWithDialogComponent.vue:279` → `ListRow`.
  - `OpenWithDialogComponent.vue:265` → `AlertMessage`.
- **`GlobalSearchView.vue`:**
  - `:294` → `SearchField`.
  - `:351`, `:361`, `:375`, `:385` → `Checkbox`.
  - `:398` → `NumberField`.
  - `:324` y `:340` → `AlertMessage`.
  - `:481` usa `bg-background-2`, que no existe → `Disclosure` + `Badge`.
- **Otras piezas:**
  - `FileBrowserContentComponent.vue:240` → `Checkbox`.
  - `FileBrowserErrorComponent.vue:30` → `ActionButton` / `EmptyState`.
  - 14 `<kbd class="shortcut">` → Nuevo `Kbd`; `AddressBarComponent.vue:472` → `Kbd`.
  - `DriveCardComponent.vue:141` → `ProgressBar size="sm"`; `:136` usa `text-seccondary`.
  - `ContentInformationContentProperies.vue:208` → `PropertyList`.
  - `ClipboardToolbarComponent.vue:136` → `Popover` + `ActionButton`.
- **Cabeceras de grupo de la cuadrícula** (`views/filebrowser/FileBrowserGridView.vue:292`, `:344`, `:389`, `:443`) → `SectionHeading sticky count`. Llevan `backdrop-blur` y `bg-ui-bg/80-3`, que no existe.
- **Quedan propios:** las tarjetas y filas de entrada, con sus capas de selección y portapapeles (sección 5).
- **Renombrar al tocar:** los nombres internos en español (`setDesplazador`, `setContenedor`, `altoDeFila`, `estiloDeFila`, `fila.entradas`).

### vasak-settings — 95 piezas
Tiene su propio `components/ui/`, con 454 usos repartidos en las vistas.
- **Componentes propios que son casos de uno genérico:**

| propio | usos | destino | lo que sabe de más |
|---|---|---|---|
| `ui/SectionCard.vue` (con `shadow-sm` y `bg-ui-bg/75`) | 79 | Ext `ConfigSection` | — |
| `ui/PageHeader.vue` (con `sm:`) | 33 | Nuevo `PageHeader` | sección, descripción y ranura `actions` |
| `ui/EmptyStateBox.vue` | 33 | Ext `EmptyState` sin icono, `size`, `bordered` | — |
| `ui/SelectInput.vue` (flecha en `data:image/svg`) | 26 | Ext `SelectField options` | — |
| `ui/NumberInput.vue` | 26 | Nuevo `NumberField` | — |
| `ui/StatTile.vue` | 15 | Nuevo `StatTile` | `min-w-0` contra el desborde de la rejilla |
| `ui/RangeSlider.vue` (`hover:scale-110`, sombras) | 9 | Nuevo `Slider` | — |
| `ui/InfoRow.vue` | 5 | `PropertyList` | — |
| `ui/ModalDialog.vue` | 3 | `Dialog` + Ext `DialogHeader closeLabel` | — |
| `ui/StatusBadge.vue` | 3 | Nuevo `Badge` | — |
| `ui/ProgressBar.vue` | 4 | Ext `ProgressBar showValue` | etiqueta y porcentaje arriba |
| `ui/ProfileIcon.vue` | — | `ThemeIcon` | — |

- **Diálogos dibujados a mano** (`fixed inset-0 bg-black/45`) → `Dialog`: `components/vpn/NewProfileComponent.vue:174`, `views/NetworkWifiView.vue:397`, `views/OnlineAccountsView.vue:1008`.
- **Selector de salida y de entrada de audio** (`views/MultimediaAudioView.vue:233`, `views/MultimediaAudioInputView.vue:242`, con `bg-white` en `:254` y `:270`) → `OptionGroup`. Son la tercera y cuarta copia del selector del escritorio. La insignia «predeterminado» de `MultimediaAudioView.vue:268` → `Badge`.
- **SVG de «actualizar» embebidos:** `MultimediaAudioView.vue:224`, `MultimediaAudioInputView.vue:228`, `NetworkBluetoothView.vue:226`, `NetworkWifiView.vue:325` → `ActionButton` + `view-refresh`. `NetworkBluetoothView.vue:175` → `EmptyState`.
- **Fila de ajuste** (etiqueta y descripción a la izquierda, control a la derecha) → Nuevo `SettingRow`:
  - `AppearancePanelView.vue:171`, `:183`, `:195`, `:207`, `:219`
  - `AppearanceDesktopView.vue:119`, `AppearanceThemeView.vue:398`, `AppearanceFontsView.vue:249`
  - `DateTimeView.vue:174`, `:261`, `DisplayBrightnessView.vue:144`, `LoginScreenView.vue:226`
  - `PluginSection.vue:41`, `MonitorsView.vue:306`
- **Pastillas** (`rounded-full border px-2 py-0.5 text-[11px]`) → `Badge`. Unos 20 lugares: Fonts `:279`, `:298`; Theme `:504`; CpuMemory `:33`, `:48`, `:73`; MountedDisk `:30`, `:39`; SwapSensors `:46`; Bluetooth `:194`; Home `:179`; Wifi `:358`, `:364`; SpecialKeys `:88`; PluginSection `:50`; KeyBindingInput `:157`.
- **Encabezados en mayúsculas** (`text-xs uppercase tracking-[0.16em]`): unos 25 → `SectionHeading`.
- **`<details>`** en `SchemeColorEditor.vue:283`, `DateTimeView.vue:259`, `WayfireEffectsView.vue:132`, `WayfireWindowsView.vue:240` → `Disclosure`.
- **Controles nativos:**
  - `<textarea>` en `ShortcutEditorModal.vue:351` y `NewProfileComponent.vue:240`, `:250` → `TextArea`.
  - `type="checkbox"` en `NewProfileComponent.vue:260` y `UsersView.vue:458` → `Checkbox`.
  - `type="range"` en `MonitorsView.vue:388` y `WayfireInputView.vue:126`, `:199` → `Slider`.
  - Diez `<input>` en `OnlineAccountsView.vue:776`–`:1119`, con sus errores → `TextInput` + Ext `FormGroup error`; los dos puertos → `NumberField`.
- **`SchemeColorEditor.vue:203`** oscuro o claro → `SegmentedControl`.
- **`UsersView.vue:298`** foto con iniciales y superposición «cambiar» (`bg-black/45`) → `Avatar editable`. Es la copia que sabe editar.
- **Listas:** `DateTimeView.vue:203`, `NetworkWifiView.vue:337`, `OnlineAccountsView.vue:715`, `PhoneDevicesView.vue:117`, `VpnProfileItem.vue:28` → `ListGroup`/`ListRow`. `PowerView.vue:179` → `ProgressBar`.
- **Puntos de corte:** 101 en unos 30 archivos (Wayfire* 26, Appearance* 8, `SchemeColorEditor` 4…) → consultas de contenedor.
- **Excepciones:** `MonitorCanvas.vue:189` (SVG de la disposición de monitores) y las muestras de `ColorSwatch` / `SchemeColorEditor` (hex del esquema que se edita) son datos.
- **Queda local:** `KeyBindingInput` (21 usos, un solo repo).

### vasak-desktop (lo que dejó pendiente #144) — 32 piezas
- **Selector de salida de audio sin grupo de opciones:**
  - `components/controls/AudioDeviceSelector.vue:96` → `OptionGroup`; `:131` «Predeterminado» → `Badge`.
  - `views/applets/MusicAppletView.vue:219`, que es la segunda copia en el mismo repo → `OptionGroup`. Usa `focus-visible:ring-primary` en lugar de `ui-focus`.
  - `MusicAppletView.vue:177` y `:189` (CHIP) → `Badge`/`ActionButton sm`; `:204` → `ActionButton ghost`.
- **Marcos de widget:** `widgets/WidgetHost.vue:178` (`ui-float` + `surface-m`) y `widgets/WidgetSlot.vue:51` (`ui-surface/70`) → Nuevo `WidgetFrame`. Sabe: `container-type: size`, llenar el marco, la variante de superficie, y en edición el canto discontinuo y el tirador de `:188` y `:208`.
- **Tarjeta de usuario:** `cards/UserMenuCard.vue:29` y `cards/UserControlCenterCard.vue:7` → Nuevo `Avatar` + `IdentityBlock`. La segunda trae `bg-ui-bg/80`, `text-lg` y `text-2xl`; el reloj de la derecha va en la ranura `trailing`.
- **Portada con aro de progreso:** `controls/TrayMusicControl.vue:130` (`conic-gradient` + máscara) → Ext `SpinningCover progress` + `interactive`/`label`.
- **Centro de control:**
  - `controls/NetworkControl.vue:28`, `:34` (barras de señal), `BluetoothControl.vue:39`, `:49` (contador) y `ThemeToggle.vue:7` dibujan puntos y contadores en `absolute` encima de `ToggleControl`, con `custom-class` de anillos → Ext `ToggleControl indicator badge`.
  - `cards/PhoneControlCenterCard.vue:197` → `ListRow clickable`; `:214` → `StatusDot`; `:228` → `ListRow`; `:234` → `ActionButton ghost sm`; `:254` → `SettingRow`.
- **Notificaciones:**
  - `areas/control-center/NotificationArea.vue:26` → `ActionButton sm`; `:34` → `EmptyState size="sm"`; `:42` usa una curva arbitraria.
  - `cards/NotificationGroupCard.vue:13` cabecera desplegable → `Disclosure`; `:27` → `Badge`; `:42` → `ActionButton ghost sm`.
  - `cards/NotificationCard.vue:31` → `ActionButton ghost sm`; `:30` usa `text-[11px]`.
- **Menú del teléfono:** `views/ConnectMenuView.vue`:
  - `:174` → `SegmentedControl`.
  - `:196` → `ActionButton ghost`.
  - `:208` y `:226` → `AlertMessage`.
  - `:215` → `EmptyState`; `:222` → `LoadingState`.
  - `:237` → `ActionButton`; `:254` → `SettingRow`.
  - `buttons/ConnectAppButton.vue:33` → `ListRow` + `trailing`.
- **OSD:** `views/apps/OsdPopupView.vue:109` → Ext `ProgressBar size="xs"`.
- **Ventana de sesión:** `views/apps/SessionPopupView.vue`:
  - `:158` → `IconTile shape="circle" tone="accent"`.
  - `:166` y `:173` → `ActionButton lg fullWidth`; el aro a mano de `:178` → `loading`.
  - `:162` usa `text-tx-main/70`; `:161` usa `text-xl`.
- **Otras applets:**
  - `PrivacyAppletView.vue:107`, `:124`, `:144` → `ListRow`; `:148` → `ActionButton sm`.
  - `TwingateAppletView.vue:168` → `Badge`; `:191` → `StatusDot`; `:205` → `ActionButton sm`; `:183` → `ListRow`.
  - `TrayPopupView.vue:124` es el menú DBus, con `menuitemcheckbox` y profundidad → Ext `DropdownMenuItem checked inset`; `:115` → `DropdownMenuLabel`.
- **Widgets:** `MusicWidget.vue:289`/`:302` (elegir reproductor) → `Popover`. El resto de los widgets se queda (sección 5).

## 2. Componentes genéricos nuevos para la librería

> **Qué va en cada versión** (decisión 1 de «Decisiones tomadas», al final, que manda sobre esta sección):
> - **2.1.0:** `OptionGroup`, `SegmentedControl`, `Checkbox`, `Slider`, `TextArea`, `NumberField`, `SettingRow`, `ListRow`/`ListGroup`, `Badge`, `StatusDot`, `SectionHeading`, `PageHeader`, `Panel` y `DialogBody`.
> - **2.2.0:** `Popover`, `Kbd`, `Avatar`/`IdentityBlock`, `IconTile`, `Skeleton`, `CoverArt`, `Disclosure`, `PropertyList`, `StatTile`, `CodeBlock` y `DropZone`.
> - **Fuera de la librería:** `WidgetFrame`, que queda como componente propio del escritorio (decisión 4).

Los nombres van en inglés. Las fuentes son las copias de las que sale cada uno; «sabe» es lo que esa copia aporta y tiene que subir a la librería (decisión 5).

1. **`OptionGroup`** — 11 lugares en 4 repos.
   - **API:** `v-model`; `options: {value,label,description?,icon?,iconType?,badge?,disabled?}[]`; `label` (nombre del `radiogroup`); `variant: 'list' | 'card'`; ranuras `option` y `trailing`.
   - **Teclado:** flechas y tabulador móvil.
   - **Sale de:** desktop (`AudioDeviceSelector`, `MusicAppletView`), settings (Audio ×2), mail (`Preferencias` ×3), installer (`OpcionRadio` ×4 y la lista de discos).
   - **Sabe:** insignia «predeterminado» (desktop), recuadro de icono que cambia con la selección (installer), contorno del punto en `ui-border-strong` a 3:1 (desktop).

2. **`SegmentedControl`** — 8 lugares en 7 repos.
   - **API:** `v-model`; `options: {value,label,icon?,badge?}[]`; `variant: 'segmented' | 'chips'`; `label`.
   - **Sale de:** text (sangría), store (secciones, con contador), settings (oscuro/claro), file-manager (lista/cuadrícula), resonance (etiquetas de radio), desktop (dispositivos del teléfono), gallery (filtros: ver decisiones).
   - **Sabe:** contador de pendientes (store).

3. **`Checkbox`** — 18 lugares en 7 repos.
   - **API:** `v-model`; `label`; `description?`; `disabled`; `indeterminate?`.
   - **Sale de:** monitor 3, text 3, polkit 1, file-manager 7, settings 2, resonance 1, installer 1.

4. **`Slider`** — unos 16 lugares en 5 repos. Es el `input range` desnudo.
   - **API:** `v-model`; `min`, `max`, `step`; `label`; `valueText?`; ranuras `start`/`end` para las etiquetas de los extremos.
   - `SliderControl` pasa a componerlo por dentro, sin cambiar su API.
   - **Sale de:** settings `RangeSlider` (9 usos + 3 nativos), mail 1, resonance 2, gallery 1.

5. **`TextArea`** — 4 lugares en 2 repos.
   - **API:** espejo de `TextInput`: `v-model`, `rows`, `invalid`, `mono`, `resize`, `focus()`.
   - **Sale de:** mail `Redactar`, settings `ShortcutEditor` y `NewProfile` ×2.

6. **`NumberField`** — unos 29 lugares en 2 repos.
   - **API:** `v-model: number`; `min`, `max`, `step`; `stepper?: boolean`; `narrow`; `invalid`.
   - **Sale de:** settings `NumberInput` (26) + `OnlineAccounts` (2), file-manager `NumberField*`.
   - **Sabe:** ignorar lo que no se puede parsear (settings) y los botones − y + (file-manager).

7. **`Popover`, `PopoverTrigger`, `PopoverAnchor`, `PopoverContent`** — unos 11 lugares en 4 repos.
   - **API:** como `DropdownMenu`: `v-model:open`; `side`, `align`, `sideOffset`; foco atrapado opcional. Sin rol de menú.
   - **Sale de:** file-manager (7 + `TagSelector`), text `Opciones`, mail «programar», desktop `MusicWidget`.
   - **Sabe:** anclarse a un elemento que no es el disparador (`PopoverAnchor`, file-manager).

8. **`Badge`** — unos 40 lugares en 9 repos.
   - **API:** `tone: neutral|accent|info|success|warning|error`; `variant: soft|outline|solid|overlay`; `size: sm|md`; `dot?`; `color?` (dato, para etiquetas de usuario); ranura por omisión.
   - **Sale de:** settings `StatusBadge` y unas 20 pastillas, store `InsigniaDeOrigen`, file-manager, desktop, contacts, monitor, gallery, resonance, text.
   - **Nota:** `SideButton` y `TrayIconButton` ya tienen la suya; pasan a usar ésta por dentro.

9. **`StatusDot`** — unos 12 lugares en 4 repos.
   - **API:** `tone` o `color` (dato); `pulse?`; `label?` (si no lo tiene, va `aria-hidden`).
   - **Sale de:** mail, calendar ×2, file-manager ×2, desktop ×5. El indicador de `DeviceCard` pasa a usarlo.

10. **`Kbd`** — unos 20 lugares en 3 repos.
    - **API:** ranura por omisión, o `keys: string[]` que dibuja la combinación separada.
    - **Sale de:** file-manager (14 + barra de dirección), mail `Atajos`, settings `KeyBindingInput` / `ShortcutEditor`.

11. **`SectionHeading`** — unos 70 lugares en 10 repos.
    - **API:** `title`; `icon?`; `count?` (pinta un `Badge`); `variant: 'eyebrow' | 'group'`; `sticky?`; `divider?`; ranura `actions`; `as` (`h2`…`h4`).
    - **Sale de:** calendar, contacts, mail, polkit, resonance, settings, file-manager (cabeceras de cuadrícula), gallery (cabecera de mes con contador y línea), text, monitor.

12. **`PageHeader`** — unos 60 lugares en 6 repos.
    - **API:** `title`; `eyebrow?`; `description?`; `icon?` (en `IconTile`); ranura `actions`. Se acomoda con `@container`.
    - **Sale de:** settings (33), installer (11), resonance (8), store (4), gallery, monitor.

13. **`SettingRow`** — unos 25 lugares en 4 repos.
    - **API:** `label`; `description?`; `controlId?` (une la etiqueta con el control); ranura por omisión = el control, a la derecha; ranuras `leading` (icono) y `footer`; `disabled`.
    - **Sale de:** settings (unas 15), desktop (`ConnectMenu`, `PhoneControlCenterCard`), store (`Repositorios`, `Instaladas`), resonance `Settings`.
    - **Nota:** es la «fila de ajuste». `SwitchRow`, con el interruptor a la izquierda y la fila entera como botón, queda como está: es otro formato, el del instalador.

14. **`ListRow` y `ListGroup`** — unos 35 lugares en 9 repos.
    - **`ListRow`:** `title`; `description?`; `meta?`; `icon?`/`iconType`; `selectable`/`selected`; `role: 'button'|'option'|'link'|'none'`; `disabled`; ranuras `leading`, `trailing`, `default`.
    - **`ListGroup`:** contenedor con divisores y canto.
    - **Sale de:** monitor 7, settings 5, store 3, file-manager 4, resonance 6, mail 4, contacts 2, desktop 6, prism 1.
    - **Riesgo:** dentro de un desplazador virtual, `ListRow` no impone su alto.

15. **`Avatar`** — 4 lugares en 3 repos.
    - **API:** `src?`; `name` (para las iniciales); `size: sm|md|lg|xl`; `alt?`; `editable?` + evento `edit`.
    - **Sale de:** contacts (iniciales, imagen rota, caja fija), desktop ×2, settings `UsersView` (editable).

16. **`IdentityBlock`** — 3 lugares en 2 repos.
    - **API:** `Avatar` + `title` + `subtitle`; ranura `trailing`; `size`.
    - **Sale de:** desktop `UserMenuCard` y `UserControlCenterCard`, contacts cabecera.

17. **`IconTile`** — unos 10 lugares en 3 repos, más uno interno de la librería.
    - **API:** `name`; `type`; `size`; `tone: neutral|selected|success|warning|error|accent`; `shape: square|circle`; `status?` (icono en la esquina: hecho, falló).
    - **Sale de:** installer ×5, desktop ×2, settings ×2, y el recuadro interno de `SwitchRow`.

18. **`Skeleton`** — unos 6 lugares en 3 repos.
    - **API:** `width?`; `height?`; `shape: line|block|circle`; quieto con movimiento reducido.
    - **Sale de:** file-manager, gallery, settings.

19. **`CoverArt`** — unos 7 lugares en 2 repos.
    - **API:** `src?`; `alt`; `fallbackIcon?`; `fallbackText?`; `size`; `shape: square|round`; evento `error`.
    - `SpinningCover` pasa a componerlo.
    - **Sale de:** resonance ×6 (`TrackMetaCard`, álbumes, artistas, favoritos, radios), desktop `MusicWidget` (no se migra: sección 5).

20. **`Disclosure`** — unos 10 lugares en 6 repos.
    - **API:** `title`; `v-model:open` o `defaultOpen`; ranuras `meta` y `default`; `aria-expanded`.
    - **Sale de:** contacts, settings ×4, monitor, installer, desktop (grupo de notificaciones), file-manager. `SideGroup` es su variante de barra lateral.

21. **`PropertyList`** — unos 12 lugares en 5 repos.
    - **API:** `items: {label, value, mono?}[]`; `layout: 'grid'|'rows'|'inline'`; ranura `value` por elemento.
    - **Sale de:** installer ×5, contacts, store ×2, settings `InfoRow`, file-manager.

22. **`StatTile`** — unos 20 lugares en 2 repos.
    - **API:** `label`; `value`; `hint?`; `icon?`.
    - **Sale de:** settings (15), monitor (total y la cabecera de las tarjetas).

23. **`CodeBlock`** — unos 7 lugares en 4 repos.
    - **API:** `text` o `lines: {text, tone?}[]`; `wrap`; `maxHeight`; `follow?` (seguir el final); `variant: 'code'|'log'`.
    - **Sale de:** installer, monitor, store ×2, settings ×2.

24. **`DropZone`** — 4 lugares en 3 repos.
    - **API:** `active`; `label`; `locked?`; `overlay?` (encima del contenido o en línea).
    - **Sale de:** resonance, store, file-manager ×2.

25. **`Panel`** — unos 15 lugares en 5 repos.
    - **API:** `as`; `padding: none|sm|md`; `scroll?`. Es la superficie de columna (`rounded-corner-l border-ui-line bg-ui-surface/70`).
    - **Sale de:** calendar, contacts, mail, store, file-manager.
    - **Por qué no `ListCard`:** `ListCard` es una fila (`flex justify-between p-3`). El menú del escritorio lo usó para sus zonas; con `Panel` eso se vuelve a separar.

26. **`WidgetFrame`** — 2 lugares en 1 repo.
    - **API:** `surface: 'float'|'surface'`; `editing?`; eventos `remove` y `resize-start`.
    - **Sale de:** desktop (`WidgetHost`, `WidgetSlot`).
    - **Nota:** es de un solo repo, pero el PR #144 lo dejó explícitamente pendiente. Se puede dejar como componente propio del escritorio si se prefiere (ver decisiones).

Y `DialogBody`: el cuerpo desplazable con relleno que hoy escriben a mano `ModalBase` (store) y `ModalDialog` (settings).

## 3. Componentes de la librería que necesitan una extensión (sin romper)

| componente | extensión | por qué (casos reales) |
|---|---|---|
| `ActionButton` | `pressed?: boolean` (`aria-pressed` + velo seleccionado); `href?` (un `<a>` con la misma forma); `variant: 'overlay'` (sobre imagen o vídeo, con `ui-scrim`) | `TransportButton`, la barra de file-manager, el enlace de store, los controles del `Lightbox` |
| `AlertMessage` | ranura `actions`; `dismissible` + `close`; `variant: 'banner'`; icono por omisión según tono | text `AvisoComponent`, mail imágenes bloqueadas, resonance reintentar, installer `ui/AlertMessage` |
| `EmptyState` | `size: 'sm'\|'md'`; `icon=""` lo oculta | settings `EmptyStateBox` ×33, desktop notificaciones, los vacíos de mail y contacts |
| `LoadingState` | `size: 'sm'` (fila con aro chico y texto) | store `IndicadorDeCarga`, las «Cargando…» sueltas |
| `ProgressBar` | `size: 'xs'\|'sm'\|'md'`; `showValue` + ranura de etiqueta | OSD, store, file-manager ×3, installer, settings `ui/ProgressBar` |
| `SelectField` | `options?: {label,value}[]\|string[]`, además de la ranura | settings `SelectInput` ×26 |
| `FormGroup` | `help?`; `error?` (con id y `aria-describedby` cableados); `variant: 'eyebrow'` | installer `CuentaView`, settings `OnlineAccounts`, polkit, resonance `LabeledField` |
| `SearchField` | `size: 'lg'`; `bare` | prism, file-manager `GlobalSearch` |
| `TextInput` | `type: 'datetime-local'` | mail «programar» |
| `DialogHeader` | `closeLabel?` (pinta el cerrar a la derecha) | mail ×2, store, settings |
| `DialogContent` | `size: 'sm'` (unos 420 px) | file-manager pisa el ancho con `w-[420px]` cuatro veces |
| `DropdownMenuItem` | `checked?: boolean\|null` (`menuitemcheckbox` + tilde); `inset?: number`; ranura `shortcut` (con `Kbd`) | desktop `TrayPopupView` (DBusMenu), file-manager menús con atajos |
| `ToggleControl` | `indicator?: {tone, pulse?}`; `badge?: number`; ranura `overlay` (barras de señal) | desktop Network, Bluetooth y ThemeToggle |
| `SpinningCover` | `progress?: number` (aro); `interactive` + `label` (se vuelve botón con nombre); usa `CoverArt` por dentro | desktop `TrayMusicControl` |
| `ToastArea` | `ToastNotice` gana `title`, `description`, `progress`, `action {label}` + evento `action`; nombre `toast` para la ranura (alias de `aviso`) | file-manager `ui/toast/*`, mail `Deshacer`, resonance |
| `ConfigSection` | `icon` pasa a `ThemeIcon` (hoy antepone el **texto** del icono: es un error); `description?`; ranuras `header`, `aside` y `actions` | settings `SectionCard` ×79, installer `SectionCard`, monitor ×6. **Nadie lo usa hoy**: contado en los 17 repos |
| `SideBar` | ranura `footer` | resonance (reproductor), monitor (intervalo), file-manager (error de la nube) |
| `SideButton` | `description?`; ranura `icon` | installer `PasoBoton` |
| `ThemeIcon` | `fallbacks?: string[]`; `fallbackSrc?` (un icono que trae otro, no uno propio) | store `IconoDeApp`, desktop `ConnectAppButton` y `TrayItemButton` |
| `tokens.css` | barra de desplazamiento con tokens (`scrollbar-color` y ancho) | borra `ScrollArea` de file-manager |

**Idioma en lo que se toque de la librería** (regla de CLAUDE.md, con alias obsoletos como hizo la 2.0.0):
- La ranura `aviso` de `ToastArea` → `toast`.
- `src/internos/iconoDelTema.ts` → `internal/themeIcon.ts`; `useIconoDelTema` → `useThemeIcon`.
- `olvidarLosIconosDelTema` y `usarLaVersionDelTema` → `forgetThemeIcons` y `useThemeVersion`.
- Si se toca `SwitchRow`, su ranura `pie` → `footer`.
- `WindowFrame` y `AppBar` (ranuras `identidad`, `barra`, `centro`, `acciones`, `titulo`) **no** se tocan en 2.1.0. Sus alias en inglés quedan para cuando alguien abra ese archivo.

## 4. Orden de trabajo

**Paso 1. `vue-libvasak` 2.1.0 (minor), con PR y CI.**
- **Entra:** los 26 genéricos, las 19 extensiones, `DialogBody` y los alias en inglés de lo tocado.
- **Pruebas y piezas que hay que sumar:**
  - una prueba por componente;
  - sumar los archivos a `MIGRATED` de `tokens-exist.test.ts` y a `public-surface.test.ts`;
  - contraste por esquema (`surface-contrast.test.ts`) para los velos nuevos;
  - estados en `bun run bench`;
  - claves de catálogo nuevas con respaldo (`dialog.close`, `slider.value`…).
- **Tiene que pasar:** `bun test`, `vue-tsc` (nunca `--bun`; memoria `vue-tsc-sin-bun`) y el CI del repo.
- **Se publica en npm** antes de cualquier aplicación: las aplicaciones instalan del registro.
- **Arreglo en el mismo PR:** la guardia de colores usa `\b` antes de `rgba(` y no ve `drop-shadow-[…rgba(…)]`. Se pasa a `(?<![a-zA-Z])`, como en desktop (lo señaló #144).

**Paso 2. `vapp`**, para que lo que nazca de la plantilla ya venga bien: `tokens.css`, la guardia de desktop, fuera `.background`, config-manager `^2.9.0`.

**Paso 3. Tanda 1, chicas y de bajo riesgo.** Sirven para probar los genéricos.
- **permissions:** 2 botones.
- **polkit-vasak:** `enfocar` → `focus`, `Checkbox`, `ActionButton`.
- **prism:** riesgo bajo; ojo con el alto de fila.
- **terminal:** sólo tokens.
- **text:** `Popover`, `SegmentedControl`, `AlertMessage` banner.
- **calendar y contacts juntos:** comparten `Panel`, `SectionHeading` y el panel de cuentas.

**Paso 4. Tanda 2, medianas.**
- **monitor:** puntos de corte en Registros; el gráfico queda como excepción.
- **installer:** pantalla delicada, el disco. Si se elige mal, se pierden datos: capturas de `DiscoView` y `ResumenView` en las 4 medidas antes y después.
- **store.**
- **gallery:** el `Lightbox` necesita `variant="overlay"` y tokens de velo sobre medios.
- **mail:** pantalla delicada, las tres columnas que cambian por `md:`. Se pasa a `@container` sobre la fila de la ventana y se comprueba que en 600 y 360 siga mostrando una sola columna, como hoy.

**Paso 5. Tanda 3, grandes.**
- **resonance:** dos desplazadores virtuales (`RecycleScroller` 92 px, `DynamicScroller`). Las filas no cambian de alto. Medir antes de subir, según `desplazador-virtual-del-taller`.
- **vasak-desktop:** las superficies pendientes. Centro de control, notificaciones, menú del teléfono, OSD, sesión, `WidgetFrame`, la portada con aro y el selector de audio. Banco de Vite y Chrome sin pantalla: el escritorio compilado aborta fuera de `/usr/bin` (memoria `escritorio-compilado-no-tiene-capa`).
- **file-manager:** ya está en pinia 4, así que no hay colisión. Tiene tokens inexistentes que la guardia va a encontrar. La cuadrícula y la lista no se tocan por dentro.
- **vasak-settings, en tres PR apilados o seguidos:**
  - **(a)** subir a 2.x, importar `tokens.css` y vaciar `components/ui/` hacia la librería. Son 13 archivos que llegan a 454 usos.
  - **(b)** los 101 puntos de corte → contenedor, y los 3 diálogos a mano → `Dialog`.
  - **(c)** el resto de las vistas: `OptionGroup` del audio, `SettingRow`, `Badge`, SVG.

**Riesgo de dependencias por aplicación.**
- **pinia 3/4:** no bloquea a ninguna; la librería no lo declara.
- **config-manager:** los 9 repos en `~2.6.1` suben a `^2.9.0` en su mismo PR. La nota está vieja: 2.9.0 acepta pinia 3. `bun outdated` y `cargo update --dry-run` como siempre.
- **Dependencias Rust:** ningún cambio de interfaz toca dependencias de Rust; las dos listas (`.deb` y `PKGBUILD`) se auditan con `readelf` igual al entrar.

**En cada PR de aplicación:**
- `tokens.css` después de `@import "tailwindcss"`, y sacar de `main.css` los radios, el piso de foco y `.background`.
- La guardia de desktop (`tests/design-guard.test.ts`).
- Capturas antes y después del banco: claro, oscuro, 240, 360, 600 y 1200.
- Renombrar al inglés los archivos que se toquen.
- Subir versión: manifiestos y `pkgver`.
- `CHANGELOG.md` del taller.

**Qué mostraría una rotura:**
- la guardia del repo;
- `tokens-exist`, `once-ui-shape` y `public-surface` de la librería;
- `vue-tsc` sin `--bun`;
- `app / revisar` en el SHA que se mergea (memoria `esperar-el-ci-por-sha`);
- la diferencia de capturas para el formato, que ninguna prueba ve.

## 5. Lo que no conviene convertir, y por qué

- **Ítems SNI de la bandeja** (`TrayBarArea`, `TrayItemButton.vue:28`): dibujan el mapa de bits que manda otra aplicación y distinguen botones del ratón. Es la excepción que ya está en la guardia del escritorio.
- **Gráficos de datos en SVG:** monitor `GraficoDeUso.vue:70` y settings `MonitorCanvas.vue:189`. No son iconos. Excepción nombrada en la guardia del repo, como la de SNI. `Sparkline` no sube: hay una sola copia.
- **Colores que son datos:**
  - el color de cada calendario y de cada etiqueta (calendar, file-manager `TagSelector`);
  - las muestras y los hex del editor de esquemas (settings `ColorSwatch`, `SchemeColorEditor`, `custom-scheme.ts`);
  - el CSS del correo en `srcdoc` (mail `tools/formato.ts`);
  - el tema de xterm (terminal);
  - el degradado de la portada (resonance `PlayerBackground`).
  Van por `style` o como propiedad `color`, con la regla anotada en la guardia.
- **El contenido de los widgets** (`MusicWidget`, `WeatherWidget`, `FilesWidget`, los relojes): todo se mide en unidades de contenedor (`cqmin`). Los componentes de la librería tienen medidas fijas, así que cambiaría el formato. Sólo el marco pasa a `WidgetFrame`; los botones de transporte de `MusicWidget` se quedan.
- **file-manager:**
  - tarjetas y filas de entrada, con sus capas de selección y portapapeles: son el núcleo de la aplicación y viven dentro de desplazadores virtuales;
  - `TabBarComponent`/`TabComponent` (grupos de pestañas con vista dividida y vista previa, que `TabBar` no modela);
  - `ResizablePanel*` y la barra de dirección con migas: hay una sola copia de cada uno.
- **Store `CarruselDeCapturas`** (el riel) y **gallery `TimelineSidebar`** (el riel) y el escenario del `Lightbox`: piezas únicas. Sólo pasan sus botones y globos.
- **Los editores** (CodeMirror en text, xterm en terminal): no son interfaz del taller.
- **`KeyBindingInput` de settings:** 21 usos, pero en un solo repo. Se sube cuando aparezca una segunda copia.
- **Los `WindowAppLayout` de cada aplicación:** son capas finas de `WindowFrame` con el relleno de la aplicación. Hay unas 15 copias casi iguales, pero cada una arma sus ranuras. No se generalizan ahora.
- **Tamaños `text-lg`/`xl`/`2xl`, medios pasos y `transition-all`:** igual que en #144, quedan fuera de la guardia. Pasarlos a los roles de Once UI mueve píxeles de cada pantalla, y `transition-all` está medido y no cuesta (memoria `transition-all-no-cuesta`).

## Decisiones por tomar

1. **2.1.0 en un PR o en dos.** Un PR con 26 componentes y 19 extensiones es difícil de revisar. Alternativa: 2.1.0 con formularios y selección (`OptionGroup`, `SegmentedControl`, `Checkbox`, `Slider`, `TextArea`, `NumberField`, `SettingRow`, `ListRow`, `Badge`, `StatusDot`, `SectionHeading`, `PageHeader`, `Panel` y las extensiones de formulario), y 2.2.0 con el resto (`Popover`, `Kbd`, `Avatar`/`IdentityBlock`, `IconTile`, `Skeleton`, `CoverArt`, `Disclosure`, `PropertyList`, `StatTile`, `CodeBlock`, `DropZone`, `WidgetFrame` y las extensiones de medios y avisos). La tanda 1 sólo necesita la primera.
2. **Casilla o interruptor en pantallas de ajustes.** En resonance `SettingsView:139` y en text `Opciones` hay una casilla donde el resto del taller usa `SwitchToggle`. Cambiarla es aspecto, no formato, pero es visible.
3. **Los filtros de gallery** (`GalleryView.vue:43`–`:46`): hoy son acciones sin estado elegido. Pueden quedar como `ActionButton` o pasar a `SegmentedControl`, que muestra cuál está activo. Lo segundo agrega información a la pantalla.
4. **`WidgetFrame`:** en la librería, como pidió el PR #144, o como componente propio del escritorio, porque hoy tiene un solo repo.

## Decisiones tomadas (01/10/2026, sesión principal, con el «arrancá con la librería y seguí con las apps» del usuario)

1. **Dos versiones**: 2.1.0 con formularios y selección (`OptionGroup`, `SegmentedControl`, `Checkbox`, `Slider`, `TextArea`, `NumberField`, `SettingRow`, `ListRow`/`ListGroup`, `Badge`, `StatusDot`, `SectionHeading`, `PageHeader`, `Panel`, `DialogBody` y las extensiones de formulario, diálogo, avisos y carga), y 2.2.0 con el resto (`Popover`, `Kbd`, `Avatar`/`IdentityBlock`, `IconTile`, `Skeleton`, `CoverArt`, `Disclosure`, `PropertyList`, `StatTile`, `CodeBlock`, `DropZone` y las extensiones de medios, menú, bandeja y barra lateral). Una detrás de la otra: tocan los mismos archivos de pruebas e `index.ts`.
2. **Casilla o interruptor**: se queda lo que hay en cada pantalla (casilla donde hoy hay casilla). Cambiarla es visible y la regla es que el formato no cambia.
3. **Filtros de gallery**: siguen como `ActionButton`; pasar a `SegmentedControl` agrega información a la pantalla.
4. **`WidgetFrame`**: componente propio del escritorio, con los tokens, igual que `KeyBindingInput` en settings: sube a la librería cuando aparezca una segunda copia.
