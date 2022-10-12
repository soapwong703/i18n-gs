"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateConfigFile = void 0;
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
            keyStyle: "auto",
        },
        logging: {
            level: "info",
        },
    };
    fs.writeFileSync(constants_1.configFilename, "module.exports = " + JSON.stringify(template, null, 2));
    return;
}
exports.generateConfigFile = generateConfigFile;
//# sourceMappingURL=helper.js.map