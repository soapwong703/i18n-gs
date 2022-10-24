"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.baseConfig = exports.configFilename = void 0;
const i18nGSConfig_1 = require("../types/i18nGSConfig");
exports.configFilename = "i18n-gs.config.js";
exports.baseConfig = {
    spreadsheet: {
        sheetId: undefined,
        credential: {
            type: i18nGSConfig_1.CredentialType.ServiceAccount,
            path: undefined,
        },
    },
    i18n: {
        path: undefined,
        keyStyle: "nested",
        locales: {
            includes: undefined,
            excludes: undefined,
        },
        namespaces: {
            includes: undefined,
            excludes: undefined,
        },
    },
    logging: {
        level: i18nGSConfig_1.LogLevel.Info,
    },
};
//# sourceMappingURL=constants.js.map