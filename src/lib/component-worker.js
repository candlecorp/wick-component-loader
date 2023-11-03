// This is the entry point for the web worker. You can reference the pre-built WasmRS
// worker or import it and call `.main()` like we do here for better integration with your
// build system.

import { worker } from 'wasmrs-js';
worker.main();
