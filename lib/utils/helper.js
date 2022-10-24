"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initConfig = exports.extractGoogleSheetError = exports.generateConfigFile = exports.removeEmptyProperty = exports.mergeDeep = exports.isObject = void 0;
const i18nGSConfig_1 = require("../types/i18nGSConfig");
const constants_1 = require("./constants");
const path = require("path");
const fs = require("fs");
const validate_1 = require("./validate");
const log_1 = require("./log");
/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
function isObject(item) {
    return item && typeof item === "object" && !Array.isArray(item);
}
exports.isObject = isObject;
/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */
function mergeDeep(target, ...sources) {
    if (!sources.length)
        return target;
    const source = sources.shift();
    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key])
                    Object.assign(target, { [key]: {} });
                mergeDeep(target[key], source[key]);
            }
            else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }
    return mergeDeep(target, ...sources);
}
exports.mergeDeep = mergeDeep;
function removeEmptyProperty(obj) {
    // mutate target obj
    Object.keys(obj).forEach((key) => {
        if (obj[key] === undefined)
            delete obj[key];
        if (typeof obj[key] === "object")
            removeEmptyProperty(obj[key]);
    });
}
exports.removeEmptyProperty = removeEmptyProperty;
function generateConfigFile(config) {
    const configTemplate = {
        spreadsheet: {
            sheetId: "<your sheet id>",
            credential: {
                type: i18nGSConfig_1.CredentialType.ServiceAccount,
                path: "<your credential file path>",
            },
        },
        i18n: {
            path: "<your locale directory path>",
            keyStyle: i18nGSConfig_1.KeyStyle.Nested,
        },
        logging: {
            level: i18nGSConfig_1.LogLevel.Info,
        },
    };
    fs.writeFileSync(constants_1.configFilename, "module.exports = " + JSON.stringify(configTemplate, null, 2));
    return;
}
exports.generateConfigFile = generateConfigFile;
function extractGoogleSheetError(err) {
    var _a, _b, _c, _d;
    if (!((_b = (_a = err === null || err === void 0 ? void 0 : err.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error))
        return "";
    const { code, message, } = (_d = (_c = err === null || err === void 0 ? void 0 : err.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.error;
    return `[GoogleAPIError:${code}] ${message}`;
}
exports.extractGoogleSheetError = extractGoogleSheetError;
function initConfig(inlineConfig) {
    const pathname = path.resolve(constants_1.configFilename);
    let fileConfig = undefined;
    const config = constants_1.baseConfig;
    try {
        fileConfig = require(pathname);
    }
    catch (err) {
        (0, log_1.exit)(`'${constants_1.configFilename}' is not defined at: '${pathname}'`);
    }
    if (initConfig)
        mergeDeep(config, fileConfig, inlineConfig);
    (0, validate_1.validateConfig)(config);
    const { logging: { level }, } = config;
    log_1.default.setLevel(level, false);
    return config;
}
exports.initConfig = initConfig;
//# sourceMappingURL=helper.js.map