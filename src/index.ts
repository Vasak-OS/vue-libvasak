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
import SwitchToggle from "./forms/SwitchToggle.vue";
import SwitchTrack from "./forms/SwitchTrack.vue";
import ToggleControl from "./controls/ToggleControl.vue";
import Tooltip from "./tooltip/Tooltip.vue";
import TooltipContent from "./tooltip/TooltipContent.vue";
import TooltipTrigger from "./tooltip/TooltipTrigger.vue";
import TrayIconButton from "./tray/TrayIconButton.vue";
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
  SwitchToggle,
  SwitchTrack,
  ToggleControl,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TrayIconButton,
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
  SwitchToggle,
  SwitchTrack,
  ToggleControl,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TrayIconButton,
};

export type { AvisoTransitorio } from "./feedback/ToastArea.vue";
export type { TonoDelAviso } from "./feedback/tonos";
export { CLASES_POR_TONO, rolDelTono } from "./feedback/tonos";
export type { ContextoDelMenu, FocoAlAbrir } from "./dropdown/tipos";
export type { ContextoDelDialogo } from "./dialog/tipos";
export type { OpcionDeBusqueda } from "./search/buscar";
export { buscarOpciones } from "./search/buscar";
export { CLAVE_DEL_DIALOGO, usarElDialogo } from "./dialog/tipos";
export { CLAVE_DEL_MENU, usarElMenu } from "./dropdown/tipos";
export type { ContextoDelTooltip } from "./tooltip/tipos";
export { CLAVE_DEL_TOOLTIP, usarElTooltip } from "./tooltip/tipos";
export type { SidebarCategory, SidebarItem } from "./sidebar/tipos";
export type { AccionDePestana, ElementoDePestana } from "./tabs/tipos";
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
