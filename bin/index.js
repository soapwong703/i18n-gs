#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const commander_1 = require("commander");
const helper_1 = require("./utils/helper");
const constants_1 = require("./utils/constants");
const I18nGS_1 = require("./classes/I18nGS");
commander_1.program
    .command("init")
    .description("Initialize the project with config file")
    .action(() => {
    const pathname = path.resolve(constants_1.configFilename);
    const configFile = fs.existsSync(pathname);
    if (configFile)
        return commander_1.program.error(`A '${constants_1.configFilename}' file is already defined at: '${pathname}'`);
    (0, helper_1.generateConfigFile)();
});
commander_1.program
    .command("import")
    .description("Import the files from google sheet")
    .action(() => {
    const i18nGS = new I18nGS_1.default();
});
commander_1.program
    .command("export")
    .description("Export the files to google sheet")
    .action(() => {
    const i18nGS = new I18nGS_1.default();
});
commander_1.program.parse();
//# sourceMappingURL=index.js.map