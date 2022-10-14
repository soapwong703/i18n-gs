import { program } from "commander";
import { GoogleSpreadsheet } from "google-spreadsheet";
import i18nGSConfig from "i18nGSConfig";
import log from "loglevel";
import * as path from "path";
import * as fs from "fs-extra";
import { extractGoogleSheetError } from "../utils/helper";
import { configFilename } from "../utils/constants";
import { NamespaceData, SheetsData } from "i18nGSData";

const unflatten = require("flat").unflatten;

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

  async readSheet(
    namespace: string,
    _locales?: string[]
  ): Promise<NamespaceData> {
    const sheet = this.doc.sheetsByTitle[namespace];
    if (!sheet) {
      log.error(`Sheet '${namespace}' not found`);
      return undefined;
    }

    const rows = await sheet.getRows();

    const locales = (_locales ?? sheet.headerValues.slice(1) ?? []).filter(
      (locale) => !this.config?.i18n?.locales?.excludes?.includes(locale)
    );
    if (locales.length === 0) {
      log.error(`No locale available in ${namespace}`);
      return undefined;
    }

    log.info(`Loading sheet '${namespace}' with locale '${locales}'`);
    let result = {};
    rows.forEach((row) => {
      locales.forEach((langKey) => {
        result[langKey] = result[langKey] || {};
        result[langKey][row.key] = row[langKey] ?? "";
      });
    });
    return result;
  }

  async readSheets(
    _namespaces: string[],
    _locales?: string[]
  ): Promise<SheetsData> {
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

  writeFile(namespaceData: NamespaceData, namespace) {
    Object.keys(namespaceData).forEach((locale) => {
      // TODO maybe support command option
      const keyStyle = this.config?.i18n?.keyStyle;
      let i18n = undefined;

      switch (keyStyle) {
        case "flat":
          i18n = namespaceData[locale];
          break;
        case "nested":
        default:
          i18n = unflatten(namespaceData[locale], { object: true });
          break;
      }

      // TODO support command option
      const path = this.config.i18n.path;

      // if no folder, make folder
      if (!fs.existsSync(`${path}/${locale}`))
        fs.mkdirSync(`${path}/${locale}`, { recursive: true });

      // if no namespace file, make file
      if (!fs.existsSync(`${path}/${locale}/${namespace}.json`))
        console.log(`creating ${path}/${locale}/${namespace}.json`);
      // update namespace file, overwrite all data
      else console.log(`updating ${path}/${locale}/${namespace}.json`);
      fs.writeJSONSync(`${path}/${locale}/${namespace}.json`, i18n, {
        spaces: 2,
      });
    });
  }

  writeFiles(data: SheetsData) {
    Object.entries(data).forEach(([namespace, namespaceData]) =>
      this.writeFile(namespaceData, namespace)
    );
  }
}

export default i18nGS;
