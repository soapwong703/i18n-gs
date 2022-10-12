"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = exports.generateConfigFile = void 0;
const fs = require("fs");
const commander_1 = require("commander");
const path = require("path");
const constants_1 = require("./constants");
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
            keyStyle: "auto",
        },
    };
    fs.writeFileSync(constants_1.configFilename, "module.exports = " + JSON.stringify(template, null, 2));
    return;
}
exports.generateConfigFile = generateConfigFile;
function getConfig() {
    const pathname = path.resolve(constants_1.configFilename);
    try {
        return require(pathname);
    }
    catch (err) {
        commander_1.program.error(`Cannot not find a config file at: '${pathname}'`);
    }
}
exports.getConfig = getConfig;
//# sourceMappingURL=helper.js.map