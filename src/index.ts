#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import { program } from "commander";
import {
  extractGoogleSheetError,
  generateConfigFile,
  initConfig,
  removeEmptyProperty,
} from "./utils/helper";
import { configFilename } from "./utils/constants";
import I18nGS from "./classes/I18nGS";
import log from "loglevel";
import i18nGSConfig from "i18nGSConfig";
import { DeepPartial } from "DeepPartial";

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
  .command("import [namespaces...]")
  .description("Import the files from google sheet")
  .option("-l, --locales <locales...>")
  .action(async (namespaces, options) => {
    const inlineConfig: DeepPartial<i18nGSConfig> = {
      i18n: {
        namespaces: {
          includes: namespaces.length > 0 ? namespaces : undefined,
        },
        locales: {
          includes: options.locales,
        },
      },
    };
    removeEmptyProperty(inlineConfig);
    const config = initConfig(inlineConfig);
    log.debug("namespace:", namespaces);
    log.debug("--locale:", options.locales);
    log.debug("Loaded config file:", config);

    const i18nGS = new I18nGS(config);
    try {
      await i18nGS.connect();
      const sheets = await i18nGS.readSheets();
      if (Object.values(sheets).length === 0)
        program.error(`No sheets available for import!`);

      i18nGS.writeFiles(sheets);

      // log.debug(sheets);
      log.info(`Finished importing ${Object.keys(sheets).length} sheets`);
    } catch (err) {
      log.error(`Import failed!`);
      if (!!extractGoogleSheetError(err))
        return program.error(extractGoogleSheetError(err));
      return program.error(err);
    }
  });

program
  .command("export [namespaces...]")
  .description("Export the files to google sheet")
  .option("-l, --locales <locales...>")
  .action(async (namespaces, options) => {
    const inlineConfig: DeepPartial<i18nGSConfig> = {
      i18n: {
        namespaces: {
          includes: namespaces.length > 0 ? namespaces : undefined,
        },
        locales: {
          includes: options.locales,
        },
      },
    };
    removeEmptyProperty(inlineConfig);
    const config = initConfig(inlineConfig);
    log.debug("namespace:", namespaces);
    log.debug("--locale:", options.locales);
    log.debug("Loaded config file:", config);

    const i18nGS = new I18nGS(config);
    try {
      await i18nGS.connect();

      const sheetsData = await i18nGS.readFiles();
      await i18nGS.upsertAllSheets(sheetsData);

      log.info(`Finished exporting ${Object.keys(sheetsData).length} sheets`);
    } catch (err) {
      log.error(`Export failed!`);
      if (!!extractGoogleSheetError(err))
        return program.error(extractGoogleSheetError(err));
      return program.error(err);
    }
  });

program.parse();
