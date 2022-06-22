const { GoogleSpreadsheet } = require("google-spreadsheet");
const unflatten = require("flat").unflatten;
const credentials = require("./credentials.json");

const fs = require("fs-extra");

const localesPath = "./public/locales";
const sheetId = "15fTuB4hmpC7jDukkzrebFazfoD_7wMqlgFXsfH6-wrY";

const doc = new GoogleSpreadsheet(sheetId);

const init = async () => {
  await doc.useServiceAccountAuth(credentials);
  await doc.loadInfo();
  return doc;
};

const readSheet = async (sheetTitle = "Sheet1") => {
  const sheet = doc.sheetsByTitle[sheetTitle];
  if (!sheet) throw new Error(`Sheet '${sheetTitle}' not found`);
  const rows = await sheet.getRows();
  const langKeys = sheet.headerValues.slice(1);
  let result = {};
  rows.forEach((row) => {
    langKeys.forEach((langKey) => {
      result[langKey] = result[langKey] || {};
      result[langKey][row.key] = row[langKey] ?? "";
    });
  });
  return result;
};

const readAllSheets = async () => {
  const objBySheet = {};
  for (const sheetTitle in doc.sheetsByTitle) {
    objBySheet[sheetTitle] = await readSheet(sheetTitle);
  }
  return objBySheet;
};

const writeFile = (data, fileName = "translation") => {
  Object.keys(data).forEach((key) => {
    const i18n = unflatten(data[key], { object: true });
    if (!fs.existsSync(`${localesPath}/${key}`))
      fs.mkdirSync(`${localesPath}/${key}`, { recursive: true });
    if (!fs.existsSync(`${localesPath}/${key}/${fileName}.json`))
      console.log(`creating ${localesPath}/${key}/${fileName}.json`);
    else console.log(`updating ${localesPath}/${key}/${fileName}.json`);
    fs.writeJSONSync(`${localesPath}/${key}/${fileName}.json`, i18n, {
      spaces: 2,
    });
  });
};

const writeAllSheets = (data) => {
  Object.entries(data).forEach(([key, value]) => writeFile(value, key));
};

console.log("fetch translation files started");

// fetch single sheet
// initSpreadSheet()
//   .then(() => readSheet("common"))
//   .then((data) => writeFile(data, "common"))
//   .catch((err) => console.log(err));

// fetch all sheet
init()
  .then(() => readAllSheets())
  .then((data) => writeAllSheets(data))
  .then(() => {
    console.log("fetch translation files completed");
  })
  .catch((err) => console.log(err));
