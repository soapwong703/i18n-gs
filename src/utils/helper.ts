import i18nGSConfig from "i18nGSConfig";
import { configFilename, baseConfig as baseConfig } from "./constants";

import * as path from "path";
import * as fs from "fs";
import { DeepPartial } from "DeepPartial";
import log from "loglevel";

/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
export function isObject(item) {
  return item && typeof item === "object" && !Array.isArray(item);
}

/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */
export function mergeDeep(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}

export function removeEmptyProperty(obj) {
  // mutate target obj
  Object.keys(obj).forEach((key) => {
    if (obj[key] === undefined) delete obj[key];
    if (typeof obj[key] === "object") removeEmptyProperty(obj[key]);
  });
}

export function generateConfigFile(): i18nGSConfig {
  const configTemplate: i18nGSConfig = {
    spreadsheet: {
      sheetId: "<your sheet id>",
      credential: {
        type: "serviceAccount",
        path: "<your credential file path>",
      },
    },
    i18n: {
      path: "<your locale directory path>",
      keyStyle: "nested",
    },
    logging: {
      level: "info",
    },
  };

  fs.writeFileSync(
    configFilename,
    "module.exports = " + JSON.stringify(configTemplate, null, 2)
  );
  return;
}

export function extractGoogleSheetError(err) {
  if (!err?.response?.data?.error) return "";

  const {
    code,
    message,
  }: {
    code: number;
    message: string;
    status: string;
    details: Record<string, any>[];
  } = err?.response?.data?.error;

  return `[GoogleAPIError:${code}] ${message}`;
}

export function initConfig(inlineConfig?: DeepPartial<i18nGSConfig>) {
  const pathname = path.resolve(configFilename);
  const fileConfig = require(pathname);
  const config = baseConfig;

  // TODO verify configfile

  if (initConfig) mergeDeep(config, fileConfig, inlineConfig);

  const {
    logging: { level },
  } = config;

  if (log.levels[level] !== undefined) log.setLevel(level, false);
  else log.setLevel(baseConfig.logging.level, false);

  return config;
}
