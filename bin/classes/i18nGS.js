"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const google_spreadsheet_1 = require("google-spreadsheet");
const loglevel_1 = require("loglevel");
const path = require("path");
const fs = require("fs-extra");
const constants_1 = require("../utils/constants");
const unflatten = require("flat").unflatten;
/**
 * @todo support keyStyle
 * @todo support locales includes / excludes
 * @todo support namespace includes / excludes
 */
class i18nGS {
    constructor() {
        this.loadConfig();
        this.doc = new google_spreadsheet_1.GoogleSpreadsheet(this.config.spreadsheet.sheetId);
        const logLevel = this.config.logging.level;
        if (logLevel === "none")
            loglevel_1.default.setLevel("silent", false);
        else
            loglevel_1.default.setLevel(logLevel, false);
        loglevel_1.default.debug("Loaded config file:", this.config);
    }
    async connect() {
        switch (this.config.spreadsheet.credential.type) {
            case "serviceAccount":
                await this.connectWithServiceAccount();
        }
    }
    loadConfig() {
        const pathname = path.resolve(constants_1.configFilename);
        try {
            this.config = require(pathname);
        }
        catch (err) {
            commander_1.program.error(`Cannot not find a config file at: '${pathname}'`);
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
    async readSheet(namespace, _locales) {
        var _a;
        const sheet = this.doc.sheetsByTitle[namespace];
        if (!sheet) {
            loglevel_1.default.error(`Sheet '${namespace}' not found`);
            return undefined;
        }
        const rows = await sheet.getRows();
        const locales = ((_a = _locales !== null && _locales !== void 0 ? _locales : sheet.headerValues.slice(1)) !== null && _a !== void 0 ? _a : []).filter((locale) => { var _a, _b, _c, _d; return !((_d = (_c = (_b = (_a = this.config) === null || _a === void 0 ? void 0 : _a.i18n) === null || _b === void 0 ? void 0 : _b.locales) === null || _c === void 0 ? void 0 : _c.excludes) === null || _d === void 0 ? void 0 : _d.includes(locale)); });
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
    async readSheets(_namespaces, _locales) {
        var _a, _b, _c, _d, _e;
        const namespaces = ((_namespaces === null || _namespaces === void 0 ? void 0 : _namespaces.length) > 0
            ? _namespaces
            : (_e = (_d = (_c = (_b = (_a = this.config) === null || _a === void 0 ? void 0 : _a.i18n) === null || _b === void 0 ? void 0 : _b.namespaces) === null || _c === void 0 ? void 0 : _c.includes) !== null && _d !== void 0 ? _d : Object.keys(this.doc.sheetsByTitle)) !== null && _e !== void 0 ? _e : []).filter((namespace) => { var _a, _b, _c, _d; return !((_d = (_c = (_b = (_a = this.config) === null || _a === void 0 ? void 0 : _a.i18n) === null || _b === void 0 ? void 0 : _b.namespaces) === null || _c === void 0 ? void 0 : _c.excludes) === null || _d === void 0 ? void 0 : _d.includes(namespace)); });
        loglevel_1.default.debug("Selected namespaces:", namespaces);
        if (namespaces.length === 0)
            commander_1.program.error("There is no selected namespace!");
        const objBySheet = {};
        for (const namespace of namespaces) {
            const sheet = await this.readSheet(namespace, _locales);
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
                console.log(`creating ${path}/${locale}/${namespace}.json`);
            // update namespace file, overwrite all data
            else
                console.log(`updating ${path}/${locale}/${namespace}.json`);
            fs.writeJSONSync(`${path}/${locale}/${namespace}.json`, i18n, {
                spaces: 2,
            });
        });
    }
    writeFiles(data) {
        Object.entries(data).forEach(([namespace, namespaceData]) => this.writeFile(namespaceData, namespace));
    }
}
exports.default = i18nGS;
//# sourceMappingURL=I18nGS.js.map