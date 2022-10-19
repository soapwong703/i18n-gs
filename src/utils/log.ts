import * as chalk from "chalk";
import * as logger from "loglevel";
import * as prefix from "loglevel-plugin-prefix";

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
    return `${chalk.gray(`[${timestamp}]`)} ${colors[level.toUpperCase()](
      level
    )} ${chalk.green(`${name}:`)}`;
  },
});

const error: typeof logger.error = (...msg) => {
  logger.error(...msg);
  process.exit();
};

const log = logger.getLogger("i18n-gs");
log.error = error;

export default log;
