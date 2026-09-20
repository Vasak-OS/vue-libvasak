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
import ConfigSection from "./layout/ConfigSection.vue";
import DeviceCard from "./cards/DeviceCard.vue";
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
  ConfigSection,
  DeviceCard,
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
  ConfigSection,
  DeviceCard,
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
  ToggleControl,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TrayIconButton,
};

export type { ContextoDelMenu, FocoAlAbrir } from "./dropdown/tipos";
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
