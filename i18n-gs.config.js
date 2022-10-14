module.exports = {
  spreadsheet: {
    sheetId: "1_-viGzem2hNsL7QcYIHNd3KGUaRe2jkP6EpRIU6Z5Z0",
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
      excludes: ["activity"],
    },
    locales: {
      // includes: ["zh-HK", "zh-CN", "en-US"],
      excludes: ["en-US"],
    },
  },
  logging: {
    level: "debug",
  },
};
