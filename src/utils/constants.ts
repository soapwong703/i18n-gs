import i18nGSConfig, {
  CredentialType,
  KeyStyle,
  LogLevel,
} from "../types/i18nGSConfig";

export const configFilename = "i18n-gs.config.js";

export const baseConfig: i18nGSConfig = {
  spreadsheet: {
    sheetId: undefined,
    credential: {
      type: CredentialType.ServiceAccount,
      path: undefined,
    },
  },
  i18n: {
    path: undefined,
    keyStyle: KeyStyle.Nested,
    locales: {
      includes: undefined,
      excludes: undefined,
    },
    namespaces: {
      includes: undefined,
      excludes: undefined,
    },
  },
  logging: {
    level: LogLevel.Info,
  },
};
