import SideBar from "./sidebar/SideBar.vue";
import SideButton from "./sidebar/SideButton.vue";
import SideGroup from "./sidebar/SideGroup.vue";
import SelectField from "./forms/SelectField.vue";
import ThemeIcon from "./icons/ThemeIcon.vue";
import WindowFrame from "./window/WindowFrame.vue";
import AppBar from "./window/AppBar.vue";
import WindowControls from "./window/WindowControls.vue";
import TabBar from "./tabs/TabBar.vue";
import TabItem from "./tabs/TabItem.vue";
import BarSearch from "./bar/BarSearch.vue";
import ActionButton from "./controls/ActionButton.vue";
import AlertMessage from "./feedback/AlertMessage.vue";
import EmptyState from "./feedback/EmptyState.vue";
import LoadingState from "./feedback/LoadingState.vue";
import ToastArea from "./feedback/ToastArea.vue";
import ProgressBar from "./forms/ProgressBar.vue";
import SearchField from "./search/SearchField.vue";
import SearchSelect from "./search/SearchSelect.vue";
import TextInput from "./forms/TextInput.vue";
import ConfigSection from "./layout/ConfigSection.vue";
import DeviceCard from "./cards/DeviceCard.vue";
import Dialog from "./dialog/Dialog.vue";
import DialogContent from "./dialog/DialogContent.vue";
import DialogDescription from "./dialog/DialogDescription.vue";
import DialogFooter from "./dialog/DialogFooter.vue";
import DialogHeader from "./dialog/DialogHeader.vue";
import DialogTitle from "./dialog/DialogTitle.vue";
import DropdownMenu from "./dropdown/DropdownMenu.vue";
import DropdownMenuContent from "./dropdown/DropdownMenuContent.vue";
import DropdownMenuItem from "./dropdown/DropdownMenuItem.vue";
import DropdownMenuLabel from "./dropdown/DropdownMenuLabel.vue";
import DropdownMenuSeparator from "./dropdown/DropdownMenuSeparator.vue";
import DropdownMenuTrigger from "./dropdown/DropdownMenuTrigger.vue";
import FormGroup from "./forms/FormGroup.vue";
import ListCard from "./cards/ListCard.vue";
import SliderControl from "./forms/SliderControl.vue";
import SwitchRow from "./forms/SwitchRow.vue";
import SwitchToggle from "./forms/SwitchToggle.vue";
import SwitchTrack from "./forms/SwitchTrack.vue";
import ToggleControl from "./controls/ToggleControl.vue";
import Tooltip from "./tooltip/Tooltip.vue";
import TooltipContent from "./tooltip/TooltipContent.vue";
import TooltipTrigger from "./tooltip/TooltipTrigger.vue";
import TrayIconButton from "./tray/TrayIconButton.vue";
import NowPlayingCard from "./media/NowPlayingCard.vue";
import SeekBar from "./media/SeekBar.vue";
import SpinningCover from "./media/SpinningCover.vue";
import type { App } from "vue";

const components = [
  SideBar,
  SideButton,
  SideGroup,
  SelectField,
  ThemeIcon,
  WindowFrame,
  AppBar,
  WindowControls,
  TabBar,
  TabItem,
  BarSearch,
  ActionButton,
  AlertMessage,
  EmptyState,
  LoadingState,
  ProgressBar,
  SearchField,
  SearchSelect,
  TextInput,
  ToastArea,
  ConfigSection,
  DeviceCard,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  FormGroup,
  ListCard,
  SliderControl,
  SwitchRow,
  SwitchToggle,
  SwitchTrack,
  ToggleControl,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TrayIconButton,
  NowPlayingCard,
  SeekBar,
  SpinningCover,
];

export default {
  install(app: App) {
    components.forEach((component) => {
      app.component(component.name as string, component);
    });
  },
};

export {
  SideBar,
  SideButton,
  SideGroup,
  SelectField,
  ThemeIcon,
  WindowFrame,
  AppBar,
  WindowControls,
  TabBar,
  TabItem,
  BarSearch,
  ActionButton,
  AlertMessage,
  EmptyState,
  LoadingState,
  ProgressBar,
  SearchField,
  SearchSelect,
  TextInput,
  ToastArea,
  ConfigSection,
  DeviceCard,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  FormGroup,
  ListCard,
  SliderControl,
  SwitchRow,
  SwitchToggle,
  SwitchTrack,
  ToggleControl,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TrayIconButton,
  NowPlayingCard,
  SeekBar,
  SpinningCover,
};

export type { PlaybackState } from "./media/playback";
export { formatPlaybackTime } from "./media/playback";
export type { AvisoTransitorio, ToastNotice } from "./feedback/ToastArea.vue";
export type { NoticeTone } from "./feedback/tones";
export { TONE_CLASSES, TOAST_TONE_CLASSES, toneRole } from "./feedback/tones";
export type { FocusOnOpen, MenuContext } from "./dropdown/types";
export type { DialogContext } from "./dialog/types";
export type { OpcionDeBusqueda } from "./search/buscar";
export { buscarOpciones } from "./search/buscar";
export { DIALOG_KEY, useDialog } from "./dialog/types";
export { MENU_KEY, useMenu } from "./dropdown/types";
export type { TooltipContext } from "./tooltip/types";
export { TOOLTIP_KEY, useTooltip } from "./tooltip/types";
export type { SidebarCategory, SidebarItem } from "./sidebar/types";
export type { TabAction, TabEntry } from "./tabs/types";

/*
 * Los nombres de la 1.x, como alias obsoletos.
 *
 * Los identificadores de la librería van en inglés (ver `CLAUDE.md` del taller).
 * Los de estos cuatro módulos se renombraron en la 2.0.0 porque la tanda de
 * vue-libvasak#74 los tocaba. Los **nombres** viejos de lo que se exporta
 * siguen saliendo como alias obsoletos y se van en la 3.0.
 *
 * Ojo: el alias es sólo del nombre. Los campos de `MenuContext`,
 * `TooltipContext` y `DialogContext` también pasaron al inglés (`open`,
 * `close`, `trigger`…) y los valores de `FocusOnOpen` son `first`/`last`/
 * `none`: quien use esos campos o esos valores tiene que migrar. Nadie fuera de
 * la librería los usaba al cerrar la 2.0.0; ver el CHANGELOG.
 */
import type { FocusOnOpen as FocusOnOpenType, MenuContext as MenuContextType } from "./dropdown/types";
import { MENU_KEY as MENU_KEY_VALUE, useMenu as useMenuValue } from "./dropdown/types";
import type { TabAction as TabActionType, TabEntry as TabEntryType } from "./tabs/types";
import type { TooltipContext as TooltipContextType } from "./tooltip/types";
import { TOOLTIP_KEY as TOOLTIP_KEY_VALUE, useTooltip as useTooltipValue } from "./tooltip/types";

/** @deprecated Usá `MenuContext`. Se va en la 3.0. */
export type ContextoDelMenu = MenuContextType;
/** @deprecated Usá `FocusOnOpen`. Se va en la 3.0. */
export type FocoAlAbrir = FocusOnOpenType;
/** @deprecated Usá `MENU_KEY`. Se va en la 3.0. */
export const CLAVE_DEL_MENU = MENU_KEY_VALUE;
/** @deprecated Usá `useMenu`. Se va en la 3.0. */
export const usarElMenu = useMenuValue;
/** @deprecated Usá `TooltipContext`. Se va en la 3.0. */
export type ContextoDelTooltip = TooltipContextType;
/** @deprecated Usá `TOOLTIP_KEY`. Se va en la 3.0. */
export const CLAVE_DEL_TOOLTIP = TOOLTIP_KEY_VALUE;
/** @deprecated Usá `useTooltip`. Se va en la 3.0. */
export const usarElTooltip = useTooltipValue;
/** @deprecated Usá `TabEntry`. Se va en la 3.0. */
export type ElementoDePestana = TabEntryType;
/** @deprecated Usá `TabAction`. Se va en la 3.0. */
export type AccionDePestana = TabActionType;

import type { NoticeTone as NoticeToneType } from "./feedback/tones";
import { TONE_CLASSES as TONE_CLASSES_VALUE, toneRole as toneRoleValue } from "./feedback/tones";

import type { DialogContext as DialogContextType } from "./dialog/types";
import { DIALOG_KEY as DIALOG_KEY_VALUE, useDialog as useDialogValue } from "./dialog/types";

/** @deprecated Usá `DialogContext`. Se va en la 3.0. */
export type ContextoDelDialogo = DialogContextType;
/** @deprecated Usá `DIALOG_KEY`. Se va en la 3.0. */
export const CLAVE_DEL_DIALOGO = DIALOG_KEY_VALUE;
/** @deprecated Usá `useDialog`. Se va en la 3.0. */
export const usarElDialogo = useDialogValue;

/** @deprecated Usá `NoticeTone`. Se va en la 3.0. */
export type TonoDelAviso = NoticeToneType;
/** @deprecated Usá `TONE_CLASSES`. Se va en la 3.0. */
export const CLASES_POR_TONO = TONE_CLASSES_VALUE;
/** @deprecated Usá `toneRole`. Se va en la 3.0. */
export const rolDelTono = toneRoleValue;
export type {
  ContextoDeLaBarra,
  ControlDeVentana,
  OrientacionDeLaBarra,
  PosicionDeLaBarra,
} from "./window/tipos";
export {
  CLAVE_DE_LA_BARRA,
  esPosicion,
  LOS_TRES_CONTROLES,
  orientacionDe,
  POSICIONES,
  usarLaBarra,
} from "./window/tipos";
export { posicionDe, usarLaPosicionDeLaBarra } from "./window/preferencia";

/**
 * Vaciar la memoria de iconos del tema.
 *
 * Es para las pruebas de quien use la librería, y por eso sale del paquete y no
 * se queda adentro. Lo resuelto se memoriza por nombre en el módulo, y un
 * módulo se comparte entre archivos de prueba: el primero que pida un icono con
 * el tema sin preparar deja **guardado que no hay ninguno**, y cualquier prueba
 * posterior que lo prepare ya no lo ve. Pasó al adoptar la librería en el
 * instalador, donde el aviso dejó de dibujar su icono al correr la suite entera
 * y lo dibujaba bien al correr su archivo solo.
 */
export { olvidarLosIconosDelTema, usarLaVersionDelTema } from "./internos/iconoDelTema";
