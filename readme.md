# vue-libvasak

A simple vue components for VSK Applications used in VasakOS. This library is used in [application-template](https://github.com/Vasak-OS/application-template). **Don't work in browser.**

## Installation

```bash
yarn add @vasakgroup/vue-libvasak
```

## Use

We can use the components in our application as follows:

### WindowFrame

```vue
<script lang="ts">
import { defineComponent } from "vue";
import { WindowFrame } from "@vasakgroup/vue-libvasak";
</script>

<template>
  <WindowFrame title="Hello World" img="file:///home/pato/image.svg">
    <p>Hello World</p>
  </WindowFrame>
</template>
```

### SideBar

```vue
<script lang="ts">
import { defineComponent } from "vue";
import {
  SideBar,
  WindowFrame,
  SideButton,
} from "@vasakgroup/vue-libvasak";
</script>

<template>
  <WindowFrame title="Hello World">
    <SideBar>
      <SideButton url="/" title="Home" image="./home.webp" />
      <SideButton url="/about" title="About" image="./about.webp" />
    </SideBar>
  </WindowFrame>
</template>
```

### DropdownMenu

A menu with real menu semantics: `role="menu"`, `role="menuitem"`, arrow-key
navigation, `Enter` and `Space` to activate, `Escape` and `Tab` to close — and
focus goes back to whoever opened it.

```vue
<script setup lang="ts">
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@vasakgroup/vue-libvasak";
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <button type="button">Actions</button>
    </DropdownMenuTrigger>
    <DropdownMenuContent side="bottom" align="start">
      <DropdownMenuItem @select="copy">Copy</DropdownMenuItem>
      <DropdownMenuItem :disabled="!canPaste" @select="paste">Paste</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
```

`as-child` puts `aria-haspopup`, `aria-expanded` and the handlers **on your own
button** instead of on a wrapper — that is what a screen reader announces. Drop
it and the trigger wraps the slot in a `div`, which is what a context menu
anchored to a point needs; there, bind `v-model:open` and let the application
decide when to open it.

A disabled item stays focusable and keeps its place in the arrow rotation, with
`aria-disabled`: an option that vanishes cannot be discovered.

`side` is a **preference**, not an order: if the menu does not fit on the side
you asked for and there is more room on the opposite one, it flips. Whatever is
left over after that is capped to the space actually available and scrolls
inside — so a menu taller than the window never runs off the edge.

## Contributors

<center>
  <a href="https://github.com/Vasak-OS/vue-libvasak/graphs/contributors">
    <img src="https://contrib.rocks/image?repo=Vasak-OS/vue-libvasak" />
  </a>
</center>
