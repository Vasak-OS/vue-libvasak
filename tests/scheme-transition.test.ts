import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * El fundido del cambio de esquema (Vasak-OS/vasak-settings#134): las
 * variables que escribe `tauri-plugin-config-manager` se registran como
 * colores para que se puedan animar, y la animación sólo corre con la clase
 * `scheme-transition` y sin `prefers-reduced-motion: reduce`.
 */

const TOKENS = readFileSync(
	fileURLToPath(new URL('../src/styles/tokens.css', import.meta.url)),
	'utf8'
);

/** Las que el piso de cada aplicación declara siempre. */
const ANIMATED = [
	'--primary',
	'--secondary',
	'--primary-dark',
	'--secondary-dark',
	'--ui-background',
	'--ui-surface',
	'--ui-border',
	'--ui-background-dark',
	'--ui-surface-dark',
	'--ui-border-dark',
	'--text-main',
	'--text-muted',
	'--text-main-dark',
	'--text-muted-dark',
];

const registered = (name: string) =>
	new RegExp(`@property ${name} \\{[^}]*syntax: "<color>";[^}]*inherits: true;`).test(TOKENS);

/**
 * El bloque entero de `@media (prefers-reduced-motion: no-preference)`, con
 * las llaves contadas: la regla se busca sólo adentro, así que si se mudara
 * afuera de la consulta —y el fundido corriera con movimiento reducido— las
 * pruebas fallan.
 */
const transitionBlock = () => {
	const start = TOKENS.indexOf('@media (prefers-reduced-motion: no-preference)');
	expect(start).toBeGreaterThan(-1);
	const open = TOKENS.indexOf('{', start);
	let depth = 0;
	let end = open;
	for (; end < TOKENS.length; end++) {
		if (TOKENS[end] === '{') depth++;
		else if (TOKENS[end] === '}' && --depth === 0) break;
	}
	return TOKENS.slice(start, end + 1);
};

describe('el fundido del esquema', () => {
	test('cada color del esquema se registra como color heredable', () => {
		for (const name of ANIMATED) {
			expect({ name, registered: registered(name) }).toEqual({ name, registered: true });
		}
	});

	test('y cada uno se anima, unos 300 ms, sólo con la clase y sin movimiento reducido', () => {
		const rule = transitionBlock();
		expect(rule).toContain(':root.scheme-transition');
		for (const name of ANIMATED) {
			expect(rule).toMatch(new RegExp(`${name}(?![\\w-])`));
		}
		expect(rule).toContain('transition-duration: 300ms');
	});

	test('no se registran los que se leen con respaldo: un color registrado nunca cae en él', () => {
		for (const name of ['--ui-border-strong', '--ui-focus', '--text-on-primary', '--text-on-secondary']) {
			expect(TOKENS).not.toMatch(new RegExp(`@property ${name}(?![\\w-])`));
		}
	});

	test('ningún fundido fuera de la clase: abrir una ventana no parpadea', () => {
		// Una sola regla anima los colores del esquema, y es la de la clase.
		expect(TOKENS.match(/transition-property:\s*--primary/g)).toHaveLength(1);
		expect(transitionBlock()).toContain('transition-property:');
	});
});
