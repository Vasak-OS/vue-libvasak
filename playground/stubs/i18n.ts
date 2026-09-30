/** Sin catálogo: `t()` devuelve la clave, como el complemento cuando no la tiene. */
export function useI18n() {
	return { t: (key: string) => key };
}
