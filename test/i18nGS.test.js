const fs = require("fs");
const path = require("path");
const { default: I18nGS } = require("../lib/classes/I18nGS.js");

let config = undefined;

if (fs.existsSync(path.resolve("i18n-gs.config.js")))
  config = require("../i18n-gs.config.js");

const testIf = config ? test : test.skip;

testIf("connect with service account", async () => {
  const clone = JSON.parse(JSON.stringify(config));
  clone.spreadsheet.credential.type = "serviceAccount";
  const i18nGS = new I18nGS(clone);
  await expect(i18nGS.connect()).resolves.toBeUndefined();
});

// testIf("download i18n data success", async () => {
//   const i18nGS = new I18nGS(config);
//   await i18nGS.connect();
//   await i18nGS.readSheets();
// });
