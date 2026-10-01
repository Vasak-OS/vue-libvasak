<script setup lang="ts">
/**
 * El botón de acción del sistema.
 *
 * # Las variantes (vue-libvasak#74, decisión 6 del 30/09/2026)
 *
 * - `primary`: el relleno de la marca, plano —el `solidStyle: "flat"` de Once
 *   UI—. Es lo único que lleva el acento: la acción principal de la vista.
 * - `secondary`: **cambió en la 2.0.0**. Era el relleno del color secundario
 *   del esquema; ahora es el `secondary` de Once UI, el botón neutro con
 *   contorno: transparente, canto `ui-line` y el velo `ui-hover` al pasar por
 *   encima, con el canto que sube a `ui-border-strong`. Al lado de un
 *   `primary` ya no compiten dos colores de marca por la misma atención.
 * - `ghost`: nuevo. El `tertiary` de Once UI: sin borde ni fondo en reposo,
 *   para las barras de herramientas y los controles de ventana.
 * - `danger`: el relleno del error.
 *
 * Apretar es `ui-pressed` (o el relleno un poco más transparente) en 100 ms;
 * nada escala ni se mueve. El foco es el anillo de 2 px separado 2 px con
 * `ui-focus`.
 *
 * # El texto de cada relleno
 *
 * Cada relleno lleva el token de texto que corresponde a **su** fondo: el
 * `primary` va con `text-tx-on-primary`, que calcula el config-manager contra
 * WCAG. `danger` todavía no tiene el suyo: `#1e1e2e` sobre `#d20f39` da 3,02:1
 * en claro. Hace falta `--text-on-danger`, y el config-manager no puede
 * derivarlo mientras el esquema no declare los colores de estado. Hay una
 * prueba marcada como `failing` que lo recuerda.
 *
 * # Tamaños
 *
 * 24, 32 y 40 de alto (`sm`, `md`, `lg`), que son los `xs`, `s` y `m` de Once
 * UI; en el escritorio el de omisión es el de 32. Es un **mínimo**: una
 * etiqueta que no entra en el ancho que le dan se parte en dos líneas en vez de
 * cortarse, y ningún botón baja de 32 de objetivo: el de 24 agranda su zona de clic sin
 * agrandar el dibujo.
 *
 * # El icono
 *
 * `icon` es un **nombre del tema** de iconos del sistema, y se dibuja con
 * `ThemeIcon`, que lo vuelve a resolver cuando la persona cambia de tema.
 * `iconSrc` recibía una ruta ya resuelta y queda como obsoleto.
 *
 * # Lo que sumó la 2.1.0
 *
 * - **`pressed`**: un botón que se queda apretado —aleatorio y repetir en el
 *   reproductor, la vista previa del gestor de archivos—. Es lo que sabía el
 *   `TransportButton` de resonance. Va como `aria-pressed`, que es lo que
 *   hace que un lector de pantalla diga «activado» en vez de leer un botón
 *   más, y se ve con el velo de acento de lo elegido (decisión 4). Sin la
 *   propiedad, el botón no es de alternar y no lleva `aria-pressed`.
 * - **`href`**: un enlace con la forma de un botón («Sitio del proyecto» en
 *   la tienda). Es un `<a>` de verdad —abre en otra pestaña, se copia la
 *   dirección, el lector lo anuncia como enlace— y no un botón que navega.
 * - **`variant="overlay"`**: sobre una imagen o un vídeo (los controles del
 *   visor de fotos), con el velo `ui-overlay`, que sostiene el texto a 4,5:1
 *   sea cual sea la foto de abajo. Reemplaza los `bg-black/50` de la galería,
 *   que eran negro escrito a mano.
 */
import { computed, onMounted } from 'vue';
import ThemeIcon from '../icons/ThemeIcon.vue';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'overlay';
type Size = 'sm' | 'md' | 'lg';

interface Props {
	label: string;
	disabled?: boolean;
	variant?: Variant;
	loading?: boolean;
	customClass?: string | Record<string, boolean>;
	size?: Size;
	fullWidth?: boolean;
	/** El nombre del icono en el tema del sistema, como `document-save`. */
	icon?: string;
	/** `symbol` para la variante simbólica, que sigue el color del texto del tema. */
	iconType?: 'icon' | 'symbol';
	/** @deprecated La ruta ya resuelta. Usá `icon`. Se va en la 3.0. */
	iconSrc?: string;
	iconAlt?: string;
	iconRight?: boolean;
	type?: 'button' | 'submit' | 'reset';
	stopPropagation?: boolean;
	preventDefault?: boolean;
	/** Botón de alternar: `true` apretado, `false` suelto. Sin esto no alterna. */
	pressed?: boolean;
	/** La dirección: con esto es un enlace (`<a>`) con la forma del botón. */
	href?: string;
	/** Dónde abre el enlace. Con `_blank` va además `rel="noopener noreferrer"`. */
	target?: string;
	/**
	 * El globo nativo. Para el botón de sólo icono que no tiene `Tooltip`
	 * alrededor: el nombre accesible ya lo da `iconAlt`, esto es para quien ve.
	 */
	title?: string;
}

const props = withDefaults(defineProps<Props>(), {
	disabled: false,
	variant: 'primary',
	loading: false,
	customClass: () => ({}),
	size: 'md',
	fullWidth: false,
	icon: '',
	iconType: 'symbol',
	iconSrc: '',
	iconAlt: '',
	iconRight: false,
	type: 'button',
	stopPropagation: false,
	preventDefault: false,
	pressed: undefined,
	href: undefined,
	target: undefined,
	title: undefined,
});

const emit = defineEmits<{
	click: [];
}>();

const variantClasses: Record<Variant, string> = {
	primary: 'border-transparent bg-primary text-tx-on-primary hover:bg-primary/90 active:bg-primary/80',
	secondary:
		'border-ui-line bg-transparent text-tx-main hover:border-ui-border-strong hover:bg-ui-hover active:bg-ui-pressed',
	ghost: 'border-transparent bg-transparent text-tx-main hover:bg-ui-hover active:bg-ui-pressed',
	danger: 'border-transparent bg-status-error text-tx-on-primary hover:bg-status-error/90 active:bg-status-error/80',
	overlay:
		'border-transparent bg-ui-overlay text-tx-main hover:bg-linear-to-r hover:from-ui-hover hover:to-ui-hover active:from-ui-pressed active:to-ui-pressed',
};

/**
 * Apretado: el velo de acento de lo elegido, encima de lo que tenga la
 * variante. Va como imagen de fondo y no como color para no competir con el
 * relleno de la variante en el mismo atributo.
 */
const PRESSED = 'bg-linear-to-r from-ui-selected-accent to-ui-selected-accent';

/**
 * El de 24 se ve de 24 pero se apunta en 32: un seudoelemento transparente
 * agranda la zona que recibe el clic cuatro píxeles arriba y abajo.
 */
const HIT_AREA = "relative after:absolute after:inset-x-0 after:-inset-y-1 after:content-['']";

const sizeClasses: Record<Size, string> = {
	sm: `min-h-6 px-2 text-label-s ${HIT_AREA}`,
	md: 'min-h-8 px-3 text-label-m',
	lg: 'min-h-10 px-4 text-label-m',
};

/** Sólo icono: cuadrado, del alto de su tamaño. */
const iconOnlyClasses: Record<Size, string> = {
	sm: `min-h-6 min-w-6 px-0 ${HIT_AREA} after:-inset-x-1`,
	md: 'min-h-8 min-w-8 px-0',
	lg: 'min-h-10 min-w-10 px-0',
};

const hasIcon = computed(() => Boolean(props.icon || props.iconSrc));
const iconOnly = computed(() => hasIcon.value && !props.label);
const iconName = computed(() => props.iconAlt || props.label);

const isLink = computed(() => props.href !== undefined);
const inactive = computed(() => props.disabled || props.loading);

const handleClick = (event: Event) => {
	if (props.stopPropagation) event.stopPropagation();
	if (props.preventDefault) event.preventDefault();
	// Un enlace apagado no tiene `disabled`: el navegador lo seguiría igual.
	if (isLink.value && inactive.value) {
		event.preventDefault();
		return;
	}
	if (!inactive.value) {
		emit('click');
	}
};

/** Lo que cambia entre el botón y el enlace. */
const elementAttrs = computed(() => {
	if (!isLink.value) {
		return { type: props.type, disabled: inactive.value };
	}
	return {
		href: inactive.value ? undefined : props.href,
		target: props.target,
		rel: props.target === '_blank' ? 'noopener noreferrer' : undefined,
		'aria-disabled': inactive.value ? 'true' : undefined,
		role: inactive.value ? 'link' : undefined,
	};
});

onMounted(() => {
	if (props.iconSrc && !props.icon) {
		console.warn(
			'[ActionButton] «iconSrc» está obsoleto y se va en la 3.0: recibe una ruta ya resuelta. Usá «icon» con el nombre del icono del tema.'
		);
	}
});
</script>

<template>
  <component
    :is="isLink ? 'a' : 'button'"
    v-bind="elementAttrs"
    :title="props.title"
    class="inline-flex min-w-0 items-center justify-center gap-2 rounded-corner-m border py-1 text-center font-semibold no-underline transition-[background-color,border-color,color,opacity] duration-200 ease-ui active:duration-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-focus disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
    :class="[
      variantClasses[props.variant],
      iconOnly ? iconOnlyClasses[props.size] : sizeClasses[props.size],
      props.fullWidth ? 'w-full' : '',
      props.pressed ? PRESSED : '',
      customClass,
    ]"
    :aria-label="iconOnly ? iconName || undefined : undefined"
    :aria-pressed="props.pressed === undefined || isLink ? undefined : props.pressed"
    @click="handleClick">
    <!-- La rueda ocupa el lugar del icono: el ancho no cambia mientras carga. -->
    <ThemeIcon
      v-if="loading"
      name="process-working-symbolic"
      type="symbol"
      :size="16"
      class="animate-spin" />
    <template v-else-if="hasIcon && !props.iconRight">
      <ThemeIcon v-if="props.icon" :name="props.icon" :type="props.iconType" :size="16" />
      <img v-else :src="props.iconSrc" :alt="iconOnly ? '' : props.iconAlt" class="size-4 shrink-0" />
    </template>
    <span v-if="props.label" class="min-w-0 break-words">{{ props.label }}</span>
    <template v-if="!loading && hasIcon && props.iconRight">
      <ThemeIcon v-if="props.icon" :name="props.icon" :type="props.iconType" :size="16" />
      <img v-else :src="props.iconSrc" :alt="iconOnly ? '' : props.iconAlt" class="size-4 shrink-0" />
    </template>
  </component>
</template>
