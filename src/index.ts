#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import { program } from "commander";
import { generateConfigFile } from "./utils/helper";
import { configFilename } from "./utils/constants";
import I18nGS from "./classes/I18nGS";
import log from "loglevel";

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
  .command("import [namespace...]")
  .description("Import the files from google sheet")
  .option("-l, --locale <locales...>")
  .action(async (namespace, options) => {
    const i18nGS = new I18nGS();
    log.debug("namespace:", namespace);
    log.debug("--locale:", options.locale);

    await i18nGS.connect();
    const sheets = await i18nGS.readSheets(namespace, options.locale);

    // log.debug(sheets);
    log.info(`Finished importing ${Object.keys(sheets).length} sheets`);
  });

// program
//   .command("export")
//   .description("Export the files to google sheet")
//   .action((namespace) => {
//     const i18nGS = new I18nGS();
//   });

program.parse();
