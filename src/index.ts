#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { program } = require("commander");
const { exit } = require("process");

const loadConfig = () => {
  try {
    return require(path.resolve("./i18n-gs.config.js"));
  } catch (err) {
    program.error("Config file not found!");
  }
};

program
  .command("init")
  .description("Initialize the project with config file")
  .action(() => {
    const configFile = fs.existsSync(path.resolve("./i18n-gs.config.js"));

    if (configFile) return program.error("Config file already exist!");

    fs.copyFileSync(
      path.resolve(__dirname, "./i18n-gs.config.template.js"),
      path.resolve("./i18n-gs.config.js")
    );
  });

program
  .command("import")
  .description("Import the files from google sheet")
  .action(() => {
    const config = loadConfig();
    console.log(config);
  });

program
  .command("export")
  .description("Export the files to google sheet")
  .action(() => {
    const config = loadConfig();
    console.log(config);
  });

program.parse();
