const fs = require("fs");
const path = require("path");
const { default: I18nGS } = require("../lib/classes/I18nGS.js");
const { LogLevel } = require("../lib/types/i18nGSConfig.js");

let config = undefined;

if (fs.existsSync(path.resolve("i18n-gs.config.js")))
  config = require("../i18n-gs.config.js");

const testPath = path.resolve(__dirname, "data");

config.i18n.path = path.join(testPath, "locales");
config.logging.level = LogLevel.Silent;

const describeIf = config ? describe : describe.skip;

function resetTestData() {
  if (fs.existsSync(testPath)) {
    fs.rmSync(testPath, { recursive: true });
  }
  if (!fs.existsSync(testPath)) fs.mkdirSync(testPath, { recursive: true });
}

beforeEach(() => {
  resetTestData();
});

afterEach(() => {
  resetTestData();
});

describeIf("i18nGS function", () => {
  test("connect with service account", async () => {
    const clone = JSON.parse(JSON.stringify(config));
    clone.spreadsheet.credential.type = "serviceAccount";
    const i18nGS = new I18nGS(clone);
    await expect(i18nGS.connect()).resolves.toBeUndefined();
  });

  test("read sheet 'jest-test'", async () => {
    const i18nGS = new I18nGS(config);
    const desiredResult = {
      de: { Hello: "Hallo" },
      en: { Hello: "Hello" },
      es: { Hello: "Hola" },
      fr: { Hello: "Bonjour" },
      ja: { Hello: "こんにちは" },
      zh: { Hello: "你好" },
    };
    await expect(
      i18nGS.connect().then(() => i18nGS.readSheet("jest-test"))
    ).resolves.toMatchObject(desiredResult);
  });

  test("read all sheets", async () => {
    const i18nGS = new I18nGS(config);
    const desiredResult = {
      "jest-test": {
        de: { Hello: "Hallo" },
        en: { Hello: "Hello" },
        es: { Hello: "Hola" },
        fr: { Hello: "Bonjour" },
        ja: { Hello: "こんにちは" },
        zh: { Hello: "你好" },
      },
    };
    await expect(
      i18nGS.connect().then(() => i18nGS.readSheets())
    ).resolves.toMatchObject(desiredResult);
  });

  test("write sheet 'jest-test'", async () => {
    const i18nGS = new I18nGS(config);
    await expect(
      new Promise(async (resolve) => {
        await i18nGS.connect();
        const namespaceData = await i18nGS.readSheet("jest-test");
        i18nGS.writeFile(namespaceData, "jest-test");
        resolve(fs.readdirSync(config.i18n.path).length);
      })
    ).resolves.toBeGreaterThan(0);
  });

  test("write all sheets", async () => {
    const i18nGS = new I18nGS(config);
    await expect(
      new Promise(async (resolve) => {
        await i18nGS.connect();
        const sheetData = await i18nGS.readSheets();
        i18nGS.writeFiles(sheetData);
        resolve(fs.readdirSync(config.i18n.path).length);
      })
    ).resolves.toBeGreaterThan(0);
  });
});
