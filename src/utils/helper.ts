import i18nGSConfig, {
  CredentialType,
  KeyStyle,
  LogLevel,
} from "../types/i18nGSConfig";
import { configFilename, baseConfig } from "./constants";

import * as path from "path";
import * as fs from "fs";
import { DeepPartial } from "DeepPartial";
import { validateConfig } from "./validate";
import log, { exit } from "./log";

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

export function generateConfigFile(
  config?: DeepPartial<i18nGSConfig>
): i18nGSConfig {
  const configTemplate: i18nGSConfig = {
    spreadsheet: {
      sheetId: "<your sheet id>",
      credential: {
        type: CredentialType.ServiceAccount,
        path: "<your credential file path>",
      },
    },
    i18n: {
      path: "<your locale directory path>",
      keyStyle: KeyStyle.Nested,
    },
    logging: {
      level: LogLevel.Info,
    },
  };

  fs.writeFileSync(
    configFilename,
    "module.exports = " +
      JSON.stringify(mergeDeep(configTemplate, config), null, 2)
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

export function initConfig(customConfig?: DeepPartial<i18nGSConfig>) {
  const pathname = path.resolve(configFilename);
  let fileConfig = undefined;
  const config = baseConfig;

  try {
    fileConfig = require(pathname);
  } catch (err) {
    exit(`'${configFilename}' is not defined at: '${pathname}'`);
  }

  if (customConfig) mergeDeep(config, fileConfig, customConfig);

  validateConfig(config);

  const {
    logging: { level },
  } = config;

  log.setLevel(level, false);

  return config;
}
