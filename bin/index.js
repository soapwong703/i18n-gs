#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const commander_1 = require("commander");
const helper_1 = require("./utils/helper");
const constants_1 = require("./utils/constants");
const I18nGS_1 = require("./classes/I18nGS");
const loglevel_1 = require("loglevel");
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
    .command("import [namespace...]")
    .description("Import the files from google sheet")
    .option("-l, --locale <locales...>")
    .action(async (namespace, options) => {
    const i18nGS = new I18nGS_1.default();
    loglevel_1.default.debug("namespace:", namespace);
    loglevel_1.default.debug("--locale:", options.locale);
    await i18nGS.connect();
    const sheets = await i18nGS.readSheets(namespace, options.locale);
    // log.debug(sheets);
    loglevel_1.default.info(`Finished importing ${Object.keys(sheets).length} sheets`);
});
// program
//   .command("export")
//   .description("Export the files to google sheet")
//   .action((namespace) => {
//     const i18nGS = new I18nGS();
//   });
commander_1.program.parse();
//# sourceMappingURL=index.js.map