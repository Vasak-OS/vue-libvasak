import SideBar from "./sidebar/SideBar.vue";
import SideButton from "./sidebar/SideButton.vue";
import WindowFrame from "./window/WindowFrame.vue";
import type { App } from "vue";

const components = [SideBar, SideButton, WindowFrame];

export default {
  install(app: App) {
    components.forEach((component) => {
      app.component(component.name as string, component);
    });
  },
};

export { SideBar, SideButton, WindowFrame };
