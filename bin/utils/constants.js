"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.baseConfig = exports.configFilename = void 0;
exports.configFilename = "i18n-gs.config.js";
exports.baseConfig = {
    spreadsheet: {
        sheetId: undefined,
        credential: {
            type: "serviceAccount",
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
        level: "info",
    },
};
//# sourceMappingURL=constants.js.map