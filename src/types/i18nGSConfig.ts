type Credential = {
  // apiKey method is readonly
  type: "serviceAccount"; // TODO: | "apiKey" | "OAuth"
  path: string;
};

type i18nGSConfig = {
  spreadsheet: {
    sheetId: string;
    credential: Credential;
  };
  i18n: {
    keyStyle: "auto" | "flat" | "nested";
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
    level: "none" | "error" | "warn" | "info" | "debug";
  };
};

export default i18nGSConfig;
