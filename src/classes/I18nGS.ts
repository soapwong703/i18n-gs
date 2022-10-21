import {
  GoogleSpreadsheet,
  GoogleSpreadsheetRow,
  GoogleSpreadsheetWorksheet,
} from "google-spreadsheet";
import i18nGSConfig, { LogLevel } from "../types/i18nGSConfig";
import * as path from "path";
import * as fs from "fs-extra";
import { i18nRecord, NamespaceData, SheetsData } from "i18nGSData";
import log, { exit } from "../utils/log";

import ora = require("ora");

const { unflatten, flatten } = require("flat");

class i18nGS {
  private config: i18nGSConfig;
  private doc: GoogleSpreadsheet;
  private spinner: ora.Ora;

  constructor(config: i18nGSConfig) {
    this.config = config;
    this.doc = new GoogleSpreadsheet(this.config.spreadsheet.sheetId);
    this.spinner = ora({
      isSilent: config?.logging?.level === LogLevel.Silent,
    });

    if (this.config?.i18n?.namespaces?.excludes)
      log.debug(
        `Excluding namespaces:`,
        this.config?.i18n?.namespaces?.excludes
      );
    if (this.config?.i18n?.locales?.excludes)
      log.debug(`Excluding locales:`, this.config?.i18n?.locales?.excludes);
  }

  async connect() {
    switch (this.config.spreadsheet.credential.type) {
      case "serviceAccount":
        await this.connectWithServiceAccount();
    }
  }

  private async connectWithServiceAccount() {
    const pathname = path.resolve(this.config.spreadsheet.credential.path);
    let credential = null;

    try {
      credential = require(pathname);
    } catch {
      exit(`Credential file is not defined at: '${pathname}'`);
    }

    await this.doc.useServiceAccountAuth(credential);
    await this.doc.loadInfo();

    log.debug("Service account credential verified");
  }

  async readSheet(namespace: string): Promise<NamespaceData> {
    const sheet = this.doc.sheetsByTitle[namespace];
    if (!sheet) {
      log.warn(`Sheet '${namespace}' not found`);
      return undefined;
    }
    this.spinner.start(`Loading sheet '${namespace}'`);

    const rows = await sheet.getRows();

    const locales = (
      this.config?.i18n?.locales?.includes ??
      sheet.headerValues.slice(1) ??
      []
    ).filter(
      (locale) => !this.config?.i18n?.locales?.excludes?.includes(locale)
    );
    if (locales.length === 0) {
      this.spinner.fail();
      log.warn(`No locale available in ${namespace}`);
      return undefined;
    }

    let namespaceData: NamespaceData = {};
    rows.forEach((row) => {
      locales.forEach((langKey) => {
        namespaceData[langKey] = namespaceData[langKey] || {};
        namespaceData[langKey][row.key] = row[langKey] ?? "";
      });
    });

    if (this.config.logging.level === LogLevel.Debug)
      this.spinner.succeed(
        `Loaded sheet '${namespace}' with locale '${locales}'`
      );
    else this.spinner.stop();

    return namespaceData;
  }

  async readSheets(): Promise<SheetsData> {
    const namespaces = (
      this.config?.i18n?.namespaces?.includes ??
      Object.keys(this.doc.sheetsByTitle) ??
      []
    ).filter(
      (namespace) =>
        !this.config?.i18n?.namespaces?.excludes?.includes(namespace)
    );

    log.debug("Selected namespaces:", namespaces);

    if (namespaces.length === 0) exit("There is no selected namespace!");

    const sheetsData: SheetsData = {};

    for (const namespace of namespaces) {
      const sheet = await this.readSheet(namespace);
      if (sheet) sheetsData[namespace] = sheet;
    }

    return sheetsData;
  }

  writeFile(namespaceData: NamespaceData, namespace: string) {
    Object.keys(namespaceData).forEach((locale) => {
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

      const path = this.config.i18n.path;

      // if no folder, make directory
      if (!fs.existsSync(`${path}/${locale}`))
        fs.mkdirSync(`${path}/${locale}`, { recursive: true });

      // update namespace file, overwrite all data
      fs.writeJSONSync(`${path}/${locale}/${namespace}.json`, i18n, {
        spaces: 2,
      });
      log.debug(`Updated ${path}/${locale}/${namespace}.json`);
    });
  }

  writeFiles(data: SheetsData) {
    Object.entries(data).forEach(([namespace, namespaceData]) =>
      this.writeFile(namespaceData, namespace)
    );
  }

  readFile(path: string): i18nRecord {
    try {
      const data = fs.readJsonSync(path);
      return flatten(data);
    } catch (err) {
      exit(`File ${path} does not exists!`);
    }
  }

  async readFiles(): Promise<SheetsData> {
    const {
      i18n: {
        path,
        namespaces: {
          includes: _namespacesIncludes,
          excludes: _namespacesExcludes,
        },
        locales: { includes: _localesIncludes, excludes: _localesExcludes },
      },
    } = this.config;
    if (!fs.existsSync(path)) exit(`Path '${path}' does not exist`);

    const sheetsData: SheetsData = {};
    const locales = (
      _localesIncludes ??
      (await fs.readdirSync(path).filter((file) => !file.startsWith(".")))
    ).filter((locale) => !_localesExcludes?.includes(locale));

    if (locales.length === 0) exit("No locale available!");

    locales.forEach((locale) => {
      const extensionRegExp = /\.\w+/g;
      const files = fs
        .readdirSync(`${path}/${locale}`)
        .filter((file) => !file.startsWith("."));

      const namespaces = (
        _namespacesIncludes ??
        files.map((filename) => filename.replace(extensionRegExp, ""))
      ).filter((namespace) => !_namespacesExcludes?.includes(namespace));

      log.debug(`Selected namespaces in '${locale}':`, namespaces);

      if (namespaces.length === 0)
        exit(`There is no available namespace in '${locale}'`);

      namespaces.forEach((namespace) => {
        log.debug(`Loading namespace '${namespace}' in '${locale}'`);
        const data = this.readFile(`${path}/${locale}/${namespace}.json`);
        if (!data) return;
        sheetsData[namespace] = sheetsData[namespace] || {};
        Object.entries(data).forEach(([key, value]) => {
          sheetsData[namespace][locale] = sheetsData[namespace][locale] || {};
          sheetsData[namespace][locale][key] = value;
        });
      });
    });

    return sheetsData;
  }

  async upsertSheets(i18n: SheetsData) {
    function getKeyOrientedNamespaceData(data: NamespaceData): {
      [key: string]: { [locale: string]: string };
    } {
      return Object.entries(data).reduce((acc, [locale, record]) => {
        Object.entries(record).forEach(([key, value]) => {
          acc[key] = acc[key] || {};
          acc[key][locale] = value;
        });
        return acc;
      }, {});
    }

    async function updateExistKey(
      sheet: GoogleSpreadsheetWorksheet,
      data: ReturnType<typeof getKeyOrientedNamespaceData>
    ): Promise<{
      remainingData: ReturnType<typeof getKeyOrientedNamespaceData>;
      updatedCount: number;
    }> {
      const rows = await sheet.getRows();
      const clone = JSON.parse(JSON.stringify(data));
      let updatedCount = 0;
      for (const row of rows) {
        if (!clone?.[row.key]) continue;
        for (const locale in clone[row.key]) {
          const columnIndex = sheet.headerValues.findIndex(
            (header) => header === locale
          );
          if (columnIndex === -1) continue;
          const cell = sheet.getCell(row.rowIndex - 1, columnIndex);
          if (cell.value !== clone[row.key][locale]) {
            if (cell.value === null && !clone[row.key][locale]) continue;
            log.debug(`Updating ${sheet.title}/${row.key}/${locale}`);
            cell.value = clone[row.key][locale] ?? "";
            updatedCount++;
          }
        }
        delete clone[row.key];
      }

      if (updatedCount > 0) await sheet.saveUpdatedCells();

      return { remainingData: clone, updatedCount };
    }

    async function appendNonExistKey(
      sheet: GoogleSpreadsheetWorksheet,
      data: ReturnType<typeof getKeyOrientedNamespaceData>
    ): Promise<{ appendedCount: number }> {
      const appendRows = Object.entries(data).map(([key, value]) => ({
        key,
        ...value,
      }));

      if (appendRows.length > 0)
        await sheet.addRows(appendRows).then(() => {
          if (log.getLevel() <= log.levels.DEBUG)
            appendRows.forEach((col) =>
              log.debug(`Appended row '${col.key}' to '${sheet.title}'`)
            );
        });

      return { appendedCount: appendRows.length };
    }

    for await (const [namespace, data] of Object.entries(i18n)) {
      const locales = Object.keys(data);
      const defaultHeaderRow = ["key", ...locales];
      let sheet = this.doc.sheetsByTitle?.[namespace];

      if (!sheet) {
        sheet = await this.doc.addSheet({
          title: namespace,
          headerValues: defaultHeaderRow,
        });
        log.debug(`Created sheet '${namespace}'`);
      }
      this.spinner.start(`Uploading sheet '${namespace}'`);

      await sheet.loadHeaderRow().catch(async () => {
        // if no header row, assume sheet is empty and insert default header
        await sheet.setHeaderRow(defaultHeaderRow);
      });

      if (!sheet.headerValues[0]) {
        exit(`Header is invalid! Please set cell A1 to 'key'`);
      }
      const headerNotFound = defaultHeaderRow.filter(
        (col) => !sheet.headerValues.includes(col)
      );
      if (headerNotFound.length > 0) {
        log.warn(
          `Header '${headerNotFound.join(
            ","
          )}' not found! These locales will be skipped`
        );
      }

      await sheet.loadCells();

      const keyData = getKeyOrientedNamespaceData(data);
      const { remainingData, updatedCount } = await updateExistKey(
        sheet,
        keyData
      );
      const { appendedCount } = await appendNonExistKey(sheet, remainingData);

      this.spinner.succeed(
        `Uploaded sheet '${namespace}': updated ${updatedCount} cells, appended ${appendedCount} rows`
      );
    }
  }
}

export default i18nGS;
