// Apple entry: the iOS/macOS Shortcut ("Run JavaScript on Web Page") and the Safari bookmark.
// Both normally run a tiny loader (see tools/build.ts) that downloads this file from the release channel,
// so Apple users always get the latest version without re-adding anything.
//
// Shortcuts defines a global `completion(value)` that MUST be called, and kills slow scripts, so we
// always answer within the time budget even if pagination is still loading. A bookmark has no
// `completion`; then there's nobody to answer and we just run.
import { boot } from './boot.ts';

declare const completion: ((value: unknown) => void) | undefined;

const TIME_BUDGET_MS = 8000;
let done = false;
const finish = (value: unknown) => {
  if (done) return;
  done = true;
  if (typeof completion === 'function') completion(value);
};

setTimeout(() => finish({ rendered: false, reason: 'timeout' }), TIME_BUDGET_MS);
// Running the Shortcut or tapping the bookmark is an explicit request, so open even if "open
// automatically" is off. The code itself is always the latest, so no "update available" bar.
boot({ forceOpen: true, platform: 'apple', selfUpdating: true }).then(
  ({ result, rendered }) => finish({ rendered, reason: result.ok ? null : result.reason }),
  (err) => finish({ rendered: false, reason: String(err) }),
);
