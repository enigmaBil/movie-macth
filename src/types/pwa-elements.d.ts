declare module '@ionic/pwa-elements/loader' {
  export function defineCustomElements(win?: Window): Promise<void>;
  export function applyPolyfills(): Promise<void>;
}
