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

## Contributors

<center>
  <a href="https://github.com/Vasak-OS/vue-libvasak/graphs/contributors">
    <img src="https://contrib.rocks/image?repo=Vasak-OS/vue-libvasak" />
  </a>
</center>
