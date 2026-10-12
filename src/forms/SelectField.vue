<script lang="ts" setup generic="T extends string | number">
/**
 * Un desplegable con el estilo de VasakOS.
 *
 * # Sin `<select>` nativo (vue-libvasak#103, 2.19.0)
 *
 * La lista que se abre en un `<select>` **la dibuja el sistema**, no la página:
 * `appearance-none` arregla el control cerrado, pero la lista abierta sigue
 * siendo la de GTK/WebKitGTK, con sus colores, su radio y su tipografía. Era el
 * único lugar de la librería donde el escritorio dejaba de parecer VasakOS.
 *
 * Ahora es `SearchSelect` sin búsqueda: el panel `ui-float` con el teclado
 * completo (flechas, Inicio/Fin, Enter, Escape, la letra inicial) que ya usaba
 * el inicio de sesión. La API no cambia: `v-model` con el tipo que sea (y
 * `.number`), `options` o los `<option>` de siempre en la ranura, `label`,
 * `id`, `disabled` y `change`.
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
import { Comment, computed, Fragment, Text, useAttrs, useId, useSlots, type VNode } from 'vue';
import type { OpcionDeBusqueda } from '../search/buscar';
import SearchSelect from '../search/SearchSelect.vue';
import type { SelectOption } from './types';

// Los atributos se reparten a mano: `class` y `style` al contenedor y el resto
// al botón, que es el control (ver `buttonAttrs`).
defineOptions({ inheritAttrs: false });

const props = defineProps<{
	label?: string;
	/** El `id` del control. Sin esto se genera uno, que es el que nombra la etiqueta. */
	id?: string;
	disabled?: boolean;
	/** Las opciones, en vez de la ranura. Una cadena es etiqueta y valor a la vez. */
	options?: Array<SelectOption<T> | (T & string)>;
}>();

const slots = useSlots();
const attrs = useAttrs();

/** El texto de un vnode, juntando los hijos. */
function textOf(children: unknown): string {
	if (typeof children === 'string') return children;
	if (Array.isArray(children)) return children.map((child) => textOf((child as VNode).children ?? child)).join('');
	return '';
}

/**
 * Los `<option>` escritos en la ranura, como opciones.
 *
 * La ranura no se dibuja: se lee. Un `v-for` llega como un `Fragment` con los
 * `<option>` adentro, y los comentarios de un `v-if` falso, como `Comment`; se
 * aplanan y se quedan sólo las opciones. Sin `value`, el valor es el texto,
 * como en el `<option>` nativo.
 */
function optionsFromSlot(nodes: VNode[]): SelectOption<T>[] {
	const out: SelectOption<T>[] = [];
	for (const node of nodes) {
		if (node.type === Fragment && Array.isArray(node.children)) {
			out.push(...optionsFromSlot(node.children as VNode[]));
		} else if (node.type === 'option') {
			const attrsOf = (node.props ?? {}) as Record<string, unknown>;
			const label = textOf(node.children).trim();
			const disabled = attrsOf.disabled !== undefined && attrsOf.disabled !== false;
			out.push({ label, value: ('value' in attrsOf ? attrsOf.value : label) as T, disabled });
		} else if (node.type !== Comment && node.type !== Text) {
			// Otra cosa en la ranura (un `<optgroup>`, un componente) no tiene
			// lugar en la lista; se avisa en vez de perderla en silencio.
			console.warn('[SelectField] en la ranura sólo van <option>:', node.type);
		}
	}
	return out;
}

const normalized = computed<SelectOption<T>[]>(() => {
	if (props.options) {
		return props.options.map((option) =>
			typeof option === 'object' ? option : { label: String(option), value: option as T }
		);
	}
	return optionsFromSlot(slots.default?.() ?? []);
});

/**
 * Lo que recibe `SearchSelect`, que trabaja con cadenas: el valor de cada
 * opción es su posición, y así un modelo numérico vuelve numérico y no como
 * texto. Se compara por texto porque un `<option value="3">` estático llega
 * como `"3"` y el modelo puede ser `3`.
 */
const listOptions = computed<OpcionDeBusqueda[]>(() =>
	normalized.value.map((option, index) => ({
		valor: String(index),
		etiqueta: option.label,
		disabled: option.disabled,
	}))
);
const selectedIndex = computed(() =>
	String(normalized.value.findIndex((option) => String(option.value) === String(model.value)))
);

/** El nombre accesible: la etiqueta dibujada o el `aria-label` de quien lo usa. */
const accessibleName = computed(() => (attrs['aria-label'] as string | undefined) ?? props.label ?? '');

/** Lo que va al contenedor: `class` y `style`, que dan el tamaño y el lugar. */
const rootAttrs = computed(() => ({ class: attrs.class, style: attrs.style }));

/**
 * Todo lo demás va al botón, que es el control: el `aria-describedby` de un
 * `FormGroup`, `title`, `data-*`. Antes iba al `select` y no se puede perder en
 * el camino. `id` y `aria-label` ya se resuelven aparte.
 */
const buttonAttrs = computed(() => {
	const { class: _class, style: _style, id: _id, 'aria-label': _name, ...rest } = attrs;
	return rest;
});

function onChoose(value: string) {
	const option = normalized.value[Number(value)];
	if (!option) return;
	// Elegir la que ya estaba no es un cambio: el `select` nativo no daba
	// `change` en ese caso, y quien recarga algo en `@change` lo haría de más.
	if (String(option.value) === String(model.value)) return;
	model.value = option.value;
	// El `change` que daba el `select` nativo. Quien lo usa recarga algo, no lee
	// el evento: se manda uno sin destino útil, con el valor ya en el modelo.
	emit('change', new Event('change'));
}

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
  <div class="flex min-w-0 flex-col gap-1" v-bind="rootAttrs">
    <label v-if="props.label" :for="id" class="text-label-s text-tx-muted" :class="props.disabled ? 'opacity-50' : ''">{{ props.label }}</label>
    <SearchSelect
      :button-id="id"
      :model-value="selectedIndex"
      :options="listOptions"
      :label="accessibleName"
      :disabled="props.disabled"
      :searchable="false"
      :button-attrs="buttonAttrs"
      class="min-w-0"
      @update:model-value="onChoose" />
  </div>
</template>
