const { spawn, exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const rootPath = path.resolve();
const testPath = path.join(__dirname, "data");
const { configFilename } = require("../lib/utils/constants");

function resetTestData() {
  if (fs.existsSync(testPath)) {
    fs.rmSync(testPath, { recursive: true });
  }
  if (!fs.existsSync(testPath)) fs.mkdirSync(testPath, { recursive: true });
}

beforeAll(() => {
  resetTestData();
});

function i18ngsExec(cmd) {
  return new Promise((resolve, reject) => {
    // variables for collecting data written to STDOUT and STDERR
    let stdoutContents = "";
    let stderrContents = "";

    const i18ngsCP = exec(cmd, {
      cwd: testPath,
    });

    i18ngsCP.stdout.on("data", (data) => {
      stdoutContents += data.toString();
    });

    i18ngsCP.stderr.on("data", (data) => {
      stderrContents += data.toString();
    });

    i18ngsCP.on("close", () => {
      if (stderrContents) {
        // if anything was written to STDERR then
        reject(new Error(stderrContents));
      } else {
        resolve(stdoutContents);
      }
    });
  });
}

describe("command line test", () => {
  test("can create a config file", async () => {
    await expect(i18ngsExec("i18ngs init")).resolves.toBe("");
    expect(fs.existsSync(path.join(testPath, configFilename))).toBe(true);
  });

  test("can reject to config file already exists", async () => {
    await expect(i18ngsExec("i18ngs init")).rejects.toThrow();
  });

  test("can download sheets", async () => {
    const config = require(path.resolve(rootPath, configFilename));
    config.logging.level = "silent";
    fs.writeFileSync(
      path.join(testPath, configFilename),
      "module.exports = " + JSON.stringify(config)
    );
    fs.copyFileSync(
      path.join(rootPath, config.spreadsheet.credential.path),
      path.join(testPath, config.spreadsheet.credential.path)
    );

    await expect(i18ngsExec("i18ngs download")).resolves.toBe("");
    const localePath = path.join(testPath, config.i18n.path);
    const locales = fs.readdirSync(localePath);
    locales.forEach((locale) => {
      const files = fs.readdirSync(path.join(localePath, locale));
      expect(files.length).toBeGreaterThan(0);
    });
  });

  test("can upload sheets", async () => {
    const config = require(path.resolve(rootPath, configFilename));
    config.logging.level = "silent";
    fs.writeFileSync(
      path.join(testPath, configFilename),
      "module.exports = " + JSON.stringify(config)
    );
    fs.copyFileSync(
      path.join(rootPath, config.spreadsheet.credential.path),
      path.join(testPath, config.spreadsheet.credential.path)
    );

    await expect(i18ngsExec("i18ngs upload")).resolves.toBe("");
  });
});

afterAll(() => {
  resetTestData();
});
