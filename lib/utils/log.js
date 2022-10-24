"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exit = void 0;
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
const log = logger.getLogger("i18n-gs");
const exit = (...msg) => {
    log.error(...msg);
    process.exit();
};
exports.exit = exit;
exports.default = log;
//# sourceMappingURL=log.js.map