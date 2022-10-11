const { GoogleSpreadsheet } = require("google-spreadsheet");
const flatten = require("flat").flatten;
const credentials = require("./credentials.json");

const fs = require("fs-extra");

const localesPath = "./public/locales";
const sheetId = "15fTuB4hmpC7jDukkzrebFazfoD_7wMqlgFXsfH6-wrY";

const doc = new GoogleSpreadsheet(sheetId);

const defaultLocales = ["zh-HK", "zh-CN", "en-US"]; // null or undefined means all locales

const init = async () => {
  await doc.useServiceAccountAuth(credentials);
  await doc.loadInfo();
  return doc;
};

const upsertAllSheets = async ({ i18n, locales }) => {
  for await (const [ns, data] of Object.entries(i18n)) {
    const newHeaderColumn = ["key", ...locales];
    if (!doc.sheetsByTitle?.[ns]) {
      await doc.addSheet({ title: ns, headerValues: newHeaderColumn });
      console.log("added sheet", ns);
    }
    const sheet = doc.sheetsByTitle[ns];

    await sheet.loadHeaderRow().catch(() => {
      throw new Error("Please add header row in " + ns);
    });

    if (sheet.headerValues[0] !== "key")
      throw new Error("Please set column A value to 'key' in " + ns);

    if (newHeaderColumn.some((col, i) => sheet.headerValues[i] !== col))
      await sheet.setHeaderRow(newHeaderColumn);

    const rows = await sheet.getRows();
    await sheet.loadCells();

    // update existing keys
    let updatedCells = 0;
    for await (const row of rows) {
      if (!data?.[row.key]) continue;
      for (const lang in data[row.key]) {
        const columnIndex = newHeaderColumn.findIndex((col) => col === lang);
        const cell = await sheet.getCell(row.rowIndex - 1, columnIndex);
        if (cell.value !== data[row.key][lang]) {
          if (cell.value === null && !data[row.key][lang]) continue;
          console.log(`updating ${ns}/${row.key}/${lang}`);
          cell.value = data[row.key][lang] ?? "";
          updatedCells++;
        }
      }
      delete data[row.key];
    }
    if (updatedCells > 0)
      await sheet
        .saveUpdatedCells()
        .then(() => console.log(`updated ${updatedCells} cells in ${ns}`));

    // append non-existing keys
    const appendArray = Object.entries(data).map(([key, value]) => ({
      key,
      ...value,
    }));
    if (appendArray.length > 0)
      await sheet.addRows(appendArray).then(() => {
        appendArray.forEach((col) =>
          console.log(`added '${col.key}' to ${ns}`)
        );
        console.log(`added ${appendArray.length} rows to ${ns}`);
      });
  }
};

const readFile = (path) => {
  const data = fs.readJsonSync(path);
  return flatten(data);
};

const readAllFiles = async () => {
  if (!fs.existsSync(localesPath))
    throw new Error(`Path '${localesPath}' does not exist`);

  const i18n = {};
  const locales =
    defaultLocales ??
    (await fs.readdirSync(localesPath).filter((file) => !file.startsWith(".")));

  locales.forEach((locale) => {
    const files = fs
      .readdirSync(`${localesPath}/${locale}`)
      .filter((file) => !file.startsWith("."));
    files.forEach((file) => {
      const data = readFile(`${localesPath}/${locale}/${file}`);
      const extReg = /\.\w+/g;
      const namespace = file.replace(extReg, "");
      i18n[namespace] = i18n[namespace] || {};
      Object.entries(data).forEach(([key, value]) => {
        i18n[namespace][key] = i18n[namespace][key] || {};
        i18n[namespace][key][locale] = value;
      });
    });
  });

  return { i18n, locales };
};

console.log("push translation files started");
init()
  .then(() => readAllFiles())
  .then((res) => upsertAllSheets(res))
  .then(() => {
    console.log("push translation files completed");
  })
  .catch((err) => console.log(err));
