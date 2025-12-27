#!/usr/bin/env node

import { ConventionalCommitSetup } from "./setup";

// CLI execution
const setup = new ConventionalCommitSetup();
setup.setup().catch((error) => {
  console.error(error);
  process.exit(1);
});
