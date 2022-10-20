import * as chalk from "chalk";
import * as logger from "loglevel";
import * as prefix from "loglevel-plugin-prefix";
import { spinner } from "./spinner";

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

const log = logger.getLogger("i18n-gs");

export const exit: typeof logger.error = (...msg) => {
  if (spinner.isSpinning) spinner.fail();
  log.error(...msg);
  process.exit();
};

export default log;
