/** Un elemento de la barra lateral: un lugar al que se va. */
export interface SidebarItem {
	id: string;
	label: string;
	/** Un nombre del tema de iconos del escritorio, no una ruta. */
	icon?: string;
	badge?: string | number;
	disabled?: boolean;
}

/** Un grupo de elementos, con su título plegable. */
export interface SidebarCategory {
	id: string;
	title: string;
	items: SidebarItem[];
}
