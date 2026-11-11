// iOS Shortcuts "Run JavaScript on Web Page" entry.
// Shortcuts injects a global `completion(value)` that MUST be called, and kills slow scripts,
// so we always answer within the time budget even if pagination is still loading.
import { boot } from './boot.ts';

declare const completion: (value: unknown) => void;

const TIME_BUDGET_MS = 8000;
let done = false;
const finish = (value: unknown) => {
  if (done) return;
  done = true;
  completion(value);
};

setTimeout(() => finish({ rendered: false, reason: 'timeout' }), TIME_BUDGET_MS);
// Running the Shortcut is an explicit request, so open even if "open automatically" is off.
boot({ forceOpen: true, platform: 'apple' }).then(
  ({ result, rendered }) => finish({ rendered, reason: result.ok ? null : result.reason }),
  (err) => finish({ rendered: false, reason: String(err) }),
);
