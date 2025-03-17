// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { fabric } from 'fabric';

declare module 'fabric' {
  interface Canvas {
    updateZIndexes: () => void;
  }
  interface Object {
    zIndex?: number;
  }
}
