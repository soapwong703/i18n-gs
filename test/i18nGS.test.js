const fs = require("fs");
const path = require("path");
const { default: I18nGS } = require("../lib/classes/I18nGS.js");

let config = undefined;

if (fs.existsSync(path.resolve("i18n-gs.config.js")))
  config = require("../i18n-gs.config.js");

const describeIf = config ? describe : describe.skip;

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

  // test("write locale 'jest-test'", async () => {
  //   const i18nGS = new I18nGS(config);
  //   // const desiredResult = {
  //   //   "jest-test": {
  //   //     de: { Hello: "Hallo" },
  //   //     en: { Hello: "Hello" },
  //   //     es: { Hello: "Hola" },
  //   //     fr: { Hello: "Bonjour" },
  //   //     ja: { Hello: "こんにちは" },
  //   //     zh: { Hello: "你好" },
  //   //   },
  //   // };
  //   await expect(async () => {
  //     await i18nGS.connect();
  //     const sheetData = await i18nGS.readSheet("jest-test");
  //   }).resolves.toMatchObject(desiredResult);
  // });
});
