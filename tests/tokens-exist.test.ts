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
 * Los componentes que ya tienen la forma de Once UI.
 *
 * La primera tanda de vue-libvasak#74. Lo que entra acá tiene que cumplir las
 * prohibiciones de abajo; lo que no, todavía no.
 */
const MIGRATED = [
	'dropdown/DropdownMenu.vue',
	'dropdown/DropdownMenuContent.vue',
	'dropdown/DropdownMenuItem.vue',
	'dropdown/DropdownMenuLabel.vue',
	'dropdown/DropdownMenuSeparator.vue',
	'dropdown/DropdownMenuTrigger.vue',
	'forms/TextInput.vue',
	'search/SearchField.vue',
	'controls/ActionButton.vue',
	'tooltip/Tooltip.vue',
	'tooltip/TooltipContent.vue',
	'tooltip/TooltipTrigger.vue',
	'cards/ListCard.vue',
	'tabs/TabBar.vue',
	'tabs/TabItem.vue',
	'sidebar/SideBar.vue',
	'sidebar/SideButton.vue',
	'sidebar/SideGroup.vue',
	'forms/FormGroup.vue',
	'forms/SelectField.vue',
	'forms/SwitchTrack.vue',
	'forms/SwitchToggle.vue',
	'forms/SwitchRow.vue',
	'forms/ProgressBar.vue',
	'forms/SliderControl.vue',
	'controls/ToggleControl.vue',
	'search/SearchSelect.vue',
	'tray/TrayIconButton.vue',
	'cards/DeviceCard.vue',
];

/** Sin comentarios: lo que se explica no es lo que se dibuja. */
function stripComments(text: string): string {
	return text
		.replace(/<!--[\s\S]*?-->/g, '')
		.replace(/\/\*[\s\S]*?\*\//g, '')
		.replace(/(^|[^:"'`])\/\/[^\n]*/g, '$1');
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
			if (keep(match)) found.push(`${file}: ${match[0].trim()}`);
		}
	}
	return found;
}

const END = '(?![a-z0-9-])';
const VARIANTS = '(?:[a-z0-9@[\\]-]+:)*';

describe('lo que se usa existe', () => {
	test('el archivo de tokens se leyó y declara lo que tiene que declarar', async () => {
		// Sin esto, un CSS que no se encuentre deja los conjuntos vacíos, la
		// guardia de abajo no encuentra nada declarado… y como tampoco lo
		// compara, pasa siempre.
		const tokens = await declaredTokens();

		for (const color of ['ui-line', 'ui-line-weak', 'ui-hover', 'ui-pressed', 'ui-selected', 'ui-selected-accent', 'ui-float', 'ui-scrim', 'ui-focus', 'primary', 'tx-main']) {
			expect(tokens.colors.has(color)).toBe(true);
		}
		for (const radius of ['corner-xs', 'corner-s', 'corner-m', 'corner-l', 'corner-xl', 'corner-full', 'corner', 'corner-sm', 'corner-window']) {
			expect(tokens.radius.has(radius)).toBe(true);
		}
		for (const shadow of ['surface-xs', 'surface-s', 'surface-m', 'surface-l', 'surface-xl']) {
			expect(tokens.shadow.has(shadow)).toBe(true);
		}
		expect(tokens.text.has('label-m')).toBe(true);
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
			[new RegExp(`(?<![\\w-])${VARIANTS}text-((?:label|body|heading)-[a-z0-9]+)${END}`, 'g'), tokens.text],
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

describe('lo que la forma de Once UI deja afuera, en los componentes ya migrados', () => {
	const FORBIDDEN: Array<[string, RegExp]> = [
		['sombras de Tailwind en vez de shadow-surface-*', /(?<![\w-])(?:[a-z-]+:)*shadow(?:-(?:sm|md|lg|xl|2xl))?(?![\w-])/g],
		['radios de Tailwind en vez de rounded-corner-*', /(?<![\w-])(?:[a-z-]+:)*rounded(?:-[trblse]{1,2})?(?:-(?:sm|md|lg|xl|2xl|3xl))?(?![\w-])/g],
		['los alias viejos del radio', /(?<![\w-])(?:[a-z-]+:)*rounded-corner(?:-sm)?(?![\w-])/g],
		['escalas, giros y desplazamientos al pasar o al apretar', /(?<![\w-])(?:hover|active|focus|focus-visible|group-hover):-?(?:scale|rotate|translate)-/g],
		['desenfoque detrás', /backdrop-blur/g],
		['medios pasos y pasos fuera de la grilla en relleno, margen y separación', /(?<![\w-])(?:[a-z-]+:)*-?(?:p|px|py|pt|pb|pl|pr|ps|pe|m|mx|my|mt|mb|ml|mr|gap|gap-x|gap-y|space-x|space-y)-(?:1\.5|2\.5|3\.5|7|9|11)(?![\w.])/g],
		['tamaños de texto sueltos en vez de los roles', /(?<![\w-])(?:[a-z-]+:)*text-(?:xs|sm|base|lg|xl)(?![\w-])/g],
		['transition-all', /(?<![\w-])transition-all(?![\w-])/g],
		['el fondo de la ventana sobre la ventana', /(?<![\w-])(?:[a-z-]+:)*bg-ui-bg(?![\w-])|(?<![\w-])background(?=["'\s])/g],
	];

	for (const [what, regex] of FORBIDDEN) {
		test(`sin ${what}`, async () => {
			expect(await findAll(MIGRATED, regex)).toEqual([]);
		});
	}

	test('las duraciones son 100, 150, 200 o 300', async () => {
		const found = await findAll(MIGRATED, /(?<![\w-])(?:[a-z-]+:)*duration-(\d+)(?![\w-])/g, (m) =>
			!['100', '150', '200', '300'].includes(m[1] as string)
		);

		expect(found).toEqual([]);
	});

	test('la lista de migrados existe de verdad', async () => {
		// Un nombre mal escrito en la lista es un componente que nadie revisa.
		for (const file of MIGRATED) {
			expect(await Bun.file(SOURCE + file).exists()).toBe(true);
		}
	});

	test('la guardia ve lo prohibido cuando lo hay', () => {
		const muestra = 'shadow-lg rounded-md hover:scale-110 py-1.5 duration-500 backdrop-blur-md';
		const halls = FORBIDDEN.filter(([, regex]) => [...muestra.matchAll(regex)].length > 0).map(([what]) => what);

		expect(halls).toContain('sombras de Tailwind en vez de shadow-surface-*');
		expect(halls).toContain('radios de Tailwind en vez de rounded-corner-*');
		expect(halls).toContain('escalas, giros y desplazamientos al pasar o al apretar');
		expect(halls).toContain('medios pasos y pasos fuera de la grilla en relleno, margen y separación');
		expect(halls).toContain('desenfoque detrás');
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
			/#[0-9a-fA-F]{3,8}(?![\w-])|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb)\(|(?<![\w-])(?:[a-z-]+:)*(?:bg|text|border|ring|outline|from|via|to|fill|stroke|shadow|divide|accent|caret|decoration)-(?:white|black|(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3})(?![\w-])/g;

		expect(await findAll(sources('**/*.{vue,ts,css}'), literal)).toEqual([]);
	});

	test('la guardia de colores ve un color cuando lo hay', () => {
		const literal = /#[0-9a-fA-F]{3,8}(?![\w-])|\b(?:rgba?|hsla?|oklch)\(/g;
		expect([...'color: #dd7878; box-shadow: 0 0 1px rgb(0 0 0 / .1)'.matchAll(literal)]).toHaveLength(2);
		// Y un comentario no es un color.
		expect(stripComments('/* #dd7878 */ <!-- rgb(1 2 3) -->')).not.toMatch(literal);
	});

	test('ningún icono propio: los iconos salen del tema del sistema', async () => {
		// Ni SVG en línea, ni imágenes empotradas o con ruta propia, ni fuentes
		// de iconos. Un icono es un nombre del tema (`ThemeIcon`), que sigue al
		// tema que eligió la persona.
		const embedded =
			/<svg[\s>]|data:image\/|['"][^'"\s]+\.(?:svg|png|ico|webp|gif)['"]|(?<![\w-])(?:fa[srlbd]?-[a-z0-9-]+|mdi-[a-z0-9-]+|material-icons|material-symbols(?:-[a-z]+)?)(?![\w-])/g;

		expect(await findAll(sources('**/*.{vue,ts}'), embedded)).toEqual([]);
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

	test('la guardia de puntos de corte deja pasar los de contenedor', () => {
		const viewport = /(?<![\w@-])(?:max-|min-)?(?:sm|md|lg|xl|2xl)(?:\/[a-z]+)?:[a-z-]/g;
		expect([...'md:w-72 sm:flex-row'.matchAll(viewport)]).toHaveLength(2);
		expect([...'@sm:flex-row @md:w-72'.matchAll(viewport)]).toHaveLength(0);
	});
});
