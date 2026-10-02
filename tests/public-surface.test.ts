import { describe, expect, test } from 'bun:test';
import * as library from '../src/index';

/**
 * Lo que la librería exporta es lo que se comprometió a no romper.
 *
 * En la 2.6.0 se sumó la órbita del dispositivo conectado (`DeviceOrbit`).
 *
 * En la 2.5.0 se sumaron la pastilla (`Chip`) y los puntos de página
 * (`PageDots`), del reproductor desplegable del escritorio.
 *
 * En la 2.4.0 se sumaron el campo de contraseña, el reloj, los botones de
 * energía y el menú de texto del clic derecho (`TextContextMenu`, con las
 * funciones que deciden qué ofrece y qué hace).
 *
 * En la 2.2.0 se sumaron el globo con contenido (`Popover` y sus piezas), la
 * tecla, la identidad, los recuadros de icono, el esqueleto, la carátula, los
 * datos, el plegable y la zona de soltar; y los nombres en inglés del icono del
 * tema (`forgetThemeIcons`, `useThemeVersion`), con los de antes como alias.
 *
 * En la 2.1.0 se sumaron los quince componentes de formularios, selección,
 * listas y cabeceras (vue-libvasak#74, decisión 1 del 01/10/2026).
 *
 * En la 2.0.0 se sumaron los nombres en inglés de los contextos del menú y del
 * tooltip (`MENU_KEY`, `useMenu`, `TOOLTIP_KEY`, `useTooltip`); los de la 1.x
 * siguen acá como alias obsoletos hasta la 3.0.
 *
 * Desde la 1.0 el acento hace lo que todo el mundo cree que hace: una minor
 * llega sola a las diecisiete aplicaciones que la usan. Eso es lo bueno del
 * cambio y también lo que lo vuelve peligroso — sacar un componente de acá ya
 * no espera a que alguien suba el rango a mano, llega solo y rompe la ventana
 * de otro.
 *
 * El modo de fallo sin esta prueba es el de siempre: sacar un export no falla
 * nada acá. La librería compila, sus propias pruebas pasan, y el error aparece
 * en otro repositorio, semanas después, como un componente que no existe.
 */
const PUBLIC_SURFACE = [
	'ActionButton',
	'AlertMessage',
	'AppBar',
	'Avatar',
	'Badge',
	'BarSearch',
	'buscarOpciones',
	'Checkbox',
	'Chip',
	'CLASES_POR_TONO',
	'CLAVE_DE_LA_BARRA',
	'CLAVE_DEL_DIALOGO',
	'CLAVE_DEL_MENU',
	'CLAVE_DEL_TOOLTIP',
	'ClockDisplay',
	'CodeBlock',
	'ConfigSection',
	'CoverArt',
	'default',
	'DeviceCard',
	'DeviceOrbit',
	'Dialog',
	'DIALOG_KEY',
	'DialogBody',
	'DialogContent',
	'DialogDescription',
	'DialogFooter',
	'DialogHeader',
	'DialogTitle',
	'Disclosure',
	'DropdownMenu',
	'DropdownMenuContent',
	'DropdownMenuItem',
	'DropdownMenuLabel',
	'DropdownMenuSeparator',
	'DropdownMenuTrigger',
	'DropZone',
	'EmptyState',
	'esPosicion',
	'forgetThemeIcons',
	'formatPlaybackTime',
	'FormGroup',
	'getTextField',
	'IconTile',
	'IdentityBlock',
	'isTextAction',
	'Kbd',
	'ListCard',
	'ListGroup',
	'ListRow',
	'LoadingState',
	'LOS_TRES_CONTROLES',
	'MENU_KEY',
	'NowPlayingCard',
	'NumberField',
	'olvidarLosIconosDelTema',
	'OptionGroup',
	'orientacionDe',
	'PageDots',
	'PageHeader',
	'Panel',
	'PasswordField',
	'Popover',
	'POPOVER_KEY',
	'PopoverAnchor',
	'PopoverContent',
	'PopoverTrigger',
	'posicionDe',
	'POSICIONES',
	'PowerActions',
	'ProgressBar',
	'PropertyList',
	'readTextMenuState',
	'rolDelTono',
	'runTextAction',
	'SearchField',
	'SearchSelect',
	'SectionHeading',
	'SeekBar',
	'SegmentedControl',
	'SelectField',
	'SettingRow',
	'SideBar',
	'SideButton',
	'SideGroup',
	'Skeleton',
	'Slider',
	'SliderControl',
	'SpinningCover',
	'StatTile',
	'StatusDot',
	'SwitchRow',
	'SwitchToggle',
	'SwitchTrack',
	'TabBar',
	'TabItem',
	'TEXT_INPUT_TYPES',
	'TextArea',
	'TextContextMenu',
	'TextInput',
	'textMenuEntries',
	'ThemeIcon',
	'TOAST_TONE_CLASSES',
	'ToastArea',
	'ToggleControl',
	'TONE_CLASSES',
	'toneRole',
	'Tooltip',
	'TOOLTIP_KEY',
	'TooltipContent',
	'TooltipTrigger',
	'TrayIconButton',
	'usarElDialogo',
	'usarElMenu',
	'usarElTooltip',
	'usarLaBarra',
	'usarLaPosicionDeLaBarra',
	'usarLaVersionDelTema',
	'useDialog',
	'useMenu',
	'usePopover',
	'useThemeVersion',
	'useTooltip',
	'WindowControls',
	'WindowFrame',
];

describe('la superficie pública', () => {
	test('no se va nada de lo que estaba', () => {
		// Sacar o renombrar algo de esta lista es una **mayor**, no una minor.
		// Si esta prueba molesta porque el cambio es deliberado, el número de
		// versión tiene que subir con él.
		const exported = new Set(Object.keys(library));
		const missing = PUBLIC_SURFACE.filter((n) => !exported.has(n));

		expect(missing).toEqual([]);
	});

	test('lo que se sume queda anotado acá', () => {
		// La otra mitad, y no es burocracia: sumar algo es una minor y está
		// bien, pero esta lista es el único lugar donde se puede leer de un
		// vistazo con qué se comprometió la 1.0. Una lista que se queda a
		// medias deja de servir para eso, y entonces la prueba de arriba
		// protege sólo una parte sin que se note cuál.
		const exported = Object.keys(library).sort();
		const added = exported.filter((n) => !PUBLIC_SURFACE.includes(n));

		expect(added).toEqual([]);
	});
});
