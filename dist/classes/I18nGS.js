"use strict";
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const google_spreadsheet_1 = require("google-spreadsheet");
const i18nGSConfig_1 = require("../types/i18nGSConfig");
const path = require("path");
const fs = require("fs-extra");
const log_1 = require("../utils/log");
const spinner_1 = require("../utils/spinner");
const { unflatten, flatten } = require("flat");
class i18nGS {
    constructor(config) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        this.config = config;
        this.doc = new google_spreadsheet_1.GoogleSpreadsheet(this.config.spreadsheet.sheetId);
        if ((_c = (_b = (_a = this.config) === null || _a === void 0 ? void 0 : _a.i18n) === null || _b === void 0 ? void 0 : _b.namespaces) === null || _c === void 0 ? void 0 : _c.excludes)
            log_1.default.info(`Excluding namespaces:`, (_f = (_e = (_d = this.config) === null || _d === void 0 ? void 0 : _d.i18n) === null || _e === void 0 ? void 0 : _e.namespaces) === null || _f === void 0 ? void 0 : _f.excludes);
        if ((_j = (_h = (_g = this.config) === null || _g === void 0 ? void 0 : _g.i18n) === null || _h === void 0 ? void 0 : _h.locales) === null || _j === void 0 ? void 0 : _j.excludes)
            log_1.default.info(`Excluding locales:`, (_m = (_l = (_k = this.config) === null || _k === void 0 ? void 0 : _k.i18n) === null || _l === void 0 ? void 0 : _l.locales) === null || _m === void 0 ? void 0 : _m.excludes);
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
            (0, log_1.exit)(`Credential file is not defined at: '${pathname}'`);
        }
        await this.doc.useServiceAccountAuth(credential);
        await this.doc.loadInfo();
        log_1.default.debug("Service account credential verified");
    }
    async readSheet(namespace) {
        var _a, _b, _c, _d, _e;
        const sheet = this.doc.sheetsByTitle[namespace];
        if (!sheet) {
            log_1.default.warn(`Sheet '${namespace}' not found`);
            return undefined;
        }
        spinner_1.spinner.start(`Loading sheet '${namespace}'`);
        const rows = await sheet.getRows();
        const locales = ((_e = (_d = (_c = (_b = (_a = this.config) === null || _a === void 0 ? void 0 : _a.i18n) === null || _b === void 0 ? void 0 : _b.locales) === null || _c === void 0 ? void 0 : _c.includes) !== null && _d !== void 0 ? _d : sheet.headerValues.slice(1)) !== null && _e !== void 0 ? _e : []).filter((locale) => { var _a, _b, _c, _d; return !((_d = (_c = (_b = (_a = this.config) === null || _a === void 0 ? void 0 : _a.i18n) === null || _b === void 0 ? void 0 : _b.locales) === null || _c === void 0 ? void 0 : _c.excludes) === null || _d === void 0 ? void 0 : _d.includes(locale)); });
        if (locales.length === 0) {
            spinner_1.spinner.fail();
            log_1.default.warn(`No locale available in ${namespace}`);
            return undefined;
        }
        let namespaceData = {};
        rows.forEach((row) => {
            locales.forEach((langKey) => {
                var _a;
                namespaceData[langKey] = namespaceData[langKey] || {};
                namespaceData[langKey][row.key] = (_a = row[langKey]) !== null && _a !== void 0 ? _a : "";
            });
        });
        if (this.config.logging.level === i18nGSConfig_1.LogLevel.Debug)
            spinner_1.spinner.succeed(`Loaded sheet '${namespace}' with locale '${locales}'`);
        else
            spinner_1.spinner.stop();
        return namespaceData;
    }
    async readSheets() {
        var _a, _b, _c, _d, _e;
        const namespaces = ((_e = (_d = (_c = (_b = (_a = this.config) === null || _a === void 0 ? void 0 : _a.i18n) === null || _b === void 0 ? void 0 : _b.namespaces) === null || _c === void 0 ? void 0 : _c.includes) !== null && _d !== void 0 ? _d : Object.keys(this.doc.sheetsByTitle)) !== null && _e !== void 0 ? _e : []).filter((namespace) => { var _a, _b, _c, _d; return !((_d = (_c = (_b = (_a = this.config) === null || _a === void 0 ? void 0 : _a.i18n) === null || _b === void 0 ? void 0 : _b.namespaces) === null || _c === void 0 ? void 0 : _c.excludes) === null || _d === void 0 ? void 0 : _d.includes(namespace)); });
        log_1.default.debug("Selected namespaces:", namespaces);
        if (namespaces.length === 0)
            (0, log_1.exit)("There is no selected namespace!");
        const sheetsData = {};
        for (const namespace of namespaces) {
            const sheet = await this.readSheet(namespace);
            if (sheet)
                sheetsData[namespace] = sheet;
        }
        return sheetsData;
    }
    writeFile(namespaceData, namespace) {
        Object.keys(namespaceData).forEach((locale) => {
            var _a, _b;
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
            const path = this.config.i18n.path;
            // if no folder, make directory
            if (!fs.existsSync(`${path}/${locale}`))
                fs.mkdirSync(`${path}/${locale}`, { recursive: true });
            // update namespace file, overwrite all data
            fs.writeJSONSync(`${path}/${locale}/${namespace}.json`, i18n, {
                spaces: 2,
            });
            log_1.default.info(`Updated ${path}/${locale}/${namespace}.json`);
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
            (0, log_1.exit)(`File ${path} does not exists!`);
        }
    }
    async readFiles() {
        const { i18n: { path, namespaces: { includes: _namespacesIncludes, excludes: _namespacesExcludes, }, locales: { includes: _localesIncludes, excludes: _localesExcludes }, }, } = this.config;
        if (!fs.existsSync(path))
            (0, log_1.exit)(`Path '${path}' does not exist`);
        const sheetsData = {};
        const locales = (_localesIncludes !== null && _localesIncludes !== void 0 ? _localesIncludes : (await fs.readdirSync(path).filter((file) => !file.startsWith(".")))).filter((locale) => !(_localesExcludes === null || _localesExcludes === void 0 ? void 0 : _localesExcludes.includes(locale)));
        if (locales.length === 0)
            (0, log_1.exit)("No locale available!");
        locales.forEach((locale) => {
            const extensionRegExp = /\.\w+/g;
            const files = fs
                .readdirSync(`${path}/${locale}`)
                .filter((file) => !file.startsWith("."));
            const namespaces = (_namespacesIncludes !== null && _namespacesIncludes !== void 0 ? _namespacesIncludes : files.map((filename) => filename.replace(extensionRegExp, ""))).filter((namespace) => !(_namespacesExcludes === null || _namespacesExcludes === void 0 ? void 0 : _namespacesExcludes.includes(namespace)));
            log_1.default.debug(`Selected namespaces in '${locale}':`, namespaces);
            if (namespaces.length === 0)
                (0, log_1.exit)(`There is no available namespace in '${locale}'`);
            namespaces.forEach((namespace) => {
                log_1.default.debug(`Loading namespace '${namespace}' in '${locale}'`);
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
    async upsertSheets(i18n) {
        var e_1, _a;
        var _b;
        function getKeyOrientedNamespaceData(data) {
            return Object.entries(data).reduce((acc, [locale, record]) => {
                Object.entries(record).forEach(([key, value]) => {
                    acc[key] = acc[key] || {};
                    acc[key][locale] = value;
                });
                return acc;
            }, {});
        }
        async function updateExistKey(sheet, data) {
            var _a;
            const rows = await sheet.getRows();
            const clone = JSON.parse(JSON.stringify(data));
            let updatedCount = 0;
            for (const row of rows) {
                if (!(clone === null || clone === void 0 ? void 0 : clone[row.key]))
                    continue;
                for (const locale in clone[row.key]) {
                    const columnIndex = sheet.headerValues.findIndex((header) => header === locale);
                    if (columnIndex === -1)
                        continue;
                    const cell = sheet.getCell(row.rowIndex - 1, columnIndex);
                    if (cell.value !== clone[row.key][locale]) {
                        if (cell.value === null && !clone[row.key][locale])
                            continue;
                        log_1.default.debug(`Updating ${sheet.title}/${row.key}/${locale}`);
                        cell.value = (_a = clone[row.key][locale]) !== null && _a !== void 0 ? _a : "";
                        updatedCount++;
                    }
                }
                delete clone[row.key];
            }
            if (updatedCount > 0)
                await sheet.saveUpdatedCells();
            return { remainingData: clone, updatedCount };
        }
        async function appendNonExistKey(sheet, data) {
            const appendRows = Object.entries(data).map(([key, value]) => (Object.assign({ key }, value)));
            if (appendRows.length > 0)
                await sheet.addRows(appendRows).then(() => {
                    if (log_1.default.getLevel() <= log_1.default.levels.DEBUG)
                        appendRows.forEach((col) => log_1.default.debug(`Appended row '${col.key}' to '${sheet.title}'`));
                });
            return { appendedCount: appendRows.length };
        }
        try {
            for (var _c = __asyncValues(Object.entries(i18n)), _d; _d = await _c.next(), !_d.done;) {
                const [namespace, data] = _d.value;
                const locales = Object.keys(data);
                const defaultHeaderRow = ["key", ...locales];
                const sheet = (_b = this.doc.sheetsByTitle) === null || _b === void 0 ? void 0 : _b[namespace];
                if (!sheet) {
                    await this.doc.addSheet({
                        title: namespace,
                        headerValues: defaultHeaderRow,
                    });
                    log_1.default.info(`Created sheet '${namespace}'`);
                }
                spinner_1.spinner.start(`Uploading sheet '${namespace}'`);
                await sheet.loadHeaderRow().catch(async () => {
                    // if no header row, assume sheet is empty and insert default header
                    await sheet.setHeaderRow(defaultHeaderRow);
                });
                if (!sheet.headerValues[0]) {
                    (0, log_1.exit)(`Header is invalid! Please set cell A1 to 'key'`);
                }
                const headerNotFound = defaultHeaderRow.filter((col) => !sheet.headerValues.includes(col));
                if (headerNotFound.length > 0) {
                    log_1.default.warn(`Header '${headerNotFound.join(",")}' not found! These locales will be skipped`);
                }
                await sheet.loadCells();
                const keyData = getKeyOrientedNamespaceData(data);
                const { remainingData, updatedCount } = await updateExistKey(sheet, keyData);
                const { appendedCount } = await appendNonExistKey(sheet, remainingData);
                spinner_1.spinner.succeed(`Uploaded sheet '${namespace}': updated ${updatedCount} cells, appended ${appendedCount} rows`);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) await _a.call(_c);
            }
            finally { if (e_1) throw e_1.error; }
        }
    }
}
exports.default = i18nGS;
//# sourceMappingURL=I18nGS.js.map