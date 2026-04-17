import path from "node:path";

import { createRuntime } from "./create-runtime.js";

const runtime = await createRuntime({
  rootDir: path.resolve(process.cwd(), "data")
});

const processed = await runtime.ingestWorker.processPendingIngests();
console.log(`processed ${processed.length} ingest manifest(s)`);
