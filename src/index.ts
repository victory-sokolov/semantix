#!/usr/bin/env node

import { ConventionalCommitSetup } from "./setup";
import { resolve } from "node:path";

// CLI execution
const targetDir = process.argv[2] ? resolve(process.argv[2]) : undefined;
const setup = new ConventionalCommitSetup(targetDir);
setup.setup().catch((error) => {
  console.error(error);
  process.exit(1);
});
