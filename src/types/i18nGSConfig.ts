export enum CredentialType {
  ServiceAccount = "serviceAccount",
  // apiKey method is readonly
  // TODO: | "apiKey" | "OAuth"
}

export enum KeyStyle {
  Nested = "nested",
  Flat = "flat",
}

export enum LogLevel {
  Silent = "silent",
  Error = "error",
  Warn = "warn",
  Info = "info",
  Debug = "debug",
}

type Credential = {
  type: CredentialType.ServiceAccount;
  path: string;
};

type i18nGSConfig = {
  spreadsheet: {
    sheetId: string;
    credential: Credential;
  };
  i18n: {
    path: string;
    keyStyle: "nested" | "flat";
    locales?: {
      includes?: string[];
      excludes?: string[];
    };
    namespaces?: {
      includes?: string[];
      excludes?: string[];
    };
  };
  logging?: {
    level: LogLevel;
  };
};

export default i18nGSConfig;
