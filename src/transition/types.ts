/**
 * De qué lado viene el contenido al entrar.
 *
 * Lo comparten `RevealTransition` (el desplazamiento opcional) y
 * `SlideTransition`. Al salir, el deslizamiento se va hacia el lado contrario.
 */
export type TransitionSide = 'left' | 'right' | 'up' | 'down';
