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
import { DeepPartial } from "DeepPartial";
import log from "./utils/log";

program
  .command("init")
  .description("Initialize the project with config file")
  .action(() => {
    const pathname = path.resolve(configFilename);
    const configFile = fs.existsSync(pathname);

    if (configFile)
      return log.error(
        `A '${configFilename}' file is already defined at: '${pathname}'`
      );

    generateConfigFile();
  });

program
  .command("download [namespaces...]")
  .description("Download the files from google sheet")
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
        log.error(`No sheets available for download!`);

      i18nGS.writeFiles(sheets);

      log.info(`Finished downloading ${Object.keys(sheets).length} sheets`);
    } catch (err) {
      log.error(`Download failed!`);
      if (!!extractGoogleSheetError(err))
        return log.error(extractGoogleSheetError(err));
      return log.error(err);
    }
  });

program
  .command("upload [namespaces...]")
  .description("Upload the files to google sheet")
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
      await i18nGS.upsertSheets(sheetsData);

      log.info(`Finished uploading ${Object.keys(sheetsData).length} sheets`);
    } catch (err) {
      log.error(`Upload failed!`);
      if (!!extractGoogleSheetError(err))
        return log.error(extractGoogleSheetError(err));
      return log.error(err);
    }
  });

program.parse();
