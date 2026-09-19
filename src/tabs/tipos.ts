/**
 * Una pestaña, tal como la dibuja la barra compartida.
 *
 * El escritorio tenía tres barras de pestañas distintas —la terminal, el gestor
 * de archivos y el editor de texto— con prestaciones que no se solapaban: el
 * editor era el único con el punto de «sin guardar», la terminal la única con
 * vista previa al pasar por encima, y el menú de «cerrar las demás» estaba en
 * dos de las tres. Esto es la unión, para que una pestaña se comporte igual en
 * cualquier ventana.
 */

export interface ElementoDePestana {
	id: string;
	/** Lo que se lee. Si se corta, el `title` lo dice entero. */
	label: string;
	/** Un nombre del tema de iconos del escritorio, no una ruta. */
	icon?: string;
	/**
	 * Tiene cambios sin guardar.
	 *
	 * Se dibuja como un punto y, si además se puede cerrar, el punto **es** el
	 * botón de cerrar hasta que el puntero pasa por encima: así no hay dos
	 * cosas peleando por el mismo lugar en una pestaña de ciento treinta y seis
	 * píxeles.
	 */
	dirty?: boolean;
	/** Por omisión se puede cerrar. */
	closable?: boolean;
	/** Lo que dice la vista previa al pasar por encima; sin esto, el `label`. */
	tooltip?: string;
}

/** Una acción del menú contextual de una pestaña. */
export interface AccionDePestana {
	id: string;
	label: string;
	icon?: string;
	/** Se dibuja apagada, pero sigue alcanzable para un lector de pantalla. */
	disabled?: boolean;
}
