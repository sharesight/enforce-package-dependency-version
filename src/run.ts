import { setOutput, setFailed } from "@actions/core";

import {
  getTargetVersion,
  setTargetVersion,
  getResolvedVersion,
  setResolvedVersion,
} from "./version";
import { enforceVersion } from "./enforce";

function run(): void {
  try {
    setTargetVersion(); // sets to an output
    setResolvedVersion(); // sets to an output

    enforceVersion();
  } catch (error) {
    setFailed(error.message);
  }
}

// NOTE: The purpose of this file is to execute on load.
run();
