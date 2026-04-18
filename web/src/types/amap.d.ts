declare global {
  interface Window {
    AMap?: {
      Map: new (
        container: string | HTMLDivElement,
        options?: Record<string, unknown>,
      ) => {
        destroy?: () => void;
        add?: (overlays: unknown[]) => void;
        setFitView?: () => void;
      };
      Marker: new (options?: Record<string, unknown>) => {
        on?: (event: string, handler: () => void) => void;
      };
      Pixel: new (x: number, y: number) => unknown;
      Icon: new (options?: Record<string, unknown>) => unknown;
    };
  }
}

export {};
