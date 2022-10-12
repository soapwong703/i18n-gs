import i18nGSConfig from "i18nGSConfig";
import * as fs from "fs";
import { program } from "commander";
import path = require("path");
import { configFilename } from "./constants";

export function generateConfigFile(): i18nGSConfig {
  const template: i18nGSConfig = {
    spreadsheet: {
      sheetId: "<your sheet id>",
      credential: {
        type: "serviceAccount",
        path: "<your credential file path>",
      },
    },
    i18n: {
      keyStyle: "auto",
    },
  };

  fs.writeFileSync(
    configFilename,
    "module.exports = " + JSON.stringify(template, null, 2)
  );
  return;
}

export function getConfig(): i18nGSConfig {
  const pathname = path.resolve(configFilename);
  try {
    return require(pathname);
  } catch (err) {
    program.error(`Cannot not find a config file at: '${pathname}'`);
  }
}
