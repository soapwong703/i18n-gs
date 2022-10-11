type Config = {
  locales: {
    include: string[];
  };
  namespaces: {
    include: string[];
  };
  spreadsheet: {
    sheetId: string;
    credential: {
      path: string;
      // or others methods
    };
  };
  logging: {
    level: "none" | "error" | "warn" | "info" | "log" | "verbose";
  };
  i18n: {
    keyStyle: "auto" | "flat" | "nested";
  };
};

export default Config;
