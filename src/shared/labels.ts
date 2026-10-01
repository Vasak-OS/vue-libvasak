/**
 * Los textos de la librería: primero la propiedad, después el catálogo de la
 * aplicación, y al final un respaldo escrito acá.
 *
 * Una librería que traduce obliga a todas las aplicaciones a compartir sus
 * claves, así que el texto entra por propiedad. Pero una propiedad que nadie
 * pasa deja un nombre accesible fijo en un idioma, así que sin ella se busca en
 * el catálogo de quien usa el componente. `t()` devuelve la clave cruda cuando
 * no la tiene: ahí va el respaldo, y no `tabs.close` leído en voz alta.
 */
import { useI18n } from '@vasakgroup/tauri-plugin-i18n';

export function useLabels() {
	const { t } = useI18n();
	return (key: string, fallback: string): string => {
		const translated = t(key);
		return translated && translated !== key ? translated : fallback;
	};
}
