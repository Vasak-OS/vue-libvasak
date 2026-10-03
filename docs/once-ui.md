# Estilo similar a Once UI — especificación

Para `Vasak-OS/vue-libvasak#74`, con el menú anclado de `Vasak-OS/vasak-desktop#142`
como primer consumidor. Borrador para revisar con el usuario **antes** de tocar
ningún componente.

La regla que ordena todo el documento: **la forma sale de Once UI, los colores
salen del esquema del usuario.** Once UI trae su propio sistema de color
(escalas `oklch` de 12 pasos, `generateColorScheme()`); acá no entra. Lo que se
toma es el criterio: radios anidados, bordes finos y de poco contraste, sombras
de tres capas, relleno neutro al pasar por encima, acento sólo donde algo actúa,
animaciones cortas que crecen desde el disparador.

---

## 0. De dónde sale cada valor

Leído el 30/09/2026 en el sitio de documentación y en el código publicado
(`once-ui-system/core`, rama `main`, MIT). No se copia código: se anota el valor y
se reproduce con los tokens del taller.

| tema | fuente |
|---|---|
| radios: escala `xs…xl`, variantes `-nest-4`/`-nest-8`, estilos `playful`/`conservative`/`rounded`/`sharp` | https://docs.once-ui.com/once-ui/basics/border y `packages/foundations/scss/tokens/border.scss` |
| bordes: `{scheme}-border-weak/medium/strong` y `-alpha-*` | https://docs.once-ui.com/once-ui/basics/border |
| alfa neutro = `neutral-600` al 15 / 30 / 50 % | `packages/foundations/scss/tokens/theme.scss` |
| sombras `xs…xl` | `packages/foundations/scss/tokens/shadow.scss` |
| espaciado estático (grilla de 4 y 8) | https://docs.once-ui.com/once-ui/basics/spacing y `scss/tokens/layout.scss` |
| tipografía (display/heading/body/label, tamaños y alturas de línea) | https://docs.once-ui.com/once-ui/basics/typography y `scss/tokens/typography.scss` |
| duraciones y curva (`micro`/`macro`, `ease-in-out`), superficie translúcida con `blur(1rem)` | `scss/tokens/theme.scss` |
| sistema de color (base/semántico, `background`+`onBackground`, `solid`+`onSolid`) | https://docs.once-ui.com/once-ui/basics/color |
| desplegable: panel `background="surface"`, `border="neutral-medium"`, `radius="l"`, `padding="4"`; entrada `scale(0.9)→1` + opacidad en `micro-medium`, `transform-origin` desde la ubicación resuelta | `components/Dropdown.tsx`, `DropdownWrapper.tsx`, `DropdownWrapper.module.scss`, `Select.tsx`; ejemplos con `shadow="xl"` y `radius="m-4"` en https://docs.once-ui.com/once-ui/components/dropdown |
| opción de menú: `paddingX=12`, `paddingY=8`, `radius="m"`, `gap=12`, borde de 1 px transparente, `label-default-s` + descripción `body-default-xs` débil; hover/foco `neutral-alpha-weak` con borde `neutral-alpha-medium`; elegida `neutral-alpha-medium` | `components/Option.tsx`, `Option.module.scss` |
| campo: borde 1 px, `radius-s`, anillo de foco 2 px `brand-solid-strong` con 2 px de separación, error en `danger-*` | `components/Input.module.scss`, https://docs.once-ui.com/once-ui/form-controls/input |
| botón: alturas 24/32/40/48/56, radio `m` hasta el tamaño `m` y `l` arriba; `secondary` = transparente con borde `neutral-alpha-weak`; `tertiary` = sin borde; `transition-micro-medium` | `components/Button.module.scss`, `Button.tsx` |
| botón de alternar / control segmentado: alto 32 en `m`, hover `neutral-alpha-weak`, elegido `neutral-alpha-medium`; contenedor `radius="l"`, `padding="4"`, borde `neutral-alpha-weak` | `ToggleButton.module.scss`, `SegmentedControl.tsx` |
| interruptor: vía 40×24, pulgar 16, radios `l-nest-4`/`l`, encendido `brand-solid-medium`, apagado `opacity: 0.4` | `components/Switch.module.scss` |
| globo: `surface`, borde `neutral-medium`, `radius="s"`, `4×8` de relleno, `body-default-xs` | `components/Tooltip.tsx` |
| diálogo: `radius="xl"`, `shadow="xl"`, borde `neutral-medium`, relleno 24, pie con borde arriba y acciones a la derecha, `max-width: 40rem` | `components/Dialog.tsx`, `Dialog.module.scss` |
| tarjeta: `surface` + `neutral-medium`, `radius="l"`; elegida `brand-alpha-weak` + `brand-medium` | `components/Card.tsx` |
| configuración de referencia: `border: "playful"`, `surface: "translucent"`, `solidStyle: "flat"`, fuentes Geist | `magic-portfolio/src/resources/once-ui.config.ts` |

Lo que **no** se pudo verificar: la configuración de `nextjs-starter` (la ruta
esperada da 404) y el aspecto dibujado del sitio (las páginas se leyeron como
texto, no como imagen). Los valores de arriba salen del código, que es lo que
manda.

---

## 1. Cómo está hoy

- **La librería no publica tokens.** `vue-libvasak` exporta 48 componentes y un
  `style.css` compilado; los tokens (`--color-ui-bg`, `--radius-corner`…) están
  declarados en el `main.css` **de cada aplicación**, en el bloque `@theme` de
  Tailwind 4. Cada aplicación tiene su copia.
- **Los colores los escribe `tauri-plugin-config-manager`** (`guest-js/index.ts`,
  `setProperties`) sobre `:root`: `--primary`, `--secondary`, `--ui-background`,
  `--ui-surface`, `--ui-border`, `--text-main`, `--text-muted`, `--text-on-primary`
  y sus `-dark`. Además **calcula** `--text-on-primary`, `--text-on-secondary` y
  `--ui-border-strong` contra WCAG. Las variables `--use-*` eligen claro u oscuro
  según la clase `.dark`.
- **El radio ya es del usuario**: `style.radius` de `vasak.conf` → `--corner-radius`
  (10 px por omisión). Existen `rounded-corner`, `rounded-corner-sm` (r/2.5) y
  `rounded-corner-window` (r+2).
- **El lenguaje actual**, repetido en casi todos los componentes: `rounded-corner`
  para todo, `border-ui-border` (1.14–1.17:1 contra el fondo, y en oscuro es **más
  oscuro** que el fondo), `bg-ui-bg/80` en lo flotante, **hover con relleno de
  acento** (`hover:bg-primary hover:text-tx-on-primary` en `DropdownMenuItem`,
  `AppMenuCard`, `CategoryMenuPill`), escalas y giros al pasar
  (`hover:scale-110 hover:rotate-3` en los botones de sesión del menú,
  `hover:translate-x-1 hover:scale-110` en las filas), sombras de Tailwind sueltas
  (`shadow-lg`, `shadow-md`, `shadow`), rellenos de medio paso (`py-1.5`, `px-2.5`).
- **El menú** (`vasak-desktop`): ventana común de 900×620 centrada
  (`src-tauri/src/windows_apps/menu.rs`), con tres zonas en grilla
  (`src/views/MenuView.vue`): tarjeta de usuario + búsqueda + cinco botones de
  sesión arriba; lista de la categoría a la izquierda; píldoras de categoría con
  iconos de 40–56 px y el widget del clima a la derecha.
- **Los applets anclados** (`anchored_applet.rs` + `AppletPopover.vue`) ya cuelgan
  del botón, a `PANEL_GAP = 8` px del panel, con entrada de 180 ms desde el botón
  (`transform-origin` que manda el backend) y salida de 120 ms. Su página es
  `h-screen w-screen`: **la sombra no tiene dónde dibujarse** y el
  `backdrop-blur-md` que declaran no desenfoca nada (ver §7).

---

## 2. Tokens nuevos

Viven en un archivo nuevo de la librería, `src/styles/tokens.css`, publicado
como `@vasakgroup/vue-libvasak/tokens.css`. Cada aplicación lo importa **después**
de `@import "tailwindcss"` en su `main.css`. Así la forma llega a todas al subir la
librería y deja de haber una copia por aplicación. Los colores base siguen donde
están (`main.css` de piso, el plugin encima).

Los nombres respetan dos restricciones de Tailwind 4:

- `rounded-s`, `rounded-e`, `rounded-t`… **ya son utilidades** (esquinas lógicas),
  así que un `--radius-s` a secas crea una clase ambigua. Se extiende la familia
  que ya existe: `rounded-corner-*`.
- `shadow-sm/md/lg/xl` son de Tailwind; las nuestras llevan prefijo `surface` para
  que se vea de un vistazo cuál es cuál y la guardia pueda prohibir las otras.

### 2.1 Radios — de Once UI la escala y el anidado, del usuario el tamaño

Once UI tiene cuatro juegos fijos (`data-border`). Acá el usuario ya eligió su
radio, así que la escala se **deriva** de `--corner-radius` (`r`):

```css
@theme {
  --radius-corner-xs: calc(var(--corner-radius) * 0.4);            /* 4  */
  --radius-corner-s:  calc(var(--corner-radius) * 0.6);            /* 6  */
  --radius-corner-m:  var(--corner-radius);                        /* 10 */
  --radius-corner-l:  calc(var(--corner-radius) + min(var(--corner-radius), 4px)); /* 14 */
  --radius-corner-xl: calc(var(--corner-radius) + min(var(--corner-radius), 8px)); /* 18 */
  --radius-corner-full: 9999px;
  /* los que ya existen, como alias para no romper a nadie */
  --radius-corner: var(--radius-corner-m);
  --radius-corner-sm: var(--radius-corner-xs);
  --radius-corner-window: calc(var(--corner-radius) + 2px);
}
```

- **`l` = `m` + 4 y `xl` = `m` + 8 es el anidado de Once UI** (`-nest-4`,
  `-nest-8`): un contenedor con `p-1` alrededor de ítems `m` lleva `l`; con `p-2`,
  `xl`. Así la curva de adentro y la de afuera quedan concéntricas.
- El `min(r, …)` hace que con radio 0 **todo** sea 0 (el `sharp` de Once UI) en vez
  de quedar esquinas de 4 px sueltas.
- Contraste con Once UI, medido: con `r = 12` la escala da `m 12 / l 16 / xl 20`,
  **idéntica a `playful`**; con `r = 6` da `m 6 / l 10 / xl 12`, **idéntica a
  `conservative`**. El control de radio de Configuración pasa a ser el selector de
  personalidad de Once UI sin agregar ninguna opción.

**Qué radio lleva cada cosa** (de los componentes de Once UI):

| radio | para qué | de dónde |
|---|---|---|
| `corner-xs` | insignias, pulgar de barra, punto de «sin guardar» | chips de Once UI |
| `corner-s` | globo (tooltip), chips de categoría | `Tooltip radius="s"` |
| `corner-m` | botones, campos, selects, ítems de menú y de lista, pestañas | `Button` hasta `m`, `Option radius="m"` |
| `corner-l` | menús y desplegables (`p-1`), tarjetas, barra lateral, control segmentado | `DropdownWrapper radius="l"`, `Card`, `SegmentedControl` |
| `corner-xl` | diálogos, el menú de aplicaciones, applets | `Dialog radius="xl"` |
| `corner-full` | interruptor, avatar, anillo de foco redondo | `Switch` |
| `corner-window` | la ventana y lo que la tapa entera | ya existe |

### 2.2 Bordes — finos y de poco contraste, pero en la dirección correcta

Once UI dibuja los bordes con un gris medio (`neutral-600`) en transparencia: 15 %
(`weak`), 30 % (`medium`), 50 % (`strong`). La transparencia es lo que hace que el
mismo borde funcione sobre cualquier superficie. Acá el gris del esquema es el
texto principal, que es más oscuro que un gris medio en claro y más claro en
oscuro — así que se usa en porcentajes más bajos y **siempre va en la dirección
del contraste** (oscurece en claro, aclara en oscuro). Hoy `--ui-border-dark`
(`#11111b`) es más oscuro que el fondo oscuro, y por eso los bordes en oscuro se
ven como un hueco y no como un canto.

```css
@theme {
  --color-ui-line-weak: color-mix(in srgb, var(--use-text-main) 10%, transparent);
  --color-ui-line:      color-mix(in srgb, var(--use-text-main) 16%, transparent);
  /* ui-border-strong (≥ 3:1, calculado por el plugin) queda como está */
}
```

| token | uso | Once UI |
|---|---|---|
| `ui-line-weak` | separadores, borde de lo que va dentro de otra cosa (pie del diálogo, fila de lista) | `neutral-alpha-weak` |
| `ui-line` | canto de lo que se apoya o flota: tarjeta, menú, globo, diálogo, barra lateral, borde de botón `outline` | `neutral-medium` / `neutral-alpha-medium` |
| `ui-border-strong` | contorno de **un control** que tiene que percibirse: campo, select, vía apagada del interruptor | — (decisión del taller, WCAG 1.4.11) |
| `ui-border` | queda, pero sale de los componentes: es el separador del esquema | — |

### 2.3 Rellenos de estado — neutros, no de acento

```css
@theme {
  --color-ui-hover:    color-mix(in srgb, var(--use-text-main) 7%, transparent);
  --color-ui-pressed:  color-mix(in srgb, var(--use-text-main) 12%, transparent);
  --color-ui-selected: color-mix(in srgb, var(--use-text-main) 10%, transparent);
  --color-ui-selected-accent: color-mix(in srgb, var(--use-primary) 16%, transparent);
  --color-ui-float:    color-mix(in srgb, var(--use-ui-background) 88%, var(--use-ui-surface));
  --color-ui-shell:    color-mix(in srgb, var(--use-ui-background) 85%, transparent);
  --color-ui-scrim:    color-mix(in srgb, var(--use-ui-background) 55%, transparent);
  --color-ui-focus:    var(--use-ui-focus);
}
```

- `ui-hover` / `ui-pressed` / `ui-selected` son el `neutral-alpha-weak/medium` de
  `Option` y `ToggleButton`. **Es el cambio más visible**: pasar por encima de una
  opción deja de pintarla de rosa con texto oscuro y pasa a un velo gris muy leve
  con el texto de siempre. Eso es «más limpio».
- `ui-selected-accent` es el `brand-alpha-weak` de la tarjeta elegida, para lo que
  se **elige** (una tarjeta de dispositivo, un esquema de color), no para lo que se
  recorre.
- `ui-float` es la superficie de lo que flota **dentro** de una ventana
  —desplegable, globo, diálogo—: el fondo de ventana con un poco de superficie,
  **opaco**. Detrás tiene el resto de la misma página, que nadie desenfoca, así
  que translúcido se leería encima de otro texto. No contradice
  [[tokens-de-fondo]]: lo flotante no se apoya en la ventana, es su propia capa.
- `ui-shell` (2.3.0) es la superficie **del escritorio** —panel, menú, applets,
  centro de control, OSD, sesión, widgets—: el fondo de ventana al 85 %,
  **translúcido**, porque lo que tiene detrás es el escritorio y el desenfoque lo
  pone Wayfire (el complemento `blur`, por espacio de nombres de capa). Sin
  `backdrop-blur`: el WebView no ve el escritorio. Al 85 % el texto principal
  llega a 4,5:1 aunque el fondo de pantalla sea negro o blanco puro (ver §12).
  Reemplaza el `ui-float` que el §5.3 y la decisión 3 del §10 le daban al menú
  y a los applets (corrección del 02/10/2026, §13).
- `ui-scrim` reemplaza al `bg-ui-border/40` del velo del diálogo.

### 2.4 Sombras — las de Once UI tal cual

```css
@theme {
  --shadow-surface-xs: 0 0 1px rgb(0 0 0 / .12), 0 1px 2px rgb(0 0 0 / .08), 0 2px 4px rgb(0 0 0 / .08);
  --shadow-surface-s:  0 0 2px rgb(0 0 0 / .12), 0 1px 4px rgb(0 0 0 / .08), 0 4px 8px rgb(0 0 0 / .08);
  --shadow-surface-m:  0 0 2px rgb(0 0 0 / .12), 0 2px 4px rgb(0 0 0 / .08), 0 8px 8px rgb(0 0 0 / .08);
  --shadow-surface-l:  0 2px 4px rgb(0 0 0 / .12), 0 8px 12px rgb(0 0 0 / .08), 0 8px 16px rgb(0 0 0 / .08);
  --shadow-surface-xl: 0 4px 4px rgb(0 0 0 / .12), 0 8px 12px rgb(0 0 0 / .08), 0 24px 24px rgb(0 0 0 / .08);
}
```

Once UI usa el mismo negro en claro y en oscuro: en oscuro la sombra casi no se
ve y lo que separa es el borde `ui-line`, que ahí aclara. Se mantiene igual.

| elevación | qué |
|---|---|
| ninguna | lo que se apoya en la ventana: tarjeta, barra lateral, campo |
| `surface-xs` | pulgar del interruptor y de la barra |
| `surface-s` | globo |
| `surface-m` | desplegable dentro de una ventana, pestaña desplegada |
| `surface-l` | menú de aplicaciones y applets (salen del panel) |
| `surface-xl` | diálogo |

### 2.5 Espaciado — la grilla de Once UI ya es la de Tailwind

La escala estática de Once UI es 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64…
Tailwind 4 multiplica por 4 px, así que **no hace falta ningún token**: hace falta
una regla. En los componentes sólo valen los pasos `0`, `px`, `0.5`, `1`, `2`, `3`,
`4`, `5`, `6`, `8`, `10`, `12`, `14`, `16`. Quedan fuera los medios pasos
(`1.5`, `2.5`, `3.5`) y `7`, `9`, `11` en relleno, margen y separación; los altos
fijos de §2.7 son la excepción declarada.

### 2.6 Tipografía — los tamaños y alturas de Once UI, la familia del usuario

La familia sigue saliendo de `vasak.conf` (`--vsk-font-apps`, `--vsk-font-title`).
De Once UI se toman los roles y la relación tamaño/altura de línea, redondeados a
píxeles enteros (un tamaño de 13,2 px se dibuja borroso en WebKitGTK con
suavizado en escala de grises):

```css
@theme {
  --text-label-xs: 0.75rem;    --text-label-xs--line-height: 1rem;      /* 12/16 */
  --text-label-s:  0.8125rem;  --text-label-s--line-height: 1rem;       /* 13/16  Once: 13.2/16 */
  --text-label-m:  0.875rem;   --text-label-m--line-height: 1.25rem;    /* 14/20  Once: 14.8/20 */
  --text-body-xs:  0.75rem;    --text-body-xs--line-height: 1rem;       /* 12/16 */
  --text-body-s:   0.875rem;   --text-body-s--line-height: 1.25rem;     /* 14/20  Once: 14/18 */
  --text-body-m:   1rem;       --text-body-m--line-height: 1.5rem;      /* 16/24 */
  --text-heading-xs: 1rem;     --text-heading-xs--line-height: 1.25rem; /* 16/20 */
  --text-heading-s:  1.125rem; --text-heading-s--line-height: 1.5rem;   /* 18/24 */
  --text-heading-m:  1.25rem;  --text-heading-m--line-height: 1.5rem;   /* 20/24 */
}
```

`body-s` sube a 20 de altura (Once: 18) porque es el texto de párrafo de
Configuración y del correo, y a 18 las líneas se pegan. Pesos de Once UI:
etiqueta 400 y fuerte 600, título 600. Nada en 700.

### 2.7 Alturas de control

| tamaño | alto | clase | uso | Once UI |
|---|---|---|---|---|
| `xs` | 24 | `h-6` | botón dentro de una fila, cerrar pestaña | `Button xs` |
| `s` | 32 | `h-8` | **por omisión en el escritorio**: botones, campos, selects, pestañas, chips | `Button s`, `ToggleButton m` |
| `m` | 40 | `h-10` | acciones de un diálogo, ítems del menú de aplicaciones | `Button m` |
| `l` | 48 | `h-12` | fila con descripción | `Button l` |

Once UI arranca los campos en 48–56 px porque piensa en páginas con etiqueta
flotante; en un escritorio con ventanas de 800 px eso es la mitad de un
formulario. Acá los campos van en 32.

### 2.8 Duraciones y curva

| nombre | valor | uso | Once UI |
|---|---|---|---|
| `micro-short` | 100 ms | apretar, soltar | `--transition-duration-micro-short` |
| `micro-medium` | 200 ms | hover, foco, cambio de color, abrir un desplegable | `micro-medium` |
| `micro-long` | 400 ms | mover el pulgar de un interruptor | `micro-long` (Once: 300 para el pulgar) |
| `macro-short` | 150 ms | salida de un desplegable | `macro-short` |
| `macro-medium` | 300 ms | plegar la barra lateral, cambiar de vista | `macro-medium` |

```css
@theme { --ease-ui: ease-in-out; --ease-ui-out: cubic-bezier(0.2, 0, 0, 1); }
```

`ease-in-out` es el de Once UI para todo. Para una **entrada** se agrega
`ease-ui-out` (arranca rápido y frena), que es lo que hace que un menú se sienta
inmediato; Once UI usa `ease-in-out` también ahí. Tailwind 4 no tiene espacio de
nombres para duraciones, así que en las clases van los números (`duration-100`,
`duration-150`, `duration-200`, `duration-300`) y la guardia sólo acepta ésos.

Lo que **sale**: `hover:scale-*`, `hover:rotate-*`, `hover:translate-*` y
`active:scale-*` en controles. Once UI no mueve nada al pasar por encima.

---

## 3. Estados y foco

Una sola tabla para todos los controles:

| estado | qué cambia | cuánto tarda |
|---|---|---|
| reposo | nada | — |
| hover | fondo `ui-hover`; en `outline`, además el borde pasa a `ui-line` → `ui-border-strong` | 200 ms |
| apretado | fondo `ui-pressed`; sin escala | 100 ms |
| elegido (recorrido: opción, pestaña, elemento de barra) | fondo `ui-selected`, peso 600 | 200 ms |
| elegido (decisión: tarjeta, esquema) | fondo `ui-selected-accent`, borde `primary` | 200 ms |
| foco visible | anillo (abajo) — se suma, no reemplaza al hover | instantáneo |
| deshabilitado | `opacity: .5`, `cursor-not-allowed`, sin hover; **un ítem de menú sigue enfocable** (ya decidido en `DropdownMenuItem`) | — |
| inválido | borde `status-error`, texto de ayuda en `status-error` atado por `aria-describedby` | — |
| cargando | la rueda reemplaza al icono, el ancho no cambia | — |

**El acento sólo donde algo actúa**: botón principal, interruptor encendido,
barra de progreso, anillo de foco, tarjeta elegida. No en el hover, no en la
selección de una lista.

### 3.1 El anillo de foco

- `outline: 2px solid var(--color-ui-focus); outline-offset: 2px`, que es el
  `focusRing` del campo de Once UI y el mismo piso que ya tiene `main.css`.
- **Dentro de un contenedor que desplaza** (menú, lista, carril de pestañas) el
  anillo va **adentro**: `outline-offset: -2px`. Con 2 px afuera lo recorta el
  `overflow` y el foco del primer y el último ítem no se ve.
- **El color no puede ser `primary` a secas.** Medido con el esquema por omisión:
  `#dd7878` sobre `#eff1f5` da **2,64:1**, contra el 3:1 que pide WCAG 1.4.11 para
  un indicador de foco. En oscuro (`#eba0ac` sobre `#1e1e2e`) sobra.
  - **En el plugin** (`tauri-plugin-config-manager`, minor 2.10): calcular
    `--ui-focus` / `--ui-focus-dark` con `mejorSobre(background, [primary,
    secondary, text.main], MINIMO_NO_TEXTO)`, igual que ya hace
    `bordeFuerteSobre`. Así cualquier esquema —incluido el «Personalizado» y el
    automático de `vasak-settings#134`— queda con un foco visible.
  - **Piso en CSS** mientras el plugin no llegue:
    `--use-ui-focus: var(--ui-focus, color-mix(in srgb, var(--use-primary) 60%, var(--use-text-main)))`.
    Con el esquema por omisión da `#a3686f`, **3,9:1** en claro.

### 3.2 Contraste del texto sobre las superficies nuevas

Calculado con el esquema por omisión (hay que convertirlo en prueba, §8):

| texto | sobre | claro | oscuro |
|---|---|---|---|
| `tx-main` | `ui-hover` sobre el fondo | 6,5:1 | 9,3:1 |
| `tx-muted` | `ui-hover` sobre el fondo | 5,9:1 | > 6:1 |
| `tx-main` | `ui-selected-accent` sobre el fondo | 6,1:1 | > 7:1 |
| `tx-on-primary` | `primary` | lo garantiza el plugin | ídem |

Todo lo nuevo son velos de menos del 16 %, así que el texto de siempre sigue
pasando; lo que hay que vigilar es un esquema con fondo de contraste medio, y por
eso la prueba corre sobre los esquemas del sistema y no sobre uno.

---

## 4. Los componentes

Los 48, agrupados en el orden en que se hacen. Para cada uno: qué cambia. Lo que
no se nombra no cambia (API, teclado, ARIA: esto es sólo la forma).

### 4.1 Lo que usa el menú — primera tanda

**`DropdownMenuContent`** — panel `bg-ui-float`, borde `ui-line`, `rounded-corner-l`,
`shadow-surface-m`, `p-1`, `min-w-48` (hoy `min-w-30`). Entrada: opacidad 0→1 y
`scale(.96)→1` en 200 ms `ease-ui-out` con `transform-origin` en la esquina que
toca al disparador según el lado resuelto (hoy crece desde el centro); salida
150 ms. Once UI escala desde 0,9; en un menú de 300 px eso se lee como un salto,
0,96 es lo que ya usan los applets.

**`DropdownMenuItem`** — `h-8`, `px-3`, `gap-3`, `rounded-corner-m`, `text-label-m`,
borde de 1 px transparente. Hover y foco: `bg-ui-hover` (y el foco suma el anillo
interior). Hoy es `hover:bg-primary hover:text-tx-on-primary`. Nuevas ranuras
opcionales (minor): `prefix` (icono 16), `description` (`text-body-xs
text-tx-muted`, sube el alto a 48) y `shortcut` a la derecha en `text-tx-muted`.
Propiedad `danger`: texto `status-error`, hover `status-error/10`.

**`DropdownMenuLabel`** — `px-3 pt-2 pb-1 text-label-xs font-semibold text-tx-muted`
(hoy `text-sm` en `tx-main`, se confunde con una opción).

**`DropdownMenuSeparator`** — `h-px bg-ui-line-weak my-1 -mx-1` (hoy
`bg-ui-bg/80 my-4 h-0.5`, que en claro casi no se ve y separa 32 px).

**`DropdownMenuTrigger`**, **`DropdownMenu`** — sin dibujo propio; el disparador
toma el aspecto del botón que envuelva.

**`TextInput`** — `h-8 px-3 rounded-corner-m border border-ui-border-strong
bg-ui-surface/70 text-label-m`, hover `border-tx-muted`, foco: anillo de 2 px
afuera (hoy `focus:ring-1`, un píxel que no llega a 3:1), inválido
`border-status-error`. `py-1.5` se va con el alto fijo.

**`SearchField`** — hereda `TextInput`; lupa y cruz a 16 px con `pl-8`/`pr-8`; la
cruz es un botón `tertiary` `size-6 rounded-corner-s`. Variante `ghost` (minor):
sin borde ni fondo en reposo, para el encabezado del menú de aplicaciones donde el
campo ya está dentro de una superficie.

**`ListCard`** — `rounded-corner-l border-ui-line bg-ui-surface/70 p-3` (sin
`.background`, que es `bg-ui-bg/80` y es la clase que [[tokens-de-fondo]] ya
marcó); clicable: hover `bg-ui-hover` sobre la superficie, sin cambio de borde.

**`TabBar` / `TabItem`** — pasan al control segmentado de Once UI: el carril lleva
`p-1 gap-0.5 rounded-corner-l border-ui-line-weak`, cada pestaña `h-8 px-3
rounded-corner-m` **sin borde**; activa `bg-ui-selected` y peso 600 (hoy
`bg-primary font-bold text-tx-on-primary`, que en una terminal con nueve pestañas
es una fila de nueve etiquetas pero una de ellas gritando). El nombre desplegado
de la barra vertical va como globo: `bg-ui-float border-ui-line
rounded-corner-s shadow-surface-s`. El resaltado de arrastre pasa de
`ring-secondary` a una barra de 2 px en `ui-focus` en el borde de inserción.

**`SideBar` / `SideGroup` / `SideButton`** — la barra: `rounded-corner-l
border-ui-line bg-ui-surface/70`. El botón: `h-9 px-3 gap-3 rounded-corner-m`, sin
borde en ningún estado (hoy aparece `hover:border-ui-border` y el activo lleva
`border-secondary bg-primary/15 shadow-sm`), hover `bg-ui-hover`, activo
`bg-ui-selected` + peso 600 + el icono en `text-primary`. Sin `active:scale`. El
título de grupo: `text-label-xs font-semibold text-tx-muted px-3`. La insignia:
`rounded-corner-full px-2 h-5 text-label-xs bg-ui-selected`.

**`Tooltip` / `TooltipTrigger` / `TooltipContent`** — `bg-ui-float border-ui-line
rounded-corner-s px-2 py-1 text-body-xs shadow-surface-s`, entrada 150 ms sólo
opacidad y 2 px de desplazamiento desde el disparador (hoy borde `secondary`,
`text-sm`, escala 0,95 en 200 ms).

**`ActionButton`** — alto por tamaño (`sm` 24, `md` 32, `lg` 40), `rounded-corner-m`,
`text-label-m font-semibold`, `gap-2`, icono 16. Variantes: `primary` igual (plano:
el `solidStyle: "flat"` de Once UI), `secondary` igual (es el color secundario del
esquema, cambiarlo es una mayor), y **dos nuevas** (minor): `outline` (transparente,
borde `ui-line`, hover `ui-hover`) y `ghost` (transparente, sin borde, hover
`ui-hover`), que son el `secondary` y el `tertiary` de Once UI. `danger` sigue con
el problema del texto (hace falta `--text-on-danger`, anotado en el componente).

### 4.2 Formularios

**`SelectField`** — como `TextInput`: `h-8 rounded-corner-m border-ui-border-strong`;
etiqueta `text-label-s text-tx-muted`. **`SearchSelect`** — su lista toma el panel
y las opciones de `DropdownMenuContent`/`Item` (hoy dibuja la suya).
**`FormGroup`** — etiqueta `text-label-s font-semibold`, ayuda y error
`text-body-xs`, `gap-1.5` → `gap-1`/`gap-2`. **`SwitchTrack` / `SwitchToggle` /
`SwitchRow` / `ToggleControl`** — vía 40×24 (`w-10 h-6`) y pulgar 16 como Once UI
(hoy 44×24 y 48×28), apagado `bg-ui-surface border-ui-border-strong`, encendido
`bg-primary`, pulgar `shadow-surface-xs`, recorrido en 300 ms; la fila entera:
`rounded-corner-m px-3 py-2` con hover `ui-hover`. **`SliderControl` /
`ProgressBar`** — vía `h-1.5` → `h-1`, `rounded-corner-full`, relleno `primary`,
pulgar 16 con `shadow-surface-xs` y anillo de foco redondo.

### 4.3 Superposiciones y avisos

**`Dialog` y sus cinco partes** — panel `bg-ui-float border-ui-line
rounded-corner-xl shadow-surface-xl`; encabezado `p-6 pb-2 gap-1`, título
`text-heading-s`, descripción `text-body-s text-tx-muted`; cuerpo `px-6`; pie
`px-3 py-3 border-t border-ui-line-weak gap-2 justify-end` (el pie de Once UI);
velo `ui-scrim` sin desenfoque. Entrada 200 ms opacidad + `scale(.98)→1` (Once UI
arranca en 0,2, que en una ventana de escritorio es un zoom de presentación).
**`AlertMessage` / `ToastArea`** — `rounded-corner-l`, borde del tono al 30 %,
fondo al 8 %, icono a la izquierda, título `text-label-m font-semibold`; el aviso
transitorio suma `bg-ui-float shadow-surface-m`.

### 4.4 Contenedores

**`ConfigSection`**, **`DeviceCard`**, **`EmptyState`**, **`LoadingState`** —
tarjeta `rounded-corner-l border-ui-line bg-ui-surface/70`, relleno `p-4` (o
`p-6` en la sección), título `text-heading-xs`, texto secundario
`text-body-s text-tx-muted`. `DeviceCard` elegida: `bg-ui-selected-accent
border-primary` (la tarjeta elegida de Once UI).

### 4.5 La ventana

**`WindowFrame`**, **`AppBar`**, **`WindowControls`**, **`BarSearch`**,
**`TrayIconButton`** — la ventana conserva `rounded-corner-window` y su borde
pasa a `ui-line`; los controles de ventana y el botón de bandeja son botones
`ghost` de 24/32 px con `rounded-corner-m` (el de cerrar, hover `status-error/15`);
`BarSearch` usa el `SearchField` `ghost`.

### 4.6 Reproductor e iconos

**`NowPlayingCard`**, **`SeekBar`**, **`SpinningCover`** — tarjeta como §4.4, la
barra como `SliderControl`, la tapa `rounded-corner-m` (o `full` girando).
**`ThemeIcon`** — sin cambios; sólo se fijan los tamaños que se usan: 16 en
controles, 24 en filas, 32 en tarjetas, 48 en estados vacíos.

---

## 5. El menú anclado como desplegable

### 5.1 Tamaño

**400 × 560** píxeles lógicos de contenido, como una fila más en `APPLETS`
(`AppletSpec { id: "menu", route: "menu", size: (400.0, 560.0) }`), con el mismo
`place_applet`, las mismas pruebas de borde y el achique en monitores chicos que ya
tienen los applets. Es menos de la mitad de la superficie de hoy (900×620): 400
es lo que ocupa una columna de nombres de aplicación con su descripción sin
cortar, 560 son diez filas de 40 más el encabezado y el pie, y entra en una
pantalla de 768 con el panel puesto.

### 5.2 Estructura

```
┌──────────────────────────────────────┐  rounded-corner-xl, borde ui-line,
│ ⌕  Buscar aplicaciones               │  bg-ui-shell, shadow-surface-l
├──────────────────────────────────────┤  ← ui-line-weak
│ [Todas] Internet  Oficina  Sistema › │  chips h-7, se desplazan con la rueda
│                                      │
│ ▣  Firefox                           │  filas h-10: icono 24 + nombre label-m
│    Navegador web                     │  (h-12 con descripción body-xs muted)
│ ▣  Archivos                          │  hover ui-hover · teclado: ui-hover +
│ ▣  Terminal                          │  anillo interior
│ …                                    │  p-1 alrededor de la lista → filas m
├──────────────────────────────────────┤  ← ui-line-weak
│ (P) Pato             ⚙  ☾  ⇥  ↻  ⏻ │  pie h-12: avatar 28 + nombre;
└──────────────────────────────────────┘  botones ghost 32 con globo
```

- **Encabezado** (`p-2`): `SearchField` `ghost`, `h-10`, con el foco al abrir (lo
  que ya hace `prepareMenuSearch`). Al escribir, los chips se esconden y la lista
  pasa a ser de resultados, con la primera fila marcada; Enter la abre (ya existe).
  La fila marcada desde el campo **no** lleva anillo: el foco sigue en el campo
  (`aria-activedescendant`, que `SearchField` ya expone), así que la fila lleva
  `ui-selected` y peso 600, y el anillo queda en el campo (por dentro, porque el
  campo `ghost` va pegado al canto). Dos anillos a la vez dicen que hay dos focos.
- **Categorías**: los chips reemplazan a las píldoras de iconos de 40–56 px. Un
  chip es `h-7 px-3 rounded-corner-s text-label-s`; el elegido `bg-ui-selected`
  peso 600. Es el `SegmentedControl` de Once UI sin contenedor. El carril se
  desplaza con la rueda como el de `TabBar` (el mismo arreglo).
- **Lista**: una sola columna, `p-1`, filas `DropdownMenuItem` con `prefix` e
  `description`. Es literalmente un desplegable largo, y por eso el menú se arma
  con los componentes de §4.1 y no con clases propias (lo que pide `desktop#142`).
- **Pie** (`px-3 h-12`, borde arriba `ui-line-weak`): avatar y nombre a la
  izquierda (`UserMenuCard` en pequeño); a la derecha Configuración, Suspender,
  Cerrar sesión, Reiniciar y Apagar como botones `ghost` de 32 con globo. Sin
  escala ni giro al pasar.
- **Sale del menú**: el widget del clima y la grilla de tres zonas (decisión 1 de
  §9).

### 5.3 El borde y la sombra de algo que sale del panel

- `rounded-corner-xl` en las cuatro esquinas; sin flecha (Once UI no usa flechas
  en sus desplegables, y con 8 px de separación la relación con el botón la da la
  animación).
- Borde `ui-line` de 1 px y `shadow-surface-l`. Superficie `bg-ui-shell`,
  translúcida (era `bg-ui-float` opaca hasta la corrección del 02/10/2026, §13).
- **La sombra necesita lugar.** La superficie de capa es del tamaño exacto del
  applet y la página es `h-screen w-screen`, así que cualquier sombra se corta en
  el borde de la superficie. Propuesta, que sirve para los applets también:
  - la superficie crece `SHADOW_BLEED = 24` px por lado (lo que ocupa
    `surface-l`: 8 + 16 hacia abajo);
  - hacia el panel el margen se reduce en lo mismo
    (`PANEL_THICKNESS + PANEL_GAP − SHADOW_BLEED`), así que el canto visible sigue
    a 8 px del panel;
  - la página dibuja el panel con `inset: 24px`, y un `pointerdown` sobre el
    margen transparente cierra el menú como un clic afuera. (Lo más prolijo es
    recortar la región de entrada de la superficie a su parte visible con
    `input_shape_combine_region` de GDK; es más trabajo y va en su propio paso.)
  - `place_applet` recibe el tamaño con el margen incluido; las pruebas de «nunca
    tapa el panel» y «nunca sale del monitor» se escriben contra el canto visible.

### 5.4 Según el lado del panel

| panel | cuelga | crece desde | se desliza |
|---|---|---|---|
| arriba | debajo del botón, centrado sobre él y corrido lo justo para entrar | el borde de arriba, en la `x` del botón | 6 px hacia abajo |
| abajo | encima del botón | el borde de abajo, en la `x` del botón | 6 px hacia arriba |
| izquierda | a la derecha del botón, alineado en alto y corrido para entrar | el borde izquierdo, en la `y` del botón | 6 px hacia la derecha |
| derecha | a la izquierda del botón | el borde derecho, en la `y` del botón | 6 px hacia la izquierda |

El `transform-origin` ya lo calcula `appletTransformOrigin()` a partir de `side` y
`origin`. **El contenido no se da vuelta**: la búsqueda queda siempre arriba y el
pie abajo, esté el panel donde esté (decisión 2 de §9). La búsqueda tiene el foco
al abrir, así que la distancia al puntero no importa, y un menú que cambia de
orden según el panel es uno que no se aprende. Abierto sin botón (Super, D-Bus
`OpenMenu`): se ancla al botón del menú del panel, como pide `desktop#142`.

### 5.5 Apertura y cierre

- Entrada: 200 ms, `ease-ui-out`, opacidad 0→1, `scale(.96)→1` y los 6 px de
  deslizamiento desde el panel. Todo `transform` + `opacity`: se compone, no
  rehace el maquetado.
- Salida: 120 ms, `ease-in`, opacidad →0 y `scale(.98)`. Sin deslizamiento (salir
  hacia el panel se lee como «se guardó», que es lo que pasa; con escala alcanza).
- La lista **no** anima sus filas al entrar (hoy el `transition-group` de las
  píldoras escala cada una en 400 ms): una sola animación, la del panel.
- `prefers-reduced-motion`: sólo opacidad, como ya hace `AppletPopover`.
- Esconder y volver a mostrar sigue sin recargar la página (`applet-shown` /
  `applet-leave`).

---

## 6. Lo que se toma de Once UI, en una línea

Radios anidados en cinco pasos; bordes finos de un gris translúcido; sombras de
tres capas en cinco niveles; hover con velo neutro; acento sólo donde algo
actúa; anillo de foco de 2 px separado 2 px; grilla de 4/8; roles de texto con
alturas de línea fijas; 100/200/300 ms en `ease-in-out`; desplegables con
`p-1`, ítems con radio `m` y panel `l`, que crecen desde el disparador.

## 7. Lo que NO se toma, y por qué

| de Once UI | por qué no |
|---|---|
| **El color** (`oklch`, escalas de 12 pasos, `generateColorScheme`, `data-brand`) | Los colores son del esquema del usuario; ésa es la regla del issue. Sí se usa `color-mix`, que WebKitGTK ya resuelve (lo usa `main.css` en la barra de desplazamiento). |
| **Las fuentes web** (Geist, Geist Mono por `next/font`) | Las fuentes las elige el usuario en Configuración y se aplican desde `vasak.conf`; una aplicación no puede depender de bajarse una fuente de la red. |
| **La superficie translúcida con `backdrop-filter: blur(1rem)`** | En una superficie de capa transparente el WebView **no ve el escritorio**: el desenfoque sólo alcanza lo que la propia página dibujó detrás, que en un applet es nada. Por eso el `backdrop-blur-md` de `AppletPopover` no hace nada hoy y sólo cuesta. El desenfoque del escritorio es del compositor (el complemento `blur` de Wayfire, por espacio de nombres de capa) — decisión 3 de §9. Dentro de una ventana (el velo del diálogo) sí funcionaría, pero es caro en WebKitGTK y no se adopta sin medir con `medir-en-webkit.py`. |
| **Los cuatro juegos de radio** (`data-border`) | El radio ya es un control del usuario; la escala derivada reproduce `playful` con 12 y `conservative` con 6. |
| **El estilo sólido «plastic»** (sombras interiores en los botones) | La configuración de referencia de Once UI usa `flat`, y el plástico son dos capas de sombra por botón que en una barra de 20 controles se pagan en cada repintado. |
| **Etiqueta flotante en los campos** | Cambia el contrato (`FormGroup` ya pone la etiqueta y la ata por `id`) y anima `top`/`left`, que es maquetado. Queda como idea para un campo nuevo, no para éste. |
| **Espaciado y tipografía adaptables** (tres escalas por punto de corte, `data-scaling`, alturas táctiles) | Son ventanas de escritorio de tamaño conocido; la escala la da el factor de escala del monitor. |
| **Efectos** (máscara con el cursor, puntos, grillas, degradados, `CursorCard`, `TiltFx`) | Decoración de página de presentación; en un escritorio distrae y cuesta. |
| **`scale(0.9)` y `scale(0.2)` de entrada** | En superficies de 400 px o en diálogos se leen como zoom; se usa 0,96 y 0,98. |
| **Sombras más fuertes en oscuro** | Once UI tampoco las tiene; en oscuro separa el borde. |

## 8. Pruebas que tiene que traer

Todas con títulos en español; archivos nuevos con nombre en inglés.

- **`tests/tokens-exist.test.ts`** — la guardia que pide el issue. Lee
  `src/styles/tokens.css` **y** los `--color-*` del piso de colores, y falla si un
  `.vue` de `src/` usa un `rounded-corner-*`, `shadow-surface-*`, `text-label-*`,
  `text-body-*`, `text-heading-*`, `ease-ui*` o color `ui-*`/`tx-*` que no esté
  declarado. Con el borde `(?![a-z0-9-])` y la prueba previa de que el CSS se leyó
  (ver [[clases-de-color-que-no-existen]]).
- **La misma guardia, al revés**: ningún componente usa `shadow-sm|md|lg|xl`,
  `rounded-(sm|md|lg|xl)`, `hover:scale-*`, `hover:rotate-*`, medios pasos de
  relleno (`p?-1.5`, `-2.5`, `-3.5`) ni duraciones fuera de 100/150/200/300.
- **`tests/surface-contrast.test.ts`** — para cada esquema del sistema, claro y
  oscuro: `tx-main` y `tx-muted` sobre `ui-hover`, `ui-selected`,
  `ui-selected-accent` y `ui-float` compuestos sobre el fondo ≥ 4,5:1; `ui-focus`
  contra el fondo y contra `ui-float` ≥ 3:1. Y `ui-shell` (2.3.0) compuesta sobre
  un fondo de pantalla negro y uno blanco: `tx-main` ≥ 4,5:1, también sobre un
  panel, `ui-hover` y `ui-selected-accent` apoyados en ella.
- **En el plugin**: `--ui-focus` cumple 3:1 con el esquema por omisión (hoy
  `primary` da 2,64) y con uno de acento claro.
- **Por componente**: las pruebas de clases que ya existen, actualizadas; una
  prueba de que el ítem de menú **no** pinta el acento al pasar por encima.
- **En el escritorio**: `place_applet` con el margen de sombra, los cuatro lados y
  los bordes; «nunca tapa el panel» contra el canto visible; apertura sin botón.

## 9. Orden de implementación y qué revisar con el usuario

1. **Tokens** (`src/styles/tokens.css`, la exportación en `package.json`, la
   guardia) y **`--ui-focus` en el plugin**. Una minor de cada uno.
2. **Banco de estados**: una página de la librería que dibuje cada componente en
   sus estados, claro y oscuro, con el esquema por omisión y uno de acento claro
   (el stub de `invoke` de [[banco-de-widgets-sin-tauri]]). Es la vista
   «antes/después» del issue.
3. **Primera tanda**: `DropdownMenu*` → `TextInput` → `SearchField` →
   `ActionButton` → `Tooltip*` → `ListCard` → `TabBar`/`TabItem` →
   `SideBar`/`SideButton`/`SideGroup`. Una minor.
4. **Revisión con el usuario — punto de corte.** Con el banco abierto y
   `vasak-desktop` en una rama con el menú nuevo:
   - el hover neutro en lugar del de acento, visto en el menú contextual y en la
     barra lateral de Configuración;
   - el radio a 10 y a 6 (¿se ve Once UI con el radio de fábrica?);
   - la densidad (32 de control, 40 de fila de menú);
   - el menú anclado en los cuatro lados;
   - las decisiones de abajo.
5. **El menú** (`desktop#142`): fila en `APPLETS`, margen de sombra, vista nueva
   armada con la primera tanda.
6. **El resto de la librería** por grupos (§4.2 → §4.6), una minor por grupo.
7. **Las aplicaciones**, por componente y cruzando repositorios (decisión 5):
   subir la librería, importar `tokens.css`, sacar lo dibujado a mano.

### Decisiones que necesitan al usuario

1. **¿Se va el widget del clima del menú?** La propuesta lo saca: un desplegable
   es para abrir cosas. Sigue en el escritorio y en el panel.
2. **¿El contenido del menú se da vuelta con el panel abajo?** La propuesta dice
   que no (búsqueda siempre arriba); la alternativa es la búsqueda contra el panel.
3. **Desenfoque detrás del menú y los applets.** Sin desenfoque (superficie opaca,
   la propuesta) o con el complemento `blur` de Wayfire por espacio de nombres de
   capa, que es la única forma de que se vea el escritorio desenfocado. El
   `backdrop-blur` del WebView no puede.
4. **Lo elegido en una lista, ¿gris o acento?** Once UI marca la opción elegida en
   gris (`neutral-alpha-medium`); la propuesta hace lo mismo y deja el acento en el
   icono del elemento activo de la barra lateral. La alternativa es el velo de
   acento (`ui-selected-accent`) en todo lo elegido.
5. **El contorno de los campos.** Once UI los dibuja con borde de poco contraste;
   el taller decidió 3:1 (`ui-border-strong`, WCAG 1.4.11). La propuesta mantiene
   el 3:1 en campos, selects y vía del interruptor, y usa bordes finos sólo en
   contenedores.
6. **`ActionButton` `secondary`.** En Once UI «secondary» es el botón neutro con
   borde; acá es el color secundario del esquema. La propuesta suma `outline` y
   `ghost` (minor) y deja `secondary` como está; cambiarle el significado sería una
   mayor de la librería.

## 10. Decisiones del usuario (30/09/2026)

1. **El menú mantiene el formato de hoy**: la misma distribución, el mismo tamaño (900×620) y el mismo contenido, clima incluido. Lo que cambia es dónde se abre (anclado a su botón) y el estilo visual. La propuesta de 400×560 en una columna del §7 **no se hace**.
2. **Con el panel abajo el contenido no se da vuelta**: la búsqueda siempre arriba; sólo cambian el borde del que cuelga y la dirección de la animación.
3. ~~**Superficie opaca**, sin desenfoque.~~ Sale el `backdrop-blur` de
   `AppletPopover`. **Corregida el 02/10/2026** (§13): la superficie es
   translúcida (`ui-shell`) y el desenfoque lo pone Wayfire.
4. **Lo elegido en una lista o barra lateral se marca con el color de acento** (`ui-selected-accent`), no en gris. Reemplaza la propuesta del §9.4.
5. **Los campos mantienen el borde de 3:1.**
6. **`ActionButton` `secondary` se redefine** al estilo contorno de Once UI: es una versión **mayor** de `vue-libvasak` (2.0.0). `ghost` se suma como variante nueva.
7. **Se agranda la superficie de los applets 24 px por lado** para la sombra, descontados del margen hacia el panel.
8. **Alcance, en palabras del usuario:** «no quiero que lo redefinas todo: quiero que mantenga el formato actual pero que los componentes (que deben venir de la lib de componentes) tengan los lineamientos de Once UI». O sea: **ninguna pantalla cambia de distribución, tamaño ni contenido**. Lo que cambia es el aspecto de los componentes —radios, bordes, sombras, espaciado interno, estados, tiempos—, y lo que una aplicación dibuja a mano pasa a ser el componente de la librería. Todo lo de esta especificación que proponga reordenar una pantalla (como el menú de 400×560 del §7) queda fuera.
9. **Colores y iconos, en palabras del usuario:** «los colores deben salir del scheme definido y los iconos deben salir del sistema». Ningún color literal en tokens, componentes ni sombras: todo se deriva de las variables del esquema. Ningún icono embebido (SVG, fuente de iconos, imagen propia): todos del tema de iconos del sistema, por `ThemeIcon`/vicons. La guardia de tokens comprueba las dos cosas.
10. **Todo 100 % responsive**, en palabras del usuario: «todos los componentes tienen que ser 100% responsive». Cada componente se adapta al espacio que le dan —del applet más angosto a una ventana maximizada— sin desbordar ni perder información. En WebKitGTK no avisan ni `matchMedia` ni `resize`: la adaptación va con container queries (`@container`) o `ResizeObserver` sobre la raíz del componente, nunca con breakpoints de viewport. El banco de estados muestra cada componente a varios anchos, y una prueba falla si aparece un breakpoint de viewport.
11. **Radios, en palabras del usuario:** «los border radius también se definen por las variables del sistema». La escala `rounded-corner-*` se deriva con `calc()` de la variable de radio que escribe config-manager; ningún radio fijo en px ni `rounded-md`/`rounded-lg` de Tailwind. La guardia lo comprueba.

## 11. Requisitos que se sumaron al implementar (30/09/2026)

Pedidos del usuario durante la primera implementación. Mandan sobre lo de
arriba igual que el §10.

1. **Los colores salen siempre del esquema.** Ningún color fijo en tokens,
   componentes ni sombras: los bordes, los velos, la superficie flotante, el
   respaldo de `--ui-focus` y **la tinta de las sombras** son `color-mix` sobre
   las `--use-*` del esquema. La tinta de la sombra es el texto principal en
   claro y el borde del esquema en oscuro (`--use-shadow-ink`), en lugar del
   negro de Once UI. La guardia (`tests/tokens-exist.test.ts`) falla con un
   hexadecimal, un `rgb()`/`hsl()`/`oklch()` o un color de la paleta de Tailwind
   en `src/`.
2. **Los iconos salen siempre del tema del sistema** (`ThemeIcon`): ni SVG en
   línea, ni imágenes propias, ni fuentes de iconos. Si un nombre no es del
   estándar, se usa el de freedesktop (la rueda de carga es `process-working`).
   Por eso `ActionButton` gana `icon` (nombre del tema) y `iconSrc` queda
   obsoleto; y la propiedad `icon` con ruta resuelta de `SliderControl`,
   `ToggleControl`, `DeviceCard` y `TrayIconButton` se va en la 2.0.0, como
   avisaba.
3. **Los radios salen del radio del usuario.** Toda la escala
   `rounded-corner-*` se deriva con `calc()` de `--corner-radius` —también
   `corner-full`, que es `r × 999`: con radio 0 hasta el interruptor es recto—.
   La guardia prohíbe `rounded-md`, `rounded-full`, `rounded` a secas, radios
   arbitrarios y `border-radius` escrito a mano.
4. **Todo componente es adaptable.** Se acomoda al lugar que le dan, del
   applet más angosto a una ventana maximizada, sin desbordar, sin
   desplazamiento horizontal y sin cortar texto de forma que se pierda
   información:
   - **Nada de puntos de corte de la pantalla** (`sm:`, `md:`…, ni `matchMedia`
     con un ancho): el componente no sabe en qué ventana está, y en WebKitGTK
     ni `matchMedia` ni `resize` avisan. Lo que cambia con el ancho va con
     consultas de contenedor (`@container` / `@sm:`), como el pie y el
     encabezado del diálogo, o con un `ResizeObserver` sobre el contenedor del
     componente, como la barra lateral, que ahora se pliega por el lugar que le
     dan y no por la pantalla.
   - `min-w-0` en lo que vive dentro de un `flex`; `truncate` sólo donde el
     texto entero sigue disponible (en el `title` o en un globo), y si no, el
     texto se parte (un ítem de menú, la etiqueta de un botón, el nombre
     desplegado de una pestaña).
   - Lo que flota nunca es más ancho que la ventana menos 16 px (menú, globo,
     lista de `SearchSelect`, aviso transitorio) y se mantiene dentro de ella.
   - El diálogo deja 16 px de aire contra el borde y desplaza adentro si no
     entra de alto.
   - Objetivos de 32 px como mínimo aunque el dibujo sea más chico: el
     `ActionButton` `sm` se ve de 24 y se apunta en 32.
   - El banco de estados (`bun run bench`) dibuja cada componente a 240, 360,
     600 y 1200 px; lo que se dibuja contra la ventana —diálogo, avisos, el
     marco— se captura con la ventana de cada ancho.

## 12. Lo que la implementación decidió distinto, y por qué

- **El respaldo de `--ui-focus` es 40 % de primario, no 60 %.** Con un acento
  claro (`#e5c890`) el 60 % da 2,50:1 contra el fondo; el 40 % da 3,44:1. Con el
  esquema de fábrica, 4,77:1. Lo mide `tests/surface-contrast.test.ts`. El
  cálculo de verdad sigue siendo del config-manager.
- **Las alturas que cambiaban la distribución se quedaron** (decisión 8). La
  fila de `SideButton` sigue en 48, la barra de pestañas no gana el carril con
  borde y relleno del control segmentado, `DeviceCard` conserva su `px-6 py-3
  mb-4`, `ConfigSection` su `p-4`, `ProgressBar` su alto y `ToggleControl` sus
  70 px. Los campos pasan de 34 a 32 y los botones `md` de 28 a 32, que es el
  ajuste de densidad de Once UI y no mueve ninguna pantalla.
- **Lo elegido lleva `ui-selected-accent`** en pestañas, barra lateral, opción
  de `SearchSelect` y fila de interruptor encendida (decisión 4); `ui-selected`
  (gris) queda declarado para lo que se recorre y no se elige.
- **`DropdownMenuItem` no suma `prefix`, `description`, `shortcut` ni
  `danger`** en esta etapa: el menú del escritorio conserva su formato
  (decisión 1) y no los necesita. Quedan para cuando alguien los pida.
- **`SearchField` no suma la variante `ghost`**, por lo mismo.
- **`tx-muted` en claro no llega a 4,5:1 con el esquema de fábrica**, ni sobre
  el fondo pelado: `vasak-default.json` dice `#6c6f85` (4,37:1), aunque el piso
  de `main.css` ya lo había corregido a `#555869`. No es de los velos nuevos, es
  del esquema; la prueba lo deja marcado como `failing` para que se ponga roja
  sola cuando el esquema se corrija.

## 13. Corrección del usuario (02/10/2026): el escritorio es translúcido

Con los releases de la migración (`vasak-desktop` 1.21–1.23) el panel, el menú,
los applets, las notificaciones y los widgets quedaron **opacos**. Sacar el
`backdrop-blur` del HTML estuvo bien: el desenfoque lo pone Wayfire. Lo que
estuvo mal fue dejarlos opacos, porque una superficie opaca tapa ese
desenfoque. La decisión 3 del §10 queda corregida así:

- **Lo que es superficie del escritorio va en `ui-shell`**, translúcida y sin
  `backdrop-blur`: el panel, el menú y los applets (`AppletPopover`), el centro
  de control, el OSD, el diálogo de sesión, el menú de Connect y el marco de
  los widgets.
- **Lo que flota dentro de una ventana sigue en `ui-float`, opaco**:
  `DropdownMenuContent`, `PopoverContent`, `TooltipContent`, `DialogContent`,
  `ToastArea`, la lista de `SearchSelect` y `BarSearch`, el globo de
  `TabItem` y de `TrayIconButton`, `DropZone`. Detrás tienen la propia página,
  no el escritorio, y Wayfire no la desenfoca.
- **El 85 % es por el contraste**: al 80 % de antes, el texto principal sobre
  un fondo de pantalla negro con el tema claro daba 4,42:1. Al 85 %, 5,01:1.
- **Un hueco medido y atado**: el anillo de foco **de respaldo** con el acento
  claro de prueba, en claro y sobre negro puro, da 2,44:1 (no hay opacidad
  translúcida que lo lleve a 3:1; al 95 % da 3,08). Ya llegaba justo sobre el
  fondo pelado (3,44:1). Se arregla en el config-manager, que calcula
  `--ui-focus` contra el esquema (`config-manager#31`); la prueba lo deja atado
  a 2,4 para que no empeore.


## 14. La 2.4.0 (02/10/2026): lo que pidieron las aplicaciones, y la sesión

Los pedidos que dejaron las aplicaciones al adoptar la 2.2 y la 2.3 (la lista,
con quién pidió cada cosa, está en `.worktrees/libvasak-24-pending.md` del
taller) y las piezas genéricas del inicio de sesión y del bloqueo de
vasak-session-manager. Es una minor: lo que ya había dibuja lo mismo si no se
pide lo nuevo, salvo los tres arreglos de abajo.

### 14.1 Lo que se suma a la forma

- **Los roles `display`** (`text-display-m`, 48 px, y `text-display-l`, 60 px),
  en peso liviano: los números grandes de Once UI, para el reloj. `display-l`
  mide lo mismo que el `text-6xl` suelto del inicio de sesión, así que la
  pantalla no cambia de formato.
- **El halo del texto** (`text-shadow-legible`): el fondo de la ventana del
  esquema al 80 % y al 60 % alrededor de cada letra, para un texto puesto
  directo sobre un fondo de pantalla. Reemplaza al `drop-shadow-md` (negro
  fijo); la guardia prohíbe ahora las sombras de texto y de dibujo de
  Tailwind.
- **El velo de medios en degradado** (`overlay-fade-up`, `overlay-fade-down`):
  `ui-overlay` pleno en la mitad de los controles y transparente en la otra.
  El texto va en la mitad plena, que es el velo que ya llega a 4,5:1 sobre
  negro y blanco.
- **El desenfoque de las pantallas de sesión** (`shell-blur`, junto con
  `bg-ui-shell`): decisión del usuario del 02/10/2026. El inicio de sesión y el
  bloqueo no tienen a Wayfire detrás, así que el desenfoque lo dibuja el
  WebView. Es la **segunda excepción** a «sin `backdrop-blur`», junto con los
  widgets del escritorio; en todo lo demás sigue prohibido, y la guardia de
  cada aplicación tiene que prohibir también `shell-blur` salvo en
  vasak-session-manager. No pone color: el contraste es el de `ui-shell`.
- **La guardia acepta el color relativo sobre una variable del esquema**
  (`oklch(from var(--use-primary) l c h / 50%)`): deriva del esquema igual que
  un `color-mix`. Lo que va `from` un literal sigue siendo un literal.

### 14.2 Los componentes nuevos

| componente | de dónde | forma |
|---|---|---|
| `PasswordField` | inicio de sesión y bloqueo (y lo piden polkit, keyring, el wifi de Configuración, el instalador) | el `TextInput` del sistema; el ojo es un botón sin borde de 32 con `aria-pressed` que no roba el foco; Bloq Mayús va debajo con el icono de advertencia y el texto principal, atado por `aria-describedby`; vaciada, vuelve a ocultarse |
| `ClockDisplay` | `GreeterClock` | `display-l` liviano, cifras tabulares, la fecha con sólo la primera letra en mayúscula; se alinea al minuto; se achica por contenedor |
| `PowerActions` | `PowerMenu` del inicio de sesión (glifos ☾ ↻ ⏻) y el diálogo de sesión del escritorio (círculos de 80) | `icons`: botones de icono de 40; `tiles`: `IconTile` `2xl` redondo con el nombre debajo. Iconos de freedesktop (`system-suspend`, `system-reboot`, `system-shutdown`…) |
| `TextContextMenu` | las dos copias de Configuración y del gestor de archivos | no dibuja: abre el menú del sistema con `show` (del complemento, por propiedad, para no depender de él). Cortar borra el tramo que se copió |

Lo que **no** sube, porque es de esa aplicación: el reparto del inicio de sesión
entre monitores, el fondo en movimiento, los avisos del bloqueo (qué cuenta de
la sesión se muestra), el teclado de greetd y el reproductor del bloqueo. El
selector de usuario es `OptionGroup` con `avatar`; el de sesión y el de idioma,
`SearchSelect` sin búsqueda: no hacía falta un componente propio.

### 14.3 Lo que se suma a componentes que ya estaban

- `Badge`: `counter` (no se parte ni se topa al contenedor, al menos tan ancho
  como alto, cifras tabulares), `max` («99+») y `title`.
- `AppBar`: el centro mide los costados con un `ResizeObserver`: centrado con
  un tope de ancho mientras entra, en la zona libre cuando no, y en un renglón
  propio debajo cuando ni ahí quedan 96 px (la barra en «una columna por
  vez»).
- `IdentityBlock`: la ranura `details`, `as="h1"`, `wrap` y `stack`
  (`always`, o `narrow` por contenedor desde 20 rem).
- `SideBar`: `autoCollapse` (en `false`, sólo se pliega a mano) y `fill` (el
  ancho del contenedor).
- `SearchField`: `autocomplete` y `spellcheck` al `input`. `TextInput`:
  `spellcheck` y `autocapitalize`.
- `ConfigSection`: `title` opcional; sin nada arriba, no hay cabecera.
- `SelectField`: `id` y `disabled` declarados.
- `EmptyState`: `muted`, la línea atenuada sin peso.
- `DialogContent`: `size="wide"` (576 px).
- `ToastArea`: `top-right` y `top-center`, entrando desde arriba y con el más
  nuevo pegado al borde.
- `Avatar`: `ml` (40) y `2xl` (96). `IconTile`: `xl` (64) y `2xl` (80), con
  la esquina `xl` del anidado.
- `DropdownMenuItem`: `checked="mixed"`, con `aria-checked="mixed"` y una
  raya dibujada (no hay nombre del estándar para la casilla indeterminada).
- `OptionGroup`: `avatar` en una opción, para elegir una cuenta.
- `SearchSelect`: `searchable` en `false`, la lista sola.

### 14.4 Lo que cambia sin pedirlo

- **`SearchField`: la cruz también emite `search('')`**, después de `clear`.
  Lo que escuchaba sólo `search` no se enteraba de que se vació (store#36).
  Quien escuche los dos y haga lo mismo con ambos recibe dos avisos seguidos.
- **`DialogContent size="lg"` dibuja el velo**, como `md` y `sm`. Sólo `full`
  queda sin velo.
- **`SettingRow` apila por debajo de 256 px (`@3xs`) y no de 320 (`@xs`)**: el
  centro de control del escritorio mide 350 con su relleno y la fila quedaba
  apilada. A 256, un interruptor de 40 deja 200 px de texto.

### 14.5 Lo que se revisó y no era de la librería

- **El menú alineado al final, cortado a 240 px** (file-manager#107): con la
  ventana de verdad en 240 (CDP, `Emulation.setDeviceMetricsOverride`) el
  panel queda adentro, a 8 px del borde. Lo cortado era la captura: Chrome sin
  pantalla con `--window-size=240` maqueta a ~500 y recorta. Queda atado en
  `tests/library-extensions-24.test.ts`.
- **vue-tsc 3.3.12 y «Cannot find name 'id'»** en el `#default="{ id }"` de
  `FormGroup` (store): es de vue-tsc, no de la librería. Lo dispara un `$`
  seguido de letras dentro de un atributo del mismo elemento
  (`placeholder="https://…/$arch/$repo"`), estático o como expresión entre
  comillas: sin el `$` pasa limpio, y la librería misma pasa con la 3.3.12.
  La salida en la aplicación es llevar el texto a una constante del
  `<script setup>` (`:placeholder="serverPlaceholder"`), que pasa con la
  3.3.12, y sacar el pin.

## 15. La 2.5.0 (02/10/2026): el reproductor desplegable

Dos piezas que pidió el reproductor del panel del escritorio
(vasak-desktop#131), que con la 2.4.0 quedaba armado con piezas que no eran
para eso. Es una minor: no cambia nada de lo que ya había.

- **`Chip`**: la pastilla chica con icono del tema, `caption` atenuada
  («VIA», como en el video de referencia) y el dato. `bg-ui-surface/70` como
  los bloques internos, canto `ui-line-weak`, `rounded-corner-full`, 32 px de
  alto. Con `interactive` es un `<button>` con el anillo de foco; sin él, un
  `<span>` que no se pinta al pasar. El dato se corta en un renglón y queda
  entero en el `title`. Reemplaza al `ActionButton secondary` que se partía en
  dos renglones con un nombre de dispositivo largo, y a la `Badge` sin icono.
- **`PageDots`**: un punto por página, el activo estirado en `bg-primary` y los
  demás en `ui-border-strong` (3:1 contra el fondo). Botones de 32 × 32 con
  nombre (`labels`, o «N de M»), `aria-current` en el activo, un solo Tab y las
  flechas, Inicio y Fin. Con una página o ninguna no dibuja nada. Con
  `prefers-reduced-motion`, el cambio de ancho no se anima.


- **2.10.1, `NowPlayingCard` angosta**: la tarjeta mira su ancho
  (`@container`). Desde `@xs` (20 rem) es la de siempre; por debajo, el disco
  arriba en `w-20` y el texto debajo, centrado y estirado al ancho para que
  `truncate` corte con puntos suspensivos (centrado y del ancho del texto, un
  renglón largo se salía por los dos lados). Los chips de `details` se
  reparten centrados.

## 16. La 2.6.0 (02/10/2026): la órbita del dispositivo conectado

`DeviceOrbit` es la vista radial de vasak-desktop#132, imitando el video de
referencia (§2 de `.worktrees/video-reference.md`): el dispositivo o la red en
el centro y sus datos alrededor. Es la otra forma de `DeviceCard`; no la
reemplaza.

- **Centro:** círculo `bg-primary` con `text-tx-on-primary` y `shadow-surface-m`,
  con un halo `bg-primary/20` 12 px más ancho. Mide una sexta parte del lado
  menor de la caja, entre 88 y 176 px de diámetro. Sin nada conectado, el
  círculo es `bg-ui-surface/50` con canto `ui-line` y el halo punteado.
- **Satélites:** pastillas `rounded-corner-l`, canto `ui-line`,
  `bg-ui-surface/70`, icono de 20 a la izquierda, el valor en `label-m` 600 y
  la etiqueta debajo en `label-xs` `tx-muted`; hasta 192 px de ancho, con el
  valor truncado y entero en `title`. La acción lleva el canto `primary` y los
  estados de siempre (`ui-hover`, `ui-pressed`, foco `ui-focus`). El tono
  `accent` pinta el valor de `primary` (la batería baja).
- **Reparto:** parejo desde arriba en el sentido del reloj, sobre una elipse
  que se abre hasta el borde y hasta 1,6 veces más ancha que alta.
- **Líneas:** en codo —horizontal y después vertical—, del canto del círculo al
  canto de la pastilla, de 1 px en `ui-line`. Son SVG por ser geometría de
  datos: la única excepción de la guardia (§8).
- **Fondo:** dos anillos de `ui-line-weak` a 2,1 y 3,1 veces el radio.
- **Angosto:** si un satélite de costado pisaría el círculo, apila —el círculo
  de 120 arriba y un satélite por renglón, a lo ancho—, sin líneas ni anillos.
  Lo decide un `ResizeObserver` con el tope de la pastilla, no con lo que mide
  cada una, para que al volver a crecer vuelva a la órbita.
- **Movimiento:** al cambiar `orbitKey`, 200 ms con `ease-ui-out`: los viejos
  se contraen al centro con media escala y salen los nuevos desde ahí. El halo
  late en 1,6 s mientras `pulsing`. Con movimiento reducido, sólo opacidad.

## 17. La 2.7.0: el carrusel de fondos (vasak-desktop#133)

- **`WallpaperThumbnail`**: la miniatura de un fondo, imagen o video. Quieta
  siempre, salvo con `playing`: entonces monta un `<video>` mudo y en bucle, y
  al dejar de pedirlo **lo saca del DOM** (un video pausado sigue con su
  decodificador abierto). ▶ arriba a la derecha sobre `ui-overlay`; el fondo
  aplicado, con la verificación en `primary` abajo a la izquierda —las dos
  esquinas que una tarjeta inclinada a la derecha no recorta—. Apaisada 16:9
  con canto `ui-line` y radio `corner-m`, o `fill` dentro de otra caja.
- **`WallpaperCarousel`**: la fila de tarjetas en paralelogramo (sesgo de 12°,
  la imagen enderezada adentro), solapadas un 38 %, la del centro a 1,1 con el
  borde en `primary` y las demás más chicas y atenuadas; sombra `surface-l`
  porque se apoyan sobre un fondo de pantalla cualquiera. El tamaño sale del
  contenedor (`38cqi`, entre 7 y 20 rem). Es un `listbox` con
  `aria-activedescendant`; flechas, rueda y arrastre, sin dar la vuelta; Enter
  o clic aplica, Escape cierra; `moreLabel` suma la tarjeta del final.
  **Un solo video a la vez**: lo decide `previewId` (el del puntero si es
  video, si no el enfocado) y lo avisa `preview`.
- El movimiento es `transition-transform` de 300 ms con `ease-ui-out`; con
  `prefers-reduced-motion`, sin transición.

## 18. La 2.8.0 (02/10/2026): los gráficos del tiempo de pantalla

Lo que pidió el tablero de tiempo de pantalla del escritorio (vasak-desktop#150,
la referencia del video, segundo 14): la semana en barras con hoy en el acento,
el mes en un mapa de calor y la lista de aplicaciones con una barra por fila.
Es una minor.

### 18.1 La tinta de los datos: `ui-data`

Un gráfico que hace falta para entender el dato pide 3:1 (WCAG 1.4.11), y el
primario a secas no llega en claro: el de fábrica da 2,13:1 sobre un panel y
1,87:1 en el peor caso (un panel sobre el escritorio translúcido con un fondo
blanco); un acento claro, 1,01:1. Mezclarlo con el texto, como el anillo de
foco, llega recién con un 25 % de acento, y ahí el color de la marca ya no se
reconoce.

`ui-data` topa la **luminosidad** OKLCH del primario y deja el tono y la
saturación: `oklch(from var(--use-primary) min(l, 0.52) c h)` en claro (el mismo
rosa, más hondo: 3,69:1 el de fábrica y 3,48:1 el acento claro, en el peor
caso) y un piso de 0,7 en oscuro, que con los esquemas del sistema no cambia
nada. Lo mide `tests/surface-contrast.test.ts` contra el fondo, un panel,
`ui-shell` sobre negro y sobre blanco, un panel encima de eso y la vía de una
barra. Como el foco, el config-manager puede escribir el suyo.

### 18.2 Los componentes nuevos

| componente | forma |
|---|---|
| `BarChart` | cajas con el alto en porcentaje y `rounded-corner-s`, hasta 32 px de ancho cada una; la de ahora en `ui-data` con el nombre en `tx-main` y peso 600, el resto en `tx-muted` (las dos a 3:1); un valor chico se dibuja con el 4 % para que se vea; nombres cortos por debajo de 16 rem |
| `CalendarHeatmap` | siete columnas de cuadros `aspect-square` con `rounded-corner-xs` y `gap-1`; sin valor la vía `ui-line-weak`, con valor `ui-data` al 35, 60, 80 y 100 %; el título es el mes de `Intl` con la primera letra en mayúscula; el elegido, un contorno de 2 px del texto principal separado del cuadro |

Los dos son cajas y no SVG: el radio sale de la escala, el color de los tokens
y el tamaño del contenedor, y la guardia de iconos no necesita una excepción.
El color no es lo único que dice el dato: cada barra y cada día llevan su
valor escrito en el nombre accesible y en el globo nativo.

### 18.3 Lo que se suma a `ListRow`

- `bar`: la barra proporcional. Con 20 rem o más, el título en un tercio y la
  barra en el resto del renglón, como en la referencia; por debajo, la barra
  baja debajo del título. La barra es decorativa: el dato escrito va en
  `meta`.
- `hoverable`: el velo `ui-hover` en una fila sin rol, para seguir con la vista
  la fila que se apunta.

## 19. La 2.9.0 (02/10/2026): el tablero de fecha

Las piezas del tablero que se abre al tocar el reloj del panel
(vasak-desktop#130, §3 de la referencia del video), que comparten los widgets
de calendario (#112) y `vasak-calendar`.

| componente | forma |
|---|---|
| `MonthCalendar` | el mes y el año en `label-s` en mayúsculas entre dos botones `ghost` chicos; los días de la semana en `tx-muted`; casillas de 32 (`rounded-corner-m`, la zona de toque mínima); **hoy** `bg-primary` + `tx-on-primary`; el **elegido** `border-primary`; los **días con eventos**, un punto de 4 px en `secondary` (sobre hoy, en `tx-on-primary`); los de otro mes en `tx-muted`, sin opacidad. Seis semanas siempre. `role="grid"` con un solo Tab |
| `EventList` | tarjeta `rounded-corner-l`, canto `ui-line`, `ui-surface/70`; barra de 4 px a la izquierda en el color del calendario o `secondary`; en curso, `border-primary`. Columnas de al menos 12 rem que bajan de renglón |
| `HourlyForecast` | cada hora en una columna de 48: hora en `label-xs` `tx-muted`, icono del tema de 20, temperatura en `tx-main`; la de ahora, píldora `bg-primary` con `shadow-surface-s`. Arco desde los 20 rem del contenedor (`@xs:`); debajo, tira |
| `ProgressRing` | degradado cónico de `--use-primary` sobre el velo de `ui-line`, recortado a un aro de 4 px por una máscara radial; el valor en `label-xs` 600 adentro —con `unit`, la unidad en otro renglón, atenuada—, el nombre debajo en `tx-muted` |

**Por qué el anillo es CSS y no SVG.** La librería no dibuja nada propio en SVG
—la guardia lo prohíbe en toda la librería, sin excepciones nombradas— y un aro
es exactamente lo que da un `conic-gradient` con una máscara. Los dos colores
salen del esquema. Y va en **utilidades** (`bg-[conic-gradient(…)]`,
`[mask:…]`), no en un `<style>` del componente: las aplicaciones no cargan la
hoja de la librería (`style.css`), sólo toman sus clases con el `@source` del
dist, así que un estilo propio del componente no les llegaría.

**El color de un calendario no es un color de la interfaz.** Lo eligió la
persona en su servidor y es lo que distingue un calendario de otro, como la
foto de un contacto. Por eso no sale del esquema; pero lo escribió el servidor,
así que sólo un hexadecimal llega al `style` (`safeCalendarColor`), y sin uno
válido la barra va en `secondary`.

**Los días completos van en UTC.** `ListOccurrences` de vasak-accounts manda un
día completo a medianoche UTC con `all_day`. Leído en la hora local, al oeste
de Greenwich caía el día anterior; `entryDays` toma la fecha civil de UTC, y un
`AAAA-MM-DD` suelto tal cual.

## 20. La 2.11.0 (03/10/2026): el panel en píldoras

El panel del escritorio deja de ser una franja continua y pasa a píldoras
sueltas sobre el fondo, como el video de referencia (vasak-desktop#151). Es una
minor: no cambia nada de lo que ya había.

- **`PanelPill`**: `bg-ui-shell` (la ventana al 85 %) y **nunca**
  `backdrop-blur`, porque va sobre el escritorio y el desenfoque lo pone
  Wayfire (§13). Canto `ui-line`, `rounded-corner-full`, 32 px de alto. Con
  `active`, `bg-primary` y `tx-on-primary` (el estado «conectado» o «ahora»).
  El velo de pasar (`ui-hover`), de apretar (`ui-pressed`) y de abierto
  (`ui-selected-accent`, con `expanded`: lo elegido va con el velo del acento) va en un `::before` sobre la superficie, así
  que la píldora no se vuelve opaca al pasar. El `label` en `text-label-s` y el
  `caption` en `text-label-xs` atenuado entran en dos renglones dentro de los
  32 px; se cortan con puntos suspensivos y llevan cifras tabulares. Botón con
  `interactive` (anillo `ui-focus` afuera), `div` quieto sin él.
- **`WorkspaceSwitcher`**: una `PanelPill` quieta y `flush` con un botón de
  32 de ancho por espacio y un círculo de 24 adentro: el actual en
  `bg-primary`, los demás en `tx-muted` con el velo al pasar. `aria-current` en
  el actual, nombre por botón (`labels`, o «Workspace N» del catálogo), un solo
  Tab y las flechas para mover el foco; cambiar de espacio pide Enter, Espacio o
  el clic, porque mueve todas las ventanas.
