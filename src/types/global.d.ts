import type { IStaticMethods } from "preline/dist";

declare global {
  interface Window {
    _?: any;
    $: typeof import("jquery");
    jQuery: typeof import("jquery");
    DataTable?: any;
    Dropzone?: any;
    VanillaCalendarPro?: any;
    noUiSlider?: any;

    HSStaticMethods: IStaticMethods;
  }
}
export {};
