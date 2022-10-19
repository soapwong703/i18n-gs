"use strict";
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const google_spreadsheet_1 = require("google-spreadsheet");
const loglevel_1 = require("loglevel");
const path = require("path");
const fs = require("fs-extra");
const { unflatten, flatten } = require("flat");
/**
 * @todo support keyStyle
 * @todo support locales includes / excludes
 * @todo support namespace includes / excludes
 */
class i18nGS {
    constructor(config) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        this.config = config;
        this.doc = new google_spreadsheet_1.GoogleSpreadsheet(this.config.spreadsheet.sheetId);
        if ((_c = (_b = (_a = this.config) === null || _a === void 0 ? void 0 : _a.i18n) === null || _b === void 0 ? void 0 : _b.namespaces) === null || _c === void 0 ? void 0 : _c.excludes)
            loglevel_1.default.info(`Excluding namespaces:`, (_f = (_e = (_d = this.config) === null || _d === void 0 ? void 0 : _d.i18n) === null || _e === void 0 ? void 0 : _e.namespaces) === null || _f === void 0 ? void 0 : _f.excludes);
        if ((_j = (_h = (_g = this.config) === null || _g === void 0 ? void 0 : _g.i18n) === null || _h === void 0 ? void 0 : _h.locales) === null || _j === void 0 ? void 0 : _j.excludes)
            loglevel_1.default.info(`Excluding locales:`, (_m = (_l = (_k = this.config) === null || _k === void 0 ? void 0 : _k.i18n) === null || _l === void 0 ? void 0 : _l.locales) === null || _m === void 0 ? void 0 : _m.excludes);
    }
    async connect() {
        switch (this.config.spreadsheet.credential.type) {
            case "serviceAccount":
                await this.connectWithServiceAccount();
        }
    }
    async connectWithServiceAccount() {
        const pathname = path.resolve(this.config.spreadsheet.credential.path);
        let credential = null;
        try {
            credential = require(pathname);
        }
        catch (_a) {
            commander_1.program.error(`Cannot not find a credential file at: '${pathname}'`);
        }
        await this.doc.useServiceAccountAuth(credential);
        await this.doc.loadInfo();
        loglevel_1.default.debug("Service account credential verified");
    }
    async readSheet(namespace) {
        var _a, _b, _c, _d, _e;
        const sheet = this.doc.sheetsByTitle[namespace];
        if (!sheet) {
            loglevel_1.default.error(`Sheet '${namespace}' not found`);
            return undefined;
        }
        const rows = await sheet.getRows().catch((err) => {
            loglevel_1.default.error(`Loading Sheet '${namespace}'`);
            throw err;
        });
        const locales = ((_e = (_d = (_c = (_b = (_a = this.config) === null || _a === void 0 ? void 0 : _a.i18n) === null || _b === void 0 ? void 0 : _b.locales) === null || _c === void 0 ? void 0 : _c.includes) !== null && _d !== void 0 ? _d : sheet.headerValues.slice(1)) !== null && _e !== void 0 ? _e : []).filter((locale) => { var _a, _b, _c, _d; return !((_d = (_c = (_b = (_a = this.config) === null || _a === void 0 ? void 0 : _a.i18n) === null || _b === void 0 ? void 0 : _b.locales) === null || _c === void 0 ? void 0 : _c.excludes) === null || _d === void 0 ? void 0 : _d.includes(locale)); });
        if (locales.length === 0) {
            loglevel_1.default.error(`No locale available in ${namespace}`);
            return undefined;
        }
        loglevel_1.default.info(`Loading sheet '${namespace}' with locale '${locales}'`);
        let result = {};
        rows.forEach((row) => {
            locales.forEach((langKey) => {
                var _a;
                result[langKey] = result[langKey] || {};
                result[langKey][row.key] = (_a = row[langKey]) !== null && _a !== void 0 ? _a : "";
            });
        });
        return result;
    }
    async readSheets() {
        var _a, _b, _c, _d, _e;
        const namespaces = ((_e = (_d = (_c = (_b = (_a = this.config) === null || _a === void 0 ? void 0 : _a.i18n) === null || _b === void 0 ? void 0 : _b.namespaces) === null || _c === void 0 ? void 0 : _c.includes) !== null && _d !== void 0 ? _d : Object.keys(this.doc.sheetsByTitle)) !== null && _e !== void 0 ? _e : []).filter((namespace) => { var _a, _b, _c, _d; return !((_d = (_c = (_b = (_a = this.config) === null || _a === void 0 ? void 0 : _a.i18n) === null || _b === void 0 ? void 0 : _b.namespaces) === null || _c === void 0 ? void 0 : _c.excludes) === null || _d === void 0 ? void 0 : _d.includes(namespace)); });
        loglevel_1.default.debug("Selected namespaces:", namespaces);
        if (namespaces.length === 0)
            commander_1.program.error("There is no selected namespace!");
        const objBySheet = {};
        for (const namespace of namespaces) {
            const sheet = await this.readSheet(namespace);
            if (sheet)
                objBySheet[namespace] = sheet;
        }
        return objBySheet;
    }
    writeFile(namespaceData, namespace) {
        Object.keys(namespaceData).forEach((locale) => {
            var _a, _b;
            // TODO maybe support command option
            const keyStyle = (_b = (_a = this.config) === null || _a === void 0 ? void 0 : _a.i18n) === null || _b === void 0 ? void 0 : _b.keyStyle;
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
                loglevel_1.default.info(`creating ${path}/${locale}/${namespace}.json`);
            else
                loglevel_1.default.info(`updating ${path}/${locale}/${namespace}.json`);
            // update namespace file, overwrite all data
            fs.writeJSONSync(`${path}/${locale}/${namespace}.json`, i18n, {
                spaces: 2,
            });
        });
    }
    writeFiles(data) {
        Object.entries(data).forEach(([namespace, namespaceData]) => this.writeFile(namespaceData, namespace));
    }
    readFile(path) {
        try {
            const data = fs.readJsonSync(path);
            return flatten(data);
        }
        catch (err) {
            loglevel_1.default.error(`Fail to open ${path}`);
        }
    }
    async readFiles() {
        const { i18n: { path, namespaces: { includes: _namespacesIncludes, excludes: _namespacesExcludes, }, locales: { includes: _localesIncludes, excludes: _localesExcludes }, }, } = this.config;
        if (!fs.existsSync(path))
            throw new Error(`Path '${path}' does not exist`);
        const sheetsData = {};
        const locales = (_localesIncludes !== null && _localesIncludes !== void 0 ? _localesIncludes : (await fs.readdirSync(path).filter((file) => !file.startsWith(".")))).filter((locale) => !(_localesExcludes === null || _localesExcludes === void 0 ? void 0 : _localesExcludes.includes(locale)));
        if (locales.length === 0)
            commander_1.program.error("There is no selected locales!");
        locales.forEach((locale) => {
            const extReg = /\.\w+/g;
            const files = fs
                .readdirSync(`${path}/${locale}`)
                .filter((file) => !file.startsWith("."));
            const namespaces = (_namespacesIncludes !== null && _namespacesIncludes !== void 0 ? _namespacesIncludes : files.map((filename) => filename.replace(extReg, ""))).filter((namespace) => !(_namespacesExcludes === null || _namespacesExcludes === void 0 ? void 0 : _namespacesExcludes.includes(namespace)));
            loglevel_1.default.debug(`Selected namespaces in '${locale}':`, namespaces);
            if (namespaces.length === 0)
                loglevel_1.default.error(`There is no available namespace in '${locale}'`);
            namespaces.forEach((namespace) => {
                loglevel_1.default.info(`Loading namespace '${namespace}' in '${locale}'`);
                const data = this.readFile(`${path}/${locale}/${namespace}.json`);
                if (!data)
                    return;
                sheetsData[namespace] = sheetsData[namespace] || {};
                Object.entries(data).forEach(([key, value]) => {
                    sheetsData[namespace][locale] = sheetsData[namespace][locale] || {};
                    sheetsData[namespace][locale][key] = value;
                });
            });
        });
        return sheetsData;
    }
    async upsertAllSheets(i18n) {
        var e_1, _a, e_2, _b;
        var _c, _d;
        try {
            for (var _e = __asyncValues(Object.entries(i18n)), _f; _f = await _e.next(), !_f.done;) {
                const [namespace, data] = _f.value;
                const locales = Object.keys(data);
                const newHeaderColumn = ["key", ...locales];
                if (!((_c = this.doc.sheetsByTitle) === null || _c === void 0 ? void 0 : _c[namespace])) {
                    await this.doc.addSheet({
                        title: namespace,
                        headerValues: newHeaderColumn,
                    });
                    loglevel_1.default.info(`Created sheet '${namespace}'`);
                }
                loglevel_1.default.info(`Uploading to sheet '${namespace}'`);
                const sheet = this.doc.sheetsByTitle[namespace];
                await sheet.loadHeaderRow().catch(async () => {
                    // if no header row, assume sheet is empty
                    await sheet.setHeaderRow(newHeaderColumn);
                });
                if (sheet.headerValues[0] !== "key")
                    commander_1.program.error(`Sheet '${namespace}' has invalid value in header, please set cell A1 value to 'key'`);
                newHeaderColumn.forEach((col) => {
                    loglevel_1.default.debug(`Checking header column '${col}' is exist`);
                    if (!sheet.headerValues.includes(col))
                        commander_1.program.error(`Header '${col}' not found! Please include it in the sheet and try again`);
                });
                await sheet.loadCells();
                const rows = await sheet.getRows();
                const updateObject = Object.entries(data).reduce((acc, [locale, record]) => {
                    Object.entries(record).forEach(([key, value]) => {
                        acc[key] = acc[key] || {};
                        acc[key][locale] = value;
                    });
                    return acc;
                }, {});
                // update existing keys
                let updatedCells = 0;
                try {
                    for (var rows_1 = (e_2 = void 0, __asyncValues(rows)), rows_1_1; rows_1_1 = await rows_1.next(), !rows_1_1.done;) {
                        const row = rows_1_1.value;
                        if (!(updateObject === null || updateObject === void 0 ? void 0 : updateObject[row.key]))
                            continue;
                        for (const lang in updateObject[row.key]) {
                            const columnIndex = sheet.headerValues.findIndex((col) => col === lang);
                            const cell = await sheet.getCell(row.rowIndex - 1, columnIndex);
                            if (cell.value !== updateObject[row.key][lang]) {
                                if (cell.value === null && !updateObject[row.key][lang])
                                    continue;
                                loglevel_1.default.debug(`Updating ${namespace}/${row.key}/${lang}`);
                                cell.value = (_d = updateObject[row.key][lang]) !== null && _d !== void 0 ? _d : "";
                                updatedCells++;
                            }
                        }
                        delete updateObject[row.key];
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (rows_1_1 && !rows_1_1.done && (_b = rows_1.return)) await _b.call(rows_1);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
                if (updatedCells > 0)
                    await sheet.saveUpdatedCells();
                loglevel_1.default.info(`Sheet '${namespace}' has updated ${updatedCells} cells`);
                // // update existing keys
                // let updatedCells = 0;
                // for await (const row of rows) {
                //   for (const lang in data) {
                //     // console.log(data?.[lang]?.[row.key]);
                //     // if (data?.[lang]?.[row.key] === undefined || null) continue;
                //     const columnIndex = sheet.headerValues.findIndex(
                //       (col) => col === lang
                //     );
                //     const cell = await sheet.getCell(row.rowIndex - 1, columnIndex);
                //     if (cell.value !== data[lang][row.key]) {
                //       if (cell.value === null && !data[lang][row.key]) continue;
                //       log.debug(`Updating ${namespace}/${row.key}/${lang}`);
                //       cell.value = (data[lang][row.key] as string) ?? "";
                //       updatedCells++;
                //     }
                //     delete data[lang][row.key];
                //   }
                // }
                // if (updatedCells > 0) await sheet.saveUpdatedCells();
                // log.info(`Sheet '${namespace}' has updated ${updatedCells} cells`);
                // // append non-existing key
                // const appendObject: { [key: string]: { [locale: string]: string } } =
                //   Object.entries(data).reduce((acc, [locale, record]) => {
                //     Object.entries(record).forEach(([key, value]) => {
                //       acc[key] = acc[key] || {};
                //       acc[key][locale] = value;
                //     });
                //     return acc;
                //   }, {});
                const appendArray = Object.entries(updateObject).map(([key, value]) => (Object.assign({ key }, value)));
                if (appendArray.length > 0)
                    await sheet.addRows(appendArray).then(() => {
                        if (loglevel_1.default.getLevel() <= loglevel_1.default.levels.DEBUG)
                            appendArray.forEach((col) => loglevel_1.default.debug(`Appended row '${col.key}' to '${namespace}'`));
                    });
                loglevel_1.default.info(`Sheet '${namespace}' has appended ${appendArray.length} rows`);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_f && !_f.done && (_a = _e.return)) await _a.call(_e);
            }
            finally { if (e_1) throw e_1.error; }
        }
    }
}
exports.default = i18nGS;
//# sourceMappingURL=I18nGS.js.map