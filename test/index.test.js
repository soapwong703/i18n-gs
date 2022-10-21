const { spawn, exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const testPath = "./test";

beforeAll(() => {
  if (fs.existsSync(path.join(testPath, "i18n-gs.config.js")))
    fs.rmSync(path.join(testPath, "i18n-gs.config.js"));
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

describe("init", () => {
  test("can create a config file", async () => {
    await expect(i18ngsExec("i18ngs init")).resolves.toBe("");
    expect(fs.existsSync(path.join(testPath, "i18n-gs.config.js"))).toBe(true);
  });

  test("can reject to config file already exists", async () => {
    expect(i18ngsExec("i18ngs init")).rejects.toThrow();
  });
});
