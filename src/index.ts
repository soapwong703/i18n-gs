#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import { program } from "commander";
import { generateConfigFile, getConfig } from "./utils/helper";
import { configFilename } from "./utils/constants";

program
  .command("init")
  .description("Initialize the project with config file")
  .action(() => {
    const pathname = path.resolve(configFilename);
    const configFile = fs.existsSync(pathname);

    if (configFile)
      return program.error(
        `A '${configFilename}' file is already defined at: '${pathname}'`
      );

    generateConfigFile();
  });

program
  .command("import")
  .description("Import the files from google sheet")
  .action(() => {
    const config = getConfig();
    console.log(config);
  });

program
  .command("export")
  .description("Export the files to google sheet")
  .action(() => {
    const config = getConfig();
    console.log(config);
  });

program.parse();
