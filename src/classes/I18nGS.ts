import { program } from "commander";
import { GoogleSpreadsheet } from "google-spreadsheet";
import i18nGSConfig from "i18nGSConfig";
import log from "loglevel";
import * as path from "path";
import { extractGoogleSheetError } from "../utils/helper";
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
  }

  async connect() {
    switch (this.config.spreadsheet.credential.type) {
      case "serviceAccount":
        await this.connectWithServiceAccount();
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

  async readSheet(namespace: string, _locales?: string[]) {
    const sheet = this.doc.sheetsByTitle[namespace];
    if (!sheet) return log.error(`Sheet '${namespace}' not found`);

    try {
      const rows = await sheet.getRows();

      const locales = (_locales ?? sheet.headerValues.slice(1) ?? []).filter(
        (locale) => !this.config?.i18n?.locales?.excludes?.includes(locale)
      );
      if (locales.length === 0)
        return log.error(`No locale available in ${namespace}`);

      log.info(`Loading sheet '${namespace}' with locale '${locales}'`);
      let result = {};
      rows.forEach((row) => {
        locales.forEach((langKey) => {
          result[langKey] = result[langKey] || {};
          result[langKey][row.key] = row[langKey] ?? "";
        });
      });
      return result;
    } catch (err) {
      log.error(`Error while loading sheet '${namespace}'!`);
      if (!!extractGoogleSheetError(err))
        program.error(extractGoogleSheetError(err));
      program.error(err);
    }
  }

  async readSheets(_namespaces: string[], _locales?: string[]) {
    const namespaces = (
      _namespaces?.length > 0
        ? _namespaces
        : this.config?.i18n?.namespaces?.includes ??
          Object.keys(this.doc.sheetsByTitle) ??
          []
    ).filter(
      (namespace) =>
        !this.config?.i18n?.namespaces?.excludes?.includes(namespace)
    );

    log.debug("Selected namespaces:", namespaces);

    if (namespaces.length === 0)
      program.error("There is no selected namespace!");

    const objBySheet = {};

    for (const namespace of namespaces) {
      const sheet = await this.readSheet(namespace, _locales);
      objBySheet[namespace] = sheet;
    }

    return objBySheet;
  }
}

export default i18nGS;
