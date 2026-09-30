import { describe, expect, test } from 'bun:test';
import * as library from '../src/index';

/**
 * Lo que la librería exporta es lo que la 1.0 se comprometió a no romper.
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
	'BarSearch',
	'CLASES_POR_TONO',
	'CLAVE_DEL_DIALOGO',
	'CLAVE_DEL_MENU',
	'CLAVE_DEL_TOOLTIP',
	'CLAVE_DE_LA_BARRA',
	'ConfigSection',
	'DeviceCard',
	'Dialog',
	'DialogContent',
	'DialogDescription',
	'DialogFooter',
	'DialogHeader',
	'DialogTitle',
	'DropdownMenu',
	'DropdownMenuContent',
	'DropdownMenuItem',
	'DropdownMenuLabel',
	'DropdownMenuSeparator',
	'DropdownMenuTrigger',
	'EmptyState',
	'FormGroup',
	'LOS_TRES_CONTROLES',
	'ListCard',
	'LoadingState',
	'NowPlayingCard',
	'POSICIONES',
	'ProgressBar',
	'SearchField',
	'SearchSelect',
	'SeekBar',
	'SelectField',
	'SideBar',
	'SideButton',
	'SideGroup',
	'SliderControl',
	'SpinningCover',
	'SwitchRow',
	'SwitchToggle',
	'SwitchTrack',
	'TabBar',
	'TabItem',
	'TextInput',
	'ThemeIcon',
	'ToastArea',
	'ToggleControl',
	'Tooltip',
	'TooltipContent',
	'TooltipTrigger',
	'TrayIconButton',
	'WindowControls',
	'WindowFrame',
	'buscarOpciones',
	'default',
	'esPosicion',
	'formatPlaybackTime',
	'olvidarLosIconosDelTema',
	'orientacionDe',
	'posicionDe',
	'rolDelTono',
	'usarElDialogo',
	'usarElMenu',
	'usarElTooltip',
	'usarLaBarra',
	'usarLaPosicionDeLaBarra',
	'usarLaVersionDelTema',
];

describe('la superficie pública de la 1.0', () => {
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
