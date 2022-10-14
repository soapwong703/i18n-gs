module.exports = {
  spreadsheet: {
    sheetId: "1StsBHQ3R9FmWFFC2Usm2pDpkdnteU2RlZyj5B73xTZ8",
    credential: {
      type: "serviceAccount",
      path: "./credential.json",
    },
  },
  i18n: {
    path: "./test/locales",
    keyStyle: "nested",
    namespaces: {
      // includes: ["activity"],
      // excludes: ["activity"],
    },
    locales: {
      // includes: ["zh-HK", "zh-CN", "en-US"],
      // excludes: ["zh-HK", "zh-CN"],
    },
  },
  logging: {
    level: "info",
  },
};
