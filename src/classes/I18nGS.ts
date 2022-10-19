import { program } from "commander";
import { GoogleSpreadsheet } from "google-spreadsheet";
import i18nGSConfig from "i18nGSConfig";
import log from "loglevel";
import * as path from "path";
import * as fs from "fs-extra";
import { NamespaceData, SheetsData } from "i18nGSData";

const { unflatten, flatten } = require("flat");

/**
 * @todo support keyStyle
 * @todo support locales includes / excludes
 * @todo support namespace includes / excludes
 */

class i18nGS {
  protected config: i18nGSConfig;
  protected doc: GoogleSpreadsheet;

  constructor(config) {
    this.config = config;
    this.doc = new GoogleSpreadsheet(this.config.spreadsheet.sheetId);

    if (this.config?.i18n?.namespaces?.excludes)
      log.info(
        `Excluding namespaces:`,
        this.config?.i18n?.namespaces?.excludes
      );
    if (this.config?.i18n?.locales?.excludes)
      log.info(`Excluding locales:`, this.config?.i18n?.locales?.excludes);
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
      program.error(`Cannot not find a credential file at: '${pathname}'`);
    }

    await this.doc.useServiceAccountAuth(credential);
    await this.doc.loadInfo();

    log.debug("Service account credential verified");
  }

  async readSheet(namespace: string): Promise<NamespaceData> {
    const sheet = this.doc.sheetsByTitle[namespace];
    if (!sheet) {
      log.error(`Sheet '${namespace}' not found`);
      return undefined;
    }

    const rows = await sheet.getRows().catch((err) => {
      log.error(`Loading Sheet '${namespace}'`);
      throw err;
    });

    const locales = (
      this.config?.i18n?.locales?.includes ??
      sheet.headerValues.slice(1) ??
      []
    ).filter(
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

    if (namespaces.length === 0)
      program.error("There is no selected namespace!");

    const objBySheet = {};

    for (const namespace of namespaces) {
      const sheet = await this.readSheet(namespace);
      if (sheet) objBySheet[namespace] = sheet;
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
        log.info(`creating ${path}/${locale}/${namespace}.json`);
      else log.info(`updating ${path}/${locale}/${namespace}.json`);

      // update namespace file, overwrite all data
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

  readFile(path) {
    try {
      const data = fs.readJsonSync(path);
      return flatten(data);
    } catch (err) {
      log.error(`Fail to open ${path}`);
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
    if (!fs.existsSync(path)) throw new Error(`Path '${path}' does not exist`);

    const sheetsData = {};
    const locales = (
      _localesIncludes ??
      (await fs.readdirSync(path).filter((file) => !file.startsWith(".")))
    ).filter((locale) => !_localesExcludes?.includes(locale));

    if (locales.length === 0) program.error("There is no selected locales!");

    locales.forEach((locale) => {
      const extReg = /\.\w+/g;
      const files = fs
        .readdirSync(`${path}/${locale}`)
        .filter((file) => !file.startsWith("."));

      const namespaces = (
        _namespacesIncludes ??
        files.map((filename) => filename.replace(extReg, ""))
      ).filter((namespace) => !_namespacesExcludes?.includes(namespace));

      log.debug(`Selected namespaces in '${locale}':`, namespaces);

      if (namespaces.length === 0)
        log.error(`There is no available namespace in '${locale}'`);

      namespaces.forEach((namespace) => {
        log.info(`Loading namespace '${namespace}' in '${locale}'`);
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

  async upsertAllSheets(i18n: SheetsData) {
    for await (const [namespace, data] of Object.entries(i18n)) {
      const locales = Object.keys(data);

      const newHeaderColumn = ["key", ...locales];
      if (!this.doc.sheetsByTitle?.[namespace]) {
        await this.doc.addSheet({
          title: namespace,
          headerValues: newHeaderColumn,
        });
        log.info(`Created sheet '${namespace}'`);
      }
      log.info(`Uploading to sheet '${namespace}'`);
      const sheet = this.doc.sheetsByTitle[namespace];

      await sheet.loadHeaderRow().catch(async () => {
        // if no header row, assume sheet is empty
        await sheet.setHeaderRow(newHeaderColumn);
      });

      if (sheet.headerValues[0] !== "key")
        program.error(
          `Sheet '${namespace}' has invalid value in header, please set cell A1 value to 'key'`
        );

      newHeaderColumn.forEach((col) => {
        log.debug(`Checking header column '${col}' is exist`);
        if (!sheet.headerValues.includes(col))
          program.error(
            `Header '${col}' not found! Please include it in the sheet and try again`
          );
      });

      await sheet.loadCells();
      const rows = await sheet.getRows();

      const updateObject: { [key: string]: { [locale: string]: string } } =
        Object.entries(data).reduce((acc, [locale, record]) => {
          Object.entries(record).forEach(([key, value]) => {
            acc[key] = acc[key] || {};
            acc[key][locale] = value;
          });
          return acc;
        }, {});

      // update existing keys
      let updatedCells = 0;
      for await (const row of rows) {
        if (!updateObject?.[row.key]) continue;
        for (const lang in updateObject[row.key]) {
          const columnIndex = sheet.headerValues.findIndex(
            (col) => col === lang
          );
          const cell = await sheet.getCell(row.rowIndex - 1, columnIndex);
          if (cell.value !== updateObject[row.key][lang]) {
            if (cell.value === null && !updateObject[row.key][lang]) continue;
            log.debug(`Updating ${namespace}/${row.key}/${lang}`);
            cell.value = updateObject[row.key][lang] ?? "";
            updatedCells++;
          }
        }
        delete updateObject[row.key];
      }
      if (updatedCells > 0) await sheet.saveUpdatedCells();
      log.info(`Sheet '${namespace}' has updated ${updatedCells} cells`);

      // append non-existing key
      const appendArray = Object.entries(updateObject).map(([key, value]) => ({
        key,
        ...value,
      }));

      if (appendArray.length > 0)
        await sheet.addRows(appendArray).then(() => {
          if (log.getLevel() <= log.levels.DEBUG)
            appendArray.forEach((col) =>
              log.debug(`Appended row '${col.key}' to '${namespace}'`)
            );
        });

      log.info(`Sheet '${namespace}' has appended ${appendArray.length} rows`);
    }
  }
}

export default i18nGS;
