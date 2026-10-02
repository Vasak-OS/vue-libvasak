<script lang="ts" setup generic="T extends string | number">
/**
 * Un `select` que respeta el tema.
 *
 * El `select` nativo de WebKit se dibuja solo: pinta su propio fondo blanco y
 * su propio texto, y las clases de color no lo tocan — en una ventana en modo
 * oscuro eso deja texto claro sobre blanco, ilegible. `appearance-none` apaga
 * ese dibujo, y entonces la flecha hay que ponerla a mano porque se va con el
 * resto.
 *
 * Estaba copiado en vasak-monitor y en vasak-settings con dos nombres
 * distintos.
 *
 * # La etiqueta
 *
 * Con `label`, el componente la dibuja y la ata al control con `for`/`id`. Es
 * la razón de que exista la propiedad: quien lo usaba ponía un `<label>` suelto
 * al lado, que **no** está asociado a nada — un lector de pantalla anuncia un
 * desplegable sin nombre, y hacer clic en el texto no abre la lista.
 *
 * Envolverlo en un `<label>` también vale, que es asociación implícita; en ese
 * caso no se pasa `label` y no se dibuja ninguna.
 *
 * # La forma (vue-libvasak#74)
 *
 * La de `TextInput`: 32 de alto, `rounded-corner-m`, el borde de 3:1 y el
 * anillo de foco de 2 px. La etiqueta, `text-label-s` en `tx-muted`.
 *
 * # `options` (2.1.0)
 *
 * Las opciones se pueden pasar como lista en vez de escribir los `<option>` en
 * la ranura: objetos `{ label, value, disabled? }` o, cuando la etiqueta es el
 * valor, cadenas sueltas. Es lo que hacía el `SelectInput` de Configuración en
 * sus 26 usos, y lo único que tenía de más (además de su flecha, que era un
 * SVG empotrado en un `data:`). Con las dos cosas, gana la lista y la ranura
 * se ignora.
 *
 * # `id` y `disabled` (2.4.0)
 *
 * Declarados, con su tipo. Ya llegaban al `select` como atributos, pero con
 * `strictTemplates` escribirlos sobre el componente era un error de tipos, y
 * Configuración los pasaba por `v-bind` de un objeto en nueve lugares, que no
 * se comprueba. Apagado, la etiqueta también se atenúa.
 */
import { computed, useAttrs, useId } from 'vue';
import ThemeIcon from '../icons/ThemeIcon.vue';
import type { SelectOption } from './types';

// Los atributos van al `select` y no al contenedor: si no, un `@change` o un
// `aria-label` quedan colgados de un `div` y no hacen nada.
defineOptions({ inheritAttrs: false });

const props = defineProps<{
	label?: string;
	/** El `id` del `select`. Sin esto se genera uno, que es el que nombra la etiqueta. */
	id?: string;
	disabled?: boolean;
	/** Las opciones, en vez de la ranura. Una cadena es etiqueta y valor a la vez. */
	options?: Array<SelectOption<T> | (T & string)>;
}>();

const normalized = computed<SelectOption<T>[] | null>(() =>
	props.options
		? props.options.map((option) =>
				typeof option === 'object' ? option : { label: String(option), value: option as T }
			)
		: null
);
const attrs = useAttrs();

// El `id` propio sólo si hace falta uno y quien lo usa no trajo el suyo.
const generatedId = useId();
const id = computed(() => props.id ?? (attrs.id as string | undefined) ?? generatedId);

const emit = defineEmits<{
	/**
	 * El `change` del `select` de abajo.
	 *
	 * Se declara en vez de dejarlo caer por atributos: con `strictTemplates`,
	 * un `@change` sobre un componente que no lo emite es un error, y quien lo
	 * escribía no tenía forma de saber si llegaba a algún lado. Llega: hasta
	 * ahora por `v-bind="atributos"`, ahora por acá.
	 */
	change: [event: Event];
}>();

/**
 * El modelo, del tipo que use quien lo pone.
 *
 * Era `string | number` fijo, y eso obliga a quien tiene un `ref<string>` —o
 * algo más estrecho, como los cuatro lados de la barra— a aceptar de vuelta un
 * `number` que nunca va a llegar. Con `strictTemplates` eso dejó de pasar en
 * silencio: `Type 'string | number' is not assignable to type '"top" | …'`.
 */
const [model, modifiers] = defineModel<T>({
	required: true,
	set(value) {
		// `v-model.number` sobre un componente no convierte solo como lo hace
		// sobre un `input`: el modificador llega acá y hay que aplicarlo. Sin
		// esto, un valor numérico sale como cadena y quien lo valida lo rechaza.
		//
		// La conversión se afirma: quien escribe `.number` está diciendo que su
		// modelo es numérico, y el tipo de la conversión no lo sabe.
		return modifiers.number ? (Number(value) as T) : value;
	},
});
</script>

<template>
  <div class="flex min-w-0 flex-col gap-1">
    <label v-if="props.label" :for="id" class="text-label-s text-tx-muted" :class="props.disabled ? 'opacity-50' : ''">{{ props.label }}</label>
    <div class="relative flex min-w-0 items-center">
      <select
        :id="id"
        v-model="model"
        class="h-8 min-w-0 flex-1 appearance-none truncate rounded-corner-m border border-ui-border-strong bg-ui-surface/70 pr-8 pl-3 text-label-m text-tx-main transition-colors duration-200 ease-ui hover:border-tx-main focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-focus disabled:cursor-not-allowed disabled:opacity-50"
        v-bind="attrs"
        :disabled="props.disabled"
        @change="emit('change', $event)">
        <template v-if="normalized">
          <option v-for="option in normalized" :key="option.value" :value="option.value" :disabled="option.disabled">
            {{ option.label }}
          </option>
        </template>
        <slot v-else />
      </select>
      <ThemeIcon
        name="pan-down-symbolic"
        type="symbol"
        :size="16"
        class="pointer-events-none absolute right-2" />
    </div>
  </div>
</template>
