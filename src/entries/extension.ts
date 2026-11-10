// Desktop dev extension content script (apps/extension). Runs automatically on supported sites.
import { boot } from './boot.ts';

void boot({ debug: true });
