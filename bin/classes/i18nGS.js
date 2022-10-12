"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const google_spreadsheet_1 = require("google-spreadsheet");
const loglevel_1 = require("loglevel");
const path = require("path");
const constants_1 = require("../utils/constants");
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
        switch (this.config.spreadsheet.credential.type) {
            case "serviceAccount":
                this.connectWithServiceAccount();
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
}
exports.default = i18nGS;
//# sourceMappingURL=I18nGS.js.map