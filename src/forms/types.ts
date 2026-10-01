/**
 * Las formas de las opciones de los controles de elección.
 *
 * Viven acá y no en cada `.vue` porque esos componentes son genéricos
 * (`generic="T"`): su `<script setup>` se compila adentro de una función, y
 * desde ahí no se puede exportar nada.
 */
import type { BadgeTone } from '../indicators/Badge.vue';

/** Una opción de `SelectField` cuando se pasan como lista. */
export interface SelectOption<V extends string | number = string | number> {
	label: string;
	value: V;
	disabled?: boolean;
}

/** Una opción de `OptionGroup`. */
export interface OptionGroupOption<V extends string | number = string | number> {
	value: V;
	label: string;
	description?: string;
	/** Nombre de icono del tema. */
	icon?: string;
	iconType?: 'icon' | 'symbol';
	/** Una insignia a la derecha: «Predeterminado». */
	badge?: string | number;
	disabled?: boolean;
}

/** Una opción de `SegmentedControl`. */
export interface SegmentedOption<V extends string | number = string | number> {
	value: V;
	label: string;
	/** Nombre de icono del tema. */
	icon?: string;
	iconType?: 'icon' | 'symbol';
	/** Sólo el icono: el texto queda como nombre accesible y globo. */
	iconOnly?: boolean;
	/** Un contador o una marca a la derecha: las actualizaciones pendientes. */
	badge?: string | number;
	badgeTone?: BadgeTone;
	disabled?: boolean;
	/** Con esto el control es una navegación y la opción, un enlace. */
	href?: string;
}
