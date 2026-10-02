/**
 * La guardia de los tokens, en las dos direcciones.
 *
 * **Que exista lo que se usa.** Tailwind 4 arma las utilidades desde las
 * variables del `@theme`, y una clase que nombra un token no declarado no
 * emite ninguna regla ni avisa: el elemento se queda con lo que herede y se ve
 * «casi bien», que es por qué estas clases muertas sobreviven años (había 160
 * en cuatro repositorios). Los tokens se leen de `src/styles/tokens.css`, el
 * archivo que se publica, y no de una lista escrita acá.
 *
 * **Que no se use lo prohibido.** Lo que la forma de Once UI deja afuera
 * (`docs/once-ui.md`, §2.5, §2.8 y §7): sombras y radios sueltos de Tailwind,
 * medios pasos de relleno, duraciones fuera de 100/150/200/300, escalas y giros
 * al pasar o al apretar, desenfoque detrás. Se aplica a los componentes que ya
 * pasaron por la especificación —la lista crece con cada tanda— porque los
 * demás todavía tienen la forma de antes y se revisan con el usuario por grupo.
 *
 * Y tres reglas para **toda** la librería, que no esperan a ninguna tanda:
 * ningún color escrito a mano (los colores son del esquema), ningún icono
 * propio (los iconos son del tema del sistema) y ningún punto de corte de la
 * pantalla (un componente no sabe en qué ventana está).
 */

import { describe, expect, test } from 'bun:test';
import { Glob } from 'bun';
import { fileURLToPath } from 'node:url';

const SOURCE = fileURLToPath(new URL('../src/', import.meta.url));
const TOKENS_CSS = fileURLToPath(new URL('../src/styles/tokens.css', import.meta.url));

/**
 * Los componentes que tienen la forma de Once UI: desde la 2.0.0, todos.
 *
 * vue-libvasak#74 los pasó por grupos y esta lista creció con cada uno; con el
 * último ya es la librería entera, así que se lee del disco. Un componente
 * nuevo entra solo, que es lo que tiene que pasar.
 */
const MIGRATED = sources('**/*.vue');

/**
 * Sin comentarios: lo que se explica no es lo que se dibuja.
 *
 * Se recorre a mano y no con un reemplazo de expresiones regulares: sacar un
 * comentario con `replace` puede juntar los pedazos de otro (`<!-<!-- -->-`), y
 * esto no sanea nada —sólo decide qué se mira—, pero un recorrido que corta por
 * delimitadores no tiene ese problema.
 */
function stripComments(text: string): string {
	const pairs: Array<[string, string]> = [
		['<!--', '-->'],
		['/*', '*/'],
	];
	let out = '';
	let index = 0;
	while (index < text.length) {
		const pair = pairs.find(([open]) => text.startsWith(open, index));
		if (pair) {
			const end = text.indexOf(pair[1], index + pair[0].length);
			index = end === -1 ? text.length : end + pair[1].length;
			continue;
		}
		// `//` de línea, salvo dentro de una dirección (`https://`) o un texto.
		const previous = text[index - 1] ?? '';
		if (text.startsWith('//', index) && !':"\'`'.includes(previous)) {
			const end = text.indexOf('\n', index);
			index = end === -1 ? text.length : end;
			continue;
		}
		out += text[index];
		index += 1;
	}
	return out;
}

async function read(path: string): Promise<string> {
	return stripComments(await Bun.file(path).text());
}

function sources(pattern: string): string[] {
	return [...new Glob(pattern).scanSync(SOURCE)].sort();
}

/** Los nombres que declara el `@theme` de `tokens.css`, por espacio. */
async function declaredTokens() {
	const css = await read(TOKENS_CSS);
	const names = [...css.matchAll(/--([a-z0-9-]+)\s*:/g)].map((m) => m[1] as string);
	const strip = (prefix: string) =>
		new Set(
			names
				.filter((n) => n.startsWith(prefix) && !n.endsWith('--line-height') && !n.includes('--'))
				.map((n) => n.slice(prefix.length))
		);
	return {
		colors: strip('color-'),
		radius: strip('radius-'),
		shadow: strip('shadow-'),
		text: strip('text-'),
		ease: strip('ease-'),
	};
}

/** Cada aparición de `regex` en cada archivo, como `archivo: coincidencia`. */
async function findAll(files: string[], regex: RegExp, keep: (match: RegExpMatchArray) => boolean = () => true) {
	const found: string[] = [];
	for (const file of files) {
		const text = await read(SOURCE + file);
		for (const match of text.matchAll(regex)) {
			if (keep(Object.assign(match, { file }))) found.push(`${file}: ${match[0].trim()}`);
		}
	}
	return found;
}

/**
 * Los archivos que pueden tener un `<svg>`, con su porqué.
 *
 * - `cards/DeviceOrbit.vue`: las líneas del centro a cada satélite
 *   (vasak-desktop#132). Lo que pueden tener está atado en la prueba de la
 *   excepción, más abajo.
 */
const SVG_EXCEPTIONS = ['cards/DeviceOrbit.vue'];

/** `<svg` en un archivo de la lista: lo mira su propia prueba. */
function isNamedSvgException(match: RegExpMatchArray & { file?: string }): boolean {
	return match[0].startsWith('<svg') && SVG_EXCEPTIONS.includes(match.file ?? '');
}

const END = '(?![a-z0-9-])';
const VARIANTS = '(?:[a-z0-9@[\\]-]+:)*';

describe('lo que se usa existe', () => {
	test('el archivo de tokens se leyó y declara lo que tiene que declarar', async () => {
		// Sin esto, un CSS que no se encuentre deja los conjuntos vacíos, la
		// guardia de abajo no encuentra nada declarado… y como tampoco lo
		// compara, pasa siempre.
		const tokens = await declaredTokens();

		for (const color of ['ui-line', 'ui-line-weak', 'ui-hover', 'ui-pressed', 'ui-selected', 'ui-selected-accent', 'ui-float', 'ui-shell', 'ui-scrim', 'ui-overlay', 'ui-focus', 'ui-data', 'primary', 'tx-main']) {
			expect(tokens.colors.has(color)).toBe(true);
		}
		for (const radius of ['corner-xs', 'corner-s', 'corner-m', 'corner-l', 'corner-xl', 'corner-full', 'corner', 'corner-sm', 'corner-window']) {
			expect(tokens.radius.has(radius)).toBe(true);
		}
		for (const shadow of ['surface-xs', 'surface-s', 'surface-m', 'surface-l', 'surface-xl']) {
			expect(tokens.shadow.has(shadow)).toBe(true);
		}
		expect(tokens.text.has('label-m')).toBe(true);
		expect(tokens.text.has('heading-l')).toBe(true);
		// La 2.4.0: los números grandes del reloj y el halo del texto.
		expect(tokens.text.has('display-m')).toBe(true);
		expect(tokens.text.has('display-l')).toBe(true);
		expect(tokens.text.has('shadow-legible')).toBe(true);
		expect(tokens.ease.has('ui-out')).toBe(true);
	});

	test('ningún componente nombra un color del taller que no esté declarado', async () => {
		const { colors } = await declaredTokens();
		const regex = new RegExp(
			`(?<![\\w-])${VARIANTS}(?:bg|text|border(?:-[trblxy])?|ring|outline|from|via|to|fill|stroke|divide|placeholder|decoration|accent|caret|shadow)-((?:ui|tx|status)-[a-z0-9]+(?:-[a-z0-9]+)*|primary|secondary)(?:\\/\\d+)?${END}`,
			'g'
		);

		const dead = await findAll(sources('**/*.vue'), regex, (m) => !colors.has(m[1] as string));

		expect(dead).toEqual([]);
	});

	test('ni un radio, una sombra, un rol de texto o una curva que no existan', async () => {
		const tokens = await declaredTokens();
		const families: Array<[RegExp, Set<string>]> = [
			[new RegExp(`(?<![\\w-])${VARIANTS}rounded(?:-[trblse]{1,2})?-(corner[a-z0-9-]*)${END}`, 'g'), tokens.radius],
			[new RegExp(`(?<![\\w-])${VARIANTS}shadow-(surface[a-z0-9-]*)${END}`, 'g'), tokens.shadow],
			[new RegExp(`(?<![\\w-])${VARIANTS}text-((?:label|body|heading|display)-[a-z0-9]+)${END}`, 'g'), tokens.text],
			// La sombra de texto del taller (2.4.0) vive en el mismo espacio de
			// nombres que los tamaños: `--text-shadow-legible`.
			[new RegExp(`(?<![\\w-])${VARIANTS}text-(shadow-[a-z0-9-]+)${END}`, 'g'), tokens.text],
			[new RegExp(`(?<![\\w-])${VARIANTS}ease-(ui[a-z0-9-]*)${END}`, 'g'), tokens.ease],
		];

		const dead: string[] = [];
		for (const [regex, declared] of families) {
			dead.push(...(await findAll(sources('**/*.vue'), regex, (m) => !declared.has(m[1] as string))));
		}

		expect(dead).toEqual([]);
	});

	test('la guardia ve una clase muerta cuando la hay', () => {
		// Si la expresión no viera nada, la prueba de arriba pasaría siempre.
		// `border-ui-border-strong` tiene que leerse entero, no como
		// `ui-border` —que existe— seguido de basura.
		const regex = new RegExp(
			`(?<![\\w-])${VARIANTS}(?:bg|border)-((?:ui|tx|status)-[a-z0-9]+(?:-[a-z0-9]+)*)(?:\\/\\d+)?${END}`,
			'g'
		);
		const found = [...'hover:bg-ui-hoover border-ui-border-strong'.matchAll(regex)].map((m) => m[1]);

		expect(found).toEqual(['ui-hoover', 'ui-border-strong']);
	});
});

describe('lo que la forma de Once UI deja afuera', () => {
	const FORBIDDEN: Array<[string, RegExp]> = [
		['sombras de Tailwind en vez de shadow-surface-*', /(?<![\w-])(?:[a-z-]+:)*shadow(?:-(?:sm|md|lg|xl|2xl))?(?![\w-])/g],
		['radios de Tailwind en vez de rounded-corner-*', /(?<![\w-])(?:[a-z-]+:)*rounded(?:-[trblse]{1,2})?(?:-(?:sm|md|lg|xl|2xl|3xl))?(?![\w-])/g],
		['los alias viejos del radio', /(?<![\w-])(?:[a-z-]+:)*rounded-corner(?:-sm)?(?![\w-])/g],
		['escalas, giros y desplazamientos al pasar o al apretar', /(?<![\w-])(?:hover|active|focus|focus-visible|group-hover):-?(?:scale|rotate|translate)-/g],
		['desenfoque detrás', /backdrop-blur/g],
		['medios pasos y pasos fuera de la grilla en relleno, margen y separación', /(?<![\w-])(?:[a-z-]+:)*-?(?:p|px|py|pt|pb|pl|pr|ps|pe|m|mx|my|mt|mb|ml|mr|gap|gap-x|gap-y|space-x|space-y)-(?:1\.5|2\.5|3\.5|7|9|11)(?![\w.])/g],
		['tamaños de texto sueltos en vez de los roles', /(?<![\w-])(?:[a-z-]+:)*text-(?:xs|sm|base|lg|xl)(?![\w-])/g],
		['transition-all', /(?<![\w-])transition-all(?![\w-])/g],
		// Las de Tailwind tiñen con negro fijo; la del taller es `text-shadow-legible`.
		['sombras de texto y de dibujo de Tailwind', /(?<![\w-])(?:[a-z-]+:)*(?:text-shadow-(?:2xs|xs|sm|md|lg)|drop-shadow(?:-(?:xs|sm|md|lg|xl|2xl))?)(?![\w-])/g],
		['el fondo de la ventana sobre la ventana', /(?<![\w-])(?:[a-z-]+:)*bg-ui-bg(?![\w-])|(?<![\w-])background(?=["'\s])/g],
	];

	/**
	 * Los que pueden llevar el fondo de la ventana, y por qué.
	 *
	 * - El marco **es** la ventana.
	 * - El título pegajoso de `SectionHeading` tapa lo que pasa por debajo al
	 *   desplazar, así que tiene que ser opaco y del color exacto de lo que
	 *   tiene detrás —la ventana, o la ventana con la superficie de un `Panel`
	 *   encima—, o se ve una franja. No es una tarjeta sobre la ventana: es la
	 *   ventana misma, recortada.
	 */
	const WINDOW_BACKGROUND_ALLOWED = ['window/WindowFrame.vue', 'layout/SectionHeading.vue'];

	for (const [what, regex] of FORBIDDEN) {
		test(`sin ${what}`, async () => {
			const files =
				what === 'el fondo de la ventana sobre la ventana'
					? MIGRATED.filter((file) => !WINDOW_BACKGROUND_ALLOWED.includes(file))
					: MIGRATED;
			expect(await findAll(files, regex)).toEqual([]);
		});
	}

	test('las duraciones son 100, 150, 200 o 300', async () => {
		const found = await findAll(MIGRATED, /(?<![\w-])(?:[a-z-]+:)*duration-(\d+)(?![\w-])/g, (m) =>
			!['100', '150', '200', '300'].includes(m[1] as string)
		);

		expect(found).toEqual([]);
	});

	test('la lista de migrados es la librería entera', () => {
		// Si el disco no se leyera, la lista vacía haría pasar todo lo de arriba.
		expect(MIGRATED.length).toBeGreaterThanOrEqual(80);
		expect(MIGRATED).toContain('dropdown/DropdownMenuItem.vue');
		// Los de la 2.1.0 entran solos por leerse del disco; se nombran para que
		// moverlos de carpeta no los saque de la guardia sin que nadie lo note.
		for (const file of [
			'forms/OptionGroup.vue',
			'forms/SegmentedControl.vue',
			'forms/Checkbox.vue',
			'forms/Slider.vue',
			'forms/TextArea.vue',
			'forms/NumberField.vue',
			'layout/SettingRow.vue',
			'list/ListRow.vue',
			'list/ListGroup.vue',
			'indicators/Badge.vue',
			'indicators/StatusDot.vue',
			'layout/SectionHeading.vue',
			'layout/PageHeader.vue',
			'layout/Panel.vue',
			'dialog/DialogBody.vue',
			// La 2.2.0.
			'popover/PopoverContent.vue',
			'text/Kbd.vue',
			'identity/Avatar.vue',
			'identity/IdentityBlock.vue',
			'indicators/IconTile.vue',
			'feedback/Skeleton.vue',
			'media/CoverArt.vue',
			'disclosure/Disclosure.vue',
			'data/PropertyList.vue',
			'data/StatTile.vue',
			'data/CodeBlock.vue',
			'feedback/DropZone.vue',
			// La 2.4.0.
			'forms/PasswordField.vue',
			'data/ClockDisplay.vue',
			'controls/PowerActions.vue',
			'text/TextContextMenu.vue',
		]) {
			expect(MIGRATED).toContain(file);
		}
	});

	test('la guardia ve lo prohibido cuando lo hay', () => {
		const muestra = 'shadow-lg rounded-md hover:scale-110 py-1.5 duration-500 backdrop-blur-md drop-shadow-md text-shadow-sm';
		const halls = FORBIDDEN.filter(([, regex]) => [...muestra.matchAll(regex)].length > 0).map(([what]) => what);

		expect(halls).toContain('sombras de Tailwind en vez de shadow-surface-*');
		expect(halls).toContain('radios de Tailwind en vez de rounded-corner-*');
		expect(halls).toContain('escalas, giros y desplazamientos al pasar o al apretar');
		expect(halls).toContain('medios pasos y pasos fuera de la grilla en relleno, margen y separación');
		expect(halls).toContain('desenfoque detrás');
		expect(halls).toContain('sombras de texto y de dibujo de Tailwind');
		// Y la del taller pasa.
		expect([...'text-shadow-legible'.matchAll(FORBIDDEN.find(([what]) => what.startsWith('sombras de texto'))?.[1] as RegExp)]).toHaveLength(0);
	});
});

describe('en toda la librería', () => {
	test('ningún color escrito a mano: los colores salen del esquema', async () => {
		// Ni hexadecimales, ni `rgb()`/`hsl()`/`oklch()`, ni la paleta de
		// Tailwind (`bg-white`, `text-gray-500`). Todo color es un token que
		// termina en una `--use-*` del esquema, incluidas las sombras. Lo que
		// está en un comentario no cuenta: es una medición explicada, no un
		// color dibujado.
		const literal =
			/#[0-9a-fA-F]{3,8}(?![\w-])|(?<![a-zA-Z])(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb)\((?!\s*from\s+var\(--)|(?<![\w-])(?:[a-z-]+:)*(?:bg|text|border|ring|outline|from|via|to|fill|stroke|shadow|divide|accent|caret|decoration)-(?:white|black|(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3})(?![\w-])/g;

		expect(await findAll(sources('**/*.{vue,ts,css}'), literal)).toEqual([]);
	});

	test('la guardia de colores ve un color cuando lo hay', () => {
		const literal = /#[0-9a-fA-F]{3,8}(?![\w-])|(?<![a-zA-Z])(?:rgba?|hsla?|oklch)\(/g;
		expect([...'color: #dd7878; box-shadow: 0 0 1px rgb(0 0 0 / .1)'.matchAll(literal)]).toHaveLength(2);
		// Pegado a un `_` o a un `[` dentro de un valor arbitrario de Tailwind.
		// Con `\b` delante, `drop-shadow-[0_2px_rgba(0,0,0,.4)]` pasaba: el `_`
		// es un carácter de palabra, así que entre `_` y `r` no hay borde.
		expect([...'drop-shadow-[0_2px_rgba(0,0,0,.4)] bg-[rgb(1_2_3)]'.matchAll(literal)]).toHaveLength(2);
		// Y una función que sólo termina en esas letras no es un color.
		expect([...'color-mix(in srgb, var(--x) 10%, transparent)'.matchAll(literal)]).toHaveLength(0);
		// Y un comentario no es un color.
		expect(stripComments('/* #dd7878 */ <!-- rgb(1 2 3) -->')).not.toMatch(literal);
	});

	test('un color relativo sobre una variable del esquema no es un color escrito a mano', () => {
		// `oklch(from var(--use-primary) l c h / 50%)` deriva del esquema, igual
		// que un `color-mix`: lo pidió Configuración (settings#142). Lo que va
		// `from` un literal sigue siendo un literal.
		const literal = /#[0-9a-fA-F]{3,8}(?![\w-])|(?<![a-zA-Z])(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb)\((?!\s*from\s+var\(--)/g;
		expect([...'oklch(from var(--use-primary) l c h / 50%)'.matchAll(literal)]).toHaveLength(0);
		expect([...'rgb(from var(--use-ui-background) r g b / 0.4)'.matchAll(literal)]).toHaveLength(0);
		expect([...'oklch(from #dd7878 l c h)'.matchAll(literal)]).toHaveLength(2);
		expect([...'oklch(0.7 0.1 20)'.matchAll(literal)]).toHaveLength(1);
	});

	test('ningún icono propio: los iconos salen del tema del sistema', async () => {
		// Ni SVG en línea, ni imágenes empotradas o con ruta propia, ni fuentes
		// de iconos. Un icono es un nombre del tema (`ThemeIcon`), que sigue al
		// tema que eligió la persona.
		const embedded =
			/<svg[\s>]|data:image\/|['"][^'"\s]+\.(?:svg|png|ico|webp|gif)['"]|(?<![\w-])(?:fa[srlbd]?-[a-z0-9-]+|mdi-[a-z0-9-]+|material-icons|material-symbols(?:-[a-z]+)?)(?![\w-])/g;

		const found = await findAll(sources('**/*.{vue,ts}'), embedded, (match) => !isNamedSvgException(match));
		expect(found).toEqual([]);
	});

	test('la única excepción de SVG son las líneas de la órbita, y no dibujan nada más', async () => {
		// `DeviceOrbit` une el centro con cada satélite con una línea que
		// depende de dónde quedó la pastilla: geometría de datos, no un icono
		// (vasak-desktop#132). Se deja pasar sólo eso: un `<svg>` oculto al
		// lector, nada más que `<path>`, con el trazo en `currentColor` —el
		// color lo pone la clase, que es un token— y sin relleno.
		for (const file of SVG_EXCEPTIONS) {
			const text = await read(SOURCE + file);
			const svgs = [...text.matchAll(/<svg[\s\S]*?<\/svg>/g)].map((m) => m[0]);

			expect(svgs).toHaveLength(1);
			const svg = svgs[0] as string;
			expect(svg).toMatch(/aria-hidden="true"/);
			expect(svg).toMatch(/fill="none"/);
			const tags = [...svg.matchAll(/<([a-zA-Z]+)[\s>]/g)].map((m) => m[1]);
			expect(new Set(tags)).toEqual(new Set(['svg', 'path']));
			const strokes = [...svg.matchAll(/stroke="([^"]*)"/g)].map((m) => m[1]);
			expect(strokes.length).toBeGreaterThan(0);
			expect(strokes.every((stroke) => stroke === 'currentColor')).toBe(true);
		}
	});

	test('ningún punto de corte de la pantalla: un componente no sabe en qué ventana está', async () => {
		// `sm:`, `md:`… miran la pantalla. Lo que se adapta va con consultas de
		// contenedor (`@container` y `@sm:`) o con un `ResizeObserver` sobre el
		// componente. Y `matchMedia` con un ancho tampoco: en WebKitGTK ni
		// siquiera avisa cuando cambia.
		const viewport =
			/(?<![\w@-])(?:max-|min-)?(?:sm|md|lg|xl|2xl)(?:\/[a-z]+)?:[a-z-]|(?<![\w@-])(?:max|min)-\[[^\]]+\]:|matchMedia\(\s*[`'"]\(?\s*(?:max|min)-(?:width|height)/g;

		expect(await findAll(sources('**/*.{vue,ts}'), viewport)).toEqual([]);
	});

	test('ningún radio fijo: todos salen del radio que eligió la persona', async () => {
		// Los radios son la escala `rounded-corner-*`, derivada con `calc()` de
		// `--corner-radius`, que escribe el config-manager desde `vasak.conf`.
		// Ni los de Tailwind (`rounded-md`, `rounded-full`, `rounded` a secas),
		// ni uno arbitrario (`rounded-[6px]`), ni un `border-radius` escrito a
		// mano en un estilo.
		const fixed =
			/(?<![\w-])(?:[a-z0-9@[\]-]+:)*rounded(?:-[trblse]{1,2})?(?:-(?:none|xs|sm|md|lg|xl|2xl|3xl|4xl|full|\[[^\]]*\]))?(?![\w-])|border-radius\s*:|borderRadius\s*:/g;

		expect(await findAll(sources('**/*.{vue,ts}'), fixed)).toEqual([]);
	});

	test('y la escala de tokens.css se deriva toda de --corner-radius', async () => {
		const css = await read(TOKENS_CSS);
		const radii = [...css.matchAll(/--radius-([a-z0-9-]+):\s*([^;]+);/g)];

		expect(radii.length).toBeGreaterThanOrEqual(9);
		for (const [, name, value] of radii) {
			expect(`${name}: ${value}`).toMatch(/var\(--(?:corner-radius|radius-corner[a-z-]*)\)/);
		}
	});

	test('la guardia de puntos de corte deja pasar los de contenedor', () => {
		const viewport = /(?<![\w@-])(?:max-|min-)?(?:sm|md|lg|xl|2xl)(?:\/[a-z]+)?:[a-z-]/g;
		expect([...'md:w-72 sm:flex-row'.matchAll(viewport)]).toHaveLength(2);
		expect([...'@sm:flex-row @md:w-72'.matchAll(viewport)]).toHaveLength(0);
	});
});
