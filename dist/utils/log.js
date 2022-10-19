"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk = require("chalk");
const logger = require("loglevel");
const prefix = require("loglevel-plugin-prefix");
const colors = {
    TRACE: chalk.magenta,
    DEBUG: chalk.cyan,
    INFO: chalk.blue,
    WARN: chalk.yellow,
    ERROR: chalk.red,
};
prefix.reg(logger);
prefix.apply(logger, {
    format(level, name, timestamp) {
        return `${chalk.gray(`[${timestamp}]`)} ${colors[level.toUpperCase()](level)} ${chalk.green(`${name}:`)}`;
    },
});
const error = (...msg) => {
    logger.error(...msg);
    process.exit();
};
const log = logger.getLogger("i18n-gs");
log.error = error;
exports.default = log;
//# sourceMappingURL=log.js.map