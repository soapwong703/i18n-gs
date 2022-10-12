type Config = {
  locales: {
    include: string[];
  };
  sheets: {
    include: string[];
  };
  credential: {
    path: string;
    // or others methods
  };
  logging: {
    level: "none" | "error" | "warn" | "info" | "log" | "verbose";
  };
  i18n: {
    keyStyle: "auto" | "flat" | "nested";
  };
};

export default Config;
