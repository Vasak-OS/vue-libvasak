# Vue libvasak

Components for Applications

---

## Tecnología

Uso: generate-readme-badges.sh <tipo>

Tipos válidos:
  tauri-vue       Apps Tauri + Vue 3 (Rust, Tauri, Vue 3, TypeScript)
  rust-service    Servicios Rust systemd/D-Bus (Rust, systemd, D-Bus)
  cpp-plugin      Plugins C++ Wayfire (C++, Meson, Wayfire)
  meson-c         Módulos C WirePlumber (C, Meson, WirePlumber)
  meson-cpp       Plugins C++ genéricos Meson (C++, Meson)

Ejemplos:
  ./generate-readme-badges.sh tauri-vue
  ./generate-readme-badges.sh rust-service > tech-badges.md

## Estado

[![CI](https://github.com/Vasak-OS/vue-libvasak/actions/workflows/ci.yml/badge.svg)](https://github.com/Vasak-OS/vue-libvasak/actions/workflows/ci.yml)
[![Versión](https://img.shields.io/github/v/release/Vasak-OS/vue-libvasak?style=flat&label=Versi%C3%B3n)](https://github.com/Vasak-OS/vue-libvasak/releases)
[![Licencia](https://img.shields.io/github/license/Vasak-OS/vue-libvasak?style=flat)](LICENSE)
[![Cobertura](https://sonarcloud.io/api/project_badges/measure?project=Vasak-OS_vue-libvasak&metric=coverage&style=flat)](https://sonarcloud.io/summary/new_code?id=Vasak-OS_vue-libvasak)
[![Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=Vasak-OS_vue-libvasak&metric=alert_status&style=flat)](https://sonarcloud.io/summary/new_code?id=Vasak-OS_vue-libvasak)
[![Tamaño repo](https://img.shields.io/github/repo-size/Vasak-OS/vue-libvasak?style=flat)](https://github.com/Vasak-OS/vue-libvasak)

---

## Descripción

Components for Applications

**Para el usuario:** Components for Applications

**Integración VasakOS:** Integra con el ecosistema VasakOS vía D-Bus y configuración compartida.

---

## Arquitectura (diagramas)

> Copia y pega la plantilla que necesites, descomenta y adapta.

### Flujo de datos

```mermaid
<!--
graph TD
    A[Entrada: Teclado / Ratón / D-Bus / Sistema] --> B[Procesamiento: Core Rust + Tauri Commands]
    B --> C[Salida: UI actualizada / Acciones del sistema]
    style A fill:#e1f5fe
    style C fill:#e8f5e9
-->
```

### Componentes internos

```mermaid
<!--
flowchart LR
    subgraph App[Vue libvasak]
        UI[Frontend Vue 3 + vue-libvasak]
        Core[Core Rust: lógica principal]
        IPC[Tauri Commands / Eventos]
        System[Systemd / D-Bus / PipeWire / Wayland]
    end
    UI --> IPC
    IPC --> Core
    Core --> DBus[(D-Bus / zbus)]
    Core --> System
    style UI fill:#f3e5f5
    style Core fill:#e3f2fd
    style DBus fill:#fff3e0
    style System fill:#fce4ec
-->
```

### Integración en el sistema VasakOS

```mermaid
<!--
C4Context
    title Vue libvasak en VasakOS
    Person(usuario, "Usuario", "Persona que usa el sistema")
    System_Boundary(c1, "VasakOS") {
        System(app, "Vue libvasak", "Components for Applications")
        System_Ext(settings, "vasak-settings", "Configuración central")
        System_Ext(keyring, "vasak-keyring", "Secrets y claves")
        System_Ext(accounts, "vasak-accounts", "Cuentas e identidad")
        System_Ext(permissions, "vasak-permissions", "Permisos y portales")
    }
    System_Ext(systemd, "systemd", "Gestión de servicios")
    System_Ext(dbus, "D-Bus", "Bus de mensajes del sistema")
    System_Ext(wayland, "Wayland / Wayfire", "Compositor")
    System_Ext(pipewire, "PipeWire", "Multimedia")
    Rel(usuario, app, "Usa")
    Rel(app, settings, "Lee/escribe config")
    Rel(app, keyring, "Guarda/lee secrets")
    Rel(app, accounts, "Identidad de cuenta")
    Rel(app, permissions, "Solicita permisos")
    Rel(app, systemd, "Activación / sockets")
    Rel(app, dbus, "Expone / consume interfaces")
    Rel(app, wayland, "Superficies / protocolos")
    Rel(app, pipewire, "Streams de audio/video")
-->
```

---

## Instalación

### Arch Linux (repo oficial)

```bash
pacman -S vasak-vue-libvasak
```

### Debian / Ubuntu (.deb)

```bash
wget https://github.com/Vasak-OS/vue-libvasak/releases/download/v{{VERSION}}/vasak-vue-libvasak_{{VERSION}}_amd64.deb
sudo apt install ./vasak-vue-libvasak_{{VERSION}}_amd64.deb
```

### Desde fuente

```bash
git clone https://github.com/Vasak-OS/vue-libvasak.git
cd vue-libvasak

# Instalar dependencias
bun install

# Build biblioteca
bun run build

# Tests
bun test

# Publicar a npm
npm publish
```

### Flatpak / AppImage

> *Placeholder: añadir cuando exista paquete Flatpak o AppImage oficial.*

## Uso desde npm

Publicado como `@vasakgroup/vue-libvasak` en npm.

### Instalación

```bash
# Con bun (recomendado)
bun add @vasakgroup/vue-libvasak

# Con npm
npm install @vasakgroup/vue-libvasak

# Con pnpm
pnpm add @vasakgroup/vue-libvasak
```

### Uso básico

```typescript
import { Button, Card, useTheme, useConfig } from '@vasakgroup/vue-libvasak';
import '@vasakgroup/vue-libvasak/style.css'; // Estilos base

// Usar componentes
const app = createApp(App);
app.use(Button);
app.use(Card);
// ... registra los componentes que necesites

// Usar composables
const { theme, toggleTheme } = useTheme();
const { config, updateConfig } = useConfig();
```

### Documentación completa

- **Guía de componentes:** [docs.vasakos.org/vue-libvasak/components](https://docs.vasakos.org/vue-libvasak/components)
- **Composables:** [docs.vasakos.org/vue-libvasak/composables](https://docs.vasakos.org/vue-libvasak/composables)
- **Design System (Once UI):** [docs.vasakos.org/vue-libvasak/once-ui](https://docs.vasakos.org/vue-libvasak/once-ui)
- **Changelog:** [GitHub Releases](https://github.com/Vasak-OS/vue-libvasak/releases)
- **Ejemplos:** [vasak-apps](https://github.com/Vasak-OS/vasak-apps/tree/main/examples/vue-libvasak)

---

## Uso rápido

```bash
# Se lanza automáticamente (systemd --user) o manualmente:
vue-libvasak
```

### Atajos / flags principales

| Acción | Comando / Tecla |
|--------|-----------------|
| Acción principal | `vue-libvasak` |
| Configuración | `vue-libvasak --config` |
| Ayuda | `vue-libvasak --help` |

> **Captura:** `assets/demo.gif` *(placeholder — sustituir por GIF real)*

---

## Configuración

### Archivo de configuración

```
~/.config/vasak/vue-libvasak.toml
```

### Variables de entorno

| Variable | Descripción | Por defecto |
|----------|-------------|-------------|
| `VASAK_DEBUG` | Activa logs de depuración en consola | `false` |
| `VASAK_PROFILE` | Perfil de rendimiento: `balanced`, `performance`, `power-save` | `balanced` |

### Integración con `tauri-plugin-config-manager`

- Esquemas de color: respeta `--ui-primary`, `--ui-surface`, `--ui-focus`, `--ui-on-surface`, `--ui-border`
- Tema de iconos: usa el tema del sistema (`vasakos-icon-theme`) vía `vicon` lookup
- Radio de bordes: variable CSS `--ui-radius` del esquema activo (por defecto 12px)
- Fuentes: `--ui-font-family`, `--ui-font-size-base` desde el esquema

---

## Desarrollo

### Requisitos

- **Rust:** `rustup` toolchain estable (`rust-toolchain.toml` fija la versión)
- **Node / bun:** `bun` ≥ 1.1 (nunca npm/yarn/pnpm para apps Tauri)
- **Sistema:** `pkg-config`, `libgtk-3-dev`, `libwebkit2gtk-4.1-dev`, `libssl-dev`
- *Ninguna adicional (solo bun)*

### Dependencias de desarrollo

#### Sistema (paquetes Arch / Debian / Fedora)

`base-devel`, `pkgconf`, `libssl-dev`, `libwebkit2gtk-4.1-dev`, `libgtk-3-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`, `gstreamer1.0-plugins-base`, `gstreamer1.0-plugins-good`, `libpipewire-0.3-dev`, `libwireplumber-0.5-dev`, `libdbus-1-dev`, `libudev-dev`, `libxkbcommon-dev`, `libwayland-dev`, `meson`, `ninja`, `clang`, `lld`

#### Rust

`rustup` → `stable` + `rustfmt` + `clippy`

#### Node

**Solo `bun`** (nunca npm/yarn/pnpm para apps Tauri). `bun --version` ≥ 1.1

#### Herramientas CLI

`just` (command runner), `cargo-binstall` (opcional), `cargo-llvm-cov` (para cobertura)

### Correr la app en desarrollo

```bash
# Frontend (Vite dev server + Tauri dev)
bun run tauri dev

# Solo frontend (Vite)
bun run dev

# Solo backend (cargo watch)
cargo watch -x "run --bin vue-libvasak"
```

### Compilar / Build de release

```bash
# Build completo (frontend + backend + bundle)
bun run tauri build

# Solo frontend (para testear bundle después)
bun run build

# Solo backend Rust (binario optimizado)
cargo build --release --locked

# Paquetes nativos
# Arch: makepkg -sf en PKGBUILDS/vue-libvasak/
# Debian: cargo deb --no-build --target-dir src-tauri/target/release/debian
```

### Targets principales

```bash
# Desarrollo (Tauri dev server + hot reload)
bun run dev

# Build producción
bun run build

# Solo frontend
bun run build:frontend

# Solo backend Rust
cargo build --release --locked

# Lint + tipos (pre-commit / CI)
bunx --bun biome check .
bunx vue-tsc --noEmit
cargo fmt --check
```

### Pruebas

```bash
# Suite completa
bun test

# Tipos
bunx vue-tsc --noEmit

# Lint
bunx --bun biome check .
```

### Convención de commits

[Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/):

```
<tipo>(<ámbito>): <descripción corta>

[cuerpo opcional]

[pie opcional: Closes #N]
```

Tipos habituales: `feat`, `fix`, `bugfix`, `docs`, `ci`, `chore`, `security`, `refactor`, `perf`, `test`.

### Cómo abrir PR

1. Rama desde `origin/main`:
   ```bash
   git worktree add -b feat/tema ~/wt/vue-libvasak-tema origin/main
   ```
2. Prefijos de rama: `fix/`, `feat/`, `bugfix/`, `docs/`, `ci/`, `chore/`, `security/`
3. Escribe el fix → **`qa` escribe las pruebas** (fallan sin el fix) → suite verde → abre PR
4. Al abrir PR, **cuatro cosas obligatorias**:
   - Asignado a `JoaquinDecima`
   - Etiqueta `enhancement` o `bug` (+ `ci` / `dependencies` si aplica)
   - Añadido al proyecto «VasakOS Roadmap»
   - Status **In Progress**

---

## Arquitectura (texto)

### Crates / módulos principales

| Paquete | Responsabilidad |
|---------|-----------------|
| `@vasakgroup/vue-libvasak` | Componentes Vue 3 reutilizables + composables + utils |

### Interfaces D-Bus / zbus expuestas



### Puntos de extensión

- **Plugins:** Sistema de plugins modular
- **Hooks:** Hooks de ciclo de vida
- **API pública Rust:** API pública del crate principal

### Features / Cargo features

| Export | Descripción |
|--------|-------------|
| `components` | Componentes Vue (Button, Card, Dialog, Form, etc.) |
| `composables` | Composables (useTheme, useConfig, useI18n, etc.) |
| `utils` | Utilidades (iconos, formateo, validación, a11y) |

Y para apps Tauri+Vue: features del `tauri.conf.json` → `bundle` / `plugins` / `allowlist` (capabilities).

---

## Pruebas y calidad

- **Cobertura objetivo:** ≥ 80 % del código nuevo (SonarCloud Quality Gate)
- **Informes:** GitHub Actions → pestaña *SonarCloud Code Analysis* → enlace a SonarCloud
- **Añadir pruebas:** ver `AGENTS.md` sección 9 (mapa de repos y comandos de prueba)
- **Regla:** toda corrección lleva prueba escrita por `qa` que falla sin el fix

---

## Contribuir

- **Guía:** [.github/CONTRIBUTING.md](https://github.com/Vasak-OS/.github/blob/main/CONTRIBUTING.md)
- **Plantillas de issue:** [.github/ISSUE_TEMPLATE/](https://github.com/Vasak-OS/.github/tree/main/ISSUE_TEMPLATE)
- **Código de conducta:** [CODE_OF_CONDUCT.md](https://github.com/Vasak-OS/.github/blob/main/CODE_OF_CONDUCT.md)

---

## Contribuidores

> **Actualizado automáticamente en CI** — muestra los avatares de quienes han aportado código a este repo.

<div align="center">
  <a href="https://github.com/JoaquinDecima" target="_blank"><img src="https://avatars.githubusercontent.com/u/11674229?v=4&s=40" width="40" height="40" alt="JoaquinDecima" style="border-radius: 50%; margin: 2px;" title="JoaquinDecima (275 contribuciones)"></a>
</div>

[Ver todos los contribuidores](https://github.com/Vasak-OS/vue-libvasak/graphs/contributors)

---

## Donadores / Sponsors

[![Sponsors](https://img.shields.io/github/sponsors/Vasak-OS?style=flat&label=Sponsors)](https://github.com/sponsors/Vasak-OS)

> **Backers:** *Actualizado automáticamente en CI desde GitHub Sponsors / OpenCollective / Polar.*

[💖 Donar al proyecto](https://github.com/sponsors/Vasak-OS)

---

## Licencia

`GPL-3.0` — Copyright © 2026 **Vasak-OS Contributors**

[Ver licencia completa](LICENSE)
