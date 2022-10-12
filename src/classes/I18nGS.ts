import { program } from "commander";
import { GoogleSpreadsheet } from "google-spreadsheet";
import i18nGSConfig from "i18nGSConfig";
import log from "loglevel";
import * as path from "path";
import { configFilename } from "../utils/constants";

/**
 * @todo support keyStyle
 * @todo support locales includes / excludes
 * @todo support namespace includes / excludes
 */

class i18nGS {
  protected config: i18nGSConfig;
  protected doc: GoogleSpreadsheet;

  constructor() {
    this.loadConfig();
    this.doc = new GoogleSpreadsheet(this.config.spreadsheet.sheetId);

    const logLevel = this.config.logging.level;
    if (logLevel === "none") log.setLevel("silent", false);
    else log.setLevel(logLevel, false);

    log.debug("Loaded config file:", this.config);

    switch (this.config.spreadsheet.credential.type) {
      case "serviceAccount":
        this.connectWithServiceAccount();
    }
  }

  private loadConfig() {
    const pathname = path.resolve(configFilename);
    try {
      this.config = require(pathname);
    } catch (err) {
      program.error(`Cannot not find a config file at: '${pathname}'`);
    }
  }

  private async connectWithServiceAccount() {
    const pathname = path.resolve(this.config.spreadsheet.credential.path);
    let credential = null;

    try {
      credential = require(pathname);
    } catch {
      program.error(`Cannot not find a credential file at: '${pathname}'`);
    }

    await this.doc.useServiceAccountAuth(credential);
    await this.doc.loadInfo();

    log.debug("Service account credential verified");
  }

  private async readSheet(sheetTitle) {
    const sheet = this.doc.sheetsByTitle[sheetTitle];
    if (!sheet) return log.error(`Sheet '${sheetTitle}' not found`);
    const rows = await sheet.getRows();
    const langKeys = sheet.headerValues.slice(1);
    let result = {};
    rows.forEach((row) => {
      langKeys.forEach((langKey) => {
        result[langKey] = result[langKey] || {};
        result[langKey][row.key] = row[langKey] ?? "";
      });
    });
    return result;
  }
}

export default i18nGS;
