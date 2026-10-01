/** Nadie emite nada en el banco: escuchar no cuesta y soltar tampoco. */
export async function listen(): Promise<() => void> {
	return () => {};
}
export async function emit(): Promise<void> {}
