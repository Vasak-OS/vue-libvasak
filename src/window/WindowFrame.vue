<script lang="ts" setup>
/**
 * El marco de una ventana: la barra superior y lo que va debajo.
 *
 * `defineProps` es una macro del compilador de componentes, no una función que
 * se importe. Importarla desde `vue` choca con la que el compilador declara, y
 * el typecheck lo decía —sólo que no había ninguno: un `declare module \'*\'`
 * dejaba todos los imports en `any` y este archivo nunca se comprobó.
 */
import TopBar from './TopBar.vue';

const props = withDefaults(defineProps<{ title?: string; image?: string }>(), {
	title: 'Vasak',
	image: '',
});
</script>

<template>
  <TopBar :title="props.title" :image="props.image" />
  <slot />
</template>
