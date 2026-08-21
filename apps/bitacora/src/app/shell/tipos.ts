import type { IconProp } from '@fortawesome/fontawesome-svg-core';

/** Una entrada del menú lateral. `exact` distingue la raíz del resto. */
export interface ItemMenu {
  readonly icon: IconProp;
  readonly label: string;
  readonly route: string;
  readonly exact: boolean;
}
