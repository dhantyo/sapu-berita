// Injected by the Android link-router app into its WebView after the page loads.
// Reports the outcome to the app through an optional JavaScript interface so it can
// fall back to opening the link in the user's normal browser.
import { boot } from './boot.ts';

interface AndroidBridge {
  onResult(json: string): void;
}

declare global {
  interface Window {
    BacaBersihAndroid?: AndroidBridge;
  }
}

void boot().then(
  ({ result, rendered }) =>
    window.BacaBersihAndroid?.onResult(JSON.stringify({ rendered, reason: result.ok ? null : result.reason })),
  (err) => window.BacaBersihAndroid?.onResult(JSON.stringify({ rendered: false, reason: String(err) })),
);
