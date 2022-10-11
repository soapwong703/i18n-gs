import Config from "../types/Config";

const { GoogleSpreadsheet } = require("google-spreadsheet");

class I18nGS {
  protected readonly config: Config;
  protected doc: typeof GoogleSpreadsheet;

  constructor(config: Config) {
    this.config = config;
    this.doc = new GoogleSpreadsheet(this.config.spreadsheet.sheetId);
  }

  /**
   * Connect to google sheet
   */

  connect(): boolean {
    // todo check credential method and connect
    console.log("connect");

    return true;
  }
}

export default I18nGS;
