<script setup lang="ts">
/**
 * El título de un tramo: «Cuentas», «Hoy», «Septiembre de 2026 · 214».
 *
 * Es el genérico con más copias del taller: unas setenta en diez aplicaciones,
 * casi todas `text-xs uppercase tracking-[0.16em] text-tx-muted` escrito a
 * mano con un `tracking` distinto en cada una. Sale de:
 *
 * - el calendario, los contactos, el correo, polkit, resonance, el monitor, el
 *   editor y Configuración: el **`eyebrow`**, la línea chica en mayúsculas
 *   sobre un tramo.
 * - las cabeceras de la cuadrícula del gestor de archivos y la cabecera de mes
 *   de la galería: el **`group`**, el título de un grupo de elementos, que
 *   suma **el contador** (`count`, en una insignia) y **la línea** que llega
 *   hasta el canto (`divider`), y que **se queda pegado arriba** al
 *   desplazar (`sticky`).
 *
 * # Pegado arriba, sin desenfoque
 *
 * Las copias pegajosas llevaban `backdrop-blur` sobre un fondo translúcido
 * (`bg-ui-bg/80-3`, que además no existe). Desenfocar cuesta en WebKitGTK y
 * acá no se hace (decisión 3): el fondo es **opaco** y del mismo color que lo
 * que tiene detrás, para que al pasar el contenido por debajo no se vea una
 * franja. `surface` dice cuál es: la ventana, o un `Panel` (la ventana con la
 * superficie al 70 % encima, en la misma cuenta que hace el navegador).
 */
import Badge from '../indicators/Badge.vue';
import ThemeIcon from '../icons/ThemeIcon.vue';

withDefaults(
	defineProps<{
		title: string;
		/** Nombre de icono del tema, antes del título. */
		icon?: string;
		iconType?: 'icon' | 'symbol';
		/** Cuántos elementos tiene el tramo. Se dibuja en una insignia. */
		count?: number | string;
		variant?: 'eyebrow' | 'group';
		/** Pegado arriba del contenedor que desplaza. */
		sticky?: boolean;
		/** Sobre qué se pega: la ventana o un `Panel`. */
		surface?: 'window' | 'panel';
		/** Una línea desde el título hasta el canto. */
		divider?: boolean;
		/** El nivel del título en el documento. */
		as?: 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
	}>(),
	{ iconType: 'symbol', variant: 'eyebrow', sticky: false, surface: 'window', divider: false, as: 'h3' }
);

defineSlots<{
	/** A la derecha: «Ver todo», «Agregar». */
	actions?: () => unknown;
}>();
</script>

<template>
  <div
    class="flex min-w-0 items-center gap-2"
    :class="[
      sticky ? 'sticky top-0 z-10 py-2' : '',
      sticky && surface === 'panel' ? 'bg-ui-bg bg-linear-to-r from-ui-surface/70 to-ui-surface/70' : '',
      sticky && surface === 'window' ? 'bg-ui-bg' : '',
    ]">
    <ThemeIcon v-if="icon" :name="icon" :type="iconType" :size="16" class="opacity-70" />
    <component
      :is="as"
      class="m-0 min-w-0 break-words"
      :class="
        variant === 'eyebrow'
          ? 'font-semibold text-label-xs tracking-wider text-tx-muted uppercase'
          : 'font-semibold text-label-m text-tx-main'
      ">
      {{ title }}
    </component>
    <Badge v-if="count !== undefined && count !== ''" :label="count" />
    <span v-if="divider" aria-hidden="true" class="h-px min-w-4 flex-1 bg-ui-line-weak" />
    <span v-else class="flex-1" />
    <span v-if="$slots.actions" class="flex shrink-0 flex-wrap items-center gap-2"><slot name="actions" /></span>
  </div>
</template>
