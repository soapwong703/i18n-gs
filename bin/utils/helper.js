"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractGoogleSheetError = exports.generateConfigFile = void 0;
const constants_1 = require("./constants");
const fs = require("fs");
function generateConfigFile() {
    const template = {
        spreadsheet: {
            sheetId: "<your sheet id>",
            credential: {
                type: "serviceAccount",
                path: "<your credential file path>",
            },
        },
        i18n: {
            path: "<your locale directory path>",
            keyStyle: "nested",
        },
        logging: {
            level: "info",
        },
    };
    fs.writeFileSync(constants_1.configFilename, "module.exports = " + JSON.stringify(template, null, 2));
    return;
}
exports.generateConfigFile = generateConfigFile;
function extractGoogleSheetError(err) {
    var _a, _b, _c, _d;
    if (!((_b = (_a = err === null || err === void 0 ? void 0 : err.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error))
        return "";
    const { code, message, status, } = (_d = (_c = err === null || err === void 0 ? void 0 : err.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.error;
    return `[GoogleAPIError:${code}] ${message}`;
}
exports.extractGoogleSheetError = extractGoogleSheetError;
//# sourceMappingURL=helper.js.map