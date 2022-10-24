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
import i18nGSConfig from "./types/i18nGSConfig";
import { DeepPartial } from "./types/DeepPartial";
import log, { exit } from "./utils/log";

program
  .command("init")
  .description("Initialize the project with config file")
  .action(() => {
    const pathname = path.resolve(configFilename);
    const configFile = fs.existsSync(pathname);

    if (configFile)
      return exit(
        `A '${configFilename}' file is already defined at: '${pathname}'`
      );

    generateConfigFile();
  });

program
  .command("download [namespaces...]")
  .description("Download the files from google sheet")
  .option("-l, --locales <locales...>", "locales to be included")
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
        exit(`No sheets available for download!`);

      i18nGS.writeFiles(sheets);

      log.info(`Finished downloading ${Object.keys(sheets).length} sheets`);
    } catch (err) {
      i18nGS.failSpinner();
      if (!!extractGoogleSheetError(err))
        return exit(extractGoogleSheetError(err));
      return exit(err);
    }
  });

program
  .command("upload [namespaces...]")
  .description("Upload the files to google sheet (only support flat key style)")
  .option("-l, --locales <locales...>", "locales to be included")
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
      await i18nGS.upsertSheets(sheetsData);

      log.info(`Finished uploading ${Object.keys(sheetsData).length} sheets`);
    } catch (err) {
      i18nGS.failSpinner();
      if (!!extractGoogleSheetError(err))
        return exit(extractGoogleSheetError(err));
      return exit(err);
    }
  });

program.parse();
