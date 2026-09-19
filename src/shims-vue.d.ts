/**
 * Que TypeScript entienda los `.vue`.
 *
 * Acá había un `declare module '*'`, que no es un shim: es apagar el chequeo de
 * **todos** los imports del proyecto y dejarlos en `any`. Con eso, los tipos que
 * esta librería publica no los comprobaba nadie —ni siquiera contra sus propios
 * componentes—, que para un paquete cuya razón de ser es que otras seis
 * aplicaciones lo usen es justo lo que no puede pasar.
 */
declare module '*.vue' {
	import type { DefineComponent } from 'vue';

	const componente: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
	export default componente;
}
