#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const commander_1 = require("commander");
const helper_1 = require("./utils/helper");
const constants_1 = require("./utils/constants");
const I18nGS_1 = require("./classes/I18nGS");
const log_1 = require("./utils/log");
const spinner_1 = require("./utils/spinner");
commander_1.program
    .command("init")
    .description("Initialize the project with config file")
    .action(() => {
    const pathname = path.resolve(constants_1.configFilename);
    const configFile = fs.existsSync(pathname);
    if (configFile)
        return log_1.default.error(`A '${constants_1.configFilename}' file is already defined at: '${pathname}'`);
    (0, helper_1.generateConfigFile)();
});
commander_1.program
    .command("download [namespaces...]")
    .description("Download the files from google sheet")
    .option("-l, --locales <locales...>")
    .action(async (namespaces, options) => {
    const inlineConfig = {
        i18n: {
            namespaces: {
                includes: namespaces.length > 0 ? namespaces : undefined,
            },
            locales: {
                includes: options.locales,
            },
        },
    };
    (0, helper_1.removeEmptyProperty)(inlineConfig);
    const config = (0, helper_1.initConfig)(inlineConfig);
    log_1.default.debug("namespace:", namespaces);
    log_1.default.debug("--locale:", options.locales);
    log_1.default.debug("Loaded config file:", config);
    const i18nGS = new I18nGS_1.default(config);
    try {
        await i18nGS.connect();
        const sheets = await i18nGS.readSheets();
        if (Object.values(sheets).length === 0)
            log_1.default.error(`No sheets available for download!`);
        i18nGS.writeFiles(sheets);
        log_1.default.info(`Finished downloading ${Object.keys(sheets).length} sheets`);
    }
    catch (err) {
        // log.error(`Download failed!`);
        spinner_1.spinner.fail();
        if (!!(0, helper_1.extractGoogleSheetError)(err))
            return log_1.default.error((0, helper_1.extractGoogleSheetError)(err));
        return log_1.default.error(err);
    }
});
commander_1.program
    .command("upload [namespaces...]")
    .description("Upload the files to google sheet")
    .option("-l, --locales <locales...>")
    .action(async (namespaces, options) => {
    const inlineConfig = {
        i18n: {
            namespaces: {
                includes: namespaces.length > 0 ? namespaces : undefined,
            },
            locales: {
                includes: options.locales,
            },
        },
    };
    (0, helper_1.removeEmptyProperty)(inlineConfig);
    const config = (0, helper_1.initConfig)(inlineConfig);
    log_1.default.debug("namespace:", namespaces);
    log_1.default.debug("--locale:", options.locales);
    log_1.default.debug("Loaded config file:", config);
    const i18nGS = new I18nGS_1.default(config);
    try {
        await i18nGS.connect();
        const sheetsData = await i18nGS.readFiles();
        await i18nGS.upsertSheets(sheetsData);
        log_1.default.info(`Finished uploading ${Object.keys(sheetsData).length} sheets`);
    }
    catch (err) {
        // log.error(`Upload failed!`);
        spinner_1.spinner.fail();
        if (!!(0, helper_1.extractGoogleSheetError)(err))
            return log_1.default.error((0, helper_1.extractGoogleSheetError)(err));
        return log_1.default.error(err);
    }
});
commander_1.program.parse();
//# sourceMappingURL=index.js.map