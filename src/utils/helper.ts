import i18nGSConfig from "i18nGSConfig";
import { configFilename } from "./constants";

import fs = require("fs");

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
    logging: {
      level: "info",
    },
  };

  fs.writeFileSync(
    configFilename,
    "module.exports = " + JSON.stringify(template, null, 2)
  );
  return;
}
